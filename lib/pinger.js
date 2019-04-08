/**
 * Contains the implementation of pinger
 * @module pinger
 * @license Apache-2.0
 */

const EventEmitter = require('events');
const Measure = require('./measure');
const Request = require('./request');
const Response = require('./response');

/**
 * Implements the logic of the first negotiation phase.
 */
class Pinger extends EventEmitter {
  /**
   * Constructor
   * @param {Number} sessionId - The id of the session
   * @param {Number} periodPings - Period in ms
   * @param {Number} numberPings - Number of pings
   * @param {Boolean} proactive - Should this pinger be the first
   */
  constructor(sessionId, periodPings, numberPings, proactive) {
    super();
    /**
     * Session id of the session. It is included in every request
     * @member {Number}
     */
    this.sessionId = sessionId;
    /**
     * Time between outbound pings requests. In ms.
     * @member {Number}
     */
    this.periodPings = periodPings;
    /**
     * Number of PING requests to be generated.
     * @member {Number}
     */
    this.numberPings = numberPings;
    /**
     * Array containing the arriving time of the recieved Requests.
     * @member {Array}
     */
    this.times = [];
    /**
     * The current local created measures.
     * @member {Measure}
     */
    this.localMeas = new Measure();
    /**
     * The reported measures from the other endpoint.
     * @member {Measure}
     */
    this.reporMeas = new Measure();
    /**
     * The sequence number which is included in every Request.
     * @member {Number}
     */
    this.sequence = 0;
    /**
     * Tells whether this pinger should start to send requests after start
     * or to wait to recieve the first ping and then start its own Pings.
     * @member {Boolean}
     */
    this.proactive = proactive;

    /**
     * Id of the timeout. Undedined in case there is no timeout running
     * @member {Number}
     */
    this.timeoutId = undefined;

    /**
     * Id of the interval. Undefined in case there is no interval running
     * @member {Number}
     */
    this.intervalId = undefined;
  }

  /**
   * Generates a new pinger with Client settings.
   * @param {Number} sessionId - The id of the session
   * @param {Number} periodPings - Period in ms
   * @param {Number} numberPings - Number of pings
   * @return {Pinger}
   */
  static genClient(sessionId, periodPings, numberPings) {
    return new Pinger(sessionId, periodPings, numberPings, true);
  }

  /**
   * Generates a new pinger with Server settings.
   * @param {Number} sessionId - The id of the session
   * @param {Number} periodPings - Period in ms
   * @param {Number} numberPings - Number of pings
   * @return {Pinger}
   */
  static genServer(sessionId, periodPings, numberPings) {
    return new Pinger(sessionId, periodPings, numberPings, false);
  }

  /**
   * Start the measurement of the pinger.
   * @return {Promise} - Returns the measured data
   */
  measure() {
    return new Promise((resolve, reject) => {
      this.endFunc = () => {
        this.timeoutId = undefined;
        this.sequence = 0;
        this.isActive = false;
        this.rejectCallback = undefined;
        this.localMeas.extractFromPinger(this.times)
            .then(() => {
              resolve({
                local: this.localMeas,
                remote: this.reporMeas,
              });
            });
      };

      this.intFunc = () => {
        const headers = {
          'Sequence-Number': this.sequence,
          'Session-Id': this.sessionId,
          'Measurements': this.localMeas.toHeader(),
        };
        this.emit('message', Request.genReq(
            'PING',
            'q4s://www.example.com',
            headers));
        this.times.push({send: Date.now()});
        this.sequence++;
        if (this.numberPings && this.sequence === this.numberPings) {
          clearInterval(this.intervalId);
          this.intervalId = undefined;
          this.timeoutId = setTimeout(this.endFunc, 1000);
        }
      };
      this.rejectCallback = reject;
      this.isActive = true;
      if (this.proactive) {
        this.intervalId = setInterval(this.intFunc, this.periodPings);
      }
    });
  }
  /**
   * Adds a response to the current measurement. This should only be called
   * during a measurement
   * @param {Response} res - The recieved response.
   * @param {Number} time - The time in miliseconds since epoch.
   */
  res(res, time) {
    if (!this.isActive) {
      return;
    }
    const seq = parseInt(res.headers['Sequence-Number']);
    if (!isNaN(seq) && seq < this.times.length) {
      this.times[seq].recieve = time.getTime();
      this.localMeas.extractFromPinger(this.times);
    }
  }
  /**
   * Adds a request to the current measurement. This should only be called
   * during a measurement.
   * @param {Request} req - The recieved request.
   * @param {Number} time - The time in miliseconds since epoch.
   */
  req(req, time) {
    if (!this.isActive) {
      return;
    }
    if (!this.proactive) {
      this.proactive = true;
      this.intervalId = setInterval(this.intFunc, this.periodPings);
    }
    const seq = req.headers['Sequence-Number'];
    const headers = {
      'Sequence-Number': seq,
      'Session-Id': req.headers['Session-Id'],
    };
    this.emit('message', Response.genRes(200, headers, undefined));
    this.reporMeas.fromHeader(req.headers.Measurements);
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = setTimeout(this.endFunc, 1000);
    }
  }
  /**
   * Cancel an outgoing measurement.
   */
  cancel() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    this.timeoutId = undefined;
    this.intervalId = undefined;
    this.sequence = 0;
    this.isActive = false;
    this.times = [];
    if (this.rejectCallback) {
      this.rejectCallback(new Error('cancel'));
    }
    this.rejectCallback = undefined;
  }
}

module.exports = Pinger;
