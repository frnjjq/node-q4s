/**
 * Client Q4S module. Intended to be used as interface of the module.
 * Implements the logic.
 * @module ClientQ4S
 * @license Apache-2.0
 */

const EventEmitter = require('events');

const Bandwidther = require('./bandwidther');
const ClientNetwork = require('./client-network');
const ContinuityPinger = require('./continuity-pinger');
const Pinger = require('./pinger');
const QualityParameters = require('./measurement-set');
const ReqQ4S = require('./request');
const Session = require('./session');

/**
 * Client Q4S class.
 * @extends EventEmitter
 */
class ClientQ4S extends EventEmitter {
  /**
   * Constructor for the Client.
   * @param {Object} clientOptions - Options to the client
   */
  constructor(clientOptions) {
    super();
    this.networkHandler = new ClientNetwork();

    this.networkHandler.on('handshake-Res',
        (res) => this.handshakeHandler(res)
    );
    this.networkHandler.on('TCP-Res', (res) => this.resTCP(res));
    this.networkHandler.on('TCP-Req', (req) => this.reqTCP(req));
    this.networkHandler.on('UDP-Req', (req, time) => this.reqUDP(req, time));
    this.networkHandler.on('UDP-Res', (res, time) => this.resUDP(res, time));
    this.networkHandler.on('finished', (err) => this.close());
    this.state = UNINITIALIZED;
  }
  /**
   * Creates a session from the client options
   * @param {Object} clientOptions
   */
  async importClientOps(clientOptions) {
    this.ses = await Session.fromClientOps(clientOptions);
    this.url = clientOptions.url;
  }
  /**
   * Connects to the handshake Q4S server
   * @param {String} ip
   * @param {Number} port
   */
  connect(ip, port) {
    this.networkHandler.initHandshakeSocket(ip, port, undefined)
        .catch((err) => {
          console.log('error aqui');
          this.emit('error', err);
          this.emit('close');
        })
        .then(() => {
          const headers = {};
          headers['Content-Type'] = 'application/sdp';
          this.networkHandler.sendHandshakeTCP(ReqQ4S.genReq(
              'BEGIN',
              this.url,
              headers,
              this.ses.toSdp()
          ));
          this.state = SENT_HANDSHAKE;
        });
  }
  /**
   * @param {Response} res
   */
  handshakeHandler(res) {
    if (this.state == SENT_HANDSHAKE) {
      if (res.statusCode != 200) {
        this.emit('error', new Error(res.reasonPhrase));
        console.log('recieved', res);
        this.close();
      } else {
        this.ses.updateWithSDP(res.body);
        this.pinger = Pinger.genClient(
            this.ses.id,
            this.ses.measurement.negotiationPingUp,
            255);

        this.networkHandler.initQ4sSocket(
            this.ses.addresses.serverAddress,
            this.ses.addresses.q4sServerPorts.TCP,
            this.ses.addresses.q4sClientPorts.TCP,
            this.ses.addresses.q4sServerPorts.UDP,
            this.ses.addresses.q4sClientPorts.UDP)
            .then(() => {
              this.networkHandler.closeHandshake();
              this.ses.state = Session.SENT_READY_0;
              console.log('here I am');
              this.startReady(0, 10);
            })
            .catch((err) => {
              this.emit('error', err);
              console.log(err);
              this.close();
            });
      }
    }
  }
  /**
   * @param {Response} res
   */
  async resTCP(res) {
    if (res.statusCode != 200) {
      this.emit('error', new Error(res));
      this.close();
    } else {
      if (this.state === SENT_READY_0) {
        try {
          this.state = MEASURING_PINGER;
          this.pinger.on('message',
              (msg) => this.networkHandler.sendUDP(msg)
          );
          const measure = await this.pinger.measure();
          const actMeas = new QualityParameters();
          actMeas.introduceClientMeasures(measure.local);
          actMeas.introduceServerMeasures(measure.remote);
          this.emit('measure', actMeas);
          if (this.ses.quality.doesMetQuality(actMeas)) {
            if (this.ses.quality.requireReady1()) {
              this.bander = Bandwidther.genClient(this.ses.id,
                  this.ses.quality.bandwidthUp,
                  this.ses.measurement.negotiationBandwidth);
              this.state = SENT_READY_1;
              this.startReady(1, 10);
            } else {
              this.state = SENT_READY_2;
              this.startReady(2, 10);
            }
          } else {
            this.state = SENT_READY_0;
            this.startReady(0, 10);
          }
        } catch (err) {}
      } else if (this.state === SENT_READY_1) {
        try {
          this.state = MEASURING_BANDWIDTH;
          this.bander.on('message', (m) => this.networkHandler.sendUDP(m));
          const measure = await this.bander.measure();
          const actMeas = new QualityParameters();
          actMeas.introduceClientMeasures(measure.local);
          actMeas.introduceServerMeasures(measure.remote);
          this.emit('measure', actMeas);
          if (this.ses.quality.doesMetQuality(actMeas)) {
            this.state = SENT_READY_2;
            this.startReady(2, 10);
          } else {
            this.state = SENT_READY_1;
            this.startReady(1, 10);
          }
        } catch (err) {}
      } else if (this.state = SENT_READY_2) {
        this.pinger = ContinuityPinger.genClient(
            this.ses.id,
            this.ses.measurement.continuityPingUp,
            this.ses.measurement.windowSizeUp,
            this.ses.measurement.windowSizePctLssUp);
        this.pinger.on('measure', (measure) => {
          const actMeas = new QualityParameters();
          actMeas.introduceClientMeasures(measure.local);
          actMeas.introduceServerMeasures(measure.remote);
          this.emit('measure', actMeas);
        });
        this.pinger.on('message', (m) => this.networkHandler.sendUDP(m));
        this.emit('completed', res.headers['Trigger-URI']);
        this.state = MEASURING_CONTINUITY;
        this.pinger.measure();
      }
    }
  }
  /**
   * @param {Request} req
   */
  reqTCP(req) {
    if (req.method === 'Q4S-ALERT') {
      const headers = {};
      headers['Session-Id'] = this.ses.sessionId;
      this.networkHandler.sendTCP(ReqQ4S.genReq('Q4S-ALERT', this.url,
          headers, req.body));
    } else if (req.method === 'Q4S-RECOVERY') {
      const headers = {};
      headers['Session-Id'] = this.ses.sessionId;
      this.networkHandler.sendTCP(ReqQ4S.genReq('Q4S-RECOVERY', this.url,
          headers, req.body));
    }
    if (this.state === MEASURING_PINGER) {
      this.pinger.cancel();
      if (req.headers['Content-Type'] === 'application/sdp') {
        this.ses = Session.fromSdp(req.body);
      }
      this.state = SENT_READY_0;
      this.startReady(0, 10);
    } else if (this.state === MEASURING_BANDWIDTH) {
      this.bander.cancel();
      this.state = SENT_READY_1;
      this.startReady(1, 10);
    }
  }
  /**
   * @param {Request} req
   * @param {Time} time
   */
  reqUDP(req, time) {
    if (this.state === MEASURING_PINGER) {
      this.pinger.req(req, time);
    } else if (this.state === MEASURING_BANDWIDTH) {
      this.bander.req(req, time);
    } else if (this.state === MEASURING_CONTINUITY) {
      this.pinger.req(req, time);
    }
  }
  /**
   * @param {Response} res
   * @param {Time} time
   */
  resUDP(res, time) {
    if (this.state === MEASURING_PINGER) {
      this.pinger.res(res, time);
    } else if (this.state === MEASURING_BANDWIDTH) {
      this.bander.res(res, time);
    } else if (this.state === MEASURING_CONTINUITY) {
      this.pinger.res(res, time);
    }
  }

