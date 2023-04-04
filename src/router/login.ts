import { Router } from 'express';
import Joi from 'joi';
import UserService from '../service/user';
import { StatusError, responseWrapper } from '../util/response_wrapper';
import { generateAccessToken, generateRefreshToken } from '../util/token';
import { User } from 'request/data';
import { passwordSchema, userIdSchema } from '../schemas/user';

const router = Router();

interface RequestType {
  '/': Pick<User, 'userId' | 'password'>;
}

const requestSchema = {
  '/': Joi.object<RequestType['/']>({
    userId: userIdSchema.required(),
    password: passwordSchema.required(),
  }),
};

router.post('/', async (req, res) => {
  const user = await requestSchema['/'].validateAsync(req.body);

  const password = await UserService.getPasswordById(user.userId);

  // 不存在该用户或该用户密码错误
  if (!password || password !== user.password) {
    throw new StatusError('wrong user name or password', 'params invalid');
  }

  // 验证通过
  const accessToken = generateAccessToken(user.userId);
  const refreshToken = generateRefreshToken(user.userId);

  res.json(responseWrapper('success', { accessToken, refreshToken }));
});

export default router;
