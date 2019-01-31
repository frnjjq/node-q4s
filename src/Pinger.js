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
   * @param {number} numberPings - Number of pings to send
   */
  constructor(sessionId, network, periodPings, numberPings) {
    this.sessionId = sessionId;
    this.network = network;
    this.periodPings = periodPings;
    this.numberPings = numberPings;
    this.sendingTime = new Array(numberPings);
    this.sendingTime.fill(0);
    this.recieveTime = new Array(numberPings);
    this.recieveTime.fill(0);
    this.reqTime = [];
    this.reqTime.fill(0);
    this.sequence = 0;
    this.localMeasurements = new Measurement();
    this.reportedMeasurements = new Measurement();
  }
  /**
   * Starts the measurement stage.
   * @param {Boolean} waitArrival - Wait for the other enpoint to start.
   * @return {Promise} On sucess the measures, on error the error
   */
  startMeasurements(waitArrival) {
    return new Promise((resolve, reject) => {
      this.rejectCallback = reject;
      const endFunc = () => {
        this.network.removeListener('UDPResponse', resFunc);
        this.network.removeListener('UDPRequest', reqFunc);
        // TODO => uSE NEW MODULE
        this.localMeasurements.fromArray(this.sendingTime, this.recieveTime,
            this.reqTime);

        resolve([this.localMeasurements, this.reportedMeasurements]);
      };
      const intervaFunc = () => {
        const headers = {Stage: '0'};
        headers['Session-Id'] = this.sessionId;
        headers['Sequence-Number'] = this.sequence;
        headers['Measurements'] = this.localMeasurements.toHeader();
        this.network.sendUDP(new ReqQ4S(
            'PING',
            'q4s://www.example.com',
            'Q4S/1.0',
            headers));
        this.sendingTime[sequenceNumber] = new Date();

        if (++this.sequence === numberOfPackets) {
          clearInterval(this.intervalId);
          setTimeout(endFunc, 300);
        }
      };
      const resFunc = (res) => {
        const time = new Date();
        if (res.headers['Sequence-Number']) {
          this.recieveTime[res.headers['Sequence-Number']] = time;
        }
        this.localMeasurements.fromArray(this.sendingTime, this.recieveTime,
            this.reqTime);
      };
      const reqFunc = (req) => {
        const time = new Date();
        const headers = {};
        const sequence = req.headers['Sequence-Number'];
        headers['Sequence-Number'] = sequence;
        headers['Session-Id'] = req.headers['Session-Id'];
        this.network.sendUDP(new ResQ4S('Q4S/1.0', 200, 'ok', headers,
            undefined));

        if (sequence < this.reqTime.lenght) {
          this.reqTime[sequence] = time;
        } else {
          this.reqTime.push(time);
          this.reqTime.shift();
        }
        this.reportedMeasurements.fromHeader(req.headers.Measurements);
      };

      this.network.on('UDPResponse', resFunc);
      this.network.on('UDPRequest', reqFunc);

      if (!waitArrival) {
        this.intervalId = setInterval(intervaFunc,
            this.measurementProcedure.negotiationPingUp);
      } else {
        this.network.once('UDPRequest', (req) => {
          this.intervalId = setInterval(intervaFunc,
              this.measurementProcedure.negotiationPingUp);
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
}

module.exports = Pinger;
