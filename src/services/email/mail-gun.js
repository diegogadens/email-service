const config       = require('../../../config')
const emailsParser = require('../../utils/email-array-to-angle-brackets')
const crypto       = require('../../utils/crypto')
const request      = require('request')

exports.sendEmail = (to, cc, bcc, subject, message, callback) => {
  const requestData = buildMailGunRequestData(to, cc, bcc, subject, message);

  request.post(requestData, (err, httpResponse, body) => {
    if (err)
      return callback(err);

    let response = {
      code: httpResponse.statusCode,
      message: body
    };

    if (httpResponse.statusCode != 200)
      return callback(null, { error: response });
    else
      return callback(null, response)
  });
}

buildMailGunRequestData = (to, cc, bcc, subject, message) => {
  const { protocol, url, privateKey, domain } = config.emailProviders.mailGun;
  const currentDate     = new Date().toUTCString();

  const formData        = buildMailGunEmailContent(to, cc, bcc, subject, message);

  return {
    url: `${protocol}api:${privateKey}@${url}/${domain}/messages`,
    form: formData
  }
}

buildMailGunEmailContent = (to, cc, bcc, subject, message) => {
  let emailForm = addMailGunRecipients(to, cc, bcc);
      emailForm.subject = subject;
      emailForm.text = message;

  return emailForm;
}

addMailGunRecipients = (to, cc, bcc) => {
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
