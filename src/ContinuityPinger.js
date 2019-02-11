
const EventEmitter = require('events');

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
   * @param {ClientNetwotk} network - Network object
   * @param {number} periodPings - ms elapsed between pings
   * @param {number} pingWndwSze - Latency and Jitter window size
   * @param {number} pcktlssWndwSze - Packet loss window size

   */
  constructor(sessionId, network, periodPings, pingWndwSze, pcktlssWndwSze) {
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
   * Starts the measurement stage.
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
  /**
   * Interruption handler which sends the requests.
   */
  _intHandler() {
    const headers = {};
    headers['Session-Id'] = this.sessionId;
    headers['Sequence-Number'] = this.sequence;
    headers['Measurements'] = this.localMeasurements.toHeader();
    this.network.sendUDP(ReqQ4S.genReq(
        'PING',
        'q4s://www.example.com',
        headers));
    this.sendingTime.push({seq: this.sequence, time: new Date()});
    this.sequence++;
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
    this.cleanArrays();
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
      this.cleanArrays();
      this.localMeas.extractLatency(this.sendingTime, this.recieveTime);
      this.emit('measure', this.localMeas, this.reporMeas);
    }
  }

  /**
   * If needed remove data.
   */
  cleanArrays() {
    const samplesSent = this.sendingTime.length;
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

    const recievedReqs = this.reqTime.length;
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
