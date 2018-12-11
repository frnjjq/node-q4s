const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const ReqQ4S = require('../src/ReqQ4S.js');

describe('q4sReq', function() {
  describe('fromString', function() {
    it('Should create request from string', function(done) {
      const msg = 'PING q4s://localhost Q4S/1.0\r\n'
        + 'User-Agent: experimental-node\r\n'
        + 'Session-Id: 1\r\n'
        + 'Content-Type: text/plain\r\n'
        + '\r\n'
        + 'This is a shit of body';
      ReqQ4S.fromString(msg)
          .then((req) => {
            expect(req).to.have.property('method');
            expect(req.method).to.be.a('string');
            expect(req.method).to.equal('PING');
            expect(req).to.have.property('requestURI');
            expect(req.requestURI).to.be.a('string');
            expect(req.requestURI).to.equal('q4s://localhost');
            expect(req).to.have.property('q4sVersion');
            expect(req.q4sVersion).to.be.a('string');
            expect(req.q4sVersion).to.equal('Q4S/1.0');
            expect(req).to.have.property('body');
            expect(req.body).to.be.a('string');
            expect(req.body).to.equal('This is a shit of body');
            expect(req).to.have.property('headers');
            expect(req.headers).to.be.a('Object');
            expect(req.headers['User-Agent']).to.equal('experimental-node');
            expect(req.headers['Session-Id']).to.equal('1');
            expect(req.headers['Content-Type']).to.equal('text/plain');
            // TODO: Fix this test, do not know how to not use -
            // expect(req.headers).to.have.keys('User-Agent', 'Session-Id');
            done();
          })
          .catch((err) => {
            done(err);
          });
    });
    it('Should fail because missing Q4S version parameter in start line', function(done) {
      const msg = 'PING q4s://localhost\r\n' // Missing Q4S version
        + 'User-Agent: experimental-node\r\n'
        + 'Session-Id: 1\r\n'
        + 'Content-Type: text/plain\r\n'
        + '\r\n'
        + 'This is a shit of body';
      ReqQ4S.fromString(msg)
          .then((req) => {
            expect.fail("Expected to fail");
            done();
          })
          .catch((err) => {
            expect(err.message).to.equal('Missing parameter in the request start line');
            done();
          });
    });

    it('Should fail because wrong verb in start line', function(done) {
      const msg = 'WARN q4s://localhost Q4S/1.0\r\n' // Wrong verb
        + 'User-Agent: experimental-node\r\n'
        + 'Session-Id: 1\r\n'
        + 'Content-Type: text/plain\r\n'
        + '\r\n'
        + 'This is a shit of body';
      ReqQ4S.fromString(msg)
          .then((req) => {
            expect.fail("Request with a wrong verb were parsed");
            done();
          })
          .catch((err) => {
            expect(err.message).to.equal('Method field  does not contain a valid word.');
            done();
          });
    });
    it('Should fail READY verb without stage', function(done) {
      const msg = 'READY q4s://localhost Q4S/1.0\r\n' // Wrong verb
        + 'User-Agent: experimental-node\r\n'
        + 'Session-Id: 1\r\n'
        + 'Content-Type: text/plain\r\n'
        + '\r\n'
        + 'This is a shit of body';
      ReqQ4S.fromString(msg)
          .then((req) => {
            expect.fail("Request with a wrong verb were parsed");
            done();
          })
          .catch((err) => {
            expect(err.message).to.equal('READY method without stage');
            done();
          });
    });
  });
  describe('toString', function() {
    it('Should parse correctly', function(done) {
      const headers = {
        header1: "1",
        header2: "2"
      };
      const req = new ReqQ4S("READY","localhost:30000","Q4S/1", headers, "This is the body");
      const resultStr= 'READY localhost:30000 Q4S/1\r\n' // Wrong verb
      + 'header1: 1\r\n'
      + 'header2: 2\r\n'
      + '\r\n'
      + 'This is the body';
      req.toString().then((str) => {
        expect(str).to.be.a('string');
        expect(str).to.equal(resultStr);
        done();
      });
    });
  });
});
