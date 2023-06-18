/*
 * @Author       : wqph
 * @Date         : 2023-05-16 18:46:54
 * @LastEditors  : wqph auhnipuiq@163.com
 * @LastEditTime : 2023-05-21 14:15:48
 * @FilePath     : \backend\src\service\public.ts
 * @Description  : 公共资源访问服务
 */

import Database from './base/database';
import { StatusError } from '../util/response_wrapper';

const PublicService = {
  async getUserAvatarUrl(userId: string) {
    const result = await Database.from('user')
      .column('user_avatar')
      .where('user_id', userId);

    if (result.length > 1) {
      throw new StatusError(
        'There are two or more users with the same ID',
        'database error'
      );
    }

    if (result.length === 0) {
      return null;
    }

    return result[0].user_avatar;
  },

  async getGroupAvatarUrl(groupId: number) {
    const result = await Database.from('group')
      .column('group_avatar')
      .where('group_id', groupId);

    if (result.length > 1) {
      throw new StatusError(
        'There are two or more group chats with the same ID',
        'database error'
      );
    }

    if (result.length === 0) {
      return null;
    }

    return result[0].group_avatar;
  },
};

export default PublicService;
