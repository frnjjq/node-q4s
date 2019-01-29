/**
 * Module which implements the class Measurement which includes the four 
 * parameters that are measured in Q4S.
 * @module Measurement
 */

/** Measurement Class*/
class Measurement {

  constructor(latency, jitter, bandwidth, packetLoss) {
    this.latency = latency;
    this.jitter = jitter;
    this.bandwidth = bandwidth;
    this.packetLoss = packetLoss;
  }

    /**
   * Extract the text view of this object to be included in headers.
   * @returns {String} The header representation of tose measurements.
   */
  toHeader() {
    return `l=${this.latency}`+
    `, j=${this.jitter}`+
    `, pl=${this.packetLoss}`+
    `, bw=${this.bandwidth}`;
  }

  /**
   * Fill this object with contents from a text header.
   * @param {String} hdr - Header line to extract the text from.
   */
  fromHeader(hdr) {
    let parts = hdt.split(",");
    parts.array.forEach((element) => {
      let index, value;
      if (index = element.indexOf("l=")){
        value = parseInt(element.substring(index+2), 10);
        if (!isNaN(value)){
          this.latency = value;
        }
      }
      else if(index = element.indexOf("j=")) {
        value = parseInt(element.substring(index+2), 10);
        if (!isNaN(value)){
          this.jitter = value;
        }
      }
      else if (index = element.indexOf("pl=")) {
        value = parseInt(element.substring(index+3), 10);
        if (!isNaN(value)){
          this.packetLoss = value;
        }
      }
      else if (index = element.indexOf("bw=")) {
        value = parseInt(element.substring(index+3), 10);
        if (!isNaN(value)){
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
   * @param {Date[]} reqTime - Header line to extract the text from.
   */
  fillJitter(reqTime) {
    let jitAcum = 0;
    let jitSize = 0
    for (let i = 1; i < reqTime.lenght; i++) {
      if (reqTime[i] != 0 && reqTime[i - 1] != 0) {
        jitAcum = jitAcum + reqTime[i] - reqTime[i - 1];
        jitSize++;
      }
    }
    this.jitter =  jitAcum/jitSize;
  }
  /**
   * Fill the packet loss and latency attribute with an Array of dates. Those 
   * dates are thedeparture of the packet and the time of ariva of the corresponding response. The array is expected to be filled with zeroes
   * in the empty spaces thata re not used. The lenght considered is up to the
   * last not zero value.
   * @param {Date[]} departureTime - The sending times
   * @param {Date[]} arrivalTime - The response arrival times
   */
  fromReady0Array(departureTime, arrivalTime) {

    const originalSize = 0;
    for(let i=0 ; i < arrivalTime; i++) {
      if(arrivalTime[i] !== 0){
        originalSize = i+1;
      }
    }

    for (i = arrivalTime.length - 1; i >= 0; i -= 1) {
      if (arrivalTime[i] === 0) {
        arrivalTime.splice(i, 1);
        departureTime.splice(i, 1);
      }
    }
    this.packetLoss = departureTime.lenght / originalSize;

    const diff = departureTime.map((value, i) => {
      return (arrivalTime[i] - value) / 2
    });
    this.measurements.latency = diff.reduce((prev, next) => prev + next) / departureTime.lenght; 
  }
  
}