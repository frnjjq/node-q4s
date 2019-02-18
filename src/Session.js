/**
 * Session manipulation class. Implements  methods to build sessions from sdp
 * and to generate new sdp.
 * @module Session
 */

const MeasurementProcedure = require('./MeasurementProcedure');
const NetworkParameters = require('./NetworkParameters');
const QualityParameters = require('./QualityParameters');
const UtilQ4S = require('./Util')

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
   * @param {number} state - The State of the current session
   * @param {number} id - The session Id of this session.
   * @param {NetworkParameters} addresses - The IP version of the client
   * address.
   * @param {QualityParameters} quality - The client IP address.
   * @param {MeasurementProcedure} procedure - The client IP address.
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
    this.addresses = addresses;
    this.quality = quality;
    this.measurement = measurement;
    this.id = id;
  }
  /**
   * Factory static method to generate a new session from an SDP.
   * @param {string} sdp - The sdp message to generate a new session.
   * @return {Session} Return the generated Session.
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
          this.adresses.updateWithSDP(line);
        } else if (line.indexOf('a=measurement:procedure') === 0) {
          this.measurement = MeasurementProcedure.fromSDPline(line.substring(24));
        } else if (line.indexOf('a=latency:') === 0) {
          this.quality.updateWithSDP(line);
        } else if (line.indexOf('a=jitter:') === 0) {
          this.quality.updateWithSDP(line);
        } else if (line.indexOf('a=bandwidth:') === 0) {
          this.quality.updateWithSDP(line);
        } else if (line.indexOf('a=packetloss:') === 0) {
          this.quality.updateWithSDP(line);
        } else if (line.indexOf('a=flow') === 0) {
          this.adresses.updateWithSDP(line);
        }
      } else if (line.indexOf('o=') === 0) {
        this.id = line.split(' ')[2];
      }
    });
  }

  /**
   * Returns a promise with the sdp representation of this session
   * @return {string} -  Sdp format of this session.
   */
  toSdp() {
    let sdp = 'o=q4s ' + this.sessionId + ' 2353687637 IN IPx xxx.xxx.xxx.xxx\r\n';
    sdp = sdp + 'a=qos-level:' + this.qosLevelUp + '/' +
    this.qosLevelDown + '\r\n';
    if (this.alertingMode === ALERT_TYP.REACTIVE) {
      sdp = sdp + 'a=alerting-mode:Reactive\r\n';
    } else {
      sdp = sdp + 'a=alerting-mode:Q4S-aware-network\r\n';
    }
    sdp = sdp + 'a=alert-pause:' + this.alertPause + '\r\n';
    sdp = sdp + this.addresses.addresesToSDP();
    sdp = sdp + 'a=measurement:procedure ' + this.measurement.toString() +
    '\r\n';
    sdp = sdp + this.quality.toSDPAttr();
    sdp = sdp + this.addresses.flowsToSDP();
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
    const alertingMode = ALERT_TYP.REACTIVE;
    const alertPause = 1000;
    const recoveryPause = 1000;
    let latency = 0;
    let jitterUp = 0;
    let jitterDown = 0;
    let bandwidthUp = 0;
    let bandwidthDown = 0;
    let packetlossUp = 0;
    let packetlossDown = 0;
    let q4sClientPorts = {};
    let appClientPorts = {};

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
    try {
      const hostData = await UtilQ4S.getPublicIp();

      const addresses = new NetworkParameters(hostData.type, hostData.host,
        undefined, undefined, q4sClientPorts, undefined, appClientPorts,
        undefined);
      
        const measurement = new MeasurementProcedure();
      return new Session(qosLevelUp, qosLevelDown, alertingMode, alertPause,
        recoveryPause, STATES.UNINITIATED, undefined, addresses, quality, measurement);

    } catch(err) {
      console.log(err);
      return;
    }

  }
};


const ALERT_TYP = Object.freeze({
  'Q4SAWARE': 0,
  'REACTIVE': 1,
});

const STATES = Object.freeze({
  'STAGE_O': 0,
  'STAGE_1': 1,
  'CONTINUITY': 2,
  'HANDSHAKE': 3,
  'TERMINATION': 4,
  'UNINITIATED': 5
});

/**
 * A constant object that exports the two alerting modes that can be possible
 * in a session
 */
module.exports = Session;
module.exports.ALERT_TYP = ALERT_TYP;
module.exports.STATES = STATES;

