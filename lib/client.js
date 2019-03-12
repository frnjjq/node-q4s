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

    this.handshakeHandler = (res) => {
      if (res.statusCode != 200) {
        this.emit('error', new Error(res.reasonPhrase));
        this.close();
      } else {
        this.ses.updateWithSDP(res.body);
        this.pinger = Pinger.genClient(
            this.ses.id,
            this.networkHandler,
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
              this.ses.state = Session.STAGE_0;
              this.startReady(0, 10);
            })
            .catch((err) => {
              this.emit('error', err);
              this.close();
            });
      }
    };
    this.networkHandler.on('handshake-Res', this.handshakeHandler);

    this.TCPRes = async (res) => {
      if (res.statusCode != 200) {
        this.emit('error', new Error(res.reasonPhrase));
        this.close();
      } else {
        if (this.ses.state === Session.STAGE_0) {
          try {
            const measure = await this.pinger.measure();


            const actMeas = new QualityParameters();
            actMeas.introduceClientMeasures(measure.local);
            actMeas.introduceServerMeasures(measure.remote);
            this.emit('measure', actMeas);
            if (this.ses.quality.doesMetQuality(actMeas)) {
              if (this.ses.quality.requireReady1()) {
                this.bander = Bandwidther.genClient(this.ses.id,
                    this.networkHandler,
                    this.ses.quality.bandwidthUp,
                    this.ses.measurement.negotiationBandwidth);
                this.ses.state = Session.STAGE_1;
                this.startReady(1, 10);
              } else {
                this.ses.state = Session.CONTINUITY;
                this.startReady(2, 10);
              }
            } else {
              this.ses.state = Session.STAGE_0;
              this.startReady(0, 10);
            }
          } catch (err) {
            this.emit('error', new Error('Error in pinger restarting'));
            this.ses.state = Session.STAGE_0;
            this.startReady(0, 10);
          }
        } else if (this.ses.state === Session.STAGE_1) {
          try {
            const measure = await this.bander.measure();
            const actMeas = new QualityParameters();
            actMeas.introduceClientMeasures(measure.local);
            actMeas.introduceServerMeasures(measure.remote);
            this.emit('measure', actMeas);
            if (this.ses.quality.doesMetQuality(actMeas)) {
              this.ses.state = Session.CONTINUITY;
              this.startReady(2, 10);
            } else {
              this.ses.state = Session.STAGE_1;
              this.startReady(1, 10);
            }
          } catch (err) {
            this.emit('error',
                new Error('Error in bandwidth measurement restarting')
            );
            this.ses.state = Session.STAGE_1;
            this.startReady(1, 10);
          }
        } else if (this.ses.state === Session.CONTINUITY) {
          this.pinger = ContinuityPinger.genClient(
              this.ses.id,
              this.networkHandler,
              this.ses.measurement.continuityPingUp,
              this.ses.measurement.windowSizeUp,
              this.ses.measurement.windowSizePctLssUp);
          this.pinger.on('measure', (measure)=>{
            const actMeas = new QualityParameters();
            actMeas.introduceClientMeasures(measure.local);
            actMeas.introduceServerMeasures(measure.remote);
            this.emit('measure', actMeas);
          });
          this.emit('completed', res.headers['Trigger-URI']);
          this.pinger.measure();
        }
      }
    };
    this.networkHandler.on('TCP-Res', this.TCPRes);

    this.TCPReq = (req) => {
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

      switch (this.ses.sessionState) {
        case Session.STAGE_0:
          if (req.method === 'Q4S-ALERT') {
            this.pinger.cancel();
            if (req.headers['Content-Type'] === 'application/sdp') {
              this.ses = Session.fromSdp(req.body);
            }
            this.ses.state = Session.STAGE_0;
            this.startReady(0, 10);
          }
          break;
        case Session.STATES.STAGE_1:
          if (req.method === 'Q4S-ALERT') {
            this.pinger.cancel();
            this.ses.state = Session.STAGE_1;
            this.startReady(1, 10);
          }
      }
    };
    this.networkHandler.on('TCP-Req', this.TCPReq);
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
          this.ses.sessionState = Session.HANDSHAKE;
        });
  }
  /**
   * Sends the Ready request for the passed stage
   * @param {Number} Stage
   * @param {Number} delay
   */
  startReady(Stage, delay) {
    this.ses.sessionState = Stage;
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
    // Send the close message and wait for response
    // if response doesnt come finsih it by force
    // Check the pingers and bandiswithers in case
    // those are running.
    this.networkHandler.closeNetwork();
    this.emit('close');
  }
}

module.exports = ClientQ4S;
