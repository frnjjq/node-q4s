const Measure = require('../lib/measure');

describe('toHeader method', function () {
  test('Generates correctly', function () {
    const solution = 'l=10, j=20, pl=0.5, bw=30';
    const meas = new Measure(10,20,30,0.50);
    const header = meas.toHeader();
    expect(header).toEqual(solution);
  });
  test('Generates correctly with missing parameter', function () {
    const solution = 'l=10, j=20, pl=0.5, bw=';
    const meas = new Measure(10,20,undefined,0.50);
    const header = meas.toHeader();
    expect(header).toEqual(solution);
  }); 
});

describe('fromHeader', function() {
  test('Generates correctly', function() {
    const header = 'l=10, j=20, pl=0.30, bw=40';
    const meas = new Measure();
    meas.fromHeader(header);
    expect(meas.latency).toEqual(10);
    expect(meas.jitter).toEqual(20); 
    expect(meas.packetLoss).toEqual(0.3); 
    expect(meas.bandwidth).toEqual(40);    
  });
});

describe('extractLatency', function() {
  test('Generates correctly latency', function() {
    const now = Date.now();
    const meas = new Measure();
    const sendingData = [
      {seq: 0, time: new Date(now)},
      {seq: 1, time: new Date(now+20)},
      {seq: 2, time: new Date(now+40)},
      {seq: 3, time: new Date(now+60)}
    ];
    const recievedData = [
      {seq: 0, time: new Date(now+5)},
      {seq: 1, time: new Date(now+25)},
      {seq: 2, time: new Date(now+55)},
      {seq: 3, time: new Date(now+75)}
    ];
    meas.extractLatency(sendingData,recievedData);
    expect(meas.latency).toEqual(10);
    expect(meas.packetLoss).toEqual(0);
  });

  test('Generates correctly packet loss', function() {
    const now = Date.now();
    const meas = new Measure();
    const sendingData = [
      {seq: 0, time: new Date(now)},
      {seq: 1, time: new Date(now+20)},
      {seq: 2, time: new Date(now+40)},
      {seq: 3, time: new Date(now+60)}
    ];
    const recievedData = [
      {seq: 0, time: new Date(now+10)},
      {seq: 1, time: new Date(now+25)},
      {seq: 3, time: new Date(now+75)}
    ];
    meas.extractLatency(sendingData,recievedData);
    expect(meas.latency).toEqual(10);
    expect(meas.packetLoss).toEqual(0.25);
  });
});

describe('extractJitter', function() {
  test('Works fine in 0 jitter scenario', function() {
    const now = Date.now();
    const meas = new Measure();
    const recievedReq = [
      {seq: 0, time: new Date(now)},
      {seq: 1, time: new Date(now+5)},
      {seq: 2, time: new Date(now+10)},
      {seq: 3, time: new Date(now+15)},
      {seq: 4, time: new Date(now+20)}
    ];
    meas.extractJitter(recievedReq);
    expect(meas.jitter).toEqual(0);
  });
  test('Works fine', function() {
    const now = Date.now();
    const meas = new Measure();
    const recievedReq = [
      {seq: 0, time: new Date(now)},
      {seq: 1, time: new Date(now+4)},
      {seq: 2, time: new Date(now+8)},
      {seq: 3, time: new Date(now+14)},
      {seq: 4, time: new Date(now+20)}
    ];
    meas.extractJitter(recievedReq);
    expect(meas.jitter).toEqual(1);
  });
});

describe('extractBandwidth', function(){
  test('Works fine in perfect condition', function() {
    const recieved = [0,1,5,4,3,2];
    const meas = new Measure();
    meas.extractBandwidth(recieved, 1000);
    expect(meas.bandwidth).toEqual(1000);
    expect(meas.packetLoss).toEqual(0.0);
  });
  test('Works fine with packet loss', function() {
    const recieved = [0,5,4];
    const meas = new Measure();
    meas.extractBandwidth(recieved, 1000);
    expect(meas.bandwidth).toEqual(500);
    expect(meas.packetLoss).toEqual(0.5);
  });
});