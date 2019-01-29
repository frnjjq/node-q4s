/**
 * Session manipulation class. Implements  methods to build sessions from sdp
 * and to generate new sdp.
 * @module Session
 */

const MeasurementParameters = require('MeasurementParameters.js');
const NetworkParameters = require('NetworkParameters.js');
const QualityParameters = require('QualityParameters.js');

/** Session class. Options to build , generate and parse sessions*/
class Session {
  /**
   * Constructor for the ReqQ4S class. Does not validate input data coherence.
   * @param {number} qosLevelUp - Contains the QoS level for uplink. May be
   * changed during session
   * @param {number} qosLevelDown - Contains the QoS level for downlink. May
   * be changed during session
   * @param {number} alertingMode - The configured alert mode setted up for
   * this session.
   * @param {number} alertPause - Alert pause value, number of miliseconds
   * between Alert q4s messages.
   * @param {number} sessionState - The State of the current session
   * @param {number} sessionId - The session Id of this session.
   * //TODO => May need more things here to be honest
   * @param {NetworkParameters} addresses - The IP version of the client
   * address.
   * @param {QualityParameters} quality - The client IP address.
   * @param {MeasurementProcedure} measurement - The client IP address.
   */
  constructor(qosLevelUp, qosLevelDown, alertingMode, alertPause,
      recoveryPause, sessionState, SessionId, addresses, quality,
      measurement) {
    this.qosLevelUp = qosLevelUp;
    this.qosLevelDown = qosLevelDown;
    this.alertingMode = alertingMode;
    this.alertPause = alertPause;
    this.recoveryPause = recoveryPause;
    this.sessionState = sessionState;
    this.addresses = addresses;
    this.quality = quality;
    this.measurement = measurement;
    this.sessionId = SessionId;
  }
  /**
   * Factory static method to generate a new session from an SDP.
   * @param {string} sdp - The sdp message to generate a new session.
   * @return {Session} Return the generated Session.
   */
  static fromSdp(sdp) {
    let qosLevelUp = 0;
    let qosLevelDown = 0;
    let alertingMode = alertTypes.REACTIVE;
    let alertPause = 1000;
    let recoveryPause = 1000;
    let clientPublicAddressType;
    let clientPublicAddress;
    let serverPublicAddressType;
    let serverPublicAddress;
    let measurement;
    let latency = 0;
    let jitterUp = 0;
    let jitterDown = 0;
    let bandwidthUp = 0;
    let bandwidthDown = 0;
    let packetlossUp = 0;
    let packetlossDown = 0;
    let q4sClientPorts;
    let q4sServerPorts;
    let appClientPorts;
    let appServerPorts;
    let SessionId;

    const lines = str.split('\r\n');
    lines.forEach((line) => {
      if (line.indexOf('a=') === 0) {
        if (line.indexOf('a=qos-level:') === 0) {
          const aux = line.substring(12).split('/');
          qosLevelUp = parseInt(aux[0], 10);
          qosLevelDown = parseInt(aux[1], 10);
        } else if (line.indexOf('a=alerting-mode:') === 0) {
          const aux = line.substring(16);
          if (aux.localeCompare('Q4S-aware-network') === 0) {
            alertingMode = alertTypes.Q4SAWARE;
          }
        } else if (line.indexOf('a=alert-pause:') === 0) {
          alertPause = parseInt(line.substring(14), 10);
        } else if (line.indexOf('a=recovery-pause:') === 0) {
          recoveryPause = parseInt(line.substring(14), 10);
        } else if (line.indexOf('a=public-address:client') === 0) {
          clientPublicAddressType = line.substring(24, 27);
          clientPublicAddress = line.substring(28);
        } else if (line.indexOf('a=public-address:server') === 0) {
          serverPublicAddressType = line.substring(24, 27);
          serverPublicAddress = line.substring(28);
        } else if (line.indexOf('a=measurement:procedure') === 0) {
          measurement = measPrmt.fromSDPline(line.substring(24));
        } else if (line.indexOf('a=latency:') === 0) {
          latency = line.substring(10);
        } else if (line.indexOf('a=jitter:') === 0) {
          const aux = line.substring(9).split('/');
          jitterUp = parseInt(aux[0], 10);
          jitterDown = parseInt(aux[1], 10);
        } else if (line.indexOf('a=bandwidth:') === 0) {
          const aux = line.substring(12).split('/');
          bandwidthUp = parseInt(aux[0], 10);
          bandwidthDown = parseInt(aux[1], 10);
        } else if (line.indexOf('a=packetloss:') === 0) {
          const aux = line.substring(13).split('/');
          packetlossUp = parseFloat(aux[0]);
          packetlossDown = parseFloat(aux[1]);
        } else if (line.indexOf('a=flow:app clientListeningPort TCP/') === 0) {
          appClientPorts.TCP = line.substring(35);
        } else if (line.indexOf('a=flow:app clientListeningPort UDP/') === 0) {
          appClientPorts.UDP = line.substring(35);
        } else if (line.indexOf('a=flow:app serverListeningPort TCP/') === 0) {
          appServerPorts.TCP = line.substring(35);
        } else if (line.indexOf('a=flow:app serverListeningPort UDP/') === 0) {
          appServerPorts.UDP = line.substring(35);
        } else if (line.indexOf('a=flow:q4s clientListeningPort TCP/') === 0) {
          q4sClientPorts.TCP = parseInt(line.substring(35));
        } else if (line.indexOf('a=flow:q4s clientListeningPort UDP/') === 0) {
          q4sClientPorts.UDP = parseInt(line.substring(35));
        } else if (line.indexOf('a=flow:q4s serverListeningPort TCP/') === 0) {
          q4sServerPorts.TCP = parseInt(line.substring(35));
        } else if (line.indexOf('a=flow:q4s serverListeningPort UDP/') === 0) {
          q4sServerPorts.UDP = parseInt(line.substring(35));
        }
      } else if (line.indexOf('o=') === 0) {
        SessionId = line.split(' ')[2];
      }
    });
    const addresses = new NetworkParameters(clientPublicAddressType,
        clientPublicAddress, serverPublicAddressType, serverPublicAddress,
        q4sClientPorts, q4sServerPorts, appClientPorts, appServerPorts);
    const quality = new QualityParameters(latency, jitterUp, jitterDown,
        bandwidthUp, bandwidthDown, packetlossUp, packetlossDown);
    return new Session(qosLevelUp, qosLevelDown, alertingMode, alertPause,
        recoveryPause, sessionStates.UNINITIATED, SessionId, addresses,
        quality, measurement);
  }

