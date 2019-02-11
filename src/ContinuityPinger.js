
const EventEmitter = require('events');

class ContinuityPinger extends EventEmitter {
  /**
   * Constructor for the QualityParameters class. Does not validate input data
   * coherence.
   * @param {number} sessionId - The session id to perform the pings
   * @param {ClientNetwotk} network - Network object
   * @param {number} periodPings - ms elapsed between pings
   * @param {number} [pingWndwSze] - Latency and Jitter window size
   * @param {number} [pcktlssWndwSze] - Packet loss window size
 
   */
  constructor(sessionId, network, periodPings, pingWndwSze, pcktlssWndwSze) {
    super();
    this.sessionId = sessionId;
    this.network = network;
    this.periodPings = periodPings;
    this.pingWndwSze = pingWndwSze;
    this.pcktlssWndwSze = pcktlssWndwSze;

    this.maxBuffer = pingWndwSze > pcktlssWndwSze ? pingWndwSze : pcktlssWndwSze;

    this.sendingTime = [];
    this.recieveTime = [];
    this.reqTime = [];

    this.localMeas = new Measurement();
    this.reporMeas = new Measurement();

    this.sequence = 0;
  }

  static getContinuity(sessionId, network, periodPings, pingWndwSze, pcktlssWndwSze) {
    return new ContinuityPinger(sessionId, network, periodPings, pingWndwSze, pcktlssWndwSze);
  }

  /**
   * Starts the measurement stage.
   * @return {Promise} On sucess the measures, on error the error
   */
  start() {
    this.network.on('UDPResponse', resFunc);
    this.network.on('UDPRequest', reqFunc);
    this.intervalId = setInterval(this._intHandler, this.periodPings);
  }
  /**
  * Cancel communication
  */
  cancel() {
    clearInterval(this.intervalId);
    this.network.removeListener('UDPResponse', resFunc);
    this.network.removeListener('UDPRequest', reqFunc);
  }

  _intHandler() {
    const headers = {};
    headers['Session-Id'] = this.sessionId;
    headers['Sequence-Number'] = this.sequence;
    headers['Measurements'] = this.localMeasurements.toHeader();
    this.network.sendUDP(ReqQ4S.genReq(
      'PING',
      'q4s://www.example.com',
      headers));
    this.sendingTime.push({ seq: this.sequence, time: new Date() });
    this.sequence++;
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
      this.emit('measure', this.localMeas, this.reporMeas);
    }
  }

  /**
   * If needed remove data.
   */
  cleanArrays() {
    let samplesSent = this.sendingTime.length;
    let anyRemoved = false;
    while (this.maxBuffer > samplesSent) {
      this.sendingTime.slice();
      anyRemoved = true;
    }
    if (anyRemoved) {
      this.recieveTime = this.recieveTime.filter((elmnt) => {
        for (let i = 0; i < this.sendingTime.length; i++) {
          if (this.sendingTime[i].seq == elmnt.seq) {
            return true;
          }
        }
        return false;
      });
    }

    let recievedReqs = this.reqTime.length;
    if (this.maximumWin > recievedReqs) {
      this.reqTime.sort((a, b) => {
        return a.seq - b.seq;
      });
    }
    while (this.maximumWin > recievedReqs) {
      this.reqTime.slice();
    }
  }
}

module.exports = ContinuityPinger;
