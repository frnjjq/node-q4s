const MeasurementProcedure = require('../src/MeasurementProcedure.js');

describe('MeasurementProcedure', function () {

  describe('fromString', function () {

    test('Correct generation', function () {
      let str = "a=measurement:procedure default(50/50,75/75,5000,40/80,100/256)";
      const meas = MeasurementProcedure.fromString(str);
      expect(meas.negotiationPingUp).toEqual(50);
      expect(meas.negotiationPingDown).toEqual(50);
      expect(meas.negotiationBandwidth).toEqual(5000);
      expect(meas.continuityPingUp).toEqual(75);
      expect(meas.continuityPingDown).toEqual(75);
      expect(meas.windowSizeUp).toEqual(40);
      expect(meas.windowSizeDown).toEqual(80);
      expect(meas.windowSizePctLssUp).toEqual(100);
      expect(meas.windowSizePctLssDown).toEqual(256);
    });

    test.skip("Does not like wrong input", function() {});
  });
  describe("toString", function () {
    test("Todo Ok", function () {
      let str = "a=measurement:procedure default(50/50,75/75,5000,40/80,100/256)";
      const meas = new MeasurementProcedure(50, 50, 5000, 75, 75, 40, 80, 100, 256);
      expect(meas.toString()).toEqual(str);
    });
  });

});