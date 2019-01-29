const Util = require('../src/Util.js');


describe('Util', function() {
  describe('isRequest', function() {
    test('Should work with a request', function() {
      const msg = 'PING q4s://localhost Q4S/1.0\r\n'
        + 'User-Agent: experimental-node\r\n'
        + 'Session-Id: 1\r\n'
        + 'Content-Type: text/plain\r\n'
        + '\r\n'
        + 'This is a shit of body';
      expect(Util.isRequest(msg)).toBeTruthy();
    });

    test('Should fail with a response', function() {
      const msg = 'Q4S/1.0 200 OK\r\n'
        + 'Date: Mon, 10 Jun 2010 10:00:01 GMT\r\n'
        + 'Content-Type: application/sdp\r\n'
        + 'Expires: 3000\r\n'
        + 'Signature: 6ec1ba40e2adf2d783de530ae254acd4f3477ac4\r\n'
        + 'Content-Length: 131\r\n'
        + '\r\n';

      expect(Util.isRequest(msg)).not.toBeTruthy();
    });
  });
});
