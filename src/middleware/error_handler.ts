import type { Request, Response, NextFunction } from 'express';
import responseWrapper from '../util/response_wrapper';
import logger from '../util/logger';

// 错误处理程序，用于处理身份验证错误
const ErrorHandler = function (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  let handled = false;

  switch (err.name) {
    // 身份验证错误
    case 'UnauthorizedError':
      res.status(401).json(responseWrapper('unauthorized'));
      handled = true;
      break;
    // 数据验证错误
    case 'ValidationError':
      res.json(responseWrapper('malformed request'));
      handled = true;
      break;
    // 数据库读写错误
    case 'DatabaseAccessError':
      res.json(responseWrapper('database error'));
      handled = true;
      break;
    // 操作错误
    default:
      res.json(responseWrapper('failed', { errorMessage: err.message }));
      handled = true;
      break;
  }

  logger.warn(`${err.name}:${err.message}`);

  // 其他错误，调用下一个错误处理程序处理
  if (!handled) {
    next(err);
  }
};

export default ErrorHandler;
