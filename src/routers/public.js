const statusController = require('../controllers/status-controller');

let _server = null;

exports.init = (server) => {
  _server = server;

  router.get({
    name: 'Status',
    path: '/status',
    handler: statusController.get
  });
  
};

var router = {
  get(opts)    { return _server.get(opts.path, opts.handler)    },
  post(opts)   { return _server.post(opts.path, opts.handler)   },
  put(opts)    { return _server.put(opts.path, opts.handler)    },
  delete(opts) { return _server.delete(opts.path, opts.handler) }
};
