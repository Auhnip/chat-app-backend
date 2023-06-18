import Joi from 'joi';
import jwt, { JwtPayload } from 'jsonwebtoken';

import Config from '../util/config';

const JWT_SECRET = Config.jwtToken.secret;

export interface PayloadType extends JwtPayload {
  grantType: 'access' | 'refresh';
  userId: string;
}

export const payloadSchema = Joi.object<PayloadType>({
  grantType: Joi.string()
    .required()
    .pattern(/^(access|refresh)$/),
  userId: Joi.string().min(2).max(25).required(),
  // offical properties
  iss: Joi.string(),
  sub: Joi.string(),
  aud: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())),
  exp: Joi.number(),
  nbf: Joi.number(),
  iat: Joi.number(),
  jti: Joi.string(),
});

// 生成 access token
export function generateAccessToken(userId: string): string {
  const payload: PayloadType = {
    grantType: 'access',
    userId,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });
}

// 生成 refresh token
export function generateRefreshToken(userId: string): string {
  const payload: PayloadType = {
    grantType: 'refresh',
    userId,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: '90d' });
}

// 验证一个 jwt 令牌及其 payload 是否合法
export async function verifyToken(token: string) {
  const decoded = jwt.verify(token, JWT_SECRET);

  const payload = await payloadSchema.validateAsync(decoded);

  return payload;
}
