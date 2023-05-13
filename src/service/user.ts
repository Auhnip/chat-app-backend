/*
 * @Author       : wqph
 * @Date         : 2023-03-30 22:24:39
 * @LastEditors  : wqph auhnipuiq@163.com
 * @LastEditTime : 2023-05-12 00:58:31
 * @FilePath     : \backend\src\service\user.ts
 * @Description  : 用户管理服务
 */

import { User } from 'request/data';
import Database from '../util/database';
import { FriendsData, UserData } from 'knex/types/tables';

const userDataConvertor = (user: User): UserData => {
  return {
    user_id: user.userId,
    user_email: user.email,
    user_password: user.password,
  };
};

const UserService = {
  /**
   * 通过 ID 查找指定用户的密码
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
   * @param {User} user 待添加的用户
   * @return {Promise<void>}
   */
  async addUser(user: User): Promise<void> {
    const userData = userDataConvertor(user);

    return await Database.from('user').insert(userData);
  },

  /**
   * 检查一个 email 是否被注册
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
   * @param {UserData['user_id']} id 要检查的用户
   * @param {FriendsData['friends_status']} status 要筛选的好友状态
   * @return {Promise<{user_id: string}[]>} 指定用户的指定状态的好友的 ID 组成的数组
   */
  async getAllFriendsByStatus(
    id: UserData['user_id'],
    status: FriendsData['friends_status']
  ): Promise<{ user_id: string }[]> {
    return await Database.from('friends')
      .column({ user_id: 'friends_user_id_1' })
      .where('friends_user_id_2', id)
      .andWhere('friends_status', status)
      .union([
        Database.from('friends')
          .column({ user_id: 'friends_user_id_2' })
          .where('friends_user_id_1', id)
          .andWhere('friends_status', status),
      ]);
  },
};

export default UserService;
