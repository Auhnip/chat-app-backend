import { Response, Router } from 'express';
import { Request as JWTRequest } from 'express-jwt';
import { PayloadType } from '../service/token';
import Joi from 'joi';
import { userIdSchema } from '../schemas/user';
import PublicService from '../service/public';
import { responseWrapper } from '../util/response_wrapper';
import { groupIdSchema } from '../schemas/group';

const router = Router();

interface RequestType {
  '/avatar/user': { userId: string };
  '/avatar/group': { groupId: number };
}

const requestSchema = {
  '/avatar/user': Joi.object<RequestType['/avatar/user']>({
    userId: userIdSchema.required(),
  }),
  '/avatar/group': Joi.object<RequestType['/avatar/group']>({
    groupId: groupIdSchema.required(),
  }),
};

router.post('/avatar/user', async (req: JWTRequest, res: Response) => {
  const { userId } = await requestSchema['/avatar/user'].validateAsync(
    req.body
  );

  const avatar = await PublicService.getUserAvatarUrl(userId);

  res.json(responseWrapper('success', { avatar }));
});

router.post('/avatar/group', async (req: JWTRequest, res: Response) => {
  const { groupId } = await requestSchema['/avatar/group'].validateAsync(
    req.body
  );

  const avatar = await PublicService.getGroupAvatarUrl(groupId);

  res.json(responseWrapper('success', { avatar }));
});

export default router;
