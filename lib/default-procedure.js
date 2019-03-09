/**
 * Measurement parameters Q4S module. Implements storing and updating for the
 * default procedure of a Q4S session.
 * @module default-procedure
 * @license Apache-2.0
 */
const util = require('./util');
const matcher = util.defaultProcedureRegEx;
const defaults = util.defaultProcedureOps;

/** Default Procedure Class*/
class DefaultProcedure {
  /**
  * Constructor for the QualityParameters class. Does not validate any data.
  * @param {Number} negotiationPingUp - Miliseconds bewtween pings for the
  * uplink during negotiation stage.
  * @param {Number} negotiationPingDown - Miliseconds bewtween pings for the
  * downlink during negotiation stage
  * @param {Number} negotiationBandwidth - Time that the bandwidth measure
  * should last in seconds.
  * @param {Number} continuityPingUp - Miliseconds between pings for the uplink
  * during the continuity stage.
  * @param {Number} continuityPingDown - Miliseconds between pings for the
  * downlink during the continuity stage.
  * @param {Number} windowSizeUp - Window size for the jitter calculation in
  * the uplink during continuity phase.
  * @param {Number} windowSizeDown - Window size for the jitter calculation in
  * the downlink during continuity phase.
  * @param {Number} windowSizePctLssUp - Window size for the packet loss
  * calculation in the uplink during continuity phase.
  * @param {Number} windowSizePctLssDown - Window size for the packet loss
  * calculation inthe downlink during continuity phase.
  */
  constructor(negotiationPingUp, negotiationPingDown, negotiationBandwidth,
      continuityPingUp, continuityPingDown, windowSizeUp, windowSizeDown,
      windowSizePctLssUp, windowSizePctLssDown) {
    /**
     * @member {Number}
     */
    this.negotiationPingUp = negotiationPingUp;
    /**
     * @member {Number}
     */
    this.negotiationBandwidth = negotiationBandwidth;
    /**
     * @member {Number}
     */
    this.continuityPingUp = continuityPingUp;
    /**
     * @member {Number}
     */
    this.continuityPingDown = continuityPingDown;
    /**
     * @member {Number}
     */
    this.windowSizeUp = windowSizeUp;
    /**
     * @member {Number}
     */
    this.windowSizeDown = windowSizeDown;
    /**
     * @member {Number}
     */
    this.windowSizePctLssUp = windowSizePctLssUp;
    /**
     * @member {Number}
     */
    this.windowSizePctLssDown = windowSizePctLssDown;
    /**
     * @member {Number}
     */
    this.negotiationPingDown = negotiationPingDown;
  }
  /**
   * Factory function to generate a new MeasurementProcedure orut of a SDP
   * string. It is intended to be called with the line which contains the
   * measurement procedure.
   * @param {String} str - Line of the SDP containing the procedure.
   */
  updateFromAttr(str) {
    const parse = function(str, past) {
      const value = parseInt(str);
      if (isNaN(value)) {
        return past;
      } else {
        return value;
      }
    };
    if (matcher.test(str)) {
      let numbers = str.split('(')[1].replace(')', '');

      numbers = numbers.split(',');
      numbers.forEach((element, index, arr) => {
        arr[index] = element.split('/');
      });

      this.negotiationPingUp = parse(numbers[0][0]);
      this.negotiationPingDown = parse(numbers[0][1]);
      this.negotiationBandwidth = parse(numbers[2][0]);
      this.continuityPingUp = parse(numbers[1][0]);
      this.continuityPingDown = parse(numbers[1][1]);
      this.windowSizeUp = parse(numbers[3][0]);
      this.windowSizeDown = parse(numbers[3][1]);
      this.windowSizePctLssUp = parse(numbers[4][0]);
      this.windowSizePctLssDown = parse(numbers[4][1]);
    }
  }
  /**
   * Generates a string with the information contained withing this object.
   * It is intended to fill an SDP.
   * @return {String} - Return the SDP representation of the Object.
   */
  toAttr() {
    if (this.negotiationPingUp && this.negotiationPingDown &&
      this.continuityPingUp && this.continuityPingDown &&
      this.negotiationBandwidth && this.windowSizeUp &&
      this.windowSizeDown && this.windowSizePctLssUp &&
      this.windowSizePctLssDown) {
      return `default(${this.negotiationPingUp}/` +
        `${this.negotiationPingDown},${this.continuityPingUp}` +
        `/${this.continuityPingDown},${this.negotiationBandwidth},` +
        `${this.windowSizeUp}/${this.windowSizeDown},` +
        `${this.windowSizePctLssUp}/${this.windowSizePctLssDown})`;
    } else {
      return '';
    }
  }

  /**
   * Generates this object from options or default it
   * @argument {Object} opt to geenrate this
   */
  fromOptions(opt) {
    if (opt) {
      this.negotiationPingUp = opt.negotiationPingUp ?
        opt.negotiationPingUp : defaults.negotiationPingUp;
      this.negotiationPingDown = opt.negotiationPingDown ?
        opt.negotiationPingDown : defaults.negotiationPingDown;
      this.negotiationBandwidth = opt.negotiationBandwidth ?
        opt.negotiationBandwidth : defaults.negotiationBandwidth;
      this.continuityPingUp = opt.continuityPingUp ?
        opt.continuityPingUp : defaults.continuityPingUpcontinuityPingUp;
      this.continuityPingDown = opt.continuityPingDown ?
        opt.continuityPingDown : defaults.continuityPingDown;
      this.windowSizeUp = opt.windowSizeUp ?
        opt.windowSizeUp : defaults.windowSizeUp;
      this.windowSizeDown = opt.windowSizeDown ?
        opt.windowSizeDown : defaults.windowSizeDown;
      this.windowSizePctLssUp = opt.windowSizePctLssUp ?
        opt.windowSizePctLssUp : defaults.windowSizePctLssUp;
      this.windowSizePctLssDown = opt.windowSizePctLssDown ?
        opt.windowSizePctLssDown : defaults.windowSizePctLssDown;
    } else {
      this.negotiationPingUp = defaults.negotiationPingUp;
      this.negotiationPingDown = defaults.negotiationPingDown;
      this.negotiationBandwidth = defaults.negotiationBandwidth;
      this.continuityPingUp = defaults.continuityPingUp;
      this.continuityPingDown = defaults.continuityPingDown;
      this.windowSizeUp = defaults.windowSizeUp;
      this.windowSizeDown = defaults.windowSizeDown;
      this.windowSizePctLssUp = defaults.windowSizePctLssUp;
      this.windowSizePctLssDown = defaults.windowSizePctLssDown;
    }
  }
}
module.exports = DefaultProcedure;
