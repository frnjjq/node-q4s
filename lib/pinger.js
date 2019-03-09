/**
 * Contains the implementation of pinger
 * @module pinger
 * @license Apache-2.0
 */
const Measure = require('./measure');
const Request = require('./request');
const Response = require('./response');

/**
 * Implements the logic of the first negotiation phase.
 */
class Pinger {
  /**
   * Constructor
   * @param {Number} sessionId - The id of the session
   * @param {ClientNetwork|ServerNetwork} network - Network object
   * @param {Number} periodPings - Period in ms
   * @param {Number} numberPings - Number of pings
   * @param {Boolean} proactive - Should this pinger be the first
   */
  constructor(sessionId, network, periodPings, numberPings, proactive) {
    /**
     * Session id of the session. It is included in every request
     * @member {Number}
     */
    this.sessionId = sessionId;
    /**
     * Network object which emits events with the messages. Can be used both
     * client and server network objects.
     * @member {ClientNetwork|ServerNetwork}
     */
    this.network = network;
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
     * Array containing the kickout time for Ping requests
     * @member {Array}
     */
    this.sendingTime = [];
    /**
     * Array containing the arriving time of the Responses for the requests.
     * @member {Array}
     */
    this.recieveTime = [];
    /**
     * Array containing the arriving time of the recieved Requests.
     * @member {Array}
     */
    this.reqTime = [];
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
     * This property describes whether this pinger is currently running
     * or it is not active. It means that the listeners are bound to
     * the network.
     * @member {Boolean}
     */
    this.isActive = false;

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
   * @param {ClientNetwork|ServerNetwork} network - Network object
   * @param {Number} periodPings - Period in ms
   * @param {Number} numberPings - Number of pings
   * @return {Pinger}
   */
  static genClient(sessionId, network, periodPings, numberPings) {
    return new Pinger(sessionId, network, periodPings, numberPings, true);
  }

  /**
   * Generates a new pinger with Server settings.
   * @param {Number} sessionId - The id of the session
   * @param {ClientNetwork|ServerNetwork} network - Network object
   * @param {Number} periodPings - Period in ms
   * @param {Number} numberPings - Number of pings
   * @return {Pinger}
   */
  static genServer(sessionId, network, periodPings, numberPings) {
    return new Pinger(sessionId, network, periodPings, numberPings, false);
  }

  /**
   * Star the measurement stage. It will resolve the promise with the obtained
   * measures and the last reported metrics from the other end. May reject if
   * someone cancels the measure.
   * @return {Promise<Object>} The measures obtained.
   */
  measure() {
    return new Promise((resolve, reject) => {
      this.resFunc = (res, time, record) => {
        if (typeof record == 'undefined' || record.id === this.sessionId) {
          const seq = parseInt(res.headers['Sequence-Number']);
          if (!isNaN(seq)) {// por que aqui no peta el 0?
            this.recieveTime.push({seq: seq, time: time});
            this.localMeas.extractLatency(this.sendingTime, this.recieveTime);
          }
        }
      };

      this.reqFunc = (req, time, record) => {
        if (typeof record == 'undefined' || record.id === this.sessionId) {
          const seq = req.headers['Sequence-Number'];
          const headers = {
            'Sequence-Number': seq,
            'Session-Id': req.headers['Session-Id'],
          };
          this.network.sendUDP(Response.genRes(200, headers, undefined)
              , this.sessionId);
          this.reqTime.push({seq: parseInt(seq), time: time});
          this.localMeas.extractJitter(this.reqTime);
          this.reporMeas.fromHeader(req.headers.Measurements);
          if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = setTimeout(this.endFunc, 1000);
          }
        }
      };

      this.endFunc = () => {
        this.timeoutId = undefined;
        this.sequence = 0;
        this.isActive = false;
        this.network.removeListener('UDP-Res', this.resFunc);
        this.network.removeListener('UDP-Req', this.reqFunc);
        this.localMeas.extractLatency(this.sendingTime, this.recieveTime);
        this.localMeas.extractJitter(this.reqTime);
        resolve({
          local: this.localMeas,
          remote: this.reporMeas,
        });
      };

      this.intFunc = () => {
        const headers = {
          'Sequence-Number': this.sequence,
          'Session-Id': this.sessionId,
          'Measurements': this.localMeas.toHeader(),
        };
        this.network.sendUDP(Request.genReq(
            'PING',
            'q4s://www.example.com',
            headers), this.sessionId);
        this.sendingTime.push({seq: this.sequence, time: new Date()});
        this.sequence++;
        if (this.numberPings && this.sequence === this.numberPings) {
          clearInterval(this.intervalId);
          this.intervalId = undefined;
          this.timeoutId = setTimeout(this.endFunc, 1000);
        }
      };

      const startIterrupt = (req, time, record) => {
        if (record.id === this.sessionId) {
          this.intervalId = setInterval(this.intFunc, this.periodPings);
          this.network.off('UDP-Req', startIterrupt);
        }
      };

      this.rejectCallback = reject;
      this.network.on('UDP-Res', this.resFunc);
      this.network.on('UDP-Req', this.reqFunc);
      this.isActive = true;

      if (this.proactive) {
        this.intervalId = setInterval(this.intFunc, this.periodPings);
      } else {
        this.network.on('UDP-Req', startIterrupt);
      }
    });
  }
  /**
   * Stop the pinger. If there is a measure ongoing there will not be any
   * action, if a measure is going it will stop abruptly. it resets the
   * pinger for another measure.
   */
  stop() {
    if (this.timeoutId) {
      clearInterval(this.timeoutId);
      this.timeoutId = undefined;
    }
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    if (this.isActive) {
      this.sequence = 0;
      this.isActive = false;
      this.network.removeListener('UDPResponse', this.resFunc);
      this.network.removeListener('UDPRequest', this.reqFunc);
      this.rejectCallback();
    }
  }
}

module.exports = Pinger;
