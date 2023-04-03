import { Router } from 'express';
import verificationCodeSender from '../service/mail';
import Joi from 'joi';
import {
  emailSchema,
  passwordSchema,
  userIdSchema,
  verificationCodeSchema,
} from '../schemas/user';
import { User } from 'request/data';
import { UserData } from 'knex/types/tables';
import { getRandomVerificationCode } from '../util/utils';
import redis from '../util/redis';
import Config from '../util/config';
import responseWrapper from '../util/response_wrapper';
import UserService from '../service/user';

const router = Router();

interface RequestType {
  '/verify/email': Pick<User, 'email'>;
  '/': User & { code: string };
}

const requestSchema = {
  '/verify/email': Joi.object<RequestType['/verify/email']>({
    email: emailSchema.required(),
  }),
  '/': Joi.object<RequestType['/']>({
    userId: userIdSchema.required(),
    password: passwordSchema.required(),
    email: emailSchema.required(),
    code: verificationCodeSchema.required(),
  }),
};

// 邮箱验证
router.post('/verify/email', async (req, res) => {
  const { email } = await requestSchema['/verify/email'].validateAsync(
    req.body
  );

  // 获取验证码相关配置
  const { verificationCode } = Config;

  // 生成验证码
  const code = getRandomVerificationCode(verificationCode.length);

  // 向邮箱发送验证码
  await verificationCodeSender(email, code);

  // 将邮箱与验证码存入 redis
  redis.set(email, code, 'EX', verificationCode.expiresInSecond);

  res.json(responseWrapper('success'));
});

// 注册
router.post('/', async (req, res) => {
  const form = await requestSchema['/'].validateAsync(req.body);

  const verifyCode = await redis.get(form.email);

  // 检查验证码是否正确
  if (verifyCode !== form.code) {
    throw new Error('incorrect verification code');
  }

  const user: UserData = {
    user_id: form.userId,
    user_password: form.password,
    user_email: form.email,
  };

  // 向数据库添加用户
  await UserService.addUser(user);

  // 删除验证码缓存
  await redis.del(form.email)

  res.json(responseWrapper('success'));
});

export default router;
