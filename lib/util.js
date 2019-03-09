/**
 * Implements helper function for the whole codebase
 * @module Util
 * @license Apache-2.0
 */

const ip = require('ip');
const publicIp = require('public-ip');

/**
 * Helper function to distinguish between a request and a response. It may
 * not be valid as the funtion is intended to be a lighwheight fast approeach
 * to distinguish between them.
 * @param {String} msg - Line of the SDP containing the procedure.
 * @return {Boolean} - True if a Request Q4S false if a Response Q4S.
*/
module.exports.isRequest = function(msg) {
  const startLine = msg.substring(0, msg.indexOf('\r\n'));
  const values = startLine.split(' ');
  if (isNaN(parseInt(values[1], 10))) {
    return true;
  }
  return false;
};

/**
 * Returns an string containing your local Ip. Obtained from the interface
 * @return {String} - The string representation of the Ip.
 */
module.exports.getPrivateIp = function() {
  return ip.address();
};
/**
 * Returns an string containing your public Ip. Obtained using an
 * external service.
 * @async
 * @return {Promise<String>} - The string representation of the Ip.
 */
module.exports.getPublicIp = async function() {
  return await publicIp.v4();
};

/**
 * Regular expression to match the default procedure.
 */
module.exports.defaultProcedureRegEx =
  /default\(\d+\/\d+,\d+\/\d+,\d+,\d+\/\d+,\d+\/\d+\)$/;

module.exports.defaultProcedureOps = {
  negotiationPingUp: 20,
  negotiationPingDown: 20,
  negotiationBandwidth: 2,
  continuityPingUp: 20,
  continuityPingDown: 20,
  windowSizeUp: 255,
  windowSizeDown: 255,
  windowSizePctLssUp: 255,
  windowSizePctLssDown: 255,
};
/**
 * Q4S version string
 */
module.exports.Q4SVERSION = 'Q4S/1.0';
