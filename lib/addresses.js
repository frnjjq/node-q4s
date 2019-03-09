/**
 * Network parameters Q4S module. Implements storing and updating for network
 * parameters of a Q4S session.
 * @module addreses
 * @license Apache-2.0
 */

/** Network Parameters Class*/
class Addresses {
  /**
   * Constructor for the QualityParameters class. Does not validate input data
   * coherence.
   * @param {number} clientAddressType - Ip version of the client
   * @param {String} clientAddress - Ip of the client.
   * @param {number} serverAddressType - Ip version of the server.
   * @param {String} serverAddress - Ip of the server
   * @param {Object} q4sClientPorts - Ports opened for Q4S communication at
   * client side
   * @param {Number} q4sClientPorts.TCP
   * @param {Number} q4sClientPorts.UDP
   * @param {Object} q4sServerPorts - Ports opened for Q4S communication at
   * server side
   * @param {Number} q4sServerPorts.TCP
   * @param {Number} q4sServerPorts.UDP
   * @param {Object} appClientPorts - Ports opened for app communication at
   * client side
   * @param {String} appClientPorts.TCP
   * @param {String} appClientPorts.UDP
   * @param {Object} appServerPorts - Ports opened for app communication at
   * server side
   * @param {String} appServerPorts.TCP
   * @param {String} appServerPorts.UDP
   */
  constructor(clientAddressType, clientAddress, serverAddressType,
      serverAddress, q4sClientPorts, q4sServerPorts, appClientPorts,
      appServerPorts) {
    /**
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
    if (!q4sClientPorts) {
      /**
       * Opened ports for the client q4s  cumunication
       * @member {Object}
       */
      this.q4sClientPorts = {};
    } else {
      this.q4sClientPorts = q4sClientPorts;
    }
    if (!q4sServerPorts) {
      /**
       * Opened ports for the server q4s cumunication
       * @member {Object}
       */
      this.q4sServerPorts = {};
    } else {
      this.q4sServerPorts = q4sServerPorts;
    }
    if (!appClientPorts) {
      /**
       * Opened ports for the client app cumunication
       * @member {Object}
       */
      this.appClientPorts = {};
    } else {
      this.appClientPorts = appClientPorts;
    }
    if (!appServerPorts) {
      /**
       * Opened ports for the server app cumunication
       * @member {Object}
       */
      this.appServerPorts = {};
    } else {
      this.appServerPorts = appServerPorts;
    }
  }

  /**
   * Updates the current Network parameters with data coming from an sdp.
   * @param  {String} sdp - The sdp representation of this parameters.
   */
  updateFromSDP(sdp) {
    const lines = sdp.split('\r\n');
    lines.forEach((line) => {
      if (line.indexOf('a=public-address:client') === 0) {
        const type = parseInt(line.substring(24, 26));
        if (!isNaN(type)) {
          this.clientAddressType = type;
        }
        this.clientAddress = line.substring(26);
      } else if (line.indexOf('a=public-address:server') === 0) {
        const type = parseInt(line.substring(24, 26));
        if (!isNaN(type)) {
          this.serverAddressType = type;
        }
        this.serverAddress = line.substring(26);
      } else if (line.indexOf('a=flow:app clientListeningPort TCP/') === 0) {
        this.appClientPorts.TCP = line.substring(35);
      } else if (line.indexOf('a=flow:app clientListeningPort UDP/') === 0) {
        this.appClientPorts.UDP = line.substring(35);
      } else if (line.indexOf('a=flow:app serverListeningPort TCP/') === 0) {
        this.appServerPorts.TCP = line.substring(35);
      } else if (line.indexOf('a=flow:app serverListeningPort UDP/') === 0) {
        this.appServerPorts.UDP = line.substring(35);
      } else if (line.indexOf('a=flow:q4s clientListeningPort TCP/') === 0) {
        const port = parseInt(line.substring(35));
        if (!isNaN(port)) {
          this.q4sClientPorts.TCP = port;
        }
      } else if (line.indexOf('a=flow:q4s clientListeningPort UDP/') === 0) {
        const port = parseInt(line.substring(35));
        if (!isNaN(port)) {
          this.q4sClientPorts.UDP = port;
        }
      } else if (line.indexOf('a=flow:q4s serverListeningPort TCP/') === 0) {
        const port = parseInt(line.substring(35));
        if (!isNaN(port)) {
          this.q4sServerPorts.TCP = port;
        }
      } else if (line.indexOf('a=flow:q4s serverListeningPort UDP/') === 0) {
        const port = parseInt(line.substring(35));
        if (!isNaN(port)) {
          this.q4sServerPorts.UDP = port;
        }
      }
    });
  }

  /**
   * Return an string representation of the addreses contained within this
   * object.
   * @return {String} - The String representation of this object.
   */
  ipToSdp() {
    let sdp = '';
    if (this.clientAddress) {
      sdp = sdp + 'a=public-address:client ' + this.clientAddressType +
        ' ' + this.clientAddress + '\r\n';
    }
    if (this.serverAddress) {
      sdp = sdp + 'a=public-address:server ' + this.serverAddressType +
        ' ' + this.serverAddress + '\r\n';
    }
    return sdp;
  }
  /**
   * Return an string representation of tthe flow ports contained within this
   * object.
   * @return {String} - The String representation of this object.
   */
  portToSDP() {
    let sdp = '';
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

module.exports = Addresses;
