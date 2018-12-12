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
   * Build a new ReqQ4S from an string. Validates the the string is correct.
   * @param {string} str - The string to parse to the ReqQ4S.
   * @return {Promise} On sucess (ReqQ4S) , on error (error).
   */
  static fromString(str) {
    return new Promise((resolve, reject) => {
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
      req.validate()
          .then(() => {
            resolve(req);
          })
          .catch((err) => {
            reject(err);
          });
    });
  }
  /**
   * Check that the data in this is correct and returns an error if data is malformed.
   * @return {Promise} On sucess () , on error (error).
   */
  validate() { // TODO: Improve this comprobation when you have the class clear
    return new Promise((resolve, reject) => {
      if (!this.method) {
        reject(new Error('Method is not present in the request line.'));
      }
      if (!(this.method === 'BEGIN' || this.method === 'READY' ||
        this.method === 'PING' || this.method === 'Q4S-ALERT' ||
        this.method === 'Q4S-RECOVERY' || this.method === 'CANCEL' ||
        this.method === 'PING')) {
        reject(new Error('Method field  does not contain a valid word.'));
      }
      if (this.method === 'READY' && typeof this.headers.stage === 'undefined') {
        reject(new Error('READY method without stage'));
      }
      if (!this.q4sVersion) {
        reject(new Error('Missing parameter in the request start line'));
      }
      if (typeof this.headers.signature !== undefined) {
        if (crypto.createHash('md5').update(this.body).digest("hex") != this.headers.signature) {
          reject(new Error('Signature MD5 does not match the body'));
        }
      }
      if (typeof this.headers["Content-Encoding"] !== undefined) {
        reject(new Error('Body in the request is compressed'));
      }
      if (typeof this.headers["Content-Type"] === undefined) {
        reject(new Error('Content-Type header is not present'));
      }
      if (typeof this.headers["Transfer-Encoding"] !== undefined && this.headers.Transfer-Encoding !== 'indentity') {
        reject(new Error('Transfer-Encoding can only be identity'));
      }
      if (!this.requestURI) {
        reject(new Error('Request Uri is not present in the request line.'));
      }
      resolve();
    });
  }

  /**
   * Introduces a new header signature in this containing the MD5 of the body of this.
   */
  signBody() {
    this.headers.signature = crypto.createHash('md5').update(this.body).digest("hex") 
  }
  /**
   * Returns a promise with the string format of this Request class. Use to send this request.
   * @return {promise} -  On sucess (string) , on error (error).
   */
  toString() {
    return new Promise((resolve, reject) => {
      let message = '';
      message = message + this.method + ' ' + this.requestURI + ' ';
      message = message + this.q4sVersion + '\r\n';

      const entries = Object.entries(this.headers);
      entries.forEach((item) => {
        message = message + item[0] + ': ' + item[1] + '\r\n';
      });
      message = message + '\r\n';
      message = message + this.body;
      resolve(message);
    });
  }
};

module.exports = ReqQ4S;
