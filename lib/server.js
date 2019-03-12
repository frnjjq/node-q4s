const Session = require('./session');
const Bandwidther = require('./bandwidther');
const Request = require('./request');
const EventEmitter = require('events');
const Response = require('./response');
const Pinger = require('./pinger');
const ContinuityPinger = require('./continuity-pinger');
const ServerNetwork = require('./server-network');
const MeasurementSet = require('./measurement-set');
const Loki = require('lokijs');

/**
 * Client Q4S classs.
 * @extends EventEmitter
 */
class ServerQ4S extends EventEmitter {
  /**
   * Constructor for the Client.
   * @param {Object} serverOptions - Options to the client
   */
  constructor(serverOptions) {
    super();

    this.serverOps = serverOptions;
    const db = new Loki();
    this.store = db.addCollection('session');

    this.networkHandler = new ServerNetwork(this.store);
    this.networkHandler.on('handshake-Req', (req, done) =>
      this.handshakeHandler(req, done));
    const funt = (record, req, done) => {
      this.tCPReqHandler(record, req, done);
    };
    this.networkHandler.on('TCP-Req', funt);
  }
  /**
   * Start listening
   */
  async listen() {
    await this.networkHandler.listen(this.serverOps.portHanshakeTCP,
        this.serverOps.portTCP,
        this.serverOps.portUDP);
  }
  /**
   * Handler for handshake
   * @argument {ReqQ4S} req
   * @argument {function} done
   */
  handshakeHandler(req, done) {
    Session.serverGenerate(req.body, this.serverOps)
        .then((ses) => {
          ses.quality.constrain(this.serverOps);
          const session = this.store.insert(ses);
          session.id = session.$loki;
          session.state = Session.HANDSHAKE;
          this.store.update(session);
          const headers = {
            'Content-Type': 'application/sdp',
            'Session-Id': session.id,
          };
          done(Response.genRes(200, headers, session.toSdp()));
        });
  }
  /**
   * Handler for TCP
   * @argument {ReqQ4S} req
   * @argument {Session} record
   * @argument {function} done
   */
  tCPReqHandler(req, record, done) {
    if (req.method === 'READY' && req.headers.Stage === '0') {
      const pinger = Pinger.genServer(record.id, this.networkHandler,
          record.measurement.negotiationPingUp, 255);
      pinger.measure()
          .then((measures) => {
            const set = new MeasurementSet();
            set.introduceClientMeasures(measures.remote);
            set.introduceServerMeasures(measures.local);
            this.emit('measure', set);
            if (record.quality.doesMetQuality(set)) {
              record.state = Session.STAGE_0;
              this.store.update(record);
            } else {
              done(Request.genReq('ALERT-Q4S', '', undefined, undefined));
            }
          });
      done(Response.genRes(200, undefined, undefined));
    } else if (record.state === Session.STAGE_0 &&
      req.method === 'READY' &&
      req.headers.Stage === '1') {
      const tool = Bandwidther.genServer(record.id, this.networkHandler,
          record.quality.bandwidthDown,
          record.measurement.negotiationBandwidth);
      tool.measure()
          .then((measures) => {
            const set = new MeasurementSet();
            set.introduceClientMeasures(measures.remote);
            set.introduceServerMeasures(measures.local);
            this.emit('measure', set);
            if (record.quality.doesMetQuality(set)) {
              record.state = Session.STAGE_1;
              this.store.update(record);
            } else {
              record.state = Session.HANDSHAKE;
              this.store.update(record);
              this.sendAlert(record.id);
            }
          }
          ).catch((e) => {
            this.emit('error',
                new Error('Error in bandwidth measurement restarting')
            );
            record.state = Session.HANDSHAKE;
            this.store.update(record);
          });
      done(Response.genRes(200, undefined, undefined));
    } else if (record.state === Session.STAGE_1 &&
      req.method === 'READY' &&
      req.headers.Stage === '2') {
      const ping = ContinuityPinger.genServer(record.id, this.networkHandler,
          record.measurement.continuityPingDown,
          record.measurement.windowSizeUp);
      ping.on('measure', (measure) => {
        const set = new MeasurementSet();
        set.introduceClientMeasures(measure.remote);
        set.introduceServerMeasures(measure.local);
        this.emit('measure', set);
        if (record.quality.doesMetQuality(set)) {
          this.sendRecovery(record.id);
        } else {
          this.sendAlert(record.id);
        }
      });
      ping.measure();
      done(Response.genRes(200, undefined, undefined));
    } else if (req.method === 'CANCEL') {
      this.networkHandler.sendTCP(record.id, Request.genReq('CANCEL'));
      record.socket.end();
      this.store.remove(record);
      // Release session and send cancel
    } else {
      this.emit('error', new Error('recieved a request out of scope'));
    }
  }
  /**
   * Send an alert for the session Id
   * @argument {Number} sessionId
   */
  sendAlert(sessionId) {
    const record = this.store.findOne({
      'id': sessionId,
    });
    const now = new Date();
    if (record.lastAlert && now > record.lastAlert + record.alertPause) {
      record.lastAlert = now;
      record.qosLevelUp++;
      record.qosLevelDown++;
      this.store.update(record);
      this.networkHandler.sendTCP(sessionId,
          Request.genReq('ALERT-Q4S', 'example.com', undefined, undefined));
    }
  }
  /**
   * Send an recovery for the session Id
   * @argument {Number} sessionId
   */
  sendRecovery(sessionId) {
    const record = this.store.findOne({
      'id': sessionId,
    });
    const now = new Date();
    if (record.lastRecovery &&
      now > record.lastRecovery + record.recoveryPause) {
      record.lastRecovery = now;
      if (record.qosLevelUp > 0) {
        record.qosLevelUp--;
      }
      if (record.qosLevelDown > 0) {
        record.qosLevelDown--;
      }
      this.store.update(record);
      this.networkHandler.sendTCP(sessionId,
          Request.genReq('RECOVERY-Q4S', 'example.com', undefined, undefined));
    }
  }
}

module.exports = ServerQ4S;
