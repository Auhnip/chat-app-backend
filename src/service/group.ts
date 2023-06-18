import { GroupData } from 'knex/types/tables';
import Database from './base/database';
import { StatusError } from '../util/response_wrapper';
import { Group } from 'request/data';

const groupParser = ({
  group_id,
  group_name,
  group_description,
  group_owner,
  group_created_at,
  group_avatar,
}: GroupData): Group => {
  return {
    groupId: group_id,
    name: group_name,
    description: group_description,
    owner: group_owner,
    createdAt: group_created_at,
    avatar: group_avatar,
  };
};

const GroupService = {
  async getGroupDetails(groupId: number): Promise<Group> {
    const result = await Database.from('group').where('group_id', groupId);

    if (result.length > 1) {
      throw new StatusError(
        'There are two or more group chats with the same ID',
        'database error'
      );
    }

    if (result.length === 0) {
      throw new StatusError(
        'There is no group chat with the specified ID',
        'params invalid'
      );
    }

    return groupParser(result[0]);
  },

  async memberStatus(groupId: number, userId: string) {
    const result = await Database.from('group_members')
      .column('group_members_status')
      .where('group_members_group_id', groupId)
      .andWhere('group_members_user_id', userId);

    if (result.length > 1) {
      throw new StatusError(
        'There are two or more member status with the same ID',
        'database error'
      );
    }

    if (result.length === 0) {
      return null;
    }

    return result[0].group_members_status;
  },

  async requestJoin(groupId: number, userId: string) {
    const status = await this.memberStatus(groupId, userId);

    if (status === 'REJECTED') {
      return await Database.from('group_members')
        .where('group_members_group_id', groupId)
        .andWhere('group_members_user_id', userId)
        .update({
          group_members_status: 'WAITING',
        });
    }

    return await Database.from('group_members').insert({
      group_members_group_id: groupId,
      group_members_user_id: userId,
      group_members_status: 'WAITING',
      group_members_request_time: new Date(),
    });
  },

  async responseJoin(groupId: number, userId: string, isAgree: boolean) {
    return await Database.from('group_members')
      .where('group_members_group_id', groupId)
      .andWhere('group_members_user_id', userId)
      .update(
        isAgree
          ? {
              group_members_status: 'JOINED',
              group_members_joined_at: new Date(),
            }
          : {
              group_members_status: 'REJECTED',
            }
      );
  },

  async quitGroup(groupId: number, userId: string) {
    return await Database.from('group_members')
      .where('group_members_group_id', groupId)
      .andWhere('group_members_user_id', userId)
      .del();
  },

  async requestList(userId: string) {
    return await Database.from('group')
      .join(
        'group_members',
        'group_members.group_members_group_id',
        'group.group_id'
      )
      .column({
        groupId: 'group_id',
        groupName: 'group_name',
        userId: 'group_members_user_id',
        requestTime: 'group_members_request_time',
      })
      .where('group_owner', userId)
      .andWhere('group_members_status', 'WAITING')
      .orderBy('group_members_request_time', 'asc');
  },

  async createGroup(
    userId: string,
    groupName: string,
    groupDescription: string
  ) {
    return await Database.transaction(async (trx) => {
      const ids = await trx.from('group').insert({
        group_name: groupName,
        group_description: groupDescription,
        group_owner: userId,
        group_created_at: new Date(),
      });

      const groupId = ids[0] as number;
      const now = new Date();
      await trx('group_members').insert({
        group_members_group_id: groupId,
        group_members_request_time: now,
        group_members_user_id: userId,
        group_members_joined_at: now,
        group_members_status: 'JOINED',
      });

      return groupId;
    });
  },
};

export default GroupService;
