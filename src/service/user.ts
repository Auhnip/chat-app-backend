/*
 * @Author       : wqph
 * @Date         : 2023-03-30 22:24:39
 * @LastEditors  : wqph auhnipuiq@163.com
 * @LastEditTime : 2023-05-31 00:17:09
 * @FilePath     : \backend\src\service\user.ts
 * @Description  : 用户管理服务
 */

import { User } from 'request/data';
import Database from './base/database';
import { FriendsData, GroupMembersData, UserData } from 'knex/types/tables';

const userDataConvertor = (user: User): UserData => {
  return {
    user_id: user.userId,
    user_email: user.email,
    user_password: user.password,
    user_created_at: user.createdAt,
    user_avatar: null,
  };
};

const userParser = (userData: UserData): User => {
  return {
    userId: userData.user_id,
    email: userData.user_email,
    password: userData.user_password,
    createdAt: userData.user_created_at,
    avatar: userData.user_avatar ?? undefined,
  };
};

const UserService = {
  /**
   * 通过 ID 查找指定用户的密码
   *
   * @param {string} id 待查找密码的用户 ID
   * @return {Promise<string | null>} 指定用户的密码，若不存在该用户则返回 null
   */
  async getPasswordById(id: string): Promise<string | null> {
    return await Database.select()
      .from('user')
      .where('user_id', id)
      .then((result) => {
        if (result.length !== 1) {
          return null;
        }

        return result[0].user_password;
      });
  },

  /**
   * 添加一个用户
   *
   * @param {User} user 待添加的用户
   * @return {Promise<void>}
   */
  async addUser(user: User): Promise<void> {
    const userData = userDataConvertor(user);

    await Database.from('user').insert(userData);
    await Database.from('read_status').insert({
      read_status_user_id: user.userId,
      read_status_last_read: new Date(),
    });
  },

  /**
   * 更新一个用户的信息
   *
   * @param {(Pick<User, 'userId' | 'avatar'>)} user 需要更新的用户信息
   * @return {Promise<void>}
   */
  async updateUser(user: Pick<User, 'userId' | 'avatar'>): Promise<void> {
    const userData: Partial<UserData> = {
      user_avatar: user.avatar,
    };

    return await Database.from('user')
      .where('user_id', user.userId)
      .update(userData);
  },

  /**
   * 获取用户的详细信息
   *
   * @param {string} userId 想要查询的用户 ID
   * @return {(Promise<User | null>)} 用户的详细个人信息
   */
  async getUserDetails(userId: string): Promise<User | null> {
    const userData = await Database.from('user').where('user_id', userId);

    if (userData.length !== 1) {
      return null;
    }

    return userParser(userData[0]);
  },

  /**
   * 检查一个 email 是否被注册
   *
   * @param {UserData['user_email']} email 待检查的 email 地址
   * @return {boolean} 该 email 是否已被注册
   */
  async hasEmail(email: UserData['user_email']) {
    const emailEquals = await Database.from('user')
      .select('user_email')
      .where('user_email', email);

    return emailEquals.length === 1;
  },

  /**
   * 获取某用户不同状态的好友
   *
   * @param {UserData['user_id']} id 要检查的用户
   * @param {FriendsData['friends_status']} status 要筛选的好友状态
   * @return {Promise<{user_id: string; user_avatar: string}[]>} 指定用户的指定状态的好友的 ID 和头像 URL 组成的数组
   */
  async getAllFriendsByStatus(
    id: UserData['user_id'],
    status: FriendsData['friends_status']
  ): Promise<{ userId: string; userAvatar: string }[]> {
    return await Database.from('friends')
      .column({ userId: 'friends_user_id_1', userAvatar: 'user.user_avatar' })
      .join('user', 'user.user_id', 'friends_user_id_1')
      .where('friends_user_id_2', id)
      .andWhere('friends_status', status)
      .union([
        Database.from('friends')
          .column({
            userId: 'friends_user_id_2',
            userAvatar: 'user.user_avatar',
          })
          .join('user', 'user.user_id', 'friends_user_id_2')
          .where('friends_user_id_1', id)
          .andWhere('friends_status', status),
      ]);
  },

  /**
   * 获取用户不同状态的群聊
   *
   * @param {UserData['user_id']} id 要检查的用户
   * @param {GroupMembersData['group_members_status']} status 要筛选的群聊状态
   * @return {Promise<{ groupId: number; groupName: string; groupAvatar: string }[]>} 哪些群聊里面，该用户在群中为指定状态。返回由这些群聊 ID 和头像 URL 组成的数组
   */
  async getAllGroupsByStatus(
    id: UserData['user_id'],
    status: GroupMembersData['group_members_status']
  ): Promise<{ groupId: number; groupName: string; groupAvatar: string }[]> {
    return await Database.from('group_members')
      .join('group', 'group.group_id', 'group_members.group_members_group_id')
      .column({
        groupId: 'group.group_id',
        groupName: 'group.group_name',
        groupAvatar: 'group.group_avatar',
      })
      .where('group_members_user_id', id)
      .andWhere('group_members_status', status);
  },
};

export default UserService;
