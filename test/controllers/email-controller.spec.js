const testServer = require('../../src/server');
const request    = require('supertest');
const should     = require('should');
const server     = testServer.createServer();

describe('Email', () => {
  describe('/POST email', () => {
    it('it should accept a request to send an email', (done) => {

      request(server)
        .post('/email')
        .expect(201)
        .end((err, res) => {
          if(err)
            return done(err);
          should(res.body).eql('OK');
          return done();
        });
    });
  });
});
