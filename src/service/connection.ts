/*
 * @Author       : wqph
 * @Date         : 2023-05-09 18:29:59
 * @LastEditors  : wqph auhnipuiq@163.com
 * @LastEditTime : 2023-06-02 19:20:19
 * @FilePath     : \backend\src\service\connection.ts
 * @Description  : 与客户端的连接服务
 */

import ws from 'ws';
import amqp from 'amqplib';
import configuration from '../util/config';
import logger from '../util/logger';
import MessageService, { GroupMessage, PrivateMessage } from './message';

const connections = new Map<string, ws>();

const ConnectionService = {
  /**
   * 添加一个与客户端的连接
   * @param {string} userId 连接的客户端的用户 ID
   * @param {ws} wsConnection 该连接的 WebSocket 对象
   * @return {Promise<void>}
   */
  async addConnection(userId: string, wsConnection: ws): Promise<void> {
    connections.set(userId, wsConnection);

    try {
      const connection = await amqp.connect(configuration.rabbitmq);
      const channel = await connection.createChannel();

      await channel.assertQueue(userId, { durable: true });

      const lastReadHistory = await MessageService.getLastReadTime(userId);

      const { consumerTag } = await channel.consume(userId, async (message) => {
        if (!message) {
          logger.info('Received empty message');
          return;
        }

        channel.ack(message);

        const content = JSON.parse(message.content.toString(), (key, value) =>
          key === 'sendAt' ? new Date(value) : value
        ) as PrivateMessage | GroupMessage;

        // 消息已经被拉取过，不需要传输给用户
        if (content.sendAt < lastReadHistory) {
          return;
        }

        logger.info(
          `User [${userId}] received message: \n${JSON.stringify(
            content,
            null,
            2
          )}`
        );

        // 推送消息到客户端
        wsConnection.send(JSON.stringify(content));
      });

      // 注册连接关闭回调
      wsConnection.on('close', async () => {
        logger.info(`The user ${userId} has disconnected from the server`);

        // 从连接池中去除
        connections.delete(userId);
        // 停止消费消息队列
        await channel.cancel(consumerTag);

        await channel.close();
        await connection.close();
      });
    } catch (error) {
      logger.error(error);
    }
  },

  /**
   * 关闭所有与客户端的连接
   * @return {void}
   */
  shutdownAllConnection(): void {
    for (const connection of connections.values()) {
      connection.terminate();
    }
  },
};

export default ConnectionService;
