import configuration from '../util/config';
import { convertGroupIdToString } from '../util/utils';
import amqp from 'amqplib';

const QueueService = {
  async setUserToGroupBinding(userId: string, groupId: number, bind: boolean) {
    const connection = await amqp.connect(configuration.rabbitmq);
    const channel = await connection.createChannel();

    await channel.assertExchange(convertGroupIdToString(groupId), 'fanout', {
      durable: true,
    });
    await channel.assertQueue(userId, { durable: true });

    if (bind) {
      await channel.bindQueue(userId, convertGroupIdToString(groupId), '');
    } else {
      await channel.unbindQueue(userId, convertGroupIdToString(groupId), '');
    }

    await channel.close();
    await connection.close();
  },
};

export default QueueService;
