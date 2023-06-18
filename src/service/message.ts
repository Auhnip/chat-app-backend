/*
 * @Author       : wqph
 * @Date         : 2023-05-09 18:27:35
 * @LastEditors  : wqph auhnipuiq@163.com
 * @LastEditTime : 2023-06-05 00:57:12
 * @FilePath     : \backend\src\service\message.ts
 * @Description  : 消息收发服务
 */

import amqp from 'amqplib';
import logger from '../util/logger';
import configuration from '../util/config';
import { convertGroupIdToString } from '../util/utils';
import {
  GroupMessageData,
  PrivateMessageData,
  UserData,
} from 'knex/types/tables';
import Database from './base/database';

interface MessageBase {
  from: string;
  content: string;
  sendAt: Date;
}

export interface GroupMessage extends MessageBase {
  type: 'group';
  to: number;
}

export interface PrivateMessage extends MessageBase {
  type: 'private';
  to: string;
}

/**
 * 将私聊消息在数据库中的表示格式转化为前后端通信时使用的格式
 * @param {Omit<PrivateMessageData, 'private_msg_id'>} 私聊消息在数据库中的表示格式对象，除开消息 ID 字段
 * @return {PrivateMessage} 私聊消息在前后端通信时的格式
 */
const privateMessageParser = ({
  private_msg_sender,
  private_msg_receiver,
  private_msg_sent_at,
  private_msg_content,
}: Omit<PrivateMessageData, 'private_msg_id'>): PrivateMessage => {
  return {
    type: 'private',
    from: private_msg_sender,
    to: private_msg_receiver,
    sendAt: private_msg_sent_at,
    content: private_msg_content,
  };
};

/**
 * 将群聊消息在数据库中的表示格式转化为前后端通信时使用的格式
 * @param {Omit<GroupMessageData, 'group_msg_id'>} 群聊消息在数据库中的表示格式对象，除开消息 ID 字段
 * @return {GroupMessage} 群聊消息在前后端通信时的格式
 */
const groupMessageParser = ({
  group_msg_sender,
  group_msg_group_id,
  group_msg_sent_at,
  group_msg_content,
}: Omit<GroupMessageData, 'group_msg_id'>): GroupMessage => {
  return {
    type: 'group',
    from: group_msg_sender,
    to: group_msg_group_id,
    sendAt: group_msg_sent_at,
    content: group_msg_content,
  };
};

