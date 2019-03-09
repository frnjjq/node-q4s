/**
 * Session manipulation class. Implements  methods to build sessions from sdp
 * and to generate new sdp.
 * @module Session
 */

const DefaultProcedure = require('./default-procedure');
const Addresses = require('./addresses');
const MeasurementSet = require('./measurement-set');
const util = require('./util');


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
   * @param {Number} recoveryPause - Number of miliseconds to wait.
   * @param {Number} state - The State of the current session
   * @param {Number} id - The session Id of this session.
   * @param {Addresses} addresses - The IP version of the client
   * address.
   * @param {MeasurementSet} quality - The client IP address.
   * @param {DefaultProcedure} measurement - The client IP address.
   */
  constructor(qosLevelUp, qosLevelDown, alertingMode, alertPause,
      recoveryPause, state, id, addresses, quality,
      measurement) {
    this.qosLevelUp = qosLevelUp;
    this.qosLevelDown = qosLevelDown;
    this.alertingMode = alertingMode;
    this.alertPause = alertPause;
    this.recoveryPause = recoveryPause;
    this.state = state;
    if (addresses) {
      this.addresses = addresses;
    } else {
      this.addresses = new Addresses();
    }
    if (quality) {
      this.quality = quality;
    } else {
      this.quality = new MeasurementSet();
    }
    if (measurement) {
      this.measurement = measurement;
    } else {
      this.measurement = new DefaultProcedure();
    }
    this.id = id;
  }
  /**
   * Factory static method to generate a new session from an SDP.
   * @param {string} sdp - The sdp message to generate a new session.
   */
  updateWithSDP(sdp) {
    const lines = sdp.split('\r\n');
    lines.forEach((line) => {
      if (line.indexOf('a=') === 0) {
        if (line.indexOf('a=qos-level:') === 0) {
          const aux = line.substring(12).split('/');
          this.qosLevelUp = parseInt(aux[0], 10);
          this.qosLevelDown = parseInt(aux[1], 10);
        } else if (line.indexOf('a=alerting-mode:') === 0) {
          const aux = line.substring(16);
          if (aux.localeCompare('Q4S-aware-network') === 0) {
            this.alertingMode = ALERT_TYP.Q4SAWARE;
          }
        } else if (line.indexOf('a=alert-pause:') === 0) {
          this.alertPause = parseInt(line.substring(14), 10);
        } else if (line.indexOf('a=recovery-pause:') === 0) {
          this.recoveryPause = parseInt(line.substring(14), 10);
        } else if (line.indexOf('a=public-address') === 0) {
          this.addresses.updateFromSDP(line);
        } else if (line.indexOf('a=measurement:procedure') === 0) {
          this.measurement = new DefaultProcedure();
          this.measurement.updateFromAttr(line.substring(24));
        } else if (line.indexOf('a=latency:') === 0) {
          this.quality.updateWithSDP(line);
        } else if (line.indexOf('a=jitter:') === 0) {
          this.quality.updateWithSDP(line);
        } else if (line.indexOf('a=bandwidth:') === 0) {
          this.quality.updateWithSDP(line);
        } else if (line.indexOf('a=packetloss:') === 0) {
          this.quality.updateWithSDP(line);
        } else if (line.indexOf('a=flow') === 0) {
          this.addresses.updateFromSDP(line);
        }
      } else if (line.indexOf('o=') === 0) {
        this.id = line.split(' ')[1];
      }
    });
  }

  /**
   * Returns a promise with the sdp representation of this session
   * @return {string} -  Sdp format of this session.
   */
  toSdp() {
    let sdp = 'o=q4s ' + this.id + ' 2353687637 IN IPx xxx.xxx.xxx.xxx\r\n';
    sdp = sdp + 'a=qos-level:' + this.qosLevelUp + '/' +
      this.qosLevelDown + '\r\n';
    if (this.alertingMode === REACTIVE) {
      sdp = sdp + 'a=alerting-mode:Reactive\r\n';
    } else {
      sdp = sdp + 'a=alerting-mode:Q4S-aware-network\r\n';
    }
    sdp = sdp + 'a=alert-pause:' + this.alertPause + '\r\n';
    sdp = sdp + this.addresses.ipToSdp();
    sdp = sdp + 'a=measurement:procedure ' + this.measurement.toAttr() +
      '\r\n';
    sdp = sdp + this.quality.toSDPAttr();
    sdp = sdp + this.addresses.portToSDP();
    return sdp;
  }

  /**
   * Creates a session from the options passed-
   * @argument {Object} options - Options
   * @return {Session} -  A new session
   */
  static async fromClientOps(options) {
    const qosLevelUp = 0;
    const qosLevelDown = 0;
    const alertingMode = REACTIVE;
    const alertPause = 1000;
    const recoveryPause = 1000;
    let latency = 0;
    let jitterUp = 0;
    let jitterDown = 0;
    let bandwidthUp = 0;
    let bandwidthDown = 0;
    let packetlossUp = 0;
    let packetlossDown = 0;
    const q4sClientPorts = {};
    const appClientPorts = {};

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
    const quality = new MeasurementSet(latency, jitterUp, jitterDown,
        bandwidthUp, bandwidthDown, packetlossUp, packetlossDown);
    if (options.portTCP) {
      q4sClientPorts.TCP = options.portTCP;
    }
    if (options.portUDP) {
      q4sClientPorts.UDP = options.portUDP;
    }
    if (options.appPortsTCP) {
      appClientPorts.TCP = options.appPortsTCP;
    }
    if (options.appPortsUDP) {
      appClientPorts.UDP = options.appPortsUDP;
    }
    let host;
    if (options.ip) {
      if (options.ip === 'private') {
        host = util.getPrivateIp();
      } else if (options.ip === 'public') {
        host = await util.getPublicIp();
      } else {
        host = options.ip;
      }
    } else {
      host = await util.getPublicIp();
    }
    const addresses = new Addresses(4, host,
        undefined, undefined, q4sClientPorts, undefined, appClientPorts,
        undefined);

    const measurement = new DefaultProcedure();
    return new Session(qosLevelUp, qosLevelDown, alertingMode, alertPause,
        recoveryPause, UNINITIATED, undefined, addresses, quality, measurement);
  }

  /**
   * Generates a session with an sdp and serveroptions.
   * @argument {String} sdp
   * @argument {Object} serverOps
   * @return {Session} -  A new session
   */
  static async serverGenerate(sdp, serverOps) {
    const ses = new Session();
    ses.updateWithSDP(sdp);
    ses.measurement.fromOptions(serverOps.procedure);
    ses.qosLevelUp = 0;
    ses.qosLevelDown = 0;
    ses.alertingMode = serverOps.alertingMode;
    ses.alertPause = serverOps.alertPause;
    ses.recoveryPause = serverOps.recoveryPause;
    ses.state = UNINITIATED;
    let host;
    if (serverOps.ip) {
      if (serverOps.ip === 'private') {
        host = util.getPrivateIp();
      } else if (serverOps.ip === 'public') {
        host = await util.getPublicIp();
      } else {
        host = serverOps.ip;
      }
    } else {
      host = await util.getPublicIp();
    }
    ses.addresses.serverAddressType = 4;
    ses.addresses.serverAddress = host;
    ses.addresses.q4sServerPorts.TCP = serverOps.portTCP;
    ses.addresses.q4sServerPorts.UDP = serverOps.portUDP;
    ses.addresses.appServerPorts.TCP = serverOps.appPortsTCP;
    ses.addresses.appServerPorts.UDP = serverOps.appPortsUDP;
    return ses;
  }
}

const Q4SAWARE = 0;
const REACTIVE = 1;
const STAGE_0 = 0;
const STAGE_1 = 1;
const CONTINUITY = 2;
const HANDSHAKE = 3;
const TERMINATION = 4;
const UNINITIATED = 5;


/**
 * A constant object that exports the two alerting modes that can be possible
 * in a session
 */
module.exports = Session;
module.exports.Q4SAWARE = Q4SAWARE;
module.exports.REACTIVE = REACTIVE;
module.exports.STAGE_0 = STAGE_0;
module.exports.STAGE_1 = STAGE_1;
module.exports.CONTINUITY = CONTINUITY;
module.exports.HANDSHAKE = HANDSHAKE;
module.exports.TERMINATION = TERMINATION;
module.exports.UNINITIATED = UNINITIATED;
