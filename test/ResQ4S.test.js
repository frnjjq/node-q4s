const ResQ4S = require('../src/ResQ4S.js');

describe('ResQ4S', function() {
  describe('fromString', function() {
    test('Should work properly', function() {
      const msg = 'Q4S/1.0 200 OK\r\n'
        + 'header1: Doge\r\n'
        + 'header2: is\r\n'
        + 'header-script: amazing\r\n'
        + '\r\n'
        + 'This is a body';
      res = ResQ4S.fromString(msg);
      expect(res).toHaveProperty('q4sVersion', 'Q4S/1.0');
      expect(res).toHaveProperty('statusCode', 200);
      expect(res).toHaveProperty('reasonPhrase', 'OK');
      expect(res).toHaveProperty('headers.header1', 'Doge');
      expect(res).toHaveProperty('headers.header2', 'is');
      expect(res).toHaveProperty('headers.header-script', 'amazing');
      expect(res).toHaveProperty('body', 'This is a body');
    });
  });
  describe('toString', function() {
    test('Should work properly', function() {
      const headers = {
        header1: 'Doge',
        header2: 'is',
      };
      headers['header-script'] = 'amazing';

      const resultStr = 'Q4S/1.0 200 OK\r\n'
        + 'header1: Doge\r\n'
        + 'header2: is\r\n'
        + 'header-script: amazing\r\n'
        + '\r\n'
        + 'This is a body';
      res = new ResQ4S('Q4S/1.0', 200, 'OK', headers, 'This is a body');
      expect(res.toString()).toEqual(resultStr);
    });

    test('Should print without body or headers', function() {
      const resultStr = 'Q4S/1.0 200 OK\r\n'
        + '\r\n';
      res = new ResQ4S('Q4S/1.0', 200, 'OK', undefined, undefined);
      expect(res.toString()).toEqual(resultStr);
    });

  });
});
