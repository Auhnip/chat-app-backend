import { NextFunction, Request, Response } from 'express';
import logger from '../util/logger';

const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  logger.info(
    `[Request] ${req.method} ${req.path} [${req.get('Content-Type')}]`
  );
  next();
};

export default requestLogger;
