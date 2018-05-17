const config       = require('../../../config')
const emailsParser = require('../../utils/email-array-to-angle-brackets')
const crypto       = require('../../utils/crypto')
const request      = require('request')

let errorCounter = 0;

exports.sendEmail = (to, cc, bcc, subject, message, callback) => {
  const requestData = buildRequestData(to, cc, bcc, subject, message);

  request.post(requestData, (err, httpResponse, body) => {
    if (err)
      return callback(err);

    let response = {
      code: httpResponse.statusCode,
      message: body
    };

    if (httpResponse.statusCode != 200)
      return callback({ error: response });
    else
      return callback(null, response)
  });
}

const buildRequestData = (to, cc, bcc, subject, message) => {
  const { protocol, url, privateKey, domain } = config.emailProviders.mailGun;

  const formData = buildEmailContent(to, cc, bcc, subject, message);

  return {
    url: `${protocol}api:${privateKey}@${url}/${domain}/messages`,
    timeout: config.emailProviders.timeoutInMs,
    form: formData
  }
}

const buildEmailContent = (to, cc, bcc, subject, message) => {
  let emailForm = addRecipients(to, cc, bcc);
      emailForm.subject = subject;
      emailForm.text = message;

  return emailForm;
}

const addRecipients = (to, cc, bcc) => {
  let recipients = {
    from: config.emailProviders.mailGun.fromAddress,
    to: emailsParser(to)
  };

  if(cc)
    recipients.cc = emailsParser(cc);

  if(bcc)
    recipients.bcc = emailsParser(bcc);

  return recipients;
}

exports.setErrorCounter = (counter) => {
  errorCounter = counter;
  console.log(`Mailgun error counter ${errorCounter}`);
}

exports.getErrorCounter = () => {
  return errorCounter
}

exports.getName = () => {
  return config.emailProviders.mailGun.providerName
}
