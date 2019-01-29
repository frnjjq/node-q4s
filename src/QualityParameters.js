/**
 * Quality parameters Q4S module.Represents a set of quality measures or 
 * constrains.
 * @module QualityParameters
 * @license Apache-2.0
 */

/** Quality Parameters Class*/
class QualityParameters {
  /**
   * Constructor for the QualityParameters class. Does not validate input data
   * coherence.
   * @param {(number|undefined)} latency - The maximum RTT latency allowed by
   * the session.
   * @param {(number|undefined)} jitterUp - The maximum jitter allowed by the
   * session in the uplink.
   * @param {(number|undefined)} jitterDown - The maximum jitter allowed by
   * the session in the downlink.
   * @param {(number|undefined)} bandwidthUp - The minimum bandwidth allowed
   * by the session in the uplink.
   * @param {(number|undefined)} bandwidthDown - The minimum bandwidth allowed
   * by the session in the downlink.
   * @param {(number|undefined)} packetlossUp - The maximum packet loss allowed
   * by the session in the uplink.
   * @param {(number|undefined)} packetlossDown - The minimum packet loss
   * allowed by the session in the downlink.
   */
  constructor(latency, jitterUp, jitterDown, bandwidthUp, bandwidthDown,
    packetlossUp, packetlossDown) {
    /**
     * The maximum RTT latency allowed by the session.
     * @member {Number}
     */
    this.latency = latency;
    /**
     * The maximum jitter allowed by the session in the uplink.
     * @member {Number}
     */
    this.jitterUp = jitterUp;
    /**
     * The maximum jitter allowed by the session in the downlink.
     * @member {Number}
     */
    this.jitterDown = jitterDown;
    /**
     * The minimum bandwidth allowed by the session in the uplink.
     * @member {Number}
     */
    this.bandwidthUp = bandwidthUp;
    /**
     * The minimum bandwidth allowed by the session in the downlink.
     * @member {Number}
     */
    this.bandwidthDown = bandwidthDown;
    /**
     * The maximum packet loss allowed by the session in the uplink.
     * @member {Number}
     */
    this.packetlossUp = packetlossUp;
    /**
     * The maximum packet loss allowed by the session in the downlink.
     * @member {Number}
     */
    this.packetlossDown = packetlossDown;
  }

  /**
   * Given another instance of Quality parameters check those measures against te ones stored here.
   * @param {QualityParameters} measurement - Object containing the measurements.
   * @return {bool} True if the requirements where fullfilled false otherwise
   */
  doesMetQuality(measurement) {
    if (this.latency && measurement.latency &&
      measurement.latency > this.latency) {
      return false;
    }
    if (this.jitterUp && measurement.jitterUp &&
      measurement.jitterUp > this.jitterUp) {
      return false;
    }
    if (this.jitterDown && measurement.jitterDown &&
      measurement.jitterDown > this.jitterDown) {
      return false;
    }
    if (this.bandwidthUp && measurement.bandwidthUp &&
      measurement.bandwidthUp < this.bandwidthUp) {
      return false;
    }
    if (this.bandwidthDown && measurement.bandwidthDown &&
      measurement.bandwidthDown < this.bandwidthDown) {
      return false;
    }
    if (this.packetlossUp && measurement.packetlossUp &&
      measurement.packetlossUp > this.packetlossUp) {
      return false;
    }
    if (this.packetlossDown && measurement.packetlossDown &&
      measurement.packetlossDown > this.packetlossDown) {
      return false;
    }
    return true;
  }
  /**
  * Checks whether a given measurement fullfill the quality parameters.
  * @param {String} sdp - The sdp which fills this Quality Parameters object.
  */
  updateWithSDP(sdp) {
    const lines = sdp.split('\r\n');
    lines.forEach((line) => {
      if (line.indexOf('a=latency:') === 0) {
        const res = parseInt(line.substring(10), 10);
        if (!isNaN(res) && res !== 0) {
          this.latency = res;
        }
      } else if (line.indexOf('a=jitter:') === 0) {
        const aux = line.substring(9).split('/');
        let res = parseInt(aux[0], 10);
        if (!isNaN(res) && res !== 0) {
          this.jitterUp = res;
        }
        res = parseInt(aux[1], 10);
        if (!isNaN(res) && res !== 0) {
          this.jitterDown = res;
        }
      } else if (line.indexOf('a=bandwidth:') === 0) {
        const aux = line.substring(12).split('/');
        let res = parseInt(aux[0], 10);
        if (!isNaN(res) && res !== 0) {
          this.bandwidthUp = res;
        }
        res = parseInt(aux[1], 10);
        if (!isNaN(res) && res !== 0) {
          this.bandwidthDown = res;
        }
      } else if (line.indexOf('a=packetloss:') === 0) {
        const aux = line.substring(13).split('/');
        let res = parseFloat(aux[0], 10);
        if (!isNaN(res) && res !== 0) {
          this.packetlossUp = res;
        }
        res = parseFloat(aux[1], 10);
        if (!isNaN(res) && res !== 0) {
          this.packetlossDown = res;
        }
      }
    });
  }
  /**
  * Returns the string representation of this. String to go in SDP.
  * @return {String} The sdp representation of this object.
  */
  toSDPAttr() {
    let lines;
    if (this.latency) {
      lines = 'a=latency:' + this.latency + '\r\n';
    }
    if (this.jitterDown && this.jitterUp) {
      lines = lines + 'a=jitter:' + this.jitterUp + '/' +
        this.jitterDown + '\r\n';
    }
    if (this.bandwidthUp && this.bandwidthDown) {
      lines = lines + 'a=bandwidth:' + this.bandwidthUp + '/' +
        this.bandwidthDown + '\r\n';
    }
    if (this.packetlossUp && this.packetlossDown) {
      lines = lines + 'a=packetloss:' + this.packetlossUp + '/' +
        this.packetlossDown + '\r\n';
    }
    return lines;
  }
  /**
   * Integrate into this object the measures from the client.
   * @return {Measurement} The taken measures from client.
   */
  introduceClientMeasures(measure) {
    latency, jitter, bandwidth, packetLoss
    if (!this.latency) {
      this.latency = measure.latency;
    }
    this.jitterUp = measure.jitter;
    this.packetlossUp = measure.packetLoss;
  }
    /**
   * Integrate into this object the measures from the server.
   * @return {Measurement} The taken measures from server.
   */
  introduceServerMeasures(measure) {
    latency, jitter, bandwidth, packetLoss
    this.latency = measure.latency;
    this.jitterDown = measure.jitter;
    this.packetlossDown = measure.packetLoss;
  }
}

module.exports = QualityParameters;
