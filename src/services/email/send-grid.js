const config       = require('../../../config')
// const emailsParser = require('../../utils/email-array-to-angle-brackets')
const crypto       = require('../../utils/crypto')
const request      = require('request')

exports.sendEmail = (to, cc, bcc, subject, message, callback) => {
  const requestData = buildSendGridRequestData(to, cc, bcc, subject, message);

  console.log(JSON.stringify(requestData));

  request.post(requestData, (err, httpResponse, body) => {
    if (err)
      return callback(err);

    let response = {
      code: httpResponse.statusCode,
      message: body
    };

    console.log("Response ", response);
    if (httpResponse.statusCode != 202)
      return callback(null, { error: response });
    else
      return callback(null, response)
  });
}

buildSendGridRequestData = (to, cc, bcc, subject, message) => {
  const { url, apiKey } = config.emailProviders.sendGrid;

  const header   = buildSendGridHeader(apiKey)
  const formData = buildSendGridEmailContent(to, cc, bcc, subject, message);

  return {
    url: `${url}`,
    headers: header,
    json: formData
  }
}

buildSendGridHeader = (apiKey) => {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json"
  }
}

buildSendGridEmailContent = (to, cc, bcc, subject, message) => {
  let emailForm = {
    personalizations: [{
      to: emailsParser(to)
    }],
    from: {
      email: config.emailProviders.sendGrid.fromAddress
    },
    content: [{
      type: "text/plain",
      value: message
    }]
  }

  if(cc)
    emailForm.personalizations[0].cc = emailsParser(cc)

  if(bcc)
    emailForm.personalizations[0].bcc = emailsParser(bcc)

  emailForm.personalizations[0].subject = subject

  return emailForm;
}

emailsParser = (emails) => {
  let recipients = emails.map((email) => {
    return { email: email }
  })

  return recipients;
}
