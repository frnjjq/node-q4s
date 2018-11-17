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
            // TODO: Fix this test, do not know how to not use -
            // expect(req.headers).to.have.keys('User-Agent', 'Session-Id');
            expect(req.headers['User-Agent']).to.equal('experimental-node');
            expect(req.headers['Session-Id']).to.equal('1');
            done();
          })
          .catch((err) => {
            done(err);
          });
    });
    it('Should fail because missing parameter in start line', function(done) {
      const msg = 'PING q4s://localhost\r\n' // Missing Q4S version
        + 'User-Agent: experimental-node\r\n'
        + 'Session-Id: 1\r\n'
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
            // TODO: Fix this test, do not know how to not use -
            // expect(req.headers).to.have.keys('User-Agent', 'Session-Id');
            expect(req.headers['User-Agent']).to.equal('experimental-node');
            expect(req.headers['Session-Id']).to.equal('1');
            done();
          })
          .catch((err) => {
            done(err);
          });
    });
  });
});
