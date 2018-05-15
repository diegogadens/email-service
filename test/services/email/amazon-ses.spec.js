const amazonSES  = require('../../../src/services/email/amazon-ses');
const config     = require('../../../config');
const crypto     = require('../../../src/utils/crypto')
const should     = require('should');
const sinon      = require('sinon');
const request    = require('request');

describe('Services', () => {

  let sandbox = null;
  let clock = null;
  let encryptedMessage = 'An-EnCryPteD-m3ss4Ge'

  describe('Email', () => {
    describe('Amazon SES', () => {

      beforeEach(() => {
        sandbox = sinon.createSandbox();
        sandbox.stub(request, 'post');
        sandbox.stub(crypto, 'toBase64');

        crypto.toBase64.returns(encryptedMessage)
        //The Amazon header signature uses the current Date as a parameter,
        //that's why we are freezing the time here
        clock = sinon.useFakeTimers(new Date('Tue, 15 May 2018 21:06:30 GMT'));
      });

      afterEach(() => {
        sandbox.restore();
        clock.restore();
      })

      it('should send an email successfully', (done) => {
        request.post.yields(null, {statusCode: 200}, 'SES response');

        const { url, accesKeyId } = config.emailProviders.amazonSES
        const to = ['diegogadens@gmail.com']
        const subject = 'Subject'
        const message = 'The message'

        amazonSES.sendEmail(to, null, null, subject, message, (err, response) => {
          should.not.exist(err)
          sinon.assert.calledWith(request.post, {
            form: {
              "Action": "SendRawEmail",
              "RawMessage.Data": encryptedMessage
            },
            headers: {
              "Date": "Tue, 15 May 2018 21:06:30 GMT",
              "X-Amzn-Authorization": `AWS3-HTTPS AWSAccessKeyId=${accesKeyId}, Algorithm=HMACSHA256, Signature=${encryptedMessage}`
            },
            url: `${url}`
          });
          response.should.eql({
            code: 200,
            message: 'SES response'
          });
          done()
        })
      });

      it('should receive an error response from Amazon', (done) => {
        request.post.yields(null, {statusCode: 401}, 'SES response');

        const { url, accesKeyId } = config.emailProviders.amazonSES
        const to = ['diegogadens@gmail.com']
        const subject = 'Subject'
        const message = 'The message'

        amazonSES.sendEmail(to, null, null, subject, message, (err, response) => {
          should.not.exist(err)
          sinon.assert.calledWith(request.post, {
            form: {
              "Action": "SendRawEmail",
              "RawMessage.Data": encryptedMessage
            },
            headers: {
              "Date": "Tue, 15 May 2018 21:06:30 GMT",
              "X-Amzn-Authorization": `AWS3-HTTPS AWSAccessKeyId=${accesKeyId}, Algorithm=HMACSHA256, Signature=${encryptedMessage}`
            },
            url: `${url}`
          });

          response.should.eql({
            error:{
              code:401,
              message: 'SES response'
            }
          });
          done()
        })
      });
    });
  });
});