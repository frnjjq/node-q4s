/**
 * Client Q4S module. Intended to be used as interface of the module.
 * Implements the logic.
 * @module ClientQ4S
 * @license Apache-2.0
 */

const EventEmitter = require('events');
const ReqQ4S = require('ReqQ4S.js');
const Session = require('session.js');
const ClientNetwork = require('ClientNetwork.js');

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

    this.session = Session.fromOpts(clientOptions);

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
          this.networkHandler.sendHandshakeTCP(new ReqQ4S(
              'BEGIN',
              'q4s://www.example.com',
              'Q4S/1.0',
              undefined,
              this.session.toSdp()
          ));
        });
  }
  /**
   * Private Handshake response handler.
   * @param {ResQ4S} res
   */
  async handshakeHandler(res) {
    switch (this.session.sessionState) {
      case Session.sessionStates.UNINITIATED:
        if (res.statusCode != 200) {
          this.emit('error', new Error(res.reasonPhrase));
          this.close();
        } else {
          // TODO => Must be changed with the sesion implementation.
          this.session.mergeServer(Session.fromSdp(res.body));
          this.pinger = new Pinger(
              this.session.id,
              this.networkHandler,
              this.session.measurement.negotiationPingUp,
              255);
          this.session.sessionState = Session.sessionStates.STABILISHED;
          try {
            await this.networkHandler.initQ4sSocket(
                this.session.addresses.serverAddress,
                this.session.addresses.q4sServerPorts.TCP,
                this.session.addresses.q4sClientPorts.TCP,
                this.session.addresses.q4sServerPorts.UDP,
                this.session.addresses.q4sClientPorts.UDP);
          } catch (err) {
            this.emit('error', err);
            this.close();
          }
          this.networkHandler.closeHandshake();
          const header ={Stage: 0};
          header['Session-Id'] = this.session.sessionId;
          this.networkHandler.sendTCP(new ReqQ4S(
              'READY',
              'q4s://www.example.com',
              'Q4S/1.0',
              header,
              undefined));
        }
        break;
    }
  }
  /**
   * Private TCP response handler.
   * @param {ResQ4S} res
   */
  async TCPResHandler(res) {
    switch (this.session.sessionState) {
      case Session.sessionStates.STABILISHED:
        if (res.statusCode != 200) {
          this.emit('error', new Error(res.reasonPhrase));
          this.close();
        } else {
          if (res.headers.Stage === '0') {
            this.session.sessionState = Session.sessionStates.STAGE_0;
            try {
              const measure = await this.pinger.startMeasurements(false);
              this.session.quality.doesMetQuality(new QualityParameters(
                  measure[0].latency,
                  measure[0].jitter,
                  measure[0].jitter));
            } catch (err) {
              const header ={Stage: 0};
              header['Session-Id'] = this.session.sessionId;
              this.networkHandler.sendTCP(new ReqQ4S(
                  'READY',
                  'q4s://www.example.com',
                  'Q4S/1.0',
                  header,
                  undefined));
            }
          } else if (res.headers.Stage === '1') {
            this.session.sessionState = Session.sessionStates.STAGE_1;
          } else {
            this.close();
          }
        }
        break;
    }
  }
  /**
   * Private TCP request handler.
   * @param {ReQQ4S} req
   */
  TCPReqHandler(req) {
    switch (this.session.sessionState) {
      case Session.sessionStates.STAGE_0:
        this.pinger.cancel();
        const headers = {};
        headers['Session-Id'] = this.session.sessionId;
        this.networkHandler.sendTCP(new ReqQ4S('Q4S-ALERT', 'q4s://www.example.com', 'Q4S/1.0', headers, undefined));
        break;
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
