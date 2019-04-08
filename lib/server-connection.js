/**
 * Contains the implementation of ServerNetwork
 * @module server-connection
 * @license Apache-2.0
 */
const EventEmitter = require('events');

const Pinger = require('./pinger');
const Bandwidther = require('./bandwidther');
const ContinuityPinger = require('./continuity-pinger');
const Response = require('./response');
const Request = require('./request');
const MeasurementSet = require('./measurement-set');

/**
 * Server conection class
 */
class ServerConnection extends EventEmitter {
  /**
   * Handler for request coming through TCP.
   * @param {Session} session - Session options for the curretn session
   */
  constructor(session) {
    super();
    this.state = HANDSHAKE_DONE;
    this.TCP = undefined;
    this.session = session;
    this.pinger = undefined;
    this.bander = undefined;
    this.conPinger = undefined;
  }
  /**
   * Handler for request coming through TCP.
   * @param {Request} req - Request
   */
  async reqTCPHandler(req) {
    if (this.state === HANDSHAKE_DONE &&
      req.method === 'READY' &&
      req.headers.Stage === '0') {
      this.pinger = Pinger.genServer(this.session.id,
          this.session.measurement.negotiationPingUp, 255);
      this.state = MEASURING_PINGER;
      this.pinger.on('message', (mess) => this.emit('udp', mess));
      this.pinger.measure()
          .then((measure) => {
            const set = new MeasurementSet();
            set.introduceClientMeasures(measure.remote);
            set.introduceServerMeasures(measure.local);
            const res = this.measuring(set);
            this.emit('measure', set);
            if (res) {
              this.emit('tcp', res);
            }
          })
          .catch((err) => {});
      this.emit('tcp', Response.genRes(200, undefined, undefined));
    } else if (this.state === PASS_READY_0 &&
      req.method === 'READY' &&
      req.headers.Stage === '1') {
      this.bander = Bandwidther.genServer(this.session.id,
          this.session.quality.bandwidthDown,
          this.session.measurement.negotiationBandwidth);
      this.state = MEASURING_BANDWIDTH;
      this.bander.on('message', (mess) => this.emit('udp', mess));
      this.bander.measure()
          .then((measure) => {
            const set = new MeasurementSet();
            set.introduceClientMeasures(measure.remote);
            set.introduceServerMeasures(measure.local);
            this.emit('measure', set);
            const res = this.measuring(set);
            if (res) {
              this.emit('tcp', res);
            }
          });
      this.emit('tcp', Response.genRes(200, undefined, undefined));
    } else if (this.state === PASS_READY_1 &&
      req.method === 'READY' &&
      req.headers.Stage === '2') {
      this.conPinger = ContinuityPinger.genServer(this.session.id,
          this.session.measurement.continuityPingDown,
          this.session.measurement.windowSizeUp,
          this.session.measurement.windowSizePctLssUp);
      this.state = MEASURING_CONTINUITY;
      this.conPinger.on('message', (mess) => this.emit('udp', mess));
      this.conPinger.on('measure', (measure) => {
        const set = new MeasurementSet();
        set.introduceClientMeasures(measure.remote);
        set.introduceServerMeasures(measure.local);
        this.emit('measure', set);
        const res = this.measuring(set);
        if (res) {
          this.emit('tcp', res);
        }
      });
      this.conPinger.measure();
      this.emit('tcp', Response.genRes(200, undefined, undefined));
    } else if (req.method === 'CANCEL') {
      this.emit('tcp', Request.genReq('CANCEL'));
      this.emit('finished');
    }
  }
  /**
   * Handler for Response coming through TCP.
   * @param {Response} res - Response
   */
  async resTCPHandler(res) {
    // Should not happen
  }
  /**
   * Handler for Request coming through UDP.
   * @param {Request} req - Request
   * @param {Number} time
   */
  async reqUDPHandler(req, time) {
    if (this.state === MEASURING_PINGER) {
      this.pinger.req(req, time);
    } else if (this.state === MEASURING_BANDWIDTH) {
      this.bander.req(req, time);
    } else if (this.state === MEASURING_CONTINUITY) {
      this.conPinger.req(req, time);
    }
  }
  /**
   * Handler for Response coming through UDP.
   * @param {Response} res - Response
   * @param {Number} time
   */
  async resUDPHandler(res, time) {
    if (typeof this.pinger !== 'undefined') {
      this.pinger.res(res, time);
    } else if (typeof this.bander !== 'undefined') {
      this.bander.res(res, time);
    } else if (typeof this.conPinger !== 'undefined') {
      this.conPinger.res(res, time);
    }
  }
  /**
   * Checks a generated measurement against the session in order to
   * produce alerts, recoveries and mvoe states depending on the result.
   * @param {MeasurementSet} set - Request
   * @return {Request} - Alert of response to send back
   */
  measuring(set) {
    let ret = undefined;
    if (this.session.quality.doesMetQuality(set)) {
      if (this.session.alert.canRecovery()) {
        this.session.alert.sentRecovery();
        ret = Request.genReq('RECOVERY-Q4S', 'example.com');
      }
      if (this.state < MEASURING_CONTINUITY) {
        this.state++;
      }
    } else {
      if (this.session.alert.canAlert()) {
        this.session.alert.sentAlert();
        ret = Request.genReq('ALERT-Q4S', '');
      }
      if (this.state < MEASURING_CONTINUITY) {
        this.state = HANDSHAKE_DONE;
      }
    }
    return ret;
  }
  /**
   * Stop any ongoing measurement
   */
  cancel() {
    if (this.state == MEASURING_PINGER) {
      this.pinger.cancel();
    } else if (this.tate === MEASURING_BANDWIDTH) {
      this.bander.cancel();
    } else if (this.tate === MEASURING_CONTINUITY) {
      this.conPinger.cancel();
    }
  }
}

HANDSHAKE_DONE = 0;
MEASURING_PINGER = 1;
PASS_READY_0 = 2;
MEASURING_BANDWIDTH = 3;
PASS_READY_1 = 4;
MEASURING_CONTINUITY = 5;

module.exports = ServerConnection;
