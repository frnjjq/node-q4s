/**
 * Pinger module which is in change of measure the Ping
 * @module Pinger
 */

/**
 * Pinger class. In charge of sending pings and obtain the metrics
 */
class Pinger {
  constructor(sessionId, network, periodPings, numberPings) {
    this.sessionId = sessionId;
    this.network = network;
    this.periodPings = periodPings;
    this.numberPings = numberPings;
    this.sendingTime = new Array(numberPings);
    this.sendingTime.fill(0);
    this.recieveTime = new Array(numberPings);
    this.recieveTime.fill(0);
    this.reqTime = new Array();
    this.reqTime.fill(0);
    this.sequence = 0;
    this.localMeasurements = new Measurement();
    this.reportedMeasurements = new Measurement();
    this.isCancel = false;
  }

  async startMeasurements(waitArrival) {
    return new Promise(function (resolve, reject) {

      const endFunc = () => {
        this.network.removeListener("UDPResponse", resFunc);
        this.network.removeListener("UDPRequest", reqFunc);
        this.localMeasurements.fromArray(this.sendingTime, this.recieveTime, this.reqTime)

        resolve([this.localMeasurements,this.reportedMeasurements]);
      }
      const intervaFunc = () => {
        if (!this.isCancel) {
          const headers = { Stage: "0" };
          headers["Session-Id"] = this.sessionId;
          headers["Sequence-Number"] = this.sequence;
          headers["Measurements"] = this.localMeasurements.toHeader();
          this.network.sendUDP(new ReqQ4S("PING", "q4s://www.example.com", "Q4S/1.0", headers));
          this.sendingTime[sequenceNumber] = new Date();

          if (++this.sequence === numberOfPackets) {
            clearInterval(this.intervalId);
            setTimeout(endFunc, 300);
          }
        }
        else {
          clearInterval(this.intervalId);
          this.network.removeListener("UDPResponse", resFunc);
          this.network.removeListener("UDPRequest", reqFunc);
          reject("Cancel");
        }
      }
      const resFunc = (res) => {
        const time = new Date();
        if (res.headers["Sequence-Number"]) {
          this.recieveTime[res.headers["Sequence-Number"]] = time;
        }
        this.localMeasurements.fromArray(this.sendingTime, this.recieveTime, this.reqTime);
      }
      const reqFunc = (req) => {
        const time = new Date();
        const headers = {};
        const sequence = req.headers["Sequence-Number"];
        headers["Sequence-Number"] = sequence;
        headers["Session-Id"] = req.headers["Session-Id"];
        this.network.sendUDP(new ResQ4S("Q4S/1.0", 200, "ok", headers, undefined));

        if (sequence < this.reqTime.lenght) {
          this.reqTime[sequence] = time;
        }
        else {
          this.reqTime.push(time);
          this.reqTime.shift();
        }
        this.reportedMeasurements.fromHeader(req.headers.Measurements);
      }

      this.network.on("UDPResponse", resFunc);
      this.network.on("UDPRequest", reqFunc);

      if (!waitArrival) {
        this.intervalId = setInterval(intervaFunc, this.measurementProcedure.negotiationPingUp);
      }
      else {
        this.network.once("UDPRequest", (req) => {
          this.intervalId = setInterval(intervaFunc, this.measurementProcedure.negotiationPingUp);
        });
      }
    });
  }
  cancel() {
    this.isCancel = true;
  }

}