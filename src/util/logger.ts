import log4js from 'log4js';

import Config from './config';

const {
  log: { level: logLevel, maxFileSize, fileNumber },
} = Config;

log4js.configure({
  appenders: {
    stdout: { type: 'stdout' },
    file: {
      type: 'file',
      filename: 'chat-system.log',
      keepFileExt: true,
      maxLogSize: maxFileSize,
      backups: fileNumber,
    },
  },
  categories: {
    default: { appenders: ['stdout'], level: 'OFF' },
    server: { appenders: ['stdout', 'file'], level: logLevel },
  },
});

const logger = log4js.getLogger('server');

export default logger;
