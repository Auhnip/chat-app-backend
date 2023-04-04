import type { Request, Response, NextFunction } from 'express';
import { responseWrapper, StatusError } from '../util/response_wrapper';
import logger from '../util/logger';

// 错误处理程序，用于处理身份验证错误
const ErrorHandler = function (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // 身份验证错误
  if (err.name === 'UnauthorizedError') {
    res.status(401).json(responseWrapper('unauthorized'));
  }
  // 数据验证错误
  else if (err.name === 'ValidationError') {
    res.json(responseWrapper('malformed request'));
  }
  // 数据库读写错误
  else if (err.sqlMessage) {
    logger.error(JSON.stringify(err));
    res.json(responseWrapper('database error'));
    // 其他需要返回错误码的错误
  } else if (err instanceof StatusError) {
    res.json(responseWrapper(err.status));
  }
  // 未知错误
  else {
    res.json(responseWrapper('failed'));
  }

  logger.error(`${err.name}: ${err.message}`);
};

export default ErrorHandler;
