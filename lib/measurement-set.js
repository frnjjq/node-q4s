/**
 * Implements the MeasurementSet Class.
 * @module measurement-set
 * @license Apache-2.0
 */

/**
 * Represents a complete q4s session quality measures. This class contains
 * methods to serve as reference quality metric. Contains too methods that
 * allow to map server and client measures into a session set of measures.
 */
class MeasurementSet {
  /**
   * Constructor for the MeasurementSet class. Does not validate input data
   * coherence. Simply sets the passed data into the object.
   * @param {Number} latency - RTT latency. ms
   * @param {Number} jitterUp - Jitter in the uplink. ms
   * @param {Number} jitterDown - Jitter in the downlink.ms
   * @param {Number} bandwidthUp - Bandwidth in the uplink. kbits/s
   * @param {Number} bandwidthDown - Bandwidth in the downlink. kbits/s
   * @param {Number} packetlossUp - Packet loss in the uplink. Probability.
   * @param {Number} packetlossDown - Packet loss in the downlink. Probability.
   */
  constructor(latency, jitterUp, jitterDown, bandwidthUp, bandwidthDown,
    packetlossUp, packetlossDown) {
    /**
     * RTT latency. ms
     * @member {Number}
     */
    this.latency = latency;
    /**
     * Jitter in the uplink. ms
     * @member {Number}
     */
    this.jitterUp = jitterUp;
    /**
     * Jitter in the downlink.ms
     * @member {Number}
     */
    this.jitterDown = jitterDown;
    /**
     * Bandwidth in the uplink. kbits/s
     * @member {Number}
     */
    this.bandwidthUp = bandwidthUp;
    /**
     * Bandwidth in the downlink. kbits/s
     * @member {Number}
     */
    this.bandwidthDown = bandwidthDown;
    /**
     * Packet loss in the uplink. Probability.
     * @member {Number}
     */
    this.packetlossUp = packetlossUp;
    /**
     * Packet loss in the downlink. Probability.
     * @member {Number}
     */
    this.packetlossDown = packetlossDown;
  }

  /**
   * Given another instance of MeasurementSet check those measures with this
   * object as reference.
   * @param {MeasurementSet} measurement - Measures to be checked.
   * @return {bool} True if the requirements where fullfilled false otherwise
   */
  doesMetQuality(measurement) {
    if (typeof this.latency !== 'undefined'&&
      typeof measurement.latency !== 'undefined' &&
      measurement.latency > this.latency) {
      return false;
    }
    if (typeof this.jitterUp !== 'undefined'&&
      typeof measurement.jitterUp !== 'undefined' &&
      measurement.jitterUp > this.jitterUp) {
      return false;
    }
    if (typeof this.jitterDown !== 'undefined'&&
      typeof measurement.jitterDown !== 'undefined' &&
      measurement.jitterDown > this.jitterDown) {
      return false;
    }
    if (typeof this.bandwidthUp !== 'undefined'&&
      typeof measurement.bandwidthUp !== 'undefined' &&
      measurement.bandwidthUp < this.bandwidthUp) {
      return false;
    }
    if (typeof this.bandwidthDown !== 'undefined'&&
      typeof measurement.bandwidthDown !== 'undefined' &&
      measurement.bandwidthDown &&
      measurement.bandwidthDown < this.bandwidthDown) {
      return false;
    }
    if (typeof this.packetlossUp !== 'undefined'&&
      typeof measurement.packetlossUp !== 'undefined' &&
      measurement.packetlossUp > this.packetlossUp) {
      return false;
    }
    if (typeof this.packetlossDown !== 'undefined'&&
      typeof measurement.packetlossDown !== 'undefined' &&
      measurement.packetlossDown > this.packetlossDown) {
      return false;
    }
    return true;
  }

  /**
   * Parses a string finding sdp attributes related to mesurement levels. If
   * any attribute is found parsing the string, the object gets updated with
   * the parsed value.
   * @param {String} sdp - Contains one or more sdp atttributes.
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
   * Returns a string form of the information in this object. This view is
   * intended to be included inside an sdp.
   * @return {String} - The SDP attributes.
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
   * Import a measure generated by the client. The imported measure overrrides
   * the current attributes.
   * @argument {Measure} measure - A client measure.
   */
  introduceClientMeasures(measure) {
    if (typeof this.latency === 'undefined' &&
      typeof measure.latency !== 'undefined') {
      this.latency = measure.latency;
    }
    if (typeof measure.jitter !== 'undefined') {
      this.jitterUp = measure.jitter;
    }
    if (typeof measure.packetLoss !== 'undefined') {
      this.packetlossUp = measure.packetLoss;
    }
    if (typeof measure.bandwidth !== 'undefined') {
      this.bandwidthUp = measure.bandwidth;
    }
  }

  /**
   * Import a measure generated by the server. The imported measure overrrides
   * the current attributes.
   * @argument {Measure} measure - A server measure.
   */
  introduceServerMeasures(measure) {
    if (typeof measure.latency !== 'undefined') {
      this.latency = measure.latency;
    }
    if (typeof measure.jitter !== 'undefined') {
      this.jitterDown = measure.jitter;
    }
    if (typeof measure.packetLoss !== 'undefined') {
      this.packetlossDown = measure.packetLoss;
    }
    if (typeof measure.bandwidth !== 'undefined') {
      this.bandwidthDown = measure.bandwidth;
    }
  }

  /**
   * Determines if continuity bandwidth measurements are required, given the
   * object as a reference metrics.
   * @return {Boolean} - True if required otherwise false
   */
  requireReady1() {
    if (this.bandwidthUp || this.bandwidthDown) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Given an object wich contains maximum and minimum possible values. The
   * attributes of this object are constrained between maximum and minimum
   * values.
   * @argument {Object} constr
   * @argument {Number} constr.latency.max
   * @argument {Number} constr.latency.min
   * @argument {Number} constr.jitterUp.max
   * @argument {Number} constr.jitterUp.min
   * @argument {Number} constr.jitterDown.max
   * @argument {Number} constr.jitterDown.min
   * @argument {Number} constr.bandwidthUp.max
   * @argument {Number} constr.bandwidthUp.min
   * @argument {Number} constr.bandwidthDown.max
   * @argument {Number} constr.bandwidthDown.min
   * @argument {Number} constr.packetlossUp.max
   * @argument {Number} constr.packetlossUp.min
   * @argument {Number} constr.packetlossDown.max
   * @argument {Number} constr.packetlossDown.min
   */
  constrain(constr) {
    // TODO -> Validate this function, so weird values do not destroy.
    const check = function (parameter, restr, maxDefault) {
      let value;
      if (parameter && restr) {
        if (restr.max && restr.min) {
          value = parameter > restr.max ?
            restr.max : parameter < restr.min ?
              restr.min : parameter;
        } else if (restr.max) {
          value = parameter > restr.max ? restr.max : parameter;
        } else if (restr.min) {
          value = parameter < restr.min ? restr.min : parameter;
        } else {
          value = parameter;
        }
      } else if (restr) {
        if (restr.max && maxDefault) {
          value = max;
        } else if (restr.min) {
          value = min;
        } else {
          value = undefined;
        }
      } else if (parameter) {
        value = parameter;
      } else {
        value = undefined;
      }
      return value;
    };
    this.latency = check(this.latency, constr.latency, true);
    this.jitterUp = check(this.jitterUp, constr.jitterUp, true);
    this.jitterDown = check(this.jitterDown, constr.jitterDown, true);
    this.bandwidthUp = check(this.bandwidthUp, constr.bandwidthUp, false);
    this.bandwidthDown = check(this.bandwidthDown, constr.bandwidthDown, false);
    this.packetlossUp = check(this.packetlossUp, constr.packetlossUp, true);
    this.packetlossDown = check(this.packetlossDown, constr.packetlossDown,
      true);
  }
}

module.exports = MeasurementSet;
