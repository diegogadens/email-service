amazonSES = require('../services/email/amazon-ses');
log       = require('../log')

exports.post = (req, res, next) => {
  const { to, cc, bcc, subject, message } = req.body;

  amazonSES.sendEmail(to, cc, bcc, subject, message, (err, code, response) => {
    if(err){
      log.error(`Error while sending email: ${err}`)
      return next(err)
    }
    else{
      res.send(code, response);
      return next();
    }
  })
};
