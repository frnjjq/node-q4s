const DefaultProcedure = require('../lib/default-procedure');

describe('updateFromAttr', function () {
  test('Correct generation', function () {
    const reference = 'a=measurement:procedure default(50/50,75/75,5000,40/80,100/256)';
    const meas = new DefaultProcedure();
    meas.updateFromAttr(reference);
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
});
describe('toString', function () {
  test('Correct Generation', function () {
    const solution = 'default(50/50,75/75,5000,40/80,100/256)';
    const meas = new DefaultProcedure(50, 50, 5000, 75, 75, 40, 80, 100, 256);
    expect(meas.toAttr()).toEqual(solution);
  });
});

