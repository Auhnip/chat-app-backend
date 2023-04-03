import Redis from 'ioredis';

import Config from './config';

const { redis: redisConfig } = Config;

const redis = new Redis(redisConfig);

export default redis;
