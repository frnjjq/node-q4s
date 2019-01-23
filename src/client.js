const EventEmitter = require('events');
const ReqQ4S = require('ReqQ4S.js');
const Session = require('session.js');
const ClientNetwork = require("ClientNetwork.js")

class clientQ4S extends EventEmitter {
  constructor(clientOptions) {
    super();

    this.session = Session.fromOpts(clientOptions);

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
    this.networkHandler.sendHandshakeTCP(new ReqQ4S("BEGIN", "q4s://www.example.com", "Q4S/1.0", undefined, this.session.toSdp()));
    return;
  }

  handshakeHandler(res) {
    switch (this.session.sessionState) {
      case Session.sessionStates.UNINITIATED:
        if (res.statusCode != 200) {
          this.emit("error", new Error(res.reasonPhrase))
          this.close();
        }
        else {
          this.session.mergeServer(Session.fromSdp(res.body)); // TODO => Must be changed with the sesion implementation.
          this.session.sessionState = Session.sessionStates.STABILISHED;
          try {
            await this.networkHandler.initQ4sSocket(this.session.addresses.serverAddress, this.session.addresses.q4sServerPorts.TCP, this.session.addresses.q4sClientPorts.TCP, this.session.addresses.q4sServerPorts.UDP, this.session.addresses.q4sClientPorts.UDP);
          }
          catch (err) {
            this.emit("error", err);
            this.close();
          }
          let header ={ Stage: 1};
          header["Session-Id"] = this.session.sessionId;
          this.networkHandler.sendTCP(new ReqQ4S("READY", "q4s://www.example.com", "Q4S/1.0", header, undefined));
        }
        break;
    }
  }

  TCPResHandler(res) {
    switch (this.session.sessionState) {
      case Session.sessionStates.STABILISHED:
      if (res.statusCode != 200) {
        this.emit("error", new Error(res.reasonPhrase))
        this.close();
      }
      else {
        if(res.headers.Stage === "0") {
          this.session.sessionState = Session.sessionStates.STAGE_0;
        }
        else if (res.headers.Stage === "1") {
          this.session.sessionState = Session.sessionStates.STAGE_1;
        }
        else {
          this.close();
        }

      }      
      break;
    }
  }

  close() {
    this.networkHandler.closeNetwork()
    this.emit("close");
  }
}

module.exports = Q4SClient;