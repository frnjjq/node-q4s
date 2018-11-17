module.exports = class ReqQ4S {
  /**
   * Constructor for the ReqQ4S class. Does not validate the input data.
   * @param {string} method - The string containing the method.
   * @param {string} requestURI - The URL of the request.
   * @param {string} q4sVersion - The string containing the Q4S version.
   * @param {Object} headers - Object containing all the headers.
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
   * @return {Promise} On sucess a new ReqQ4S objects, otherwise error.
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
    * Check that the data is correct and follows the required rules.
    * @return {Promise} On sucess nothing, otherwise error.
    */
  validate() { // TODO: Improve this comprobation when you have the class clear
    return new Promise((resolve, reject) => {
      if (!this.method) {
        reject(new Error('Method is not present in the request line.'));
      }
      if (!(this.method === 'BEGIN' || this.method === 'READY' ||
        this.method === 'PING' || data.method === 'Q4S-ALERT' ||
        this.method === 'Q4S-RECOVERY' || data.method === 'CANCEL' ||
        this.method === 'PING')) {
        reject(new Error('Method field  does not contain a valid word.'));
      }
      // TODO -> Si el metodo es ready tiene que estar presente la cabecera stage
      // TODO -> If signature is present as header validate the body. usango MD5
      // TODO -> Quizas deberia componar cabecera a ver si hay measurements que requiran ser incluidos.
      // TODO -> Si me dicen que el body esta compirmido doy error
      // TODO -> Content-Type debe de estar en todas las request que se manden
      // TODO -> "Accept-Encoding" header debe de ser "identity" forzado
      // TODO -> Si es chunqued me lo cargo

      if (!this.requestURI) {
        reject(new Error('Request Uri is not present in the request line.'));
      }
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
