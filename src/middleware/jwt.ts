import { NextFunction, Response } from 'express';
import {
  expressjwt,
  Request as JWTRequest,
  UnauthorizedError,
} from 'express-jwt';
import { unless } from 'express-unless';
import Config from '../util/config';
import { payloadSchema } from '../util/token';

const startBy = (paths: string[]) =>
  paths.map((path) => new RegExp(`^\\/${path}(\\/\\w*)*$`));

// 不适用 jwt 验证的路由
const unlessOptions = {
  path: startBy(['signup', 'login', 'token', 'ws']),
};

// 验证 token 是否有效
const JwtVerifier = expressjwt({
  secret: Config.jwtToken.secret,
  algorithms: [Config.jwtToken.algorithm],
  // 指定不适用 JWT Token 验证的路由
}).unless(unlessOptions);

// 验证 payload 是否合法
const PayloadVerifier = (() => {
  const verifier = async (
    req: JWTRequest,
    res: Response,
    next: NextFunction
  ) => {
    const payload = await payloadSchema.validateAsync(req.auth);

    let err;

    // 若 token 不为 access token 则验证错误
    if (payload.grantType !== 'access') {
      err = new UnauthorizedError('invalid_token', {
        message: 'token type error',
      });
    }

    next(err);
  };

  verifier.unless = unless;

  return verifier;
})().unless(unlessOptions);

export { JwtVerifier, PayloadVerifier };
