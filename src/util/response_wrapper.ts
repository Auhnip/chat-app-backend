const statusCodeMap = {
  // 成功
  'success': 1000,
  // 未知错误
  'failed': 2000,
  // 数据库访问错误
  'database error': 2001,
  // 请求体内容不合规范
  'malformed request': 2002,
  // token 鉴权错误
  'unauthorized': 2003,
  // 请求的参数错误
  'params invalid': 2004,
  // 服务器内部逻辑错误导致无法继续执行操作
  'internal error': 2005,
} as const;

type StatusMessageType = keyof typeof statusCodeMap;

const responseWrapper = (statusMessage: StatusMessageType, data?: unknown) => {
  return {
    code: statusCodeMap[statusMessage],
    message: statusMessage,
    data,
  };
};

class StatusError extends Error {
  status: StatusMessageType;

  constructor(message: string, status: StatusMessageType) {
    super(message);
    this.name = StatusError.name;
    this.status = status;
  }
}

export { responseWrapper, StatusError };