  /**
   * Sends the Ready request for the passed stage
   * @param {Number} Stage
   * @param {Number} delay
   */
  startReady(Stage, delay) {
    if (Stage === 0) {
      this.state = SENT_READY_0;
    } else if (Stage == 1) {
      this.state = SENT_READY_1;
    } else if (Stage === 2) {
      this.state = SENT_READY_2;
    }
    const headers = {};
    headers['Stage'] = Stage;
    headers['Session-Id'] = this.ses.id;
    headers['Content-Type'] = 'application/sdp';
    const req = ReqQ4S.genReq(
        'READY',
        this.url,
        headers,
        this.ses.toSdp()
    );
    setTimeout(() => {
      this.networkHandler.sendTCP(req);
    }, delay);
  }
  /**
   * Finishes all communication.
   * @param {ReQQ4S} req
   */
  close() {
    if (typeof this.pinger !== 'undefined') {
      this.pinger.cancel();
    }
    if (typeof this.bander !== 'undefined') {
      this.bander.cancel();
    }
    this.networkHandler.closeNetwork();
    this.state = UNINITIALIZED;

    this.emit('end');
  }
}

const UNINITIALIZED = 0;
const SENT_HANDSHAKE = 1;
const SENT_READY_0 = 2;
const MEASURING_PINGER = 3;
const SENT_READY_1 = 4;
const MEASURING_BANDWIDTH = 5;
const SENT_READY_2 = 6;
const MEASURING_CONTINUITY = 7;
module.exports = ClientQ4S;
