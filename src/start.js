const config = require('../config');
const log    = require('./log');
const server = require('./server');

let serverRunning = false;

const exit = (code) => {
  if (app && serverRunning) {
    return app.seppuku();
  } else {
    return process.exit(code);
  }
};

process.on('uncaughtException', (err) => {
  log.error('Process uncaught exception, shutting down the server');
  log.error(err);
  return exit(1);
});

process.on('SIGINT', () => {
  log.info(' -> SIGINT (Ctrl-C) received');
  return exit(0);
});

process.on('SIGTERM', () => {
  log.info(' -> SIGTERM (kill) received');
  return exit(0);
});

var app = server.createServer();

app.listen(config.serverPort, () => {
  log(`listening at ${config.serverPort}`);
  return serverRunning = true;
});
