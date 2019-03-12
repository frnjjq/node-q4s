/**
 * Module which implements the class ContinuityPinger which includes the four
 * parameters that are measured in Q4S.
 * @module continuity-pinger
 */

const EventEmitter = require('events');

const NanoTimer = require('nanotimer');

const Measure = require('./measure');
const Response = require('./response');
const Request = require('./request');

/**
 * ContinuityPinger class. In charge of sending pings and obtain the
 * metrics during Continuity.
 * @extends EventEmitter
 */
class ContinuityPinger extends EventEmitter {
  /**
   * Constructor for the QualityParameters class. Does not validate input data
   * coherence.
   * @param {number} sessionId - The session id to perform the pings
   * @param {ClientNetwork|ServerNetwork} network - Network object
   * @param {number} periodPings - ms elapsed between pings
   * @param {number} pingWndwSze - Latency and Jitter window size
   * @param {number} pcktlssWndwSze - Packet loss window size
   * @param {Boolean} proactive

   */
  constructor(sessionId, network, periodPings, pingWndwSze, pcktlssWndwSze,
      proactive) {
    super();
    /**
     * Session id to be included in the requests
     * @member {Number}
     */
    this.sessionId = sessionId;
    /**
     * Client Network object to attach th listeners required for the Pinger.
     * @member {ClientNetwork}
     */
    this.network = network;
    /**
     * Time between pings requests. Measured in ms.
     * @member {Number}
     */
    this.periodPings = periodPings;
    /**
     * Window to calculate the ping and jitter measures
     * @member {Number}
     */
    this.pingWndwSze = pingWndwSze;
    /**
     * Window to calculate the packet loss measures
     * @member {Number}
     */
    this.pcktlssWndwSze = pcktlssWndwSze;
    /**
     * Maximum number of samples to hold in the buffers.
     * @member {Number}
     */
    this.maxBuffer = pingWndwSze > pcktlssWndwSze ?
      pingWndwSze :
      pcktlssWndwSze;

    /**
     * Array containing the kickout time for Ping requests
     * @member {MeasureTimestamp[]}
     */
    this.sendingTime = [];
    /**
     * Array containing the arriving time of the Responses for the requests.
     * @member {MeasureTimestamp[]}
     */
    this.recieveTime = [];
    /**
     * Array containing the arriving time of the remote Requests.
     * @member {MeasureTimestamp[]}
     */
    this.reqTime = [];

    /**
     * The local measures for the parameters.
     * @member {Measurement}
     */
    this.localMeas = new Measure();
    /**
     * The reported measures from the other endpoint.
     * @member {Measurement}
     */
    this.reporMeas = new Measure();
    /**
     * The sequence number which is included in every Request.
     * @member {Number}
     */
    this.sequence = 0;

    this.proactive = proactive;

    this.timer = new NanoTimer();
  }

  /**
   * Generates a new pinger with Server settings.
   * @param {Number} sessionId - The id of the session
   * @param {ClientNetwork|ServerNetwork} network - Network object
   * @param {Number} periodPings - Period in ms
   * @param {Number} pingWndwSze - Window size for ping calculation
   * @param {Number} pcktlssWndwSze - Window size for packet loss calculation
   * @return {Pinger}
   */
  static genServer(sessionId, network, periodPings, pingWndwSze,
      pcktlssWndwSze) {
    return new ContinuityPinger(sessionId, network, periodPings,
        pingWndwSze, pcktlssWndwSze, false);
  }

  /**
   * Generates a new pinger with Client settings.
   * @param {Number} sessionId - The id of the session
   * @param {ClientNetwork|ServerNetwork} network - Network object
   * @param {Number} periodPings - Period in ms
   * @param {Number} pingWndwSze - Window size for ping calculation
   * @param {Number} pcktlssWndwSze - Window size for packet loss calculation
   * @return {Pinger}
   */
  static genClient(sessionId, network, periodPings, pingWndwSze,
      pcktlssWndwSze) {
    return new ContinuityPinger(sessionId, network, periodPings,
        pingWndwSze, pcktlssWndwSze, true);
  }
  /**
   * Starts the measurement stage.
   */
  measure() {
    this.resFunc = (res, time, record) => {
      if (typeof record == 'undefined' || record.id === this.sessionId) {
        const seq = parseInt(res.headers['Sequence-Number']);
        if (!isNaN(seq)) {
          this.recieveTime.push({seq: seq, time: time});
          this.cleanLatencyTime();
          this.localMeas.extractLatency(this.sendingTime, this.recieveTime);
          this.emit('measure', {
            local: this.localMeas,
            remote: this.reporMeas,
          });
        }
      }
    };

    this.reqFunc = (req, time, record) => {
      if (typeof record == 'undefined' || record.id === this.sessionId) {
        const sequence = req.headers['Sequence-Number'];
        const headers = {
          'Sequence-Number': sequence,
          'Session-Id': this.sessionId,
        };
        this.network.sendUDP(Response.genRes(200, headers, undefined),
            this.sessionId);
        this.reqTime.push({seq: parseInt(sequence), time: time});
        this.cleanReqTime();
        this.localMeas.extractJitter(this.reqTime);
        this.reporMeas.fromHeader(req.headers.Measurements);
      }
    };

    this.intFunc = () => {
      const headers = {
        'Session-Id': this.sessionId,
        'Sequence-Number': this.sequence,
        'Measurements': this.localMeas.toHeader(),
      };
      this.network.sendUDP(Request.genReq(
          'PING',
          'q4s://www.example.com',
          headers), this.sessionId);
      this.sendingTime.push({seq: this.sequence, time: new Date()});
      this.sequence++;
    };

    const startIterrupt = (req, time, record) => {
      if (record.id === this.sessionId) {
        this.timer.setInterval(this.intFunc, '', this.periodPings + 'm');
        this.network.off('UDP-Req', startIterrupt);
      }
    };

    this.network.on('UDP-Res', this.resFunc);
    this.network.on('UDP-Req', this.reqFunc);
    if (this.proactive) {
      this.timer.setInterval(this.intFunc, '', this.periodPings + 'm');
    } else {
      this.network.on('UDP-Req', startIterrupt);
    }
  }
  /**
   * Stop the current measurement.
   */
  stop() {
    this.timer.clearInterval();
    this.network.removeListener('UDPResponse', this.resFunc);
    this.network.removeListener('UDPRequest', this.reqFunc);
  }

  /**
   * Clean arrays used for jitter calculation.
   */
  cleanReqTime() {
    this.reqTime.sort((a, b) => {
      return a.seq - b.seq;
    });
    while (this.reqTime.length > this.maxBuffer) {
      this.reqTime.shift();
    }
  }
  /**
   * Clean arrays used for latency calculation.
   */
  cleanLatencyTime() {
    let anyRemoved = false;
    while (this.sendingTime.length > this.maxBuffer) {
      this.sendingTime.shift();
      anyRemoved = true;
    }
    if (anyRemoved) {
      this.recieveTime = this.recieveTime.filter((elmnt) => {
        for (let i = 0; i < this.sendingTime.length; i++) {
          if (this.sendingTime[i].seq === elmnt.seq) {
            return true;
          }
        }
        return false;
      });
    }
  }
}

module.exports = ContinuityPinger;
