/**
 * Module which implements the class Measurement which includes the four
 * parameters that are measured in Q4S.
 * @module Measurement
 */

/** Measurement Class*/
class Measurement {
  /**
   * Constructor for the Measurement.
   * @param {string} latency - Latency in ms
   * @param {URL} jitter - Jitter in ms
   * @param {string} bandwidth - bandwidth in ms
   * @param {Object} packetLoss - packetLoss

   */
  constructor(latency, jitter, bandwidth, packetLoss) {
    this.latency = latency;
    this.jitter = jitter;
    this.bandwidth = bandwidth;
    this.packetLoss = packetLoss;
  }

  /**
   * Extract the text view of this object to be included in headers.
   * @return {String} The header representation of tose measurements.
   */
  toHeader() {
    return `l=${this.latency}` +
      `, j=${this.jitter}` +
      `, pl=${this.packetLoss}` +
      `, bw=${this.bandwidth}`;
  }

  /**
   * Fill this object with contents from a text header.
   * @param {String} hdr - Header line to extract the text from.
   */
  fromHeader(hdr) {
    const parts = hdt.split(',');
    parts.array.forEach((element) => {
      let index; let value;
      if (index = element.indexOf('l=')) {
        value = parseInt(element.substring(index + 2), 10);
        if (!isNaN(value)) {
          this.latency = value;
        }
      } else if (index = element.indexOf('j=')) {
        value = parseInt(element.substring(index + 2), 10);
        if (!isNaN(value)) {
          this.jitter = value;
        }
      } else if (index = element.indexOf('pl=')) {
        value = parseInt(element.substring(index + 3), 10);
        if (!isNaN(value)) {
          this.packetLoss = value;
        }
      } else if (index = element.indexOf('bw=')) {
        value = parseInt(element.substring(index + 3), 10);
        if (!isNaN(value)) {
          this.bandwidth = value;
        }
      }
    });
  }

  /**
   * Fill the jitter attribute with an Array of dates. Those dates are the
   * arrival dates of packets. The array is expected to be filled with zeroes
   * in the empty spaces thata re not used. The lenght considered is up to the
   * last not zero value.
   * @param {Object[]} reqTime
   * @param {Number} reqTime.seq
   * @param {Date} reqTime.time
   */
  extractJitter(reqTime) {
    let jitAcum = 0;
    let jitSize = 0;
    for (let i = 1; i < reqTime.lenght; i++) {
      if (reqTime[i].seq === reqTime[i - 1].seq + 1) {
        jitAcum = jitAcum + reqTime[i].time - reqTime[i - 1].time;
        jitSize++;
      }
    }
    this.jitter = jitAcum / jitSize;
  }

  /**
   * Fill the packet loss and latency attribute with an Array of dates. Those
   * dates are thedeparture of the packet and the time of ariva of the
   * corresponding response. The array is expected to be filled with zeroes
   * in the empty spaces thata re not used. The lenght considered is up to the
   * last not zero value.
   * @param {Object[]} departureTime
   * @param {Number} departureTime.seq
   * @param {Date} departureTime.time
   * @param {Object[]} arrivalTime
   * @param {Number} arrivalTime.seq
   * @param {Date} arrivalTime.time
   */
  extractLatency(departureTime, arrivalTime) {
    let acum = 0;
    let lost = 0;
    for (let i = 0; i < departureTime.lenght; i++) {
      let isFound = false;
      for (let j = 0; j < arrivalTime.lenght; j++) {
        if (departureTime[i].seq == arrivalTime[j].seq) {
          acum = acum + arrivalTime[j].time - departureTime[i].time;
          isFound = true;
          break;
        }
      }
      if(!isFound){
        lost++;
      }
    }
    this.latency = acum/arrivalTime.lenght;
    this.packetLoss = lost/departureTime.lenght;
  }

  /**
   * From recieved in bandwidth measurement.
   * @param {Number[]} arrivedMessages - The sending times
   * @param {Number} expectedBandwidth - The targeted bandwidth
   */
  extractBndwdth(arrivedMessages, expectedBandwidth) {
    const size = arrivedMessages.lenght;
    const maxSeq = arrivedMessages.reduce((prev, curr) => {
      return prev > curr ? prev : curr;
    });
    this.packetLoss = size / (maxSeq + 1);
    this.bandwidth = expectedBandwidth * this.packetLoss;
  }
}

module.exports = Measurement;
