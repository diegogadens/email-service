const mailGun    = require('../../../src/services/email/mail-gun');
const config     = require('../../../config');
const should     = require('should');
const sinon      = require('sinon');
const request    = require('request');

describe('Services', () => {

  let sandbox = null;

  describe('Email', () => {
    describe('MailGun', () => {

      beforeEach(() => {
        sandbox = sinon.createSandbox();
        sandbox.stub(request, 'post');
      });

      afterEach(() => {
        sandbox.restore();
      })

      it('should send an email successfully through MailGun', (done) => {
        request.post.yields(null, {statusCode: 200}, 'MailGun response');

        const { protocol, url, privateKey, domain, fromAddress } = config.emailProviders.mailGun
        const to = ['diegogadens@gmail.com']
        const subject = 'Subject'
        const message = 'The message'

        mailGun.sendEmail(to, null, null, subject, message, (err, response) => {
          should.not.exist(err)
          sinon.assert.calledWith(request.post, {
            url:`${protocol}api:${privateKey}@${url}/${domain}/messages`,
            timeout: config.emailProviders.timeoutInMs,
            form: {
              from: fromAddress,
              to: `<${to[0]}>`,
              subject: subject,
              text: message,
            }
          });
          response.should.eql({
            code: 200,
            message: 'MailGun response'
          });
          done()
        });
      });

      it('should receive an error response from MailGun', (done) => {
        request.post.yields(null, {statusCode: 401}, 'MailGun response');

        const { protocol, url, privateKey, domain, fromAddress } = config.emailProviders.mailGun
        const to = ['diegogadens@gmail.com']
        const subject = 'Subject'
        const message = 'The message'

        mailGun.sendEmail(to, null, null, subject, message, (err, response) => {
          should.not.exist(err)
          sinon.assert.calledWith(request.post, {
            url:`${protocol}api:${privateKey}@${url}/${domain}/messages`,
            timeout: config.emailProviders.timeoutInMs,
            form: {
              from: fromAddress,
              to: `<${to[0]}>`,
              subject: subject,
              text: message,
            }
          });

          response.should.eql({
            error:{
              code:401,
              message: 'MailGun response'
            }
          });
          done()
        });
      });

      it('should receive an http error while trying to send a request to mailgun', (done) => {
        request.post.yields('some http error');

        const { protocol, url, privateKey, domain, fromAddress } = config.emailProviders.mailGun
        const to = ['diegogadens@gmail.com']
        const subject = 'Subject'
        const message = 'The message'

        mailGun.sendEmail(to, null, null, subject, message, (err, response) => {
          should.exist(err)
          err.should.eql('some http error');
          done()
        });
      });
    });
  });
});
