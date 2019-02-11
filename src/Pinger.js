/**
 * Pinger module which is in change of measure the Ping
 * @module Pinger
 */
const Measurement = require('./Measurement');

/**
 * Measuring timestamp
 * @typedef {Object} MeasureTimestamp
 * @property {Number} seq - The sequence value
 * @property {Date} time - The time when the message was generated
 */

/**
 * Pinger class. In charge of sending pings and obtain the metrics
 */
class Pinger {
  /**
   * Constructor for the QualityParameters class. Does not validate input data
   * coherence.
   * @param {Number} sessionId - The session id to perform the pings
   * @param {ClientNetwork} network - Network object
   * @param {Number} periodPings - ms elapsed between pings
   * @param {Boolean} proactive - Packet loss widnow size
   * @param {Number} numberPings - Number of pings to send
   */
  constructor(sessionId, network, periodPings, proactive, numberPings) {
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
     * Switch to tell whether this instance will wait to start the request. Or
     * will be proactive and start sending PING request as instanciated.
     * @member {Boolean}
     */
    this.proactive = proactive;
    /**
     * Number of PING requests to send to the other end.
     * @member {Number}
     */
    this.numberPings = numberPings;
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
     * Array containing the arriving time of the Requests done by the other end.
     * @member {MeasureTimestamp[]}
     */
    this.reqTime = [];
    /**
     * The local measures for the parameters.
     * @member {Measurement}
     */
    this.localMeas = new Measurement();
    /**
     * The reported measures from the other endpoint.
     * @member {Measurement}
     */
    this.reporMeas = new Measurement();
    /**
     * The sequence number which is included in every Request.
     * @member {Number}
     */
    this.sequence = 0;
  }

  /**
   * Fabric static method which generates a Pinger ready for the Client
   * @param {Number} sessionId - The session id to perform the pings
   * @param {ClientNetwotk} network - Network object
   * @param {Number} periodPings - ms elapsed between pings
   * @param {Number} numberPings - Number of pings to send
   * @return {Pinger} - The generated intance of this class
   */
  static getNegotiationClient(sessionId, network, periodPings, numberPings) {
    return new Pinger(sessionId, network, periodPings, true, numberPings);
  }
  /**
   * Fabric static method which generates a Pinger ready for the Server.
   * @param {Number} sessionId - The session id to perform the pings
   * @param {ClientNetwotk} network - Network object
   * @param {Number} periodPings - ms elapsed between pings
   * @param {Number} numberPing - Number of pings to send
   * @return {Pinger} - The generated intance of this class
   */
  static getNegotiationServer(sessionId, network, periodPings, numberPing) {
    return new Pinger(sessionId, network, periodPings, false, numberPing);
  }

  /**
   * Starts the measurement stage.
   * @return {Promise<Measurement[]>} The measures obtained.
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
  /**
   * Interruption handler which sends the requests.
   */
  _intHandler() {
    const headers = {};
    headers['Session-Id'] = this.sessionId;
    headers['Sequence-Number'] = this.sequence;
    headers['Measurements'] = this.localMeasurements.toHeader();
    this.network.sendUDP(ReqQ4S.genRes(
        'PING',
        'q4s://www.example.com',
        headers));
    this.sendingTime.push({seq: this.sequence, time: new Date()});
    this.cleanArrays();
    this.sequence++;
    if (this.numberPings && this.sequence === this.numberPings) {
      clearInterval(this.intervalId);
      setTimeout(_endHandler, 300);
    }
  }
  /**
   * Timeout handler which finishes the measures.
   */
  _endHandler() {
    this.network.removeListener('UDPResponse', this._resHandler);
    this.network.removeListener('UDPRequest', this._reqHandler);
    this.localMeas.extractLatency(this.sendingTime, this.recieveTime);
    this.localMeas.extractJitter(this.reqTime);
    this.resolveCallback([this.localMeas, this.reporMeas]);
  }
  /**
   * Handler for the requests during the measurement.
   * @param {ReqQ4S} req - The recieved request
   * @param {Date} time - Arrival time of the request.
   */
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
  /**
   * Handler for the responses during the measurement.
   * @param {ResQ4S} res - The recieved response
   * @param {Date} time - Arrival time of the response.
   */
  _resHandler(res, time) {
    const seq = res.headers['Sequence-Number'];
    if (seq) {
      this.recieveTime.push({seq: seq, time: time});
      this.localMeas.extractLatency(this.sendingTime, this.recieveTime);
    }
    // TODO -> CHECK WHETHER NEW QUALITY WAS SENT. Then reinitiaite this stage.
    // And parse new quality.
    // TODO -> IF NEW QOS is send means that there were an aler. Then reinitiate
    // this stage.
  }
}

module.exports = Pinger;
