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
    this.networkHandler.on("TCPRequest", this.TCPReqHandler);
  }

  async connect(ip, port) {
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

  async handshakeHandler(res) {
    switch (this.session.sessionState) {
      case Session.sessionStates.UNINITIATED:
        if (res.statusCode != 200) {
          this.emit("error", new Error(res.reasonPhrase))
          this.close();
        }
        else {
          this.session.mergeServer(Session.fromSdp(res.body)); // TODO => Must be changed with the sesion implementation.
          this.pinger = new Pinger(this.session.sessionId,this.networkHandler, this.session.measurement.negotiationPingUp,255);
          this.session.sessionState = Session.sessionStates.STABILISHED;
          try {
            await this.networkHandler.initQ4sSocket(this.session.addresses.serverAddress, this.session.addresses.q4sServerPorts.TCP, this.session.addresses.q4sClientPorts.TCP, this.session.addresses.q4sServerPorts.UDP, this.session.addresses.q4sClientPorts.UDP);
          }
          catch (err) {
            this.emit("error", err);
            this.close();
          }
          this.networkHandler.closeHandshake();
          let header ={ Stage: 0};
          header["Session-Id"] = this.session.sessionId;
          this.networkHandler.sendTCP(new ReqQ4S("READY", "q4s://www.example.com", "Q4S/1.0", header, undefined));
        }
        break;
    }
  }

  async TCPResHandler(res) {
    switch (this.session.sessionState) {
      case Session.sessionStates.STABILISHED:
      if (res.statusCode != 200) {
        this.emit("error", new Error(res.reasonPhrase))
        this.close();
      }
      else {
        if(res.headers.Stage === "0") {
          this.session.sessionState = Session.sessionStates.STAGE_0;
          try{
            const [localMeasure, reportedMeasure] = await this.pinger.startMeasurements(false);
            this.session.quality.doesMetQuality(new QualityParameters(reportedMeasures.latency, localMeasure.jitter, reportedMeasure.jitter))

          } catch (err){
            let header ={ Stage: 0};
            header["Session-Id"] = this.session.sessionId;
            this.networkHandler.sendTCP(new ReqQ4S("READY", "q4s://www.example.com", "Q4S/1.0", header, undefined));
          }
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

  TCPReqHandler(req) {
    switch (this.session.sessionState) {
      case Session.sessionStates.STAGE_0:
        this.pinger.cancel();
        let headers = {};
        headers["Session-Id"] = this.session.sessionId; 
        this.networkHandler.sendTCP(new ReqQ4S("Q4S-ALERT", "q4s://www.example.com", "Q4S/1.0",headers, undefined));
      break;
    }
  }

  close() {
    this.networkHandler.closeNetwork()
    this.emit("close");
  }
}

module.exports = Q4SClient;