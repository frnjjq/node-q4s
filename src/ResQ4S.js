module.exports = class ResQ4S {
  /**
     * Constructor for the ReqQ4S class. Does not validate the input data.
     * @param {string} q4sVersion - The string containing the Q4S version.
     * @param {number} statusCode - The status code of the response
     * @param {string} reasonPhrase - The reason of the response
     * @param {Object} headers - Object containing all the headers.
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
     * Build a new ResQ4S from an string. Validates the the string is correct.
     * @param {string} str - The string to parse to the ReqQ4S.
     * @return {Promise} On sucess a new ResQ4S objects, otherwise error.
     */
  static fromString(str) {
    return new Promise((resolve, reject) => {
      let q4sVersion; let statusCode; let reasonPhrase;
      const headers = {};

      const body = str.substring(str.indexOf('\r\n\r\n') + 4);
      const headerPart = str.substring(0, str.indexOf('\r\n\r\n'));
      const headLine = headerPart.split('\r\n');
      headLine.forEach((item, index) => {
        if (index === 0) {
          const values = item.split(' ');
          q4sVersion = values[0];
          statusCode = values[1]; // TODO:Add a number cast to store it as a number from string
          reasonPhrase = values[2];
        } else {
          const header = item.split(': ');
          headers[header[0]] = header[1];
        }
      });
      const res = new ResQ4S(q4sVersion, statusCode, reasonPhrase, headers, body);
      res.validate()
          .then(() => {
            resolve(req);
          })
          .catch((err) => {
            reject(err);
          });
    });
  }
  /**
      * Check that the data is correct and follows the required rules.
      * @return {Promise} On sucess nothing, otherwise error.
      */
  validate() { // TODO: Improve this comprobation when you have the class clear
    return new Promise((resolve, reject) => {
      // TODO -> Content-Type debe de estar en todas las request que se manden
      // TODO -> "Accept-Encoding" header debe de ser "identity" forzado
      // TODO -> Si es chunqued me lo cargo
      resolve();
    });
  }
  /**
     * Returns a promise with the string format of this object.
     * @return {promise} - On sucess the string of the request
     */
  toString() {
    return new Promise((resolve, reject) => {
      let message = '';
      // TODO: Cast to string ¿automatically?
      message = message + this.q4sVersion + ' ' + this.statusCode + ' ';
      message = message + this.reasonPhrase + '\r\n';

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
