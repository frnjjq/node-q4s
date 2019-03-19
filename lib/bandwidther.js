/**
 * Implements Bandwidther class.
 * @module bandwidther
 */
const crypto = require('crypto');

const Measure = require('./measure');
const Request = require('./request');

/**
 * Bandwidther class. In charge of sending pings and obtain the metrics
 */
class Bandwidther {
  /**
   * Constructor for the Bandwidther class. Does not validate input data
   * coherence.
   * @param {number} sessionId - The session id to perform the pings
   * @param {ClientNetwork} network - Network object
   * @param {number} requestedBw - required bandwidth is in kbits/s
   * @param {number} negotiationBandwidth - Time to run the test in seconds
   * @param {Boolean} proactive - Tells teh bandwidther to be proactive
   */
  constructor(sessionId, network, requestedBw, negotiationBandwidth,
      proactive) {
    this.sessionId = sessionId;
    this.network = network;
    this.requestedBw = requestedBw;
    this.negotiationBandwidth = negotiationBandwidth;
    this.proactive = proactive;
    this.recieved = [];
    this.sequence = 0;

    this.localMeasurements = new Measure();
    this.reportedMeasurements = new Measure();

    // Generate the random payload. The size is 1000 bytes.
    const buffer = Buffer.alloc(1000);
    crypto.randomFillSync(buffer, 1000);
    this.body = buffer.toString('utf8');

    // Fill the required timers for the bandwidth.
    this.timers = [];
    let msgPerSec = requestedBw / 8;
    for (let i = 1; i <= 1000; i++) {
      const intPart = Math.floor(msgPerSec * i * 0.001);
      if (intPart !== 0) {
        msgPerSec = msgPerSec - (intPart*1000) / i;
        this.timers.push({
          ms: i,
          times: intPart,
        });
        if (msgPerSec === 0) {
          break;
        }
      }
    }
    this.timeoutId = undefined;
  }

  /**
   * Generates a new bandwidther with Client settings.
   * @param {number} sessionId - The session id to perform the pings
   * @param {ClientNetwork|ServerNetwork} network - Network object
   * @param {number} requestedBw - required bandwidth is in kbits/s
   * @param {number} negotiationBandwidth - Time to run the test in seconds
   * @return {Bandwidther}
   */
  static genClient(sessionId, network, requestedBw, negotiationBandwidth) {
    return new Bandwidther(sessionId, network, requestedBw,
        negotiationBandwidth, true);
  }

  /**
   * Generates a new bandwidther with Server settings.
   * @param {number} sessionId - The session id to perform the pings
   * @param {ClientNetwork|ServerNetwork} network - Network object
   * @param {number} requestedBw - required bandwidth is in kbits/s
   * @param {number} negotiationBandwidth - Time to run the test in seconds
   * @return {Bandwidther}
   */
  static genServer(sessionId, network, requestedBw, negotiationBandwidth) {
    return new Bandwidther(sessionId, network, requestedBw,
        negotiationBandwidth, false);
  }

  /**
   * Starts the measurement stage.
   * @return {Promise} On sucess the measures, on error the error
   */
  measure() {
    return new Promise((resolve, reject) => {
      this.rejectCallback = reject;
      const endFunc = () => {
        this.network.removeListener('UDP-Req', this.reqFunc);
        this.localMeasurements.extractBandwidth(this.recieved,
            this.requestedBw);
        this.recieved = [];
        this.sequence = 0;
        setImmediate(resolve, {
          local: this.localMeasurements,
          remote: this.reportedMeasurements,
        });
      };

      const intervaFunc = (count) => {
        for (let i = 0; i < count; i++) {
          const headers = {
            'Stage': '1',
            'Session-Id': this.sessionId,
            'Sequence-Number': this.sequence,
            'Measurements': this.localMeasurements.toHeader(),
          };
          this.network.sendUDP(Request.genReq(
              'BWIDTH',
              'q4s://www.example.com',
              headers,
              undefined), this.sessionId);
          this.sequence++;
        }
        if (Date.now() > this.endTime) {
          this.timers.forEach((timer, i, arr) => {
            if (timer.intervalId) {
              clearInterval(timer.intervalId);
              arr[i].intervalId = undefined;
            }
          });
          this.timeoutId = setTimeout(endFunc, 300);
        }
      };

      this.reqFunc = (req, date, session) => {
        if (typeof session == 'undefined' || session.id === this.sessionId) {
          if (req.headers['Sequence-Number']) {
            this.recieved.push(parseInt(req.headers['Sequence-Number']));
          }
          if (req.headers.Measurements) {
            this.reportedMeasurements.fromHeader(req.headers.Measurements);
          }
          this.localMeasurements.extractBandwidth(this.recieved,
              this.requestedBw);
          if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = setTimeout(endFunc, 300);
          }
        }
      };
      const startIterrupt = (req, time, record) => {
        if (record.id === this.sessionId) {
          this.timers.forEach((timer, i, arr) => {
            arr[i].intervalId = setInterval(intervaFunc, timer.ms,
                timer.times);
          });
          this.endTime = Date.now() + this.negotiationBandwidth * 1000;
          this.network.off('UDP-Req', startIterrupt);
        }
      };


      this.network.on('UDP-Req', this.reqFunc);
      if (this.proactive) {
        this.timers.forEach((timer, i, arr) => {
          arr[i].intervalId = setInterval(intervaFunc, timer.ms,
              timer.times);
        });
        this.endTime = Date.now() + this.negotiationBandwidth * 1000;
      } else {
        this.network.on('UDP-Req', startIterrupt);
      }
    });
  }
  /**
   * Cancel communication
   */
  cancel() {
    this.timers.forEach((timer, i, arr) => {
      if (timer.intervalId) {
        clearInterval(timer.intervalId);
        arr[i].intervalId = undefined;
      }
    });
    this.network.removeListener('UDPRequest', this.reqFunc);
    this.recieved = [];
    this.sequence = 0;
    this.rejectCallback();
  }
}

module.exports = Bandwidther;
