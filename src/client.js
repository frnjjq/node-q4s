const EventEmitter = require('events');
const req = require('ReqQ4S.js');
const ses = require('session.js');
const ClientNetwork = require("ClientNetwork.js")

class clientQ4S extends EventEmitter {
  constructor(clientOptions) {
    super();

    this.session = ses.fromOpts(clientOptions);

    this.networkHandler = new ClientNetwork();
    this.networkHandler.on("handshakeResponse", this.handshakeHandler);
    this.networkHandler.on("TCPResponse", this.TCPResHandler);
  }

  connect(ip, port) {
    try {
      await this.networkHandler.initHandshakeSocket(ip, port, undefined);
    } catch (err) {
      this.emit("error", err);
      this.emit("close");
      return;
    }
    this.networkHandler.sendHandshakeTCP(new req("BEGIN", "q4s://www.example.com", "Q4S/1.0", undefined, this.session.toSdp()));
    return;
  }

  handshakeHandler(res) {
    switch (this.session.sessionState) {
      case ses.sessionStates.UNINITIATED:
        if (res.statusCode != 200) {
          this.emit("error", new Error(res.reasonPhrase))
          this.close();
        }
        else {
          this.session.mergeServer(ses.fromSdp(res.body));
          this.session.sessionState = ses.sessionStates.STABILISHED;
          try {
            await this.networkHandler.initQ4sSocket(this.session.addresses.serverAddress, this.session.addresses.q4sServerPorts.TCP, this.session.addresses.q4sClientPorts.TCP, this.session.addresses.q4sServerPorts.UDP, this.session.addresses.q4sClientPorts.UDP);
          }
          catch (err) {
            this.emit("error", err);
            this.close();
          }
          this.networkHandler.sendTCP(/* Send READY 1*/);
        }
        break;
    }
  }
  TCPResHandler(res) {

  }
  close() {
    this.networkHandler.closeNetwork() 
    this.emit("close");
  }
}

module.exports = Q4SClient;