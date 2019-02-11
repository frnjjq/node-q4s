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
   * @param {number} numberPings - Number of pings to send
   */
  constructor(sessionId, network, periodPings, proactive, numberPings) {
    this.sessionId = sessionId;
    this.network = network;
    this.periodPings = periodPings;
    this.proactive = proactive;
    this.numberPings = numberPings;

    this.sendingTime = [];
    this.recieveTime = [];
    this.reqTime = [];

    this.localMeas = new Measurement();
    this.reporMeas = new Measurement();

    this.sequence = 0;
  }

  static getNegotiationClient(sessionId, network, periodPings, numberPings) {
    return new Pinger(sessionId, network, periodPings, true, numberPings);
  }
  static getNegotiationServer(sessionId, network, periodPings, numberPing) {
    return new Pinger(sessionId, network, periodPings, false, numberPing);
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
          this.periodPings);
      } else {
        this.network.once('UDPRequest', () => {
          this.intervalId = setInterval(this._intHandler,
            this.periodPings);
        });
      }
    });
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
    this.localMeas.extractJitter(this.reqTime);
    this.reporMeas.fromHeader(req.headers.Measurements);
  }
  _resHandler(res, time) {
    const seq = res.headers['Sequence-Number'];
    if (seq) {
      this.recieveTime.push({ seq: seq, time: time });
      this.localMeas.extractLatency(this.sendingTime, this.recieveTime);
    }
  }
}

module.exports = Pinger;
