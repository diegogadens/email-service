const amazonSES = require('../services/email/amazon-ses');
const mailGun   = require('../services/email/mail-gun');
const sendGrid  = require('../services/email/send-grid');
const queue     = require('../services/queue/job-manager')
const log       = require('../log')

exports.post = (req, res, next) => {
  const emailJob = sanitizeBody(req.body);

  queue.pushEmailJob(emailJob, (err, jobId) => {
    if(err){
      log.error(`Error while queuing email: ${err}`)
      return next(err)
    }
    else{
      res.send(202, beautifyResponse(jobId));
      return next();
    }
  });
};

const sanitizeBody = (body) => {
  const { to, cc, bcc, subject, message } = body;

  return {
    email:{
      to,
      cc,
      bcc,
      subject,
      message
    },
    deliveryAttempts: []
  }
}

const beautifyResponse = (jobId) => {
  return {
    code: 202,
    message: 'Your email has been queued and will be sent shortly',
    emailJobId: jobId
  }
}








//
