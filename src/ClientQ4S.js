/**
 * Client Q4S module. Intended to be used as interface of the module.
 * Implements the logic.
 * @module ClientQ4S
 * @license Apache-2.0
 */

const EventEmitter = require('events');

const Bandwidther = require('./Bandwidther');
const ClientNetwork = require('./ClientNetwork');
const ContinuityPinger = require('./ContinuityPinger');
const Pinger = require('./Pinger');
const QualityParameters = require('./QualityParameters');
const ReqQ4S = require('./ReqQ4S');
const Session = require('./Session');

/**
 * Client Q4S classs.
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
    this.networkHandler.on('handshakeResponse', this.handshakeHandler);
    this.networkHandler.on('TCPResponse', this.TCPResHandler);
    this.networkHandler.on('TCPRequest', this.TCPReqHandler);
  }

  async importClientOps(clientOptions) {
    this.ses = await Session.fromClientOps(clientOptions);
    this.url = clientOptions.url;
    return;
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
        this.networkHandler.sendHandshakeTCP(ReqQ4S.genReq(
          'BEGIN',
          this.url,
          undefined,
          this.ses.toSdp()
        ));
        this.ses.sessionState = Session.STATES.HANDSHAKE;
      });
  }
  /**
   * Sends the Ready request for the passed stage
   * @param {Number} Stage
   */
  startReady(Stage) {
    this.ses.sessionState = Stage;
    const headers = {};
    headers['Stage'] = Stage;
    headers['Session-Id'] = this.ses.id;
    this.networkHandler.sendTCP(ReqQ4S.genReq(
      'READY',
      this.url,
      headers,
      this.ses.toSdp()
    ));
  }
  /**
   * Private Handshake response handler.
   * @param {ResQ4S} res
   */
  handshakeHandler(res) {
    if (res.statusCode != 200) {
      this.emit('error', new Error(res.reasonPhrase));
      this.close();
    } else {
      this.ses = Session.fromSdp(res.body);
      this.pinger = Pinger.getNegotiationClient(
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
          this.startReady(0);
        })
        .catch((err) => {
          this.emit('error', err);
          this.close();
        });
    }
  }
  /**
   * Private TCP response handler.
   * @param {ResQ4S} res
   */
  async TCPResHandler(res) {

    if (res.statusCode != 200) {
      this.emit('error', new Error(res.reasonPhrase));
      this.close();
    } else {
      if (res.headers.Stage === '0') {
        try {
          const measure = await this.pinger.startMeasurements(false);
          const actMeas = new QualityParameters();
          actMeas.introduceClientMeasures(measure[0]);
          actMeas.introduceServerMeasures(measure[1]);
          if (this.ses.quality.doesMetQuality(actMeas)) {
            if (this.ses.quality.requireReady1()) {
              this.bander = new Bandwidther(this.ses.id,
                this.networkHandler,
                this.ses.quality.bandwidthUp,
                this.ses.measurement.negotiationBandwidth);
              this.startReady(1);
            } else {
              this.startReady(2);
            }
          } else {
            this.startReady(0);
          }
        } catch (err) {
          this.startReady(0);
        }
      }
      else if (res.headers.Stage === '1') {
        try {
          const measure = await this.bander.start();
          const actMeas = new QualityParameters();
          actMeas.introduceClientMeasures(measure[0]);
          actMeas.introduceServerMeasures(measure[1]);
          if (this.ses.quality.doesMetQuality(actMeas)) {
            this.startReady(2);
          } else {
            this.startReady(1);
          }
        } catch (err) {
          this.startReady(1);
        }
      }
      else if (res.headers.Stage === '2') {
        this.pinger = ContinuityPinger.getContinuity(
          this.ses.id,
          this.networkHandler,
          this.ses.measurement.continuityPingUp,
          this.ses.measurement.windowSizeUp,
          this.ses.measurement.windowSizePctLssUp);
        this.emit('completed', res.headers['Trigger-URI']);
        this.pinger.start();
      }
    }
  }
  /**
   * Private TCP request handler.
   * @param {ReQQ4S} req
   */
  TCPReqHandler(req) {
    if (req.method === 'Q4S-ALERT') {
      const headers = {};
      headers['Session-Id'] = this.ses.sessionId;
      this.networkHandler.sendTCP(new ReqQ4S('Q4S-ALERT', this.url, 'Q4S/1.0', headers, req.body));
    }
    else if (req.method === 'Q4S-RECOVERY') {
      const headers = {};
      headers['Session-Id'] = this.ses.sessionId;
      this.networkHandler.sendTCP(ReqQ4S.genReq('Q4S-RECOVERY', this.url, headers, req.body));
    }

    switch (this.ses.sessionState) {
      case Session.STATES.STAGE_0:
        if (req.method === 'Q4S-ALERT') {
          this.pinger.cancel();
          if (req.headers["Content-Type"] === 'application/sdp') {
            this.ses = Session.fromSdp(req.body);
          }
          this.startReady(0);
        }
        break;
      case Session.STATES.STAGE_1:
        if (req.method === 'Q4S-ALERT') {
          this.pinger.cancel();
          this.startReady(1);
        }
    }
  }
  /**
   * Finishes all communication.
   * @param {ReQQ4S} req
   */
  close() {
    this.networkHandler.closeNetwork();
    this.emit('close');

  }
}

module.exports = ClientQ4S;
