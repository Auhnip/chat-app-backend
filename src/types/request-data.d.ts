declare module 'request/data' {
  export interface User {
    userId: string;
    password: string;
    email: string;
    createdAt: Date;
    avatar?: string;
  }

  export interface Group {
    groupId: number;
    name: string;
    description: string | null;
    owner: string;
    createdAt: Date;
    avatar: string | null;
  }
}
