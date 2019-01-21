const crypto = require('crypto');
const faker = require('faker');
const url = require('url');

const ReqQ4S = require('../src/ReqQ4S.js');


describe('q4sReq', function () {

  describe('fromString & validation', function () {

    test('Correct Req generation', function () {
      const msg = 'PING q4s://localhost Q4S/1.0\r\n'
        + 'User-Agent: experimental-node\r\n'
        + 'Session-Id: 1\r\n'
        + 'Content-Type: text/plain\r\n'
        + '\r\n'
        + 'This is a shit of body';
      const req = ReqQ4S.fromString(msg)
      expect(req).toHaveProperty("method", "PING");
      expect(req).toHaveProperty("requestURI", new URL("q4s://localhost"));
      expect(req).toHaveProperty("q4sVersion", "Q4S/1.0");
      expect(req).toHaveProperty("headers.User-Agent", "experimental-node");
      expect(req).toHaveProperty("headers.Session-Id", "1");
      expect(req).toHaveProperty("headers.Content-Type", "text/plain");
      expect(req).toHaveProperty("body", "This is a shit of body");
    });

    test('Missing a parameter in start line', function () {
      const msg = 'PING q4s://localhost\r\n' // Missing Q4S version
        + 'User-Agent: experimental-node\r\n'
        + 'Session-Id: 1\r\n'
        + 'Content-Type: text/plain\r\n'
        + '\r\n'
        + 'This is a shit of body';
      expect(() => {
        req = ReqQ4S.fromString(msg);
      }).toThrow("Missing an argument in the start line");
    });

    test('Unexistent method in the request', function () {
      const msg = 'WARN q4s://localhost Q4S/1.0\r\n' // Wrong verb
        + 'User-Agent: experimental-node\r\n'
        + 'Session-Id: 1\r\n'
        + 'Content-Type: text/plain\r\n'
        + '\r\n'
        + 'This is a shit of body';
      expect(() => {
        req = ReqQ4S.fromString(msg);
      }).toThrow("Method field  does not contain a valid verb.");
    });
    test('READY verb without stage header', function () {
      const msg = 'READY q4s://localhost Q4S/1.0\r\n' // Wrong verb
        + 'User-Agent: experimental-node\r\n'
        + 'Session-Id: 1\r\n'
        + 'Content-Type: text/plain\r\n'
        + '\r\n'
        + 'This is a shit of body';
      expect(() => {
        req = ReqQ4S.fromString(msg);
      }).toThrow("READY method without stage");
    });
    test('Tranfer encoding header not equal to identity', function () {
      const msg = 'BEGIN q4s://localhost Q4S/1.0\r\n' // Wrong verb
        + 'User-Agent: experimental-node\r\n'
        + 'Session-Id: 1\r\n'
        + 'Content-Type: text/plain\r\n'
        + "Transfer-Encoding: chunked\r\n"
        + '\r\n'
        + 'This is a shit of body';
      expect(() => {
        req = ReqQ4S.fromString(msg);
      }).toThrow("Transfer-Encoding header can only be identity");
    });

    test('The body is encoded', function () {
      const msg = 'BEGIN q4s://localhost Q4S/1.0\r\n' // Wrong verb
        + 'User-Agent: experimental-node\r\n'
        + 'Content-Encoding: zip\r\n'
        + 'Content-Type: text/plain\r\n'
        + "Transfer-Encoding: chunked\r\n"
        + '\r\n'
        + 'This is a shit of body';
      expect(() => {
        req = ReqQ4S.fromString(msg);
      }).toThrow("Body in the request is compressed");
    });

    test('Wrong hash in signature', function () {
      const msg = 'BEGIN q4s://localhost Q4S/1.0\r\n' // Wrong verb
        + 'User-Agent: experimental-node\r\n'
        + 'Content-Type: text/plain\r\n'
        + 'signature: kdlsflkdfslew\r\n'      
        + '\r\n'
        + 'This is a shit of body';
      expect(() => {
        req = ReqQ4S.fromString(msg);
      }).toThrow("Signature MD5 does not match the body.");
    });

    test('Content-Type header is not present', function () {
      const msg = 'BEGIN q4s://localhost Q4S/1.0\r\n' // Wrong verb
        + 'User-Agent: experimental-node\r\n'
        + '\r\n'
        + 'This is a shit of body';
      expect(() => {
        req = ReqQ4S.fromString(msg);
      }).toThrow("Content-Type header is not present");
    });

    test('Random generated strings should trow at any reason', function () {
      for (var i = 0; i < 50; i++) {
        const msg = faker.lorem.text();
        expect(() => {
          req = ReqQ4S.fromString(msg);
        }).toThrow();
      }
    });
  });

  describe('toString', function () {
    test('Should create the correct string', function () {
      const headers = {
        header1: '1',
        header2: '2',
      };
      const req = new ReqQ4S('READY', new URL('localhost:30000'), 'Q4S/1', headers, 'This is the body');
      const resultStr = 'READY localhost:30000 Q4S/1\r\n'
        + 'header1: 1\r\n'
        + 'header2: 2\r\n'
        + '\r\n'
        + 'This is the body';
      var str = req.toString();
      expect(str).toEqual(resultStr);
    });
  });

  describe('signBody', function () {
    test('Should generate the correct MD5', function () {
      const headers = {
        header1: '1',
        header2: '2',
      };
      const body = 'This is the body';
      const hash = crypto.createHash('md5').update(body).digest('hex');
      const req = new ReqQ4S('READY', new URL('localhost:30000'), 'Q4S/1', headers, body);
      req.signBody();
      expect(req.headers.signature).toEqual(hash);
    });
  });

  describe('isRequest', function () {
    test('Should work with a request', function () {
      const msg = 'PING q4s://localhost Q4S/1.0\r\n'
        + 'User-Agent: experimental-node\r\n'
        + 'Session-Id: 1\r\n'
        + 'Content-Type: text/plain\r\n'
        + '\r\n'
        + 'This is a shit of body';
      expect(ReqQ4S.isRequest(msg)).toBeTruthy();
    });

    test('Should fail with a response', function () {
      const msg = 'Q4S/1.0 200 OK\r\n'
        + 'Date: Mon, 10 Jun 2010 10:00:01 GMT\r\n'
        + 'Content-Type: application/sdp\r\n'
        + 'Expires: 3000\r\n'
        + 'Signature: 6ec1ba40e2adf2d783de530ae254acd4f3477ac4\r\n'
        + 'Content-Length: 131\r\n'
        + '\r\n';

      expect(ReqQ4S.isRequest(msg)).not.toBeTruthy();
    });
  });
});