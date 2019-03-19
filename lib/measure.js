/**
 * Module which implements the class Measurement which includes the four
 * parameters that are measured in Q4S.
 * @module measure
 */

/** Measurement Class*/
class Measure {
  /**
   * Constructor for the Measurement.
   * @param {Number} latency - Latency in ms
   * @param {Number} jitter - Jitter in ms
   * @param {Number} bandwidth - bandwidth in ms
   * @param {Number} packetLoss - packetLoss

   */
  constructor(latency, jitter, bandwidth, packetLoss) {
    /**
     * Latency in ms
     * @member {Number}
     */
    this.latency = latency;
    /**
     * Jitter in ms
     * @member {Number}
     */
    this.jitter = jitter;
    /**
     * Bandwidth in kbps kilo bits per second
     * @member {Number}
     */
    this.bandwidth = bandwidth;
    /**
     * Packet Loss in probability 0 to 1
     * @member {Number}
     */
    this.packetLoss = packetLoss;
  }

  /**
   * Extract the text view of this object to be included in headers.
   * @return {String} The header representation of tose measurements.
   */
  toHeader() {
    let header = 'l=';
    if (typeof this.latency !== 'undefined') {
      header = header + this.latency;
    }
    header = header + ', j=';
    if (typeof this.jitter !== 'undefined') {
      header = header + this.jitter;
    }
    header = header + ', pl=';
    if (typeof this.packetLoss !== 'undefined') {
      header = header + this.packetLoss;
    }
    header = header + ', bw=';
    if (typeof this.bandwidth !== 'undefined') {
      header = header + this.bandwidth;
    }
    return header;
  }

  /**
   * Fill this object with contents from a text header.
   * @param {String} hdr - Header line to extract the text from.
   */
  fromHeader(hdr) {
    const latencyReg = /^l=\d+(\.\d+)?/;
    const jitterReg = /^j=\d+(\.\d+)?/;
    const packetLossReg = /^pl=[0-1]+(\.\d+)?/;
    const bandwidthReg = /^bw=\d+(\.\d+)?/;

    const parts = hdr.split(', ');

    parts.forEach((element) => {
      if (latencyReg.test(element)) {
        this.latency = parseFloat(element.substring(2));
      } else if (jitterReg.test(element)) {
        this.jitter = parseFloat(element.substring(2));
      } else if (packetLossReg.test(element)) {
        this.packetLoss = parseFloat(element.substring(3));
      } else if (bandwidthReg.test(element)) {
        this.bandwidth = parseFloat(element.substring(3));
      }
    });
  }

  /**
   * From recieved in bandwidth measurement.
   * @param {Number[]} times - The sending times
   * @return {Promise}
   */
  extractFromPinger(times) {
    return new Promise( (resolve, reject) => {
      let latencies = [];
      let lost = 0;
      let i = times.length-1;

      // Remove the ones which hasnt been recieved
      while (typeof times[i].recieve === 'undefined') {
        i--;
      }

      for (; i>=0; i--) {
        if (typeof times[i].recieve !== 'undefined') {
          latencies.push(times[i].recieve- times[i].send);
        } else {
          lost++;
        }
      }
      setImmediate(() => {
        let jitters = new Array(latencies.length-1);
        for (i = 0; i<jitters.length; i++) {
          jitters[i] = Math.abs(latencies[i+1]-latencies[i]);
        }

        latencies = latencies.sort((a, b) => {
          return a - b;
        });
        setImmediate(() => {
          jitters = jitters.sort((a, b) => {
            return a - b;
          });
          this.latency = latencies[Math.trunc((latencies.length-1)/2)];
          this.jitter = jitters[Math.trunc((latencies.length-1)/2)];
          this.packetLoss = lost /times.length;
          resolve();
        });
      });
    });
  }

  /**
   * From recieved in bandwidth measurement.
   * @param {Number[]} arrivedMessages - The sending times
   * @param {Number} expectedBandwidth - The targeted bandwidth
   */
  extractBandwidth(arrivedMessages, expectedBandwidth) {
    const size = arrivedMessages.length;
    if (size > 0) {
      const maxSeq = arrivedMessages.reduce((prev, curr) => {
        return prev > curr ? prev : curr;
      });
      const recievedPercentage = size / (maxSeq + 1);
      this.packetLoss = 1 - recievedPercentage;
      this.bandwidth = expectedBandwidth * recievedPercentage;
    }
  }
}

module.exports = Measure;
