import Redis, { RedisOptions } from 'ioredis';

import Config from '../../util/config';
import logger from '../../util/logger';

const { redis: redisConfig } = Config;

const redisOptions: RedisOptions = {
  ...redisConfig,

  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },

  showFriendlyErrorStack: true,
};

// 初始化 redis 实例
const redis = new Redis(redisOptions);

logger.info('Redis instance initialized');

// 连接建立
redis.on('connect', () => {
  logger.info('A connection is established to the Redis server');
});

// 连接关闭
redis.on('close', () => {
  logger.warn('An established Redis server connection has closed');
});

// 重新连接
redis.on('reconnecting', (time) => {
  logger.info(`Will reconnect to the Redis server in ${time} ms`);
});

// 连接失败
redis.on('end', () => {
  logger.error(
    'No more reconnections will be made, or the connection is failed to establish'
  );
});

// 产生错误
redis.on('error', (error) => {
  logger.error(`${error.name}: ${error.message}`);
});

export default redis;
