import { FriendsData } from 'knex/types/tables';
import Database from './base/database';
import { StatusError } from '../util/response_wrapper';

const getRecordsBetween = (self: string, others: string) =>
  Database.from('friends')
    .where((builder) =>
      builder
        .where('friends_user_id_1', self)
        .andWhere('friends_user_id_2', others)
    )
    .orWhere((builder) =>
      builder
        .where('friends_user_id_1', others)
        .andWhere('friends_user_id_2', self)
    );

const FriendsService = {
  async getStatusBetween(self: string, others: string) {
    const result = await getRecordsBetween(self, others).column({
      user1: 'friends_user_id_1',
      user2: 'friends_user_id_2',
      status: 'friends_status',
    });

    if (result.length > 1) {
      throw new StatusError(
        `Multiple friend records for User ${self} and User ${others} exist in the database`,
        'database error'
      );
    }

    return result.length === 1 ? result[0] : null;
  },

  async requestForFriends(self: string, others: string) {
    const statusBetween = await getRecordsBetween(self, others);
    if (statusBetween.length && statusBetween[0].friends_status === 'AGREED') {
      throw new StatusError(
        `Friend records for user ${self} and user ${others} already exist in the database`,
        'database error'
      );
    }

    if (statusBetween.length) {
      return await getRecordsBetween(self, others).update({
        friends_status: 'WAITING',
      });
    }

    return await Database.from('friends').insert({
      friends_user_id_1: self,
      friends_user_id_2: others,
      friends_status: 'WAITING',
      friends_request_time: new Date(),
    });
  },

  async responseForFriends(
    self: string,
    others: string,
    status: 'AGREED' | 'REJECTED'
  ) {
    const result = await Database.from('friends')
      .where('friends_user_id_1', others)
      .andWhere('friends_user_id_2', self)
      .update({
        friends_status: status,
        friends_response_time: new Date(),
      });

    if (result !== 1) {
      throw new StatusError(
        `No records found for user ${others}'s friend request to user ${self}`,
        'database error'
      );
    }
  },

  async deleteFriends(self: string, others: string) {
    const result = await getRecordsBetween(self, others).del();

    if (result > 1) {
      throw new StatusError(
        `Multiple friend records for User ${self} and User ${others} exist in the database`,
        'database error'
      );
    }

    if (result === 0) {
      throw new StatusError(
        `No friend records between User ${self} and User ${others} exist`,
        'database error'
      );
    }
  },
};

export default FriendsService;
