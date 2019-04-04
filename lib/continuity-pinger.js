/**
 * Module which implements the class ContinuityPinger which includes the four
 * parameters that are measured in Q4S.
 * @module continuity-pinger
 */

const EventEmitter = require('events');

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
   * @param {number} periodPings - ms elapsed between pings
   * @param {number} pingWndwSze - Latency and Jitter window size
   * @param {number} pcktlssWndwSze - Packet loss window size
   * @param {Boolean} proactive

   */
  constructor(sessionId, periodPings, pingWndwSze, pcktlssWndwSze,
      proactive) {
    super();
    /**
     * Session id to be included in the requests
     * @member {Number}
     */
    this.sessionId = sessionId;
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
    this.times = [];
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
    /**
     * The number of units sequece has over passed buffers
     * @member {Number}
     */
    this.seqOverflow = 0;

    this.proactive = proactive;
  }

  /**
   * Generates a new pinger with Server settings.
   * @param {Number} sessionId - The id of the session
   * @param {Number} periodPings - Period in ms
   * @param {Number} pingWndwSze - Window size for ping calculation
   * @param {Number} pcktlssWndwSze - Window size for packet loss calculation
   * @return {Pinger}
   */
  static genServer(sessionId, periodPings, pingWndwSze,
      pcktlssWndwSze) {
    return new ContinuityPinger(sessionId, periodPings,
        pingWndwSze, pcktlssWndwSze, false);
  }

  /**
   * Generates a new pinger with Client settings.
   * @param {Number} sessionId - The id of the session
   * @param {Number} periodPings - Period in ms
   * @param {Number} pingWndwSze - Window size for ping calculation
   * @param {Number} pcktlssWndwSze - Window size for packet loss calculation
   * @return {Pinger}
   */
  static genClient(sessionId, periodPings, pingWndwSze,
      pcktlssWndwSze) {
    return new ContinuityPinger(sessionId, periodPings,
        pingWndwSze, pcktlssWndwSze, true);
  }
  /**
   * Starts the measurement stage.
   */
  measure() {
    this.intFunc = () => {
      const headers = {
        'Session-Id': this.sessionId,
        'Sequence-Number': this.sequence,
        'Measurements': this.localMeas.toHeader(),
      };
      this.emit('message', Request.genReq(
          'PING',
          'q4s://www.example.com',
          headers));
      this.times.push({send: Date.now()});
      this.sequence++;
    };

    if (this.proactive) {
      this.intervalId = setInterval(this.intFunc, this.periodPings);
    }
  }
  /**
   * Stop the current measurement.
   */
  stop() {
    clearInterval(this.intervalId);
    this.network.removeListener('UDPResponse', this.resFunc);
    this.network.removeListener('UDPRequest', this.reqFunc);
    this.intervalId = undefined;
  }
  /**
   * Adds a response to the current measurement. This should only be called
   * during a measurement
   * @param {Response} res - The recieved response.
   * @param {Number} time - The time in miliseconds since epoch.
   */
  res(res, time) {
    const seq = parseInt(res.headers['Sequence-Number']);
    if (!isNaN(seq) && (seq-this.seqOverflow) >= 0) {
      this.times[seq - this.seqOverflow].recieve = time.getTime();
      this.cleanArrays();
      this.localMeas.extractFromPinger(this.times)
          .then(() => {
            this.emit('measure', {
              local: this.localMeas,
              remote: this.reporMeas,
            });
          });
    }
  };
  /**
   * Adds a request to the current measurement. This should only be called
   * during a measurement.
   * @param {Request} req - The recieved request.
   * @param {Number} time - The time in miliseconds since epoch.
   */
  req(req, time) {
    if (!this.proactive) {
      this.proactive = true;
      this.intervalId = setInterval(this.intFunc, this.periodPings);
    }

    const sequence = req.headers['Sequence-Number'];
    const headers = {
      'Sequence-Number': sequence,
      'Session-Id': this.sessionId,
    };
    this.emit('message', Response.genRes(200, headers));
    this.reporMeas.fromHeader(req.headers.Measurements);
  }

  /**
   * If needed remove data.
   */
  cleanArrays() {
    while (this.times.length >= this.maxBuffer) {
      this.times.shift();
      this.seqOverflow++;
    }
  }
}

module.exports = ContinuityPinger;