const MessageService = {
  /**
   * 发送群聊消息
   *
   * @param {GroupMessage} message 待发送的消息
   * @return {Promise<void>}
   */
  async groupMessageSender(message: GroupMessage): Promise<void> {
    logger.info(
      `Sending group message: [${message.from} -> ${message.to}: ${message.sendAt}]\n${message.content}`
    );

    await this.addMessageToRecords(message);

    const messageQueue = await amqp.connect(configuration.rabbitmq);
    const channel = await messageQueue.createChannel();

    const groupId = convertGroupIdToString(message.to);

    // 确保交换机存在
    await channel.assertExchange(groupId, 'fanout', { durable: true });

    // 发布消息到该交换机
    channel.publish(groupId, '', Buffer.from(JSON.stringify(message)), {
      persistent: true,
    });

    await channel.close();
    await messageQueue.close();
  },

  /**
   * 发送私聊消息
   *
   * @param {PrivateMessage} message 待发送的消息
   * @return {Promise<void>}
   */
  async privateMessageSender(message: PrivateMessage): Promise<void> {
    logger.info(
      `Sending private message: [${message.from} -> ${message.to}: ${message.sendAt}]\n${message.content}`
    );

    await this.addMessageToRecords(message);

    const messageQueue = await amqp.connect(configuration.rabbitmq);
    const channel = await messageQueue.createChannel();

    // 断言对应的用户队列存在
    await channel.assertQueue(message.from, { durable: true });
    await channel.assertQueue(message.to, { durable: true });

    // 发送消息给对应用户
    channel.sendToQueue(message.from, Buffer.from(JSON.stringify(message)), {
      persistent: true,
    });
    channel.sendToQueue(message.to, Buffer.from(JSON.stringify(message)), {
      persistent: true,
    });

    await channel.close();
    await messageQueue.close();
  },

  /**
   * 获取某个用户在特定时间往后的所有消息记录，按时间排序
   *
   * @param {UserData['user_id']} userId 该用户的 ID
   * @param {Date} startDate 需要被提取的消息记录的起始时间
   * @return {Promise<(PrivateMessage | GroupMessage)[]>} 查询得到的所有消息记录，按照时间排序
   */
  async getMessageRecordsAfter(
    userId: UserData['user_id'],
    startDate: Date
  ): Promise<(PrivateMessage | GroupMessage)[]> {
    const privateMessageRecords = await Database.from('private_message')
      .column(
        'private_msg_sender',
        'private_msg_receiver',
        'private_msg_sent_at',
        'private_msg_content'
      )
      .where('private_msg_sent_at', '>', startDate)
      .where((builder) =>
        builder
          .where('private_msg_receiver', userId)
          .orWhere('private_msg_sender', userId)
      )
      .orderBy('private_msg_sent_at', 'asc');

    const groupMessageRecords = await Database.from('group_message')
      .join(
        'group_members',
        'group_members.group_members_group_id',
        'group_message.group_msg_group_id'
      )
      .column(
        'group_msg_sender',
        'group_msg_group_id',
        'group_msg_sent_at',
        'group_msg_content'
      )
      .where('group_msg_sent_at', '>', startDate)
      .where('group_members_user_id', userId)
      .andWhere('group_members_status', 'JOINED')
      .orderBy('group_msg_sent_at', 'asc');

    const records = [
      ...privateMessageRecords.map(privateMessageParser),
      ...groupMessageRecords.map(groupMessageParser),
    ];

    records.sort((lhs, rhs) => lhs.sendAt.getTime() - rhs.sendAt.getTime());

    if (records.length > 0) {
      const lastMessage = records[records.length - 1];
      await this.setLastReadTime(userId, lastMessage.sendAt);
    } else {
      await this.setLastReadTime(userId, new Date());
    }

    return records;
  },

  /**
   * 设置某个用户最后一次拉取历史记录时，拉取的记录中最晚的时间，若没有拉取到任何记录，则该时间为拉取时间
   *
   * @param {string} userId 该用户的 ID
   * @param {Date} date 被设置的时间
   * @return {Promise<void>}
   */
  async setLastReadTime(userId: string, date: Date): Promise<void> {
    await Database.from('read_status')
      .where('read_status_user_id', userId)
      .update('read_status_last_read', date);
  },

  /**
   * 获取某个用户最近拉取历史记录的时间
   *
   * @param {string} userId 该用户的 ID
   * @return {Promise<Date>}
   */
  async getLastReadTime(userId: string): Promise<Date> {
    const result = await Database.from('read_status')
      .column('read_status_last_read')
      .where('read_status_user_id', userId);

    if (result.length !== 1) {
      const now = new Date();
      await this.setLastReadTime(userId, now);
      return now;
    }

    return result[0].read_status_last_read;
  },

  /**
   * 添加一条消息到消息记录中
   *
   * @param {PrivateMessage | GroupMessage} message 待添加的消息
   * @return {void}
   */
  async addMessageToRecords(
    message: PrivateMessage | GroupMessage
  ): Promise<void> {
    if (message.type === 'private') {
      const messageRecord: Omit<PrivateMessageData, 'private_msg_id'> = {
        private_msg_sender: message.from,
        private_msg_receiver: message.to,
        private_msg_content: message.content,
        private_msg_sent_at: message.sendAt,
      };

      return await Database.from('private_message').insert(messageRecord);
    }

    const messageRecord: Omit<GroupMessageData, 'group_msg_id'> = {
      group_msg_sender: message.from,
      group_msg_group_id: message.to,
      group_msg_content: message.content,
      group_msg_sent_at: message.sendAt,
    };

    return await Database.from('group_message').insert(messageRecord);
  },
};

export default MessageService;
