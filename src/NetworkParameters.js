/**
 * Network parameters Q4S module. Implements storing and updating for network
 * parameters of a Q4S session.
 * @module NetworkParameters
 */

const ip = require('ip');

/** Network Parameters Class*/
class NetworkParameters {
  /**
  * Constructor for the QualityParameters class. Does not validate input data
  * coherence.
  * @param {number} clientAddressType - The maximum latency allowed by the
  * session.
  * @param {string} clientAddress - The maximum jitter allowed by the session
  * in the uplink.
  * @param {number} serverAddressType - The maximum jitter allowed by the
  * session in the downlink.
  * @param {number} serverAddress - The minimum bandwidth allowed by the
  * session in the uplink.
  * @param {Object} q4sClientPorts - The minimum bandwidth allowed by the
  * session in the downlink.
  * @param {Number} q4sClientPorts.TCP
  * @param {Number} q4sClientPorts.UDP
  * @param {Object} q4sServerPorts - The minimum bandwidth allowed by the
  * session in the downlink.
  * @param {Number} q4sServerPorts.TCP
  * @param {Number} q4sServerPorts.UDP
  * @param {Object} appClientPorts - The minimum bandwidth allowed by the
  * session in the downlink.
  * @param {String} appClientPorts.TCP
  * @param {String} appClientPorts.UDP
  * @param {Object} appServerPorts - The minimum bandwidth allowed by the
  * session in the downlink.
  * @param {String} appServerPorts.TCP
  * @param {String} appServerPorts.UDP
  */
  constructor(clientAddressType, clientAddress, serverAddressType,
      serverAddress, q4sClientPorts, q4sServerPorts, appClientPorts,
      appServerPorts) {
    this.clientAddressType = clientAddressType;
    this.clientAddress = clientAddress;
    this.serverAddressType = serverAddressType;
    this.serverAddress = serverAddress;
    this.q4sClientPorts = q4sClientPorts;
    this.q4sServerPorts = q4sServerPorts;
    this.appClientPorts = appClientPorts;
    this.appServerPorts = appServerPorts;
  }

  /**
   * Returns an object containing your publicIp and type.Use it to introduce
   *  info into this object.
   * @return {String} - The string representation of the Ip.
   */
  static getMyPublicIp() {
    return ip.address();
  }

  /**
   * Returns an object containing your publicIp and type.Use it to introduce
   * info into this object.
   * @param  {String} sdp - The sdp representation of this parameters.
   */
  updateWithSDP(sdp) {
    // TODO =>
  }

  /**
   * Returns an object containing your publicIp and type.Use it to introduce
   * info into this object.
   */
  toSDPAttr() {
    // TODO =>
  }
}

module.exports = NetworkParameters;
