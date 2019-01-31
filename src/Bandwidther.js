/**
 * Pinger module which is in change of measure the Ping
 * @module Bandwidther
 */

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
   * @param {number} negotiationBandwidth - Time to run the bandwidth test
   * , seconds
   */
  constructor(sessionId, network, requestedBw, negotiationBandwidth) {
    this.sessionId = sessionId;
    this.network = network;
    this.requestedBw = requestedBw;
    this.negotiationBandwidth = negotiationBandwidth;
    this.recieved = [];
    this.sequence = 0;

    this.localMeasurements = new Measurement();
    this.reportedMeasurements = new Measurement();

    // Generate the random payload
    const buffer = Buffer.alloc(1000);
    crypto.randomFillSync(this.buffer, 1000);
    this.body = buffer.toString('utf8');

    // Fill the required timers for the bandwidth.
    this.timers = [];
    let msgPerSec = requestedBw / 8;
    for (let i = 1; i < 200; i++) {
      const intPart = Math.ceil(msgPerSec * i * 0.001);
      if (intPart !== 0) {
        msgPerSec = msgPerSec - 1000 / i;
        this.timers.push({
          ms: i,
          times: intPart,
        });
        if (msgPerSec === 0) {
          break;
        }
      }
    }
  }
  /**
   * Starts the measurement stage.
   * @return {Promise} On sucess the measures, on error the error
   */
  start() {
    return new Promise((resolve, reject) => {
      this.rejectCallback = reject;
      const endFunc = () => {
        this.network.removeListener('UDPRequest', reqFunc);
        this.localMeasurements.fromReady1Array(this.recieved, this.requestedBw);
        resolve([this.localMeasurements, this.reportedMeasurements]);
      };
      const intervaFunc = (count) => {
        for (let i = 0; i < count; i++) {
          const headers = {Stage: '1'};
          headers['Session-Id'] = this.sessionId;
          headers['Sequence-Number'] = this.sequence;
          headers['Measurements'] = this.reportedMeasurements.toHeader();
          this.network.sendUDP(ReqQ4S.genReq(
              'BWIDTH',
              'q4s://www.example.com',
              headers,
              this.body));
          this.sequence++;
        }
        if (new Date() > this.endTime) {
          this.timers.forEach((timer) => {
            clearInterval(timer.intervalId);
          });
          setTimeout(endFunc, 300);
        }
      };

      const reqFunc = (req) => {
        if (res.headers['Sequence-Number']) {
          this.recieved.push(toString(res.headers['Sequence-Number']));
        }
        if (res.headers.Measurements) {
          this.reportedMeasurements.fromHeader(res.headers.Measurement);
        }
        this.localMeasurements.fromReady1Array(this.recieved, this.requestedBw);
      };

      this.network.on('UDPRequest', reqFunc);
      this.timers.forEach((timer, i, arr) => {
        arr[i].intervalId = setInterval(intervaFunc, timer.ms, timer.times);
      });
      this.endTime = new Date() + negotiationBandwidth * 1000;
    });
  }
  /**
   * Cancel communication
   */
  cancel() {
    this.timers.forEach((timer) => {
      clearInterval(timer.intervalId);
    });
    this.network.removeListener('UDPRequest', reqFunc);
    this.rejectCallback();
  }
}

module.exports = Bandwidther;
