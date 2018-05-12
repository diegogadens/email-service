const restify = require('restify');
const seppuku = require('seppuku');
const config  = require('../config');
const routers = require('./routers');

exports.createServer = () => {

  const server = restify.createServer();

  server.use(
    seppuku(server, {
      minDeferralTime: config.shutDownTimeout,
      maxDeferralTime: config.shutDownTimeout,
      trapExceptions: false
    })
  );

  server.on('uncaughtException', (req, res, route, err) =>
    res.send(503, new restify.InternalError('Service not available'))
  );

  server.use(restify.plugins.queryParser());
  server.use(restify.plugins.bodyParser());

  routers.configureRoutes(server);

  return server;
};
