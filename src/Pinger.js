/**
 * Pinger module which is in change of measure the Ping
 * @module Pinger
 */

/**
 * Pinger class. In charge of sending pings and obtain the metrics
 */
class Pinger {
  /**
   * Constructor for the QualityParameters class. Does not validate input data
   * coherence.
   * @param {number} sessionId - The session id to perform the pings
   * @param {ClientNetwotk} network - Network object
   * @param {number} periodPings - ms elapsed between pings
   * @param {Boolean} proactive - Packet loss widnow size
   * @param {number} [numberPings] - Number of pings to send
   * @param {number} [pingWndwSze] - Latency and Jitter window size
   * @param {number} [pcktlssWndwSze] - Packet loss window size

   */
  constructor(sessionId, network, periodPings, proactive, numberPings, pingWndwSze, pcktlssWndwSze) {
    this.sessionId = sessionId;
    this.network = network;
    this.periodPings = periodPings;
    this.proactive = proactive;
    this.numberPings = numberPings;
    this.pingWndwSze = pingWndwSze;
    this.pcktlssWndwSze = pcktlssWndwSze;
    this.maximumWin = pingWndwSze > pcktlssWndwSze ? pingWndwSze : pcktlssWndwSze;

    this.sendingTime = [];
    this.recieveTime = [];
    this.reqTime = [];

    this.localMeas = new Measurement();
    this.reporMeas = new Measurement();

    this.sequence = 0;
  }
  /**
   * Starts the measurement stage.
   * @return {Promise} On sucess the measures, on error the error
   */
  start() {
    return new Promise((resolve, reject) => {
      this.resolveCallback = resolve;
      this.rejectCallback = reject;
      this.network.on('UDPResponse', resFunc);
      this.network.on('UDPRequest', reqFunc);

      if (this.proactive) {
        this.intervalId = setInterval(this._intHandler,
          this.measurementProcedure.negotiationPingUp);
      } else {
        this.network.once('UDPRequest', () => {
          this.intervalId = setInterval(this._intHandler,
            this.measurementProcedure.negotiationPingUp);
        });
      }
    });
  }
  _intHandler() {
    const headers = {};
    headers['Session-Id'] = this.sessionId;
    headers['Sequence-Number'] = this.sequence;
    headers['Measurements'] = this.localMeasurements.toHeader();
    this.network.sendUDP(ReqQ4S.genRes(
      'PING',
      'q4s://www.example.com',
      headers));
    this.sendingTime.push({ seq: this.sequence, time: new Date() });
    this.cleanArrays();
    this.sequence++;
    if (this.numberPings && this.sequence === this.numberPings) {
      clearInterval(this.intervalId);
      setTimeout(_endHandler, 300);
    }
  }
  _endHandler() {
    this.network.removeListener('UDPResponse', this._resHandler);
    this.network.removeListener('UDPRequest', this._reqHandler);
    this.cleanArrays();
    this.localMeas.extractLatency(this.sendingTime, this.recieveTime);
    this.localMeas.extractJitter(this.reqTime);
    this.resolveCallback([this.localMeas, this.reporMeas]);
  }
  _reqHandler(req, time) {
    const headers = {};
    const sequence = req.headers['Sequence-Number'];
    headers['Sequence-Number'] = sequence;
    headers['Session-Id'] = req.headers['Session-Id'];
    this.network.sendUDP(ResQ4S.genRes(200, headers, undefined));
    this.reqTime.push(time);
    this.cleanArrays();
    this.localMeas.extractJitter(this.reqTime);
    this.reporMeas.fromHeader(req.headers.Measurements);
  }
  _resHandler(res, time) {
    const seq = res.headers['Sequence-Number'];
    if (seq) {
      this.recieveTime.push({ seq: seq, time: time });
      this.cleanArrays();
      this.localMeas.extractLatency(this.sendingTime, this.recieveTime);
    }
  }

  /**
   * Cancel communication
   */
  cancel() {
    clearInterval(this.intervalId);
    this.network.removeListener('UDPResponse', resFunc);
    this.network.removeListener('UDPRequest', reqFunc);
    if (this.rejectCallback) {
      this.rejectCallback();
    }
  }
  /**
   * If needed remove data.
   */
  cleanArrays() {
    if (!this.numberPings) {
      let samplesSent = this.sendingTime.length;
      let anyRemoved = false;
      while (this.maximumWin > samplesSent) {
        this.sendingTime.slice();
        anyRemoved = true;
      }
      if(anyRemoved){
        this.recieveTime = this.recieveTime.filter((elmnt) => {
          for (let i = 0; i < this.recieveTime.length; i++) {
            if (this.sendingTime[i] == elmnt.seq) {
              return true;
            }
          }
          return false;
        });
      }

      let recievedReqs = this.reqTime.length;
      if (this.maximumWin > recievedReqs){
        this.reqTime.sort((a, b) => {
          return a.seq - b.seq;
        });
      }
      while (this.maximumWin > recievedReqs) {
        this.reqTime.slice();
      }
    }
  }
}

module.exports = Pinger;
