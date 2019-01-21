/**
 * Measurement parameters Q4S module. Implements storing and updating for the
 * default procedure of a Q4S session.
 * @module MeasurementProcedure
 */

/** Network Parameters Class*/
class MeasurementProcedure {
  /**
  * Constructor for the QualityParameters class. Does not validate any data.
  * @param {number} negotiationPingUp - Miliseconds bewtween pings for the
  * uplink during negotiation stage.
  * @param {number} negotiationPingDown - Miliseconds bewtween pings for the
  * downlink during negotiation stage
  * @param {number} negotiationBandwidth - Minimum bandwidth during
  * negotiation.
  * @param {number} continuityPingUp - Miliseconds between pings for the uplink
  * during the continuity stage.
  * @param {number} continuityPingDown - Miliseconds between pings for the
  * downlink during the continuity stage.
  * @param {number} windowSizeUp - Window size for the jitter calculation in
  * the uplink during continuity phase.
  * @param {number} windowSizeDown - Window size for the jitter calculation in
  * the downlink during continuity phase.
  * @param {number} windowSizePctLssUp - Window size for the packet loss
  * calculation in the uplink during continuity phase.
  * @param {number} windowSizePctLssDown - Window size for the packet loss
  * calculation inthe downlink during continuity phase.
  */
  constructor(negotiationPingUp, negotiationPingDown, negotiationBandwidth,
      continuityPingUp, continuityPingDown, windowSizeUp, windowSizeDown,
      windowSizePctLssUp, windowSizePctLssDown) {
    this.negotiationPingUp = negotiationPingUp;
    this.negotiationPingDown = negotiationPingDown;
    this.negotiationBandwidth = negotiationBandwidth;
    this.continuityPingUp = continuityPingUp;
    this.continuityPingDown = continuityPingDown;
    this.windowSizeUp = windowSizeUp;
    this.windowSizeDown = windowSizeDown;
    this.windowSizePctLssUp = windowSizePctLssUp;
    this.windowSizePctLssDown = windowSizePctLssDown;
  }
  /**
   * Factory function to generate a new MeasurementProcedure orut of a SDP
   * string. It is intended to be called with the line which contains the
   * measurement procedure.
   * @param {String} str - Line of the SDP containing the procedure.
   * @return {MeasurementProcedure} - Return the generated object.
   */
  static fromString(str) {
    let numbers = str.split('(')[1].replace(')', '');

    numbers = numbers.split(',');
    numbers.forEach((element, index, arr) => {
      arr[index] = element.split('/');
    });
    const negotiationPingUp = parseInt(numbers[0][0], 10);
    const negotiationPingDown = parseInt(numbers[0][1], 10);
    const negotiationBandwidth = parseInt(numbers[2][0], 10);
    const continuityPingUp = parseInt(numbers[1][0], 10);
    const continuityPingDown = parseInt(numbers[1][1], 10);
    const windowSizeUp = parseInt(numbers[3][0], 10);
    const windowSizeDown = parseInt(numbers[3][1], 10);
    const windowSizePctLssUp = parseInt(numbers[4][0], 10);
    const windowSizePctLssDown = parseInt(numbers[4][1], 10);

    return new MeasurementProcedure(negotiationPingUp, negotiationPingDown,
        negotiationBandwidth, continuityPingUp, continuityPingDown,
        windowSizeUp, windowSizeDown, windowSizePctLssUp, windowSizePctLssDown);
  }
  /**
   * Generates a string with the information contained withing this object.
   * It is intended to fill an SDP.
   * @return {String} - Return the SDP representation of the Object.
   */
  toString() {
    return `a=measurement:procedure default(${this.negotiationPingUp}/`+
    `${this.negotiationPingDown},${this.continuityPingUp}`+
    `/${this.continuityPingDown},${this.negotiationBandwidth},`+
    `${this.windowSizeUp}/${this.windowSizeDown},${this.windowSizePctLssUp}`+
    `/${this.windowSizePctLssDown})`;
  }
}
module.exports = MeasurementProcedure;
