const s            = require('strummer');
const sware        = require('strummer-middleware');
const errorHandler = require('../errors/bad-request-handler')

exports.request = sware({
  body: s({
    to: s.array({of: s.email(), min: 1}),
    cc: s.optional(s.array({of: s.email()})),
    bcc: s.optional(s.array({of: s.email()})),
    subject: s.optional(s.string()),
    message: s.string({min: 1})
  })
});

exports.errorHandler = errorHandler
