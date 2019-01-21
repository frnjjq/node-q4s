const faker = require('faker');

const ResQ4S = require('../src/ResQ4S.js');

describe('q4sReq', function () {

  describe('fromString', function () {

    test('Should work properly', function () {
      const msg = 'Q4S/1.0 200 OK\r\n'
        + 'header1: Doge\r\n'
        + 'header2: is\r\n'
        + 'header-script: amazing\r\n'
        + '\r\n'
        + 'This is a body';
      res = ResQ4S.fromString(msg);
      expect(res).toHaveProperty("q4sVersion", "Q4S/1.0");
      expect(res).toHaveProperty("statusCode", 200);
      expect(res).toHaveProperty("reasonPhrase", "OK");
      expect(res).toHaveProperty("headers.header1", "Doge");
      expect(res).toHaveProperty("headers.header2", "is");
      expect(res).toHaveProperty("headers.header-script", "amazing");
      expect(res).toHaveProperty("body", "This is a body");
    });

  });
  describe('toString', function () {

    test('Should work properly', function () {
      const headers = {
        header1: "Doge",
        header2: "is",
      };
      headers["header-script"] = "amazing";

      const resultStr = 'Q4S/1.0 200 OK\r\n'
        + 'header1: Doge\r\n'
        + 'header2: is\r\n'
        + 'header-script: amazing\r\n'
        + '\r\n'
        + 'This is a body';
      res = new ResQ4S("Q4S/1.0", 200, "OK", headers, "This is a body");
      expect(res.toString()).toEqual(resultStr);
    });

  });
  describe('isResponse', function () {

    test('OK with a Response', function () {
      const msg = 'Q4S/1.0 200 OK\r\n'
        + 'Date: Mon, 10 Jun 2010 10:00:01 GMT\r\n'
        + 'Content-Type: application/sdp\r\n'
        + 'Expires: 3000\r\n'
        + 'Signature: 6ec1ba40e2adf2d783de530ae254acd4f3477ac4\r\n'
        + 'Content-Length: 131\r\n'
        + '\r\n';
      expect(ResQ4S.isResponse(msg)).toBeTruthy();
    });

    test('Detect a resquest', function () {
      const msg = 'PING q4s://localhost Q4S/1.0\r\n'
        + 'User-Agent: experimental-node\r\n'
        + 'Session-Id: 1\r\n'
        + 'Content-Type: text/plain\r\n'
        + '\r\n'
        + 'This is a shit of body';
      expect(ResQ4S.isResponse(msg)).not.toBeTruthy();
    });
  });
});
