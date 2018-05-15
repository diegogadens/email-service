amazonSES = require('../services/email/amazon-ses');
mailGun   = require('../services/email/mail-gun');
sendGrid  = require('../services/email/send-grid');
log       = require('../log')

exports.post = (req, res, next) => {
  const { to, cc, bcc, subject, message } = req.body;

  // amazonSES.sendEmail(to, cc, bcc, subject, message, (err, response) => {
  //   if(err){
  //     log.error(`Error while sending email: ${err}`)
  //     return next(err)
  //   }
  //   else{
  //     res.send(response.code, response);
  //     return next();
  //   }
  // })

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

  sendGrid.sendEmail(to, cc, bcc, subject, message, (err, response) => {
    if(err){
      log.error(`Error while sending email: ${err}`)
      return next(err)
    }
    if(response.error){
      res.send(response.error.code, response);
      return next();
    }
    else{
      res.send(response.code, response);
      return next();
    }
  })



};
