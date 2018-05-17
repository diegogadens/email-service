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
  const { url, accesKeyId, secretAccessKey } = config.emailProviders.amazonSES;
  const currentDate     = new Date().toUTCString();

  const headerSignature = createHeaderSignature(currentDate, secretAccessKey)
  const awsHeaders      = configureAwsHeaders(currentDate, accesKeyId, headerSignature);
  const formData        = buildEmailContent(to, cc, bcc, subject, message);

  return {
    url: url,
    timeout: config.emailProviders.timeoutInMs,
    headers: awsHeaders,
    form: formData
  }
}

const createHeaderSignature = (currentDate, secretAccessKey) => {
  // Encrypt the currentDate with your secretAccessKey
  // afterwards encode it in base64
  return crypto.toBase64(crypto.HmacSHA256(currentDate, secretAccessKey));
}

const configureAwsHeaders = (currentDate, accesKeyId, signature)=> {
  // this is the POST request header that Amazon uses to verify the validity of your request
  return {
    'Date' : currentDate,
    'X-Amzn-Authorization': `AWS3-HTTPS AWSAccessKeyId=${accesKeyId}, Algorithm=HMACSHA256, Signature=${signature}`
  }
}

const buildEmailContent = (to, cc, bcc, subject, message) => {
  let emailBody = addRecipients(to, cc, bcc);

  emailBody +=
    `Subject: ${subject}\n` +
    'Content-Type: text/plain; charset="us-ascii"\n' +
    'Content-Transfer-Encoding: quoted-printable\n' +
    'MIME-Version: 1.0\n' +
    '\n\n' + //These two new lines are required by Amazon to identify the beginning of the actual email message
    `${message}`;

  // now we base64 encode the whole message, that's how Amazon wants it
  const encodedBody = crypto.toBase64(crypto.utf8Encode(emailBody));

  const formData = {
    Action:'SendRawEmail',
    'RawMessage.Data': encodedBody
  };

  return formData;
}

const addRecipients = (to, cc, bcc) => {
  let recipients =
    `From: ${config.emailProviders.amazonSES.fromAddress}\n` +
    `To: ${emailsParser(to)}\n`;

  if(cc)
    recipients += `Cc: ${emailsParser(cc)}\n`;

  if(bcc)
    recipients += `Bcc: ${emailsParser(bcc)}\n`;

  return recipients;
}

exports.setErrorCounter = (counter) => {
  errorCounter = counter;
  console.log(`Amazon error counter ${errorCounter}`);
}

exports.getErrorCounter = () => {
  return errorCounter
}

exports.getName = () => {
  return config.emailProviders.amazonSES.providerName
}