  /**
   * Returns a promise with the sdp representation of this session
   * @return {string} -  Sdp format of this session.
   */
  toSdp() {
    let sdp = 'o=q4s ' + this.sessionId + ' 2353687637 IN IPx xxx.xxx.xxx.xxx';
    sdp = sdp + 'a=qos-level:' + this.qosLevelUp + '/' +
    this.qosLevelDown + '\r\n';
    if (this.alertingMode === alertTypes.REACTIVE) {
      sdp = sdp + 'a=alerting-mode:Reactive\r\n';
    } else {
      sdp = sdp + 'a=alerting-mode:Q4S-aware-network\r\n';
    }
    sdp = sdp + 'a=alert-pause:' + this.alertPause + '\r\n';
    sdp = sdp + 'a=public-address:client ' + this.addresses.clientAddressType +
     ' ' + this.addresses.clientAddress + '\r\n';
    sdp = sdp + 'a=public-address:server ' + this.addresses.serverAddressType +
     ' ' + this.addresses.serverAddress + '\r\n';
    sdp = sdp + 'a=measurement:procedure ' + this.measurement.toString() +
    '\r\n';
    sdp = sdp + 'a=latency:' + this.quality.latency + '\r\n';
    sdp = sdp + 'a=jitter:' + this.quality.jitterUp + '/' +
    this.quality.jitterDown + '\r\n';
    sdp = sdp + 'a=bandwidth:' + this.quality.bandwidthUp + '/' +
     this.quality.bandwidthDown + '\r\n';
    sdp = sdp + 'a=packetloss:' + this.quality.packetlossUp + '/' +
     this.quality.packetlossDown + '\r\n';
    if (this.addresses.appClientPorts.TCP) {
      sdp = sdp + 'a=flow:app clientListeningPort TCP/'+
      this.addresses.appClientPorts.TCP +'\r\n';
    }
    if (this.addresses.appClientPorts.UDP) {
      sdp = sdp + 'a=flow:app clientListeningPort UDP/'+
      this.addresses.appClientPorts.UDP +'\r\n';
    }
    if (this.addresses.appServerPorts.TCP) {
      sdp = sdp + 'a=flow:app serverListeningPort TCP/'+
      this.addresses.appServerPorts.TCP +'\r\n';
    }
    if (this.addresses.appServerPorts.UDP) {
      sdp = sdp + 'a=flow:app serverListeningPort UDP/'+
      this.addresses.appServerPorts.UDP +'\r\n';
    }
    sdp = sdp + 'a=flow:q4s clientListeningPort TCP/'+
    this.addresses.q4sClientPorts.TCP +'\r\n';
    sdp = sdp + 'a=flow:q4s clientListeningPort UDP/'+
    this.addresses.q4sClientPorts.UDP +'\r\n';
    sdp = sdp + 'a=flow:q4s serverListeningPort TCP/'+
    this.addresses.q4sServerPorts.TCP +'\r\n';
    sdp = sdp + 'a=flow:q4s serverListeningPort UDP/'+
    this.addresses.q4sServerPorts.UDP +'\r\n';
    return sdp;
  }


