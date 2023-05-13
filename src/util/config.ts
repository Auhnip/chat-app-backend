import config from 'config';
import type { Algorithm } from 'jsonwebtoken';

type Config = {
  rabbitmq: {
    hostname: string;
    port: number;
    username: string;
    password: string;
    vhost: string;
  };

  mysql: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
  };

  redis: {
    host: string;
    port: number;
    password: string;
  };

  jwtToken: {
    secret: string;
    algorithm: Algorithm;
  };

  mail: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };

  verificationCode: {
    mailSubject: string;
    length: number;
    expiresInSecond: number;
  };

  log: {
    level: string;
    maxFileSize: string | number;
    fileNumber: number;
  };
};

const configuration = config.util.toObject() as Config;

export default configuration;
