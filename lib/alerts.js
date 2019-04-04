/**
 * Module which implements the class Alerts
 * @module alerts
 */

/** Alerts Class*/
class Alerts {
  /**
   * Constructor for the QualityParameters class. Does not validate input data
   * coherence.
   * @param {Object} options - Options for the alert.
   */
  constructor(options = {}) {
    if (typeof options.alertPause === 'number') {
      this.alertPause = options.alertPause;
    } else {
      this.alertPause = 100;
    }
    if (typeof options.recoveryPause === 'number') {
      this.recoveryPause = options.recoveryPause;
    } else {
      this.recoveryPause = 100;
    }
    if (typeof options.qosUp === 'number') {
      this.qosUp = options.qosUp;
    } else {
      this.qosUp = 0;
    }
    if (typeof options.qosDown === 'number') {
      this.qosDown = options.qosDown;
    } else {
      this.qosDown = 0;
    }
    if (typeof options.alertingMode === 'number') {
      this.alertingMode = options.alertingMode;
    } else {
      this.alertingMode = REACTIVE;
    }

    this.lastAlert = 0;
    this.lastRecovery = 0;
  }
  /**
   * Checks if twith the current alert options can be an alert.
   * @return {Boolean}
   */
  canAlert() {
    const cond1 = Date.now() > this.lastAlert + this.alertPause;
    const cond2 = this.qosUp < 8;
    const cond3 = this.qosDown < 8;
    return cond1 && cond2 && cond3;
  }
  /**
   * Checks if twith the current recovery options can be an alert.
   * @return {Boolean}
   */
  canRecovery() {
    const cond1 = Date.now() > this.lastRecovery + this.recoveryPause;
    const cond2 = this.qosUp > 0;
    const cond3 = this.qosDown > 0;
    return cond1 && cond2 && cond3;
  }
  /**
   * Inform to the object that an alert were sent. This should be called
   * right after checking that can actually be an alert.
   */
  sentAlert() {
    this.lastAlert = Date.now();
    this.qosLevelUp++;
    this.qosLevelDown++;
  }
  /**
   * Inform to the object that a recovery were sent. This should be called
   * right after checking that can actually be a recovery.
   */
  sentRecovery() {
    this.lastRecovery = Date.now();
    this.qosUp--;
    this.qosDown--;
  }
  /**
   * return the sdp attributes format of the infomration contained in this
   * object
   * @return {String}
   */
  toSdp() {
    let sdp = '';

    sdp = sdp + 'a=qos-level:' + this.qosLevelUp + '/' +
      this.qosLevelDown + '\r\n';
    if (this.alertingMode === REACTIVE) {
      sdp = sdp + 'a=alerting-mode:Reactive\r\n';
    } else {
      sdp = sdp + 'a=alerting-mode:Q4S-aware-network\r\n';
    }
    sdp = sdp + 'a=alert-pause:' + this.alertPause + '\r\n';
    sdp = sdp + 'a=recovery-pause:' + this.recoveryPause + '\r\n';

    return sdp;
  }
  /**
   * Update thr information contained in thid oject with an sdp string.
   * @param {String} sdp - sdp containing the new parameters to use.
   */
  updateFromSDP(sdp) {
    const lines = sdp.split('\r\n');
    lines.forEach((line) => {
      if (line.indexOf('a=qos-level:') === 0) {
        const aux = line.substring(12).split('/');
        this.qosUp = parseInt(aux[0], 10);
        this.qosDown = parseInt(aux[1], 10);
      } else if (line.indexOf('a=alerting-mode:') === 0) {
        const aux = line.substring(16);
        if (aux.localeCompare('Q4S-aware-network') === 0) {
          this.alertingMode = Q4SAWARE;
        }
        if (aux.localeCompare('reactive') === 0) {
          this.alertingMode = REACTIVE;
        }
      } else if (line.indexOf('a=alert-pause:') === 0) {
        this.alertPause = parseInt(line.substring(14), 10);
      } else if (line.indexOf('a=recovery-pause:') === 0) {
        this.recoveryPause = parseInt(line.substring(14), 10);
      }
    });
  }
}
const Q4SAWARE = 0;
const REACTIVE = 1;

module.exports = Alerts;
