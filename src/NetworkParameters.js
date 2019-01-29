/**
 * Network parameters Q4S module. Implements storing and updating for network
 * parameters of a Q4S session.
 * @module NetworkParameters
 * @license Apache-2.0
 */

/** Network Parameters Class*/
class NetworkParameters {
  /**
  * Constructor for the QualityParameters class. Does not validate input data
  * coherence.
  * @param {number} clientAddressType - Ip version of the client
  * @param {string} clientAddress - Ip of the client.
  * @param {number} serverAddressType - Ip version of the server.
  * @param {number} serverAddress - Ip of the server
  * @param {Object} q4sClientPorts - Ports opened for Q4S communication at client 
  * side
  * @param {Number} q4sClientPorts.TCP
  * @param {Number} q4sClientPorts.UDP
  * @param {Object} q4sServerPorts - Ports opened for Q4S communication at server 
  * side
  * @param {Number} q4sServerPorts.TCP
  * @param {Number} q4sServerPorts.UDP
  * @param {Object} appClientPorts - Ports opened for app communication at client 
  * side
  * @param {String} appClientPorts.TCP
  * @param {String} appClientPorts.UDP
  * @param {Object} appServerPorts - Ports opened for app communication at server 
  * side
  * @param {String} appServerPorts.TCP
  * @param {String} appServerPorts.UDP
  */
  constructor(clientAddressType, clientAddress, serverAddressType,
    serverAddress, q4sClientPorts, q4sServerPorts, appClientPorts,
    appServerPorts) {
    /**
     * Ip version of the client.
     * @member {Number}
     */
    this.clientAddressType = clientAddressType;
    /**
     * Client IP
     * @member {String}
     */
    this.clientAddress = clientAddress;
    /**
     * Ip version of the server.
     * @member {Number}
     */
    this.serverAddressType = serverAddressType;
    /**
     * Server IP
     * @member {String}
     */
    this.serverAddress = serverAddress;
    if (!q4sClientPorts){
      /**
       * Opened ports for the client q4s  cumunication
       * @member {Object}
       */
      this.q4sClientPorts = {};
    }
    else {
      this.q4sClientPorts = q4sClientPorts;
    }
     if (!q4sServerPorts){
      /**
       * Opened ports for the server q4s cumunication
       * @member {Object}
       */
      this.q4sServerPorts = {};
    }
    else {
      this.q4sServerPorts = q4sServerPorts;
    }  
    if (!appClientPorts){
      /**
       * Opened ports for the client app cumunication
       * @member {Object}
       */
      this.appClientPorts = {};
    }
    else {
      this.appClientPorts = appClientPorts;
    }   
    if (!appServerPorts){
      /**
       * Opened ports for the server app cumunication
       * @member {Object}
       */
      this.appServerPorts = {};
    }
    else {
      this.appServerPorts = appServerPorts;
    }    
  }

  /**
   * Updates the current Network parameters with data coming from an sdp.
   * @param  {String} sdp - The sdp representation of this parameters.
   */
  updateWithSDP(sdp) {
    const lines = sdp.split('\r\n');
    lines.forEach((line) => {
      if (line.indexOf('a=public-address:client') === 0) {
        this.clientAddressType = line.substring(24, 27);
        this.clientAddress = line.substring(28);
      } else if (line.indexOf('a=public-address:server') === 0) {
        this.serverAddressType = line.substring(24, 27);
        this.serverAddress = line.substring(28);
      } else if (line.indexOf('a=flow:app clientListeningPort TCP/') === 0) {
        this.appClientPorts.TCP = line.substring(35);
      } else if (line.indexOf('a=flow:app clientListeningPort UDP/') === 0) {
        this.appClientPorts.UDP = line.substring(35);
      } else if (line.indexOf('a=flow:app serverListeningPort TCP/') === 0) {
        this.appServerPorts.TCP = line.substring(35);
      } else if (line.indexOf('a=flow:app serverListeningPort UDP/') === 0) {
        this.appServerPorts.UDP = line.substring(35);
      } else if (line.indexOf('a=flow:q4s clientListeningPort TCP/') === 0) {
        this.q4sClientPorts.TCP = parseInt(line.substring(35));
      } else if (line.indexOf('a=flow:q4s clientListeningPort UDP/') === 0) {
        this.q4sClientPorts.UDP = parseInt(line.substring(35));
      } else if (line.indexOf('a=flow:q4s serverListeningPort TCP/') === 0) {
        this.q4sServerPorts.TCP = parseInt(line.substring(35));
      } else if (line.indexOf('a=flow:q4s serverListeningPort UDP/') === 0) {
        this.q4sServerPorts.UDP = parseInt(line.substring(35));
      }
    });
  }

  /**
   * Return an string representation of tthe addreses contained within this object.
   * @return {String} - The String representation of this object.
   */
  addresesToSDP() {
    const sdp = "";
    if (this.clientAddress) {
      sdp = sdp + 'a=public-address:client ' + this.clientAddressType +
        ' ' + this.clientAddress + '\r\n';
    }
    if (this.serverAddress) {
      sdp = sdp + 'a=public-address:server ' + this.addresses.serverAddressType +
        ' ' + this.serverAddress + '\r\n';
    }
    return sdp;
  }
  /**
 * Return an string representation of tthe flow ports contained within this object.
 * @return {String} - The String representation of this object.
 */
  flowsToSDP() {
    let sdp = "";
    if (this.appClientPorts.TCP) {
      sdp = sdp + 'a=flow:app clientListeningPort TCP/' +
        this.appClientPorts.TCP + '\r\n';
    }
    if (this.appClientPorts.UDP) {
      sdp = sdp + 'a=flow:app clientListeningPort UDP/' +
        this.appClientPorts.UDP + '\r\n';
    }
    if (this.appServerPorts.TCP) {
      sdp = sdp + 'a=flow:app serverListeningPort TCP/' +
        this.appServerPorts.TCP + '\r\n';
    }
    if (this.appServerPorts.UDP) {
      sdp = sdp + 'a=flow:app serverListeningPort UDP/' +
        this.appServerPorts.UDP + '\r\n';
    }
    if (this.q4sClientPorts.TCP) {
      sdp = sdp + 'a=flow:q4s clientListeningPort TCP/' +
        this.q4sClientPorts.TCP + '\r\n';
    }
    if (this.q4sClientPorts.UDP) {
      sdp = sdp + 'a=flow:q4s clientListeningPort UDP/' +
        this.q4sClientPorts.UDP + '\r\n';
    }
    if (this.q4sServerPorts.TCP) {
      sdp = sdp + 'a=flow:q4s serverListeningPort TCP/' +
        this.q4sServerPorts.TCP + '\r\n';
    }
    if (this.q4sServerPorts.UDP) {
      sdp = sdp + 'a=flow:q4s serverListeningPort UDP/' +
        this.q4sServerPorts.UDP + '\r\n';
    }
    return sdp;
  }
}

module.exports = NetworkParameters;
