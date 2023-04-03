// 自定义错误类型

export class DatabaseAccessError extends Error {
  reason: unknown;

  constructor(message: string, reason: unknown) {
    super(message);
    this.name = DatabaseAccessError.name;
    this.reason = reason;
  }
}
