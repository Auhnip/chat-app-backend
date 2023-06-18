import { Router } from 'express';
import Joi from 'joi';
import { StatusError, responseWrapper } from '../util/response_wrapper';
import { generateAccessToken, verifyToken } from '../service/token';

const router = Router();

interface RequestType {
  '/verify': { token: string };
  '/refresh': { refreshToken: string };
}

const requestSchema = {
  '/verify': Joi.object<RequestType['/verify']>({
    token: Joi.string().required(),
  }),
  '/refresh': Joi.object<RequestType['/refresh']>({
    refreshToken: Joi.string().required(),
  }),
};

router.post('/verify', async (req, res) => {
  const { token } = await requestSchema['/verify'].validateAsync(req.body);

  const payload = await verifyToken(token);

  res.json(responseWrapper('success', payload));
});

router.post('/refresh', async (req, res) => {
  const { refreshToken } = await requestSchema['/refresh'].validateAsync(
    req.body
  );

  const { grantType, userId } = await verifyToken(refreshToken);

  if (grantType !== 'refresh') {
    throw new StatusError('token type error', 'params invalid');
  }

  const accessToken = generateAccessToken(userId);

  res.json(responseWrapper('success', { userId, accessToken }));
});

export default router;
