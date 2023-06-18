import { Knex } from 'knex';

declare module 'knex/types/tables' {
  interface UserData {
    user_id: string;
    user_password: string;
    user_email: string;
    user_created_at: Date;
    user_avatar: string | null;
  }

  interface GroupData {
    group_id: number;
    group_name: string;
    group_description: string | null;
    group_owner: string;
    group_created_at: Date;
    group_avatar: string | null;
  }

  interface FriendsData {
    friends_id: number;
    friends_user_id_1: string;
    friends_user_id_2: string;
    friends_status: 'AGREED' | 'REJECTED' | 'WAITING';
    friends_request_time: Date;
    friends_response_time: Date;
  }

  interface GroupMessageData {
    group_msg_id: string;
    group_msg_group_id: number;
    group_msg_sender: string;
    group_msg_sent_at: Date;
    group_msg_content: string;
  }

  interface PrivateMessageData {
    private_msg_id: number;
    private_msg_sender: string;
    private_msg_receiver: string;
    private_msg_sent_at: Date;
    private_msg_content: string;
  }

  interface GroupMembersData {
    group_members_group_id: number;
    group_members_user_id: string;
    group_members_status: 'JOINED' | 'WAITING' | 'REJECTED';
    group_members_nickname: string;
    group_members_request_time: Date;
    group_members_joined_at: Date;
  }

  interface ReadStatusData {
    read_status_id: number;
    read_status_user_id: string;
    read_status_last_read: Date;
  }

  interface Tables {
    // For more advanced types, you can specify separate type
    // for base model, "insert" type and "update" type.
    ['user']: Knex.CompositeTableType<
      // This interface will be used for return type and
      // `where`, `having` etc where full type is required
      UserData,
      // Specifying "insert" type will also make sure
      // data matches interface in full. Meaning
      // if interface is `{ a: string, b: string }`,
      // `insert({ a: '' })` will complain about missing fields.
      UserData,
      // This interface is used for "update()" calls.
      // As opposed to regular specifying interface only once,
      // when specifying separate update interface, user will be
      // required to match it  exactly. So it's recommended to
      // provide partial interfaces for "update". Unless you want to always
      // require some field (e.g., `Partial<User> & { updated_at: string }`
      // will allow updating any field for User but require updated_at to be
      // always provided as well.
      //
      // For example, this wil allow updating all fields except "id".
      // "id" will still be usable for `where` clauses so
      //      knex('users_composite')
      //      .update({ name: 'name2' })
      //      .where('id', 10)`
      // will still work.
      // Defaults to Partial "insert" type
      Partial<UserData>
    >;

    ['group']: Knex.CompositeTableType<
      GroupData,
      Omit<GroupData, 'group_id' | 'group_avatar'>,
      Partial<Omit<GroupData, 'group_id'>>
    >;

    ['friends']: Knex.CompositeTableType<
      FriendsData,
      Omit<
        FriendsData,
        'friends_id' | 'friends_response_time' | 'friends_status'
      > & { friends_status: 'WAITING' },
      Partial<
        Pick<
          FriendsData,
          'friends_status' | 'friends_response_time' | 'friends_request_time'
        >
      >
    >;

    ['private_message']: Knex.CompositeTableType<
      PrivateMessageData,
      Omit<PrivateMessageData, 'private_msg_id'>,
      {}
    >;

    ['group_message']: Knex.CompositeTableType<
      GroupMessageData,
      Omit<GroupMessageData, 'group_msg_id'>,
      {}
    >;

    ['group_members']: Knex.CompositeTableType<
      GroupMembersData,
      Omit<
        GroupMembersData,
        'group_members_nickname' | 'group_members_joined_at'
      > &
        Partial<
          Pick<
            GroupMembersData,
            'group_members_nickname' | 'group_members_joined_at'
          >
        >,
      Partial<
        Pick<
          GroupMembersData,
          | 'group_members_status'
          | 'group_members_nickname'
          | 'group_members_joined_at'
        >
      >
    >;

    ['read_status']: Knex.CompositeTableType<
      ReadStatusData,
      Omit<ReadStatusData, 'read_status_id'>,
      Pick<ReadStatusData, 'read_status_last_read'>
    >;
  }
}
