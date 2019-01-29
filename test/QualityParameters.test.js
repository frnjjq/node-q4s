const QualityParameters = require('../src/QualityParameters.js');


describe('QualityParameters', function() {
  describe('doesMetQuality', function() {
    test('fail due latency too low', function() {
      const qual = new QualityParameters(40, undefined, undefined, undefined, undefined, undefined, undefined);
      const meas = {
        latency: 50,
      };
      expect(qual.doesMetQuality(meas)).not.toBeTruthy();
    });
    test('fail due jitter in the uplink too high', function() {
      const qual = new QualityParameters(undefined, 40, undefined, undefined, undefined, undefined, undefined);
      const meas = {
        jitterUp: 50,
      };
      expect(qual.doesMetQuality(meas)).not.toBeTruthy();
    });
    test('fail due jitter in the downlink too high', function() {
      const qual = new QualityParameters(undefined, undefined, 40, undefined, undefined, undefined, undefined);
      const meas = {
        jitterDown: 50,
      };
      expect(qual.doesMetQuality(meas)).not.toBeTruthy();
    });
    test('fail due bandwidth in the uplink too low', function() {
      const qual = new QualityParameters(undefined, undefined, undefined, 40, undefined, undefined, undefined);
      const meas = {
        bandwidthUp: 30,
      };
      expect(qual.doesMetQuality(meas)).not.toBeTruthy();
    });
    test('fail due bandwidth in the downlink too low', function() {
      const qual = new QualityParameters(undefined, undefined, undefined, undefined, 40, undefined, undefined);
      const meas = {
        bandwidthDown: 30,
      };
      expect(qual.doesMetQuality(meas)).not.toBeTruthy();
    });
    test('fail due packetloss in the uplink too low', function() {
      const qual = new QualityParameters(undefined, undefined, undefined, undefined, undefined, 0.05, undefined);
      const meas = {
        packetlossUp: 0.10,
      };
      expect(qual.doesMetQuality(meas)).not.toBeTruthy();
    });
    test('fail due packetloss in the downlink too high', function() {
      const qual = new QualityParameters(undefined, undefined, undefined, undefined, undefined, undefined, 0.05);
      const meas = {
        packetlossDown: 0.10,
      };
      expect(qual.doesMetQuality(meas)).not.toBeTruthy();
    });
    test('Meet the requirements', function() {
      const qual = new QualityParameters(100, 100, 100, 30, 30, 0.15, 0.15);
      const meas = {
        latency: 50,
        jitterUp: 50,
        jitterDown: 50,
        bandwidthUp: 50,
        bandwidthDown: 50,
        packetlossUp: 0.10,
        packetlossDown: 0.10,
      };
      expect(qual.doesMetQuality(meas)).toBeTruthy();
    });
  });

  describe('updateWithSDP', function() {
    test('SDP updates the requirements', function() {
      const sdp = 'a=latency:40\r\n' +
      'a=jitter:10/5\r\n' +
      'a=bandwidth:20/6000\r\n' +
      'a=packetloss:0.50/0.40\r\n';

      const qual = new QualityParameters(100, 100, 100, 30, 30, 0.15, 0.15);
      qual.updateWithSDP(sdp);
      qual;
      expect(qual.latency).toEqual(40);
      expect(qual.jitterUp).toEqual(10);
      expect(qual.jitterDown).toEqual(5);
      expect(qual.bandwidthUp).toEqual(20);
      expect(qual.bandwidthDown).toEqual(6000);
      expect(qual.packetlossUp).toEqual(0.5);
      expect(qual.packetlossDown).toEqual(0.4);
    });
    test('SDP with wrong requirements', function() {
      const sdp = 'a=latency:ui\r\n' +
      'a=jitter:uaa/bin\r\n' +
      'a=bandwidth:bam/daba\r\n' +
      'a=packetloss:lim/bo\r\n';

      const qual = new QualityParameters(100, 100, 100, 30, 30, 0.15, 0.15);
      qual.updateWithSDP(sdp);
      expect(qual.latency).toEqual(100);
      expect(qual.jitterUp).toEqual(100);
      expect(qual.jitterDown).toEqual(100);
      expect(qual.bandwidthUp).toEqual(30);
      expect(qual.bandwidthDown).toEqual(30);
      expect(qual.packetlossUp).toEqual(0.15);
      expect(qual.packetlossDown).toEqual(0.15);
    });
  });
  describe('toSDPAttr', function() {
    test('All OK', function() {
      const qual = new QualityParameters(100, 100, 100, 30, 30, 0.15, 0.15);
      const expected = 'a=latency:100\r\n' +
      'a=jitter:100/100\r\n' +
      'a=bandwidth:30/30\r\n' +
      'a=packetloss:0.15/0.15\r\n';
      expect(qual.toSDPAttr()).toEqual(expected);
    });
  });
});
