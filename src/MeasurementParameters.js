/**
 * Measurement parameters Q4S module. Implements storing and updating for the default procedure
 *  of a Q4S session.
 * @module MeasurementParameters
 */

 /** Network Parameters Class*/
 class MeasurementParameters {

    /**
    * Constructor for the QualityParameters class. Does not validate input data coherence.
    * @param {number} negotiationPingUp - The maximum latency allowed by the session.
    * @param {number} negotiationPingDown
    * @param {number} negotiationBandwidth
    * @param {number} continuityPingUp
    * @param {number} continuityPingDown
    * @param {number} windowSizeUp
    * @param {number} windowSizeDown
    * @param {number} windowSizePctLssUp
    * @param {number} windowSizePctLssDown
    */
   constructor(negotiationPingUp) {
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
  }