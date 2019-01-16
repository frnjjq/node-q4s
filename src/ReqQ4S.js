/**
 * Request Q4S module. Implements the Request Q4S class that allow requests manipulation.
 * @module ReqQ4S
 */
const crypto = require('crypto');

/** Request Q4S class. Options to build , generate, parse and validate Q4S requests*/
class ReqQ4S {
  /**
   * Constructor for the ReqQ4S class. Does not validate input data coherence.
   * @param {string} method - The string containing the method.
   * @param {string} requestURI - The URI of the request.
   * @param {string} q4sVersion - The Q4S version.
   * @param {Object} headers - Object containing all the headers.
   * @param {string} headers.headername - One entry in the object for each header.
   * @param {string} body - The body of the request. Normally a sdp message.
   */
  constructor(method, requestURI, q4sVersion, headers, body) {
    this.method = method;
    this.requestURI = requestURI;
    this.q4sVersion = q4sVersion;
    this.headers = headers;
    this.body = body;
  }
  /**
   * Factory method to build a new ReqQ4S from an string. Validates the the 
   * created request object is correct.
   * @param {string} message - The mesage which has to be parsed into a ReqQ4S.
   * @return {Object} On sucess an object of the class ReqQ4S, on error returns an error.
   */
  static fromString(message) {
    let method; let requestURI; let q4sVersion;
    const headers = {};

    const body = str.substring(str.indexOf('\r\n\r\n') + 4);
    const headerPart = str.substring(0, str.indexOf('\r\n\r\n'));
    const headLine = headerPart.split('\r\n');
    headLine.forEach((item, index) => {
      if (index === 0) {
        const values = item.split(' ');
        method = values[0];
        requestURI = values[1];
        q4sVersion = values[2];
      } else {
        const header = item.split(': ');
        headers[header[0]] = header[1];
      }
    });
    const req = new ReqQ4S(method, requestURI, q4sVersion, headers, body);
    if (req.validate()) {
      return req;
    }
    return new Error("Malformed request.");
  }
  /**
   * Check that the data in this is correct and returns true if all is ok or 
   * false if data is malformed. 
   * @return {boolean} True is the data is correct. False otherwise.
   */
  validate() { // TODO: Improve this comprobation when you have the class clear
    if (!this.method) {
      return false;
    }
    if (!(this.method === 'BEGIN' || this.method === 'READY' ||
      this.method === 'PING' || this.method === 'Q4S-ALERT' ||
      this.method === 'Q4S-RECOVERY' || this.method === 'CANCEL' ||
      this.method === 'PING')) {
      return false;
    }
    if (this.method === 'READY' && typeof this.headers.stage === 'undefined') {
      return false;
    }
    if (!this.q4sVersion) {
      return false;
    }
    if (typeof this.headers.signature !== undefined) {
      if (crypto.createHash('md5').update(this.body).digest("hex") != this.headers.signature) {
        return false;
      }
    }
    if (typeof this.headers["Content-Encoding"] !== undefined) {
      return false;
    }
    if (typeof this.headers["Content-Type"] === undefined) {
      return false;
    }
    if (typeof this.headers["Transfer-Encoding"] !== undefined && this.headers.Transfer - Encoding !== 'indentity') {
      return false;
    }
    if (!this.requestURI) {
      return false;
    }
    return true;
  }

  /**
   * Introduces a new header signature in this containing the MD5 of the body of this.
   */
  signBody() {
    this.headers.signature = crypto.createHash('md5').update(this.body).digest("hex")
  }

  /**
   * Form the message format of this request. Use it to send it over TCP/UDP.
   * @return {string} -  String format of this response.
   */
  toString() {
    let message = '';
    message = message + this.method + ' ' + this.requestURI + ' ';
    message = message + this.q4sVersion + '\r\n';

    const entries = Object.entries(this.headers);
    entries.forEach((item) => {
      message = message + item[0] + ': ' + item[1] + '\r\n';
    });
    message = message + '\r\n';
    message = message + this.body;
    return message;
  }

    /**
   * Static class method that allows to check whether a string is a Request.
   * it is intended for fast checking as validity is not a concern.
   * @return {boolean} -  True if it is a Response, False if it is not
   */
  static isRequest(message) {
    const startLine = str.substring(0, message.indexOf('\r\n'));
    const values = startLine.split(' ');
    if (parseInt(values[1], 10) !== NaN) {
      return true;
    }
    return false;
  }
};

module.exports = ReqQ4S;
