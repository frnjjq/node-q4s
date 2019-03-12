const Bandwidther = require('../lib/bandwidther');

describe.skip('constructor', function () {
  test(' Builds required timers 8kbps', function () {
    // 8kbps -> 1kBps -> 1 msge per second
    const band = new Bandwidther(0, undefined, 8, 10, true);
    expect(band.timers).toEqual([{ ms: 1000, times: 1 }]);
  });

  test(' Builds required timers 10kbps', function () {
    // 10kbps -> 1.25kBps -> 1,25 msge per second
    const band = new Bandwidther(0, undefined, 10, 10, true);
    expect(band.timers).toEqual([
      { ms: 800, times: 1 }
    ]);
  });

  test(' Builds required timers 17Mbps', function () {
    // 10kbps -> 1.25kBps -> 1,25 msge per second
    const band = new Bandwidther(0, undefined, 17000, 10, true);
    expect(band.timers).toEqual([
      { ms: 1, times: 2 },
      { ms: 8, times: 1 }
    ]);
  });
});