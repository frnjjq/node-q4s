/**
 * Request Q4S module. Implements the Request Q4S class that allow requests
 * manipulation.
 * @module ReqQ4S
 * @license Apache-2.0
 */
const crypto = require('crypto');
require('url');
const Util = require('./util');

/**
 * Request Q4S class. Options to build , generate, parse and validate Q4S
 * requests
 */
class ReqQ4S {
  /**
   * Constructor for the ReqQ4S class. Does not validate input data coherence.
   * @param {string} method - The string containing the method.
   * @param {URL} requestURI - The URI of the request.
   * @param {string} q4sVersion - The Q4S version.
   * @param {Object} headers - Object containing all the headers.
   * @param {string} headers.headername - One entry in the object for each
   * header.
   * @param {string} body - The body of the request. Normally a sdp message.
   */
  constructor(method, requestURI, q4sVersion, headers, body) {
    /**
     * Method of the request.
     * @member {String}
     */
    this.method = method;
    /**
     * The URI field of the request
     * @member {String}
     */
    this.requestURI = requestURI;
    /**
     * The version of the Q4S protocol.
     * @member {String}
     */
    this.q4sVersion = q4sVersion;
    /**
     * Object containing the headers. Each property name os the name of the
     * header. Its value is the field.
     * @member {Object}
     */
    this.headers = headers;
    /**
     * The body of the request.
     * @member {String}
     */
    this.body = body;
  }
  /**
   * Factory method to build a new ReqQ4S from an string. Validates the the
   * created request object is correct.
   * @param {string} message - The mesage which has to be parsed into a ReqQ4S.
   * @return {Object} On sucess an object of the class ReqQ4S, otherwise an
   * error will be trown
   */
  static fromString(message) {
    let method; let requestURI; let q4sVersion;
    const headers = {};

    const body = message.substring(message.indexOf('\r\n\r\n') + 4);
    const headerPart = message.substring(0, message.indexOf('\r\n\r\n'));
    const headLine = headerPart.split('\r\n');
    headLine.forEach((item, index) => {
      if (index === 0) {
        const values = item.split(' ');
        method = values[0];
        requestURI = new URL(values[1]);
        q4sVersion = values[2];
      } else {
        const header = item.split(': ');
        headers[header[0]] = header[1];
      }
    });
    const req = new ReqQ4S(method, requestURI, q4sVersion, headers, body);
    req.validate();
    return req;
  }

  /**
   * Factory method to build a new ReqQ4S abstracting part of the details.
   * @param {string} method - The string containing the method.
   * @param {URL} requestURI - The URI of the request.
   * @param {Object} headers - Object containing all the headers.
   * @param {string} headers.headername - One entry in the object for each
   * header.
   * @param {string} body - The body of the request. Normally a sdp message.
   * returns an error.
   * @return {ReqQ4SQ}
   */
  static genReq(method, requestURI, headers, body) {
    return new ReqQ4S(method, requestURI, Util.Q4SVERSION, headers, body);
  }

  /**
   * Check that the data in this is correct and returns true if all is ok or
   * false if data is malformed.If there is anything malformed an error will be
   * trown.
   */
  validate() { // TODO: Improve this comprobation when you have the class clear
    if (!this.q4sVersion) {
      throw new Error('Missing an argument in the start line');
    }
    if (!METHODS.includes(this.method)) {
      throw new Error('Method field  does not contain a valid verb.');
    }
    if (this.method === 'READY' && typeof this.headers.Stage === 'undefined') {
      throw new Error('READY method without stage header');
    }
    if (this.headers.signature !== undefined) {
      if (crypto.createHash('md5').update(this.body).digest('hex') !=
        this.headers.signature) {
        throw new Error('Signature MD5 does not match the body.');
      }
    }
    if (this.headers['Content-Encoding'] !== undefined) {
      throw new Error('Body in the request is compressed');
    }
    if (this.body && this.headers['Content-Type'] === undefined) {
      throw new Error('Content-Type header is not present');
    }
    if (this.headers['Transfer-Encoding'] !== undefined &&
      this.headers['Transfer-Encoding'] !== 'indentity') {
      throw new Error('Transfer-Encoding header can only be identity');
    }
    return;
  }

  /**
   * Introduces a new header signature in this containing the MD5 of the body
   * of this.
   */
  signBody() {
    this.headers.signature = crypto.createHash('md5')
        .update(this.body)
        .digest('hex');
  }

  /**
   * Form the message format of this request. Use it to send it over TCP/UDP.
   * @return {string} -  String format of this response.
   */
  toString() {
    let message = '';
    message = message + this.method + ' ' + this.requestURI + ' ';
    message = message + this.q4sVersion + '\r\n';
    if (this.headers) {
      const entries = Object.entries(this.headers);
      entries.forEach((item) => {
        message = message + item[0] + ': ' + item[1] + '\r\n';
      });
    }
    message = message + '\r\n';
    if (this.body) {
      message = message + this.body;
    }
    return message;
  }
};

const METHODS = [
  'BEGIN',
  'READY',
  'PING',
  'Q4S-ALERT',
  'Q4S-RECOVERY',
  'CANCEL',
  'PING',
  'BWIDTH',
];
module.exports = ReqQ4S;
