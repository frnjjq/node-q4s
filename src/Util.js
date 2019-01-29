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
 * @return {String} - The string representation of the Ip.
 */
module.exports.getPublicIp = async function() {
  return await publicIp.v4();
};

module.exports.Q4SVERSION = 'Q4S/1.0';
