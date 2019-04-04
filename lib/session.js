/**
 * Session manipulation class. Implements  methods to build sessions from sdp
 * and to generate new sdp.
 * @module Session
 */

const DefaultProcedure = require('./default-procedure');
const Addresses = require('./addresses');
const Alerts = require('./alerts');
const MeasurementSet = require('./measurement-set');
const util = require('./util');


/** Session class. Options to build , generate and parse sessions*/
class Session {
  /**
   * Constructor for the ReqQ4S class. Does not validate input data coherence.
   * @param {Alerts} alert - The alert options of the session
   * @param {Number} id - The session Id of this session.
   * @param {Addresses} addresses - The IP version of the client
   * address.
   * @param {MeasurementSet} quality - The client IP address.
   * @param {DefaultProcedure} measurement - The client IP address.
   */
  constructor(alert, id, addresses, quality,
      measurement) {
    if (alert) {
      this.alert = alert;
    } else {
      this.alert = new Alerts();
    }
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
          this.alert.updateFromSDP(line);
        } else if (line.indexOf('a=alerting-mode:') === 0) {
          this.alert.updateFromSDP(line);
        } else if (line.indexOf('a=alert-pause:') === 0) {
          this.alert.updateFromSDP(line);
        } else if (line.indexOf('a=recovery-pause:') === 0) {
          this.alert.updateFromSDP(line);
        } else if (line.indexOf('a=public-address') === 0) {
          this.addresses.updateFromSDP(line);
        } else if (line.indexOf('a=measurement:procedure') === 0) {
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
    sdp = sdp + this.alert.toSdp();
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
    const alerting = new Alerts();
    return new Session(alerting, undefined, addresses, quality, measurement);
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
    ses.alert.alertingMode = serverOps.alertingMode;
    ses.alert.alertPause = serverOps.alertPause;
    ses.alert.recoveryPause = serverOps.recoveryPause;
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

/**
 * A constant object that exports the two alerting modes that can be possible
 * in a session
 */
module.exports = Session;
