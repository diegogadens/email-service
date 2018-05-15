amazonSES = require('../services/email/amazon-ses');
mailGun   = require('../services/email/mail-gun');
log       = require('../log')

exports.post = (req, res, next) => {
  const { to, cc, bcc, subject, message } = req.body;

  amazonSES.sendEmail(to, cc, bcc, subject, message, (err, response) => {
    if(err){
      log.error(`Error while sending email: ${err}`)
      return next(err)
    }
    else{
      res.send(response.code, response);
      return next();
    }
  })

  // mailGun.sendEmail(to, cc, bcc, subject, message, (err, response) => {
  //   if(err){
  //     log.error(`Error while sending email: ${err}`)
  //     return next(err)
  //   }
  //   else{
  //     res.send(response.code, response);
  //     return next();
  //   }
  // })



};
