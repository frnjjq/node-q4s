const Session = require('./session');
const EventEmitter = require('events');
const Response = require('./response');
const ServerNetwork = require('./server-network');
const ServerConnection = require('./server-connection');
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
      this.handshakeHandler(req, done)
    );
    this.networkHandler.on('TCP-Req', (msg, connection) => {
      connection.reqTCPHandler(msg)
          .then( () => this.store.update(connection));
    });
    this.networkHandler.on('TCP-Res', (msg, connection) => {
      connection.resTCPHandler(msg)
          .then(() => this.store.update(connection));
    });
    this.networkHandler.on('UDP-Req', (msg, time, connection) => {
      connection.reqUDPHandler(msg, time)
          .then(() => this.store.update(connection));
    });
    this.networkHandler.on('UDP-Res', (msg, time, connection) => {
      connection.resUDPHandler(msg, time)
          .then(() => this.store.update(connection));
    });
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
          let conn = new ServerConnection(ses);
          conn = this.store.insert(conn);
          conn.session.id = conn.$loki;
          conn.on('tcp', (msg) => {
            this.networkHandler.sendTCP(msg, conn);
          });
          conn.on('udp', (msg) => {
            this.networkHandler.sendUDP(msg, conn);
          });
          conn.on('finished', () => {
            conn.cancel();
            this.store.remove(conn);
          });
          conn.on('measure', (msg) => this.emit('measure', msg));
          this.store.update(conn);
          const headers = {
            'Content-Type': 'application/sdp',
            'Session-Id': conn.session.id,
          };
          done(Response.genRes(200, headers, conn.session.toSdp()));
        });
  }
}

module.exports = ServerQ4S;