  static fromClientOps(options) {
    const qosLevelUp = 0;
    const qosLevelDown = 0;
    const alertingMode = alertTypes.REACTIVE;
    const alertPause = 1000;
    const recoveryPause = 1000;
    let latency = 0;
    let jitterUp = 0;
    let jitterDown = 0;
    let bandwidthUp = 0;
    let bandwidthDown = 0;
    let packetlossUp = 0;
    let packetlossDown = 0;
    let q4sClientPorts;
    let appClientPorts;

    if (options.latency) {
      latency = options.latency;
    }
    if (options.jitterUp) {
      jitterUp = options.jitterUp;
    }
    if (options.jitterDown) {
      jitterDown = options.jitterDown;
    }
    if (options.bandwidthUp) {
      bandwidthUp = options.bandwidthUp;
    }
    if (options.bandwidthDown) {
      bandwidthDown = options.bandwidthDown;
    }
    if (options.packetlossUp) {
      packetlossUp = options.packetlossUp;
    }
    if (options.packetlossDown) {
      packetlossDown = options.packetlossDown;
    }
    const quality = new QualityParameters(latency, jitterUp, jitterDown,
        bandwidthUp, bandwidthDown, packetlossUp, packetlossDown);
    if (options.portTCP) {
      q4sClientPorts.TCP = options.portTCP;
    }
    if (options.portUDP) {
      q4sClientPorts.TCP = options.portUDP;
    }
    if (options.appPortsTCP) {
      appClientPorts.TCP = options.appPortsTCP;
    }
    if (options.appPortsUDP) {
      appClientPorts.UDP = options.appPortsUDP;
    }
    const hostData = netwrkPrmt.getMyPublicIp();
    const addresses = new NetworkParameters(hostData.type, hostData.host,
        undefined, undefined, q4sClientPorts, undefined, appClientPorts,
        undefined);

    return new Session(qosLevelUp, qosLevelDown, alertingMode, alertPause,
        recoveryPause, sessionState, undefined, addresses, quality, undefined,
        sessionStates.UNINITIATED);
  }
};


const alertTypes = Object.freeze({
  'Q4SAWARE': 0,
  'REACTIVE': 1,
});

const sessionStates = Object.freeze({
  'UNINITIATED': 0,
  'STABILISHED': 1,
  'STAGE_O': 2,
  'STAGE_1': 3,
  'CONTINUITY': 4,
  'TERMINATION': 5,
});

/**
 * A constant object that exports the two alerting modes that can be possible
 * in a session
 */
module.exports.alertTypes = alertTypes;
module.exports.sessionStates = sessionStates;
module.exports = Session;
