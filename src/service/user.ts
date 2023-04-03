import Database from '../util/database';
import { DatabaseAccessError } from '../util/custom_error';
import { UserData } from 'knex/types/tables';

class UserService {
  static async getPasswordById(id: string): Promise<string | null> {
    return await Database.select()
      .from('user')
      .where('user_id', id)
      .then((result) => {
        if (result.length !== 1) {
          return null;
        }

        return result[0].user_password;
      })
      .catch((reason) => {
        throw new DatabaseAccessError('database access error', reason);
      });
  }

  static async addUser(user: UserData) {
    return await Database.from('user').insert(user);
  }
}

export default UserService;
