import { NextFunction, Request, Response } from 'express';
import logger from '../util/logger';

const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const contentType = req.get('Content-Type') ?? 'No content';
  logger.info(`[Request] ${req.method} ${req.path} [${contentType}]`);
  next();
};

export default requestLogger;
