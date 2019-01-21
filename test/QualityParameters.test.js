const QualityParameters = require('../src/QualityParameters.js');


describe('QualityParameters', function () {

  describe('doesMetQuality', function () {

    test('fail due latency too low', function () {
      const qual = new QualityParameters(40,undefined,undefined,undefined,undefined,undefined,undefined); 
      const meas = {
        latency: 50
      };
      expect(qual.doesMetQuality(meas)).not.toBeTruthy();
    });
    test('fail due jitter in the uplink too high', function () {
      const qual = new QualityParameters(undefined,40,undefined,undefined,undefined,undefined,undefined); 
      const meas = {
        jitterUp: 50
      };
      expect(qual.doesMetQuality(meas)).not.toBeTruthy();
    });
    test('fail due jitter in the downlink too high', function () {
      const qual = new QualityParameters(undefined,undefined,40,undefined,undefined,undefined,undefined); 
      const meas = {
        jitterDown: 50
      };
      expect(qual.doesMetQuality(meas)).not.toBeTruthy();
    });
    test('fail due bandwidth in the uplink too low', function () {
      const qual = new QualityParameters(undefined,undefined,undefined,40,undefined,undefined,undefined); 
      const meas = {
        bandwidthUp: 30
      };
      expect(qual.doesMetQuality(meas)).not.toBeTruthy();
    });
    test('fail due bandwidth in the downlink too low', function () {
      const qual = new QualityParameters(undefined,undefined,undefined,undefined,40,undefined,undefined); 
      const meas = {
        bandwidthDown: 30
      };
      expect(qual.doesMetQuality(meas)).not.toBeTruthy();
    });
    test('fail due packetloss in the uplink too low', function () {
      const qual = new QualityParameters(undefined,undefined,undefined,undefined,undefined,0.05,undefined); 
      const meas = {
        packetlossUp: 0.10
      };
      expect(qual.doesMetQuality(meas)).not.toBeTruthy();
    });
    test('fail due packetloss in the downlink too high', function () {
      const qual = new QualityParameters(undefined,undefined,undefined,undefined,undefined,undefined,0.05); 
      const meas = {
        packetlossDown: 0.10
      };
      expect(qual.doesMetQuality(meas)).not.toBeTruthy();
    });
    test('Meet the requirements', function () {
      const qual = new QualityParameters(100,100,100,30,30,0.15,0.15); 
      const meas = {
        latency:50,
        jitterUp:50,
        jitterDown:50,
        bandwidthUp: 50,
        bandwidthDown: 50,
        packetlossUp: 0.10,
        packetlossDown: 0.10
      };
      expect(qual.doesMetQuality(meas)).toBeTruthy();
    });
  });

  describe('updateWithSDP', function () {

    const sdpCorrect =    "v=0\r\n" +
    "o=q4s-UA 53655765 2353687637 IN IP4 192.0.2.33\r\n" +
    "s=Q4S\r\n" +
    "i=Q4S parameters\r\n" +
    "t=0 0\r\n" +
    "a=qos-level:1/2\r\n" +
    "a=alerting-mode: Q4S-aware-network\r\n" +
    "a=alert-pause:5000\r\n" +
    "a=public-address:client IP4 198.51.100.51\r\n" +
    "a=public-address:server IP4 198.51.100.58\r\n" +
    "a=latency:40\r\n" +
    "a=jitter:10/5\r\n" +
    "a=bandwidth:20/6000\r\n" +
    "a=packetloss:0.50/0.40\r\n" +
    "a=flow:app downlink TCP/10000-20000\r\n" +
    "a=flow:app uplink TCP/56000\r\n" +
    "a=flow:q4s downlink UDP/55000\r\n" +
    "a=flow:q4s downlink TCP/55001\r\n" +
    "a=flow:q4s uplink UDP/56000\r\n" +
    "a=flow:q4s uplink TCP/56001\r\n" +
    "a=measurement:procedure default(50/50,50/50,5000,256/256,256/256)\r\n" +
    "a=measurement:latency 30\r\n" +
    "a=measurement:jitter 6/4\r\n" +
    "a=measurement:bandwidth 200/4000\r\n" +
    "a=measurement:packetloss 0.20/0.33";

    test('SDP updates the requirements', function () {
      const sdp = "a=latency:40\r\n" +
      "a=jitter:10/5\r\n" +
      "a=bandwidth:20/6000\r\n" +
      "a=packetloss:0.50/0.40\r\n";

      const qual = new QualityParameters(100,100,100,30,30,0.15,0.15); 
      qual.updateWithSDP(sdp);
      qual
      expect(qual.latency).toEqual(40);
      expect(qual.jitterUp).toEqual(10);
      expect(qual.jitterDown).toEqual(5);
      expect(qual.bandwidthUp).toEqual(20);
      expect(qual.bandwidthDown).toEqual(6000);
      expect(qual.packetlossUp).toEqual(0.5);
      expect(qual.packetlossDown).toEqual(0.4);
    });
    test('SDP with wrong requirements', function () {
      const sdp = "a=latency:ui\r\n" +
      "a=jitter:uaa/bin\r\n" +
      "a=bandwidth:bam/daba\r\n" +
      "a=packetloss:lim/bo\r\n";
      
      const qual = new QualityParameters(100,100,100,30,30,0.15,0.15); 
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
  describe ("toSDPAttr", function () {
    test("All OK", function () {
      const qual = new QualityParameters(100,100,100,30,30,0.15,0.15); 
      const expected = "a=latency:100\r\n" +
      "a=jitter:100/100\r\n" +
      "a=bandwidth:30/30\r\n" +
      "a=packetloss:0.15/0.15\r\n";
      expect(qual.toSDPAttr()).toEqual(expected);
    });
  });
});