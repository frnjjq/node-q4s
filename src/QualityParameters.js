/**
 * Quality parameters Q4S module. Implements storing and updating for quility
 * parameters of a session.
 * @module QualityParameters
 */

 /** Quality Parameters Class*/
 class QualityParameters {

   /**
   * Constructor for the QualityParameters class. Does not validate input data coherence.
   * @param {number} latency - The maximum latency allowed by the session.
   * @param {number} jitterUp - The maximum jitter allowed by the session in the uplink.
   * @param {number} jitterDown - The maximum jitter allowed by the session in the downlink.
   * @param {number} bandwidthUp - The minimum bandwidth allowed by the session in the uplink.
   * @param {number} bandwidthDown - The minimum bandwidth allowed by the session in the downlink.
   * @param {number} packetlossUp - The maximum packet loss allowed by the session in the uplink.
   * @param {number} packetlossDown - The minimum packet loss allowed by the session in the downlink.
   */
  constructor(latency, jitterUp, jitterDown,bandwidthUp, bandwidthDown, packetlossUp,packetlossDown) {
    this.latency = latency;
    this.jitterUp = jitterUp;
    this.jitterDown = jitterDown;
    this.bandwidthUp = bandwidthUp;
    this.bandwidthDown = bandwidthDown;
    this.packetlossUp = packetlossUp;
    this.packetlossDown = packetlossDown;
  }
  /**
   * Checks whether a given measurement fullfill the quality parameters.
   * @param {Object} measurement - The sdp message to generate a new session.
   * @param {number} measurement.latency - The measured RTT latency.
   * @param {number} measurement.jitterUp - The measured jitter in the uplink .
   * @param {number} measurement.jitterDown - The measured jitter in the downlink.
   * @param {number} measurement.bandwidthUp - The measured bandwidth in the uplink.
   * @param {number} measurement.bandwidthDown - The measured bandwidth in the downlink.
   * @param {number} measurement.packetlossUp - The measured packet loss in the uplink.
   * @param {number} measurement.packetlossDown - The measured packet loss in the downlink.
   * @return {bool} True if the requirements where fullfilled false otherwise 
   */
  doesMetQuality(measurement) {
    //TODO => Implementar
    return true;
  }

 }