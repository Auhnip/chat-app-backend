import Database from '../util/database';
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
      });
  }

  static async addUser(user: UserData) {
    return await Database.from('user').insert(user);
  }

  static async hasEmail(email: UserData['user_email']) {
    const emailEquals = await Database.from('user')
      .select('user_email')
      .where('user_email', email);

    return emailEquals.length === 1;
  }
}

export default UserService;
