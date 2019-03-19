const Measure = require('../lib/measure');

describe('toHeader method', function () {
  test('Generates correctly', function () {
    const solution = 'l=10, j=20, pl=0.5, bw=30';
    const meas = new Measure(10, 20, 30, 0.50);
    const header = meas.toHeader();
    expect(header).toEqual(solution);
  });
  test('Generates correctly with missing parameter', function () {
    const solution = 'l=10, j=20, pl=0.5, bw=';
    const meas = new Measure(10, 20, undefined, 0.50);
    const header = meas.toHeader();
    expect(header).toEqual(solution);
  });
});

describe('fromHeader', function () {
  test('Generates correctly', function () {
    const header = 'l=10, j=20, pl=0.30, bw=40';
    const meas = new Measure();
    meas.fromHeader(header);
    expect(meas.latency).toEqual(10);
    expect(meas.jitter).toEqual(20);
    expect(meas.packetLoss).toEqual(0.3);
    expect(meas.bandwidth).toEqual(40);
  });
});

describe('extractFromPinger', function () {
  test('Works fine', function (done) {
    const times = [
      { send: 0, recieve: 1 },
      { send: 2, recieve: 4 },
      { send: 4, recieve: 7 },
      { send: 7, recieve: 11 },
      { send: 11 },
      { send: 20 },
    ];
    const meas = new Measure();
    meas.extractFromPinger(times)
      .then(() => {
        expect(meas.latency).toEqual(2);
        expect(meas.jitter).toEqual(1);
        done();
      });
  });
});

describe('extractBandwidth', function () {
  test('Works fine in perfect condition', function () {
    const recieved = [0, 1, 5, 4, 3, 2];
    const meas = new Measure();
    meas.extractBandwidth(recieved, 1000);
    expect(meas.bandwidth).toEqual(1000);
    expect(meas.packetLoss).toEqual(0.0);
  });
  test('Works fine with packet loss', function () {
    const recieved = [0, 5, 4];
    const meas = new Measure();
    meas.extractBandwidth(recieved, 1000);
    expect(meas.bandwidth).toEqual(500);
    expect(meas.packetLoss).toEqual(0.5);
  });
});