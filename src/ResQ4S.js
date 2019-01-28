/**
 * Response Q4S module. Implements the Response Q4S class that implements 
 * response logic and manipulation.
 * @module ResQ4S
 * @license Apache-2.0
 */

/**
 * An enumerator which defines the reason phrase for each of the error
 * codes that a response may contain.
 */
const reasonPhrases = Object.freeze({
  100: "Trying",
  200: "Ok",
  400: "Bad Request",
  404: "Not Found",
  405: "Method Not Allowed",
  406: "Not Acceptable",
  408: "Request Timeout",
  413: "Request Entity Too Large",
  414: "Request-URI Too Long",
  415: "Unsoported Media Type",
  416: "Unsoported URI Scheme",
  500: "Server Internal Error",
  501: "Not Implemented",
  503: "Service Unavailable",
  504: "Server Time-out",
  505: "Version Not Supported",
  513: "Message Too Large",
  600: "Session Does Not Exist",
  601: "Quality Level Not Allowed",
  603: "Session not Allowed",
  604: "Authorization Nor Allowed",
});

/**
 * Response Q4S class. Options to build , generate, parse and validate Q4S
 * responses
 */
class ResQ4S {
  /**
   * Constructor for the ReqQ4S class. Does not validate input data coherence.
   * @param {string} q4sVersion - The string containing the Q4S version.
   * @param {number} statusCode - The status code of the response
   * @param {string} reasonPhrase - The reason of the response
   * @param {Object} headers - Object containing all the headers.
   * @param {string} headers.headername - One entry in the object for each
   * header.
   * @param {string} body - The body of the request. Normally a sdp message.
   */
  constructor(q4sVersion, statusCode, reasonPhrase, headers, body) {
    /**
     * The Q4S protocol version
     * @member {String}
     * */
    this.q4sVersion = q4sVersion;
    /**
     * The status code
     * @member {Number}
     * */
    this.statusCode = statusCode;
    /**
     * String containing a human redable reasoning of the error code.
     * @member {String}
     * */
    this.reasonPhrase = reasonPhrase;
    /**
     * Object containing the headers. Each property name os the name of the
     * header. Its value is the field.
     * @member {Object}
     */
    this.headers = headers;
    /**
     * The body of the response.
     * @member {String}
     */
    this.body = body;
  }
  /**
   * Factory method to build a new ResQ4S from an string. Validates the the
   * string is correct.
   * @param {string} str - The string to parse to the ReqQ4S.
   * @return {Object} On sucess an object of the class ResQ4S, on error
   * returns an error.
   */
  static fromString(str) {
    let q4sVersion; let statusCode; let reasonPhrase;
    const headers = {};

    const body = str.substring(str.indexOf('\r\n\r\n') + 4);
    const headerPart = str.substring(0, str.indexOf('\r\n\r\n'));
    const headLine = headerPart.split('\r\n');
    headLine.forEach((item, index) => {
      if (index === 0) {
        const values = item.split(' ');
        q4sVersion = values[0];
        statusCode = parseInt(values[1], 10);
        reasonPhrase = values[2];
      } else {
        const header = item.split(': ');
        headers[header[0]] = header[1];
      }
    });
    const res = new ResQ4S(q4sVersion, statusCode, reasonPhrase, headers,
        body);
    res.validate();
    return res;
  }

  /**
   * Check that the data is correct and follows the required rules. This
   * method checks the response, so there wont be body validation.
   * @return {boolean} True is the data is correct. False otherwise.
   */
  validate() { // TODO: Improve this comprobation when you have the class clear
    // TODO -> Content-Type debe de estar en todas las request que se manden
    // TODO -> "Accept-Encoding" header debe de ser "identity" forzado
    // TODO -> Si es chunqued me lo cargo
    return true;
  }

  /**
   * Form the message format of this Response and send it over the network.
   * @return {string} -  String format of this Request.
   */
  toString() {
    let message = '';

    message = message + this.q4sVersion + ' ' + this.statusCode + ' ';
    message = message + this.reasonPhrase + '\r\n';

    const entries = Object.entries(this.headers);
    entries.forEach((item) => {
      message = message + item[0] + ': ' + item[1] + '\r\n';
    });
    message = message + '\r\n';
    message = message + this.body;
    return message;
  }
};

module.exports = ResQ4S;
