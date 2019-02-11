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

    this.ses = Session.fromClientOps(clientOptions);

    this.networkHandler = new ClientNetwork();
    this.networkHandler.on('handshakeResponse', this.handshakeHandler);
    this.networkHandler.on('TCPResponse', this.TCPResHandler);
    this.networkHandler.on('TCPRequest', this.TCPReqHandler);
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
              'q4s://www.example.com',
              undefined,
              this.ses.toSdp()
          ));
        });
  }
  /**
   * Sends the Ready request for the passed stage
   * @param {Number} Stage
   */
  startReady(Stage) {
    const headers = {};
    headers['Stage'] = Stage;
    headers['Session-Id'] = this.ses.id;
    this.networkHandler.sendTCP(ReqQ4S.genReq(
        'READY',
        'q4s://www.example.com',
        headers,
        this.ses.toSdp()
    ));
  }
  /**
   * Private Handshake response handler.
   * @param {ResQ4S} res
   */
  async handshakeHandler(res) {
    switch (this.ses.sessionState) {
      case Session.STATES.UNINITIATED:
        if (res.statusCode != 200) {
          this.emit('error', new Error(res.reasonPhrase));
          this.close();
        } else {
          this.ses.sessionState = Session.STATES.STABILISHED;
          // TODO => Must be changed with the sesion implementation.
          this.ses.mergeServer(Session.fromSdp(res.body));
          this.pinger = Pinger.getNegotiationClient(
              this.ses.id,
              this.networkHandler,
              this.ses.measurement.negotiationPingUp,
              255);
          try {
            await this.networkHandler.initQ4sSocket(
                this.ses.addresses.serverAddress,
                this.ses.addresses.q4sServerPorts.TCP,
                this.ses.addresses.q4sClientPorts.TCP,
                this.ses.addresses.q4sServerPorts.UDP,
                this.ses.addresses.q4sClientPorts.UDP);
            this.networkHandler.closeHandshake();
            this.startReady(0);
          } catch (err) {
            this.emit('error', err);
            this.close();
          }
        }
        break;
    }
  }
  /**
   * Private TCP response handler.
   * @param {ResQ4S} res
   */
  async TCPResHandler(res) {
    switch (this.ses.sessionState) {
      case Session.STATES.STABILISHED:
        if (res.statusCode != 200) {
          this.emit('error', new Error(res.reasonPhrase));
          this.close();
        } else {
          if (res.headers.Stage === '0') {
            this.ses.sessionState = Session.STATES.STAGE_0;
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
          } else if (res.headers.Stage === '1') {
            this.ses.sessionState = Session.STATES.STAGE_1;
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
          } else if (res.headers.Stage === '2') {
            this.ses.sessionState = Session.STATES.CONTINUITY;
            this.pinger = ContinuityPinger.getContinuity(
                this.ses.id,
                this.networkHandler,
                this.ses.measurement.continuityPingUp,
                this.ses.measurement.windowSizeUp,
                this.ses.measurement.windowSizePctLssUp);
            this.emit('completed', res.headers['Trigger-URI']);
            this.pinger.start();
          } else {
            this.close();
          }
          break;
        }
    }
  }
  /**
   * Private TCP request handler.
   * @param {ReQQ4S} req
   */
  TCPReqHandler(req) {
    // TODO -> PUEDE LLEGAR NUEVA CALDIAD
    // TODO -> Debo pedir una mayor QoS
    // TODO -> DEbo responder con el SDP con la firma
    switch (this.ses.sessionState) {
      case Session.STATES.STAGE_0:
        this.pinger.cancel();
        const headers = {};
        headers['Session-Id'] = this.ses.sessionId;
        this.networkHandler.sendTCP(new ReqQ4S('Q4S-ALERT', 'q4s://www.example.com', 'Q4S/1.0', headers, undefined));
        this.startReady(0);
        break;
      case Session.STATES.CONTINUITY:
        if (req.method === 'Q4S-ALERT') {
          const headers = {};
          headers['Session-Id'] = this.ses.sessionId;
          this.networkHandler.sendTCP(ReqQ4S.genReq('Q4S-ALERT', 'q4s://www.example.com', headers, undefined));
        } else if (req.method === 'Q4S-RECOVERY') {
          const headers = {};
          headers['Session-Id'] = this.ses.sessionId;
          this.networkHandler.sendTCP(ReqQ4S.genReq('Q4S-RECOVERY', 'q4s://www.example.com', headers, undefined));
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
