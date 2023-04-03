const statusCodeMap = {
  'success': 1000,
  'failed': 2000,
  'database error': 2001,
  'malformed request': 2002,
  'unauthorized': 2003,
} as const;

type StatusMessageType = keyof typeof statusCodeMap;

const responseWrapper = (statusMessage: StatusMessageType, data?: unknown) => {
  return {
    code: statusCodeMap[statusMessage],
    message: statusMessage,
    data,
  };
};

export default responseWrapper;
