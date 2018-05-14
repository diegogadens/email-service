const validation       = require('../validation')
const emailController  = require('../controllers/email-controller');
const statusController = require('../controllers/status-controller');

let _server = null;

exports.init = (server) => {
  _server = server;

  router.get({
    name: 'Status',
    path: '/status',
    handler: statusController.get
  });

  router.post({
    name: 'Send email',
    path: '/email',
    validate: validation.email.request,
    validationErrorHandler: validation.email.errorHandler,
    handler: emailController.post
  });
};

var router = {
  get(opts)    { return _server.get(opts.path, opts.handler)    },
  post(opts)   { return _server.post(opts.path, opts.validate, opts.validationErrorHandler, opts.handler)},
  put(opts)    { return _server.put(opts.path, opts.handler)    },
  delete(opts) { return _server.delete(opts.path, opts.handler) }
};
