/**
 * Response Q4S module. Implements the Response Q4S class that allow response
 * manipulation.
 * @module ResQ4S
 */

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
    this.q4sVersion = q4sVersion;
    this.statusCode = statusCode;
    this.reasonPhrase = reasonPhrase;
    this.headers = headers;
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

  /**
   * Static class method that allows to check whether a string is a Response.
   * it is intended for fast checking as validity is not a concern.
   * @param {string} message - The mesage which has to be checked.
   * @return {boolean} -  True if it is a Response, False if it is not
   */
  static isResponse(message) {
    const startLine = message.substring(0, message.indexOf('\r\n'));
    const values = startLine.split(' ');
    if (isNaN(parseInt(values[1], 10))) {
      return false;
    }
    return true;
  }
};

module.exports = ResQ4S;
