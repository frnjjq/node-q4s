const Addresses = require('../lib/addresses');

describe('updateFromSDP', function () {
  test.skip(' SDP forms the object', function () {
    const sdpCorrect = 'v=0\r\n' +
      'o=q4s-UA 53655765 2353687637 IN IP4 192.0.2.33\r\n' +
      's=Q4S\r\n' +
      'i=Q4S parameters\r\n' +
      't=0 0\r\n' +
      'a=qos-level:0/0\r\n' +
      'a=alerting-mode:Reactive\r\n' +
      'a=alert-pause:5000\r\n' +
      'a=public-address:client IP4 198.51.100.51\r\n' +
      'a=public-address:server IP4 198.51.100.58\r\n' +
      'a=measurement:procedure default(50/50,75/75,5000,40/80,100/256)\r\n' +
      'a=latency:40\r\n' +
      'a=jitter:10/10\r\n' +
      'a=bandwidth:20/6000\r\n' +
      'a=packetloss:0.50/0.50\r\n' +
      'a=flow:app clientListeningPort TCP/10000-20000\r\n' +
      'a=flow:app clientListeningPort UDP/15000-18000\r\n' +
      'a=flow:app serverListeningPort TCP/56000\r\n' +
      'a=flow:app serverListeningPort UDP/56000\r\n' +
      'a=flow:q4s clientListeningPort UDP/55000\r\n' +
      'a=flow:q4s clientListeningPort TCP/55001\r\n' +
      'a=flow:q4s serverListeningPort UDP/56000\r\n' +
      'a=flow:q4s serverListeningPort TCP/56001\r\n';

    const netP = new Addresses();
    netP.updateFromSDP(sdpCorrect);
    expect(netP.clientAddressType).toEqual('IP4');
    expect(netP.clientAddress).toEqual('198.51.100.51');
    expect(netP.serverAddressType).toEqual('IP4');
    expect(netP.serverAddress).toEqual('198.51.100.58');
    expect(netP.q4sClientPorts.TCP).toEqual(55001);
    expect(netP.q4sClientPorts.UDP).toEqual(55000);
    expect(netP.q4sServerPorts.TCP).toEqual(56001);
    expect(netP.q4sServerPorts.UDP).toEqual(56000);
    expect(netP.appClientPorts.TCP).toEqual('10000-20000');
    expect(netP.appClientPorts.UDP).toEqual('15000-18000');
    expect(netP.appServerPorts.TCP).toEqual('56000');
    expect(netP.appServerPorts.UDP).toEqual('56000');
  });
});
describe('ipToSdp', function () {
  test.skip('work properly', function () {
    const netP = new Addresses('IP4', '198.51.100.51', 'IP4', '198.51.100.58', { TCP: 1, UDP: 2 }, { TCP: 1, UDP: 2 }, { TCP: 3, UDP: 4 }, { TCP: 5, UDP: 6 });
    const result = 'a=public-address:client IP4 198.51.100.51\r\n' +
      'a=public-address:server IP4 198.51.100.58\r\n';
    expect(netP.ipToSdp()).toEqual(result);
  });
});
describe('portToSDP', function () {
  test.skip('work properly', function () {
    const netP = new Addresses('IP4', '198.51.100.51', 'IP4', '198.51.100.58', { TCP: 1, UDP: 2 }, { TCP: 3, UDP: 4 }, { TCP: 5, UDP: 6 }, { TCP: 7, UDP: 8 });
    const result = 'a=flow:app clientListeningPort TCP/5\r\n' +
      'a=flow:app clientListeningPort UDP/6\r\n' +
      'a=flow:app serverListeningPort TCP/7\r\n' +
      'a=flow:app serverListeningPort UDP/8\r\n' +
      'a=flow:q4s clientListeningPort TCP/1\r\n' +
      'a=flow:q4s clientListeningPort UDP/2\r\n' +
      'a=flow:q4s serverListeningPort TCP/3\r\n' +
      'a=flow:q4s serverListeningPort UDP/4\r\n';
    expect(netP.portToSDP()).toEqual(result);
  });
});
