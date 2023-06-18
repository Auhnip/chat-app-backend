import e, { Response, Router } from 'express';
import Joi from 'joi';
import { Request as JWTRequest } from 'express-jwt';
import { userIdSchema } from '../schemas/user';
import FriendsService from '../service/friends';
import { PayloadType } from '../service/token';
import { responseWrapper } from '../util/response_wrapper';
import logger from '../util/logger';

const router = Router();

interface RequestType {
  ['/relation']: { others: string };
  ['/delete']: { others: string };
  ['/request']: { others: string };
  ['/response']: { others: string; response: 'AGREED' | 'REJECTED' };
}

const requestSchema = {
  ['/relation']: Joi.object<RequestType['/relation']>({
    others: userIdSchema.required(),
  }),
  ['/delete']: Joi.object<RequestType['/delete']>({
    others: userIdSchema.required(),
  }),
  ['/request']: Joi.object<RequestType['/request']>({
    others: userIdSchema.required(),
  }),
  ['/response']: Joi.object<RequestType['/response']>({
    others: userIdSchema.required(),
    response: Joi.string().valid('AGREED', 'REJECTED').required(),
  }),
};

type Relation =
  | 'Stranger' // 陌生人
  | 'Requested' // 已向对方发送好友申请
  | 'Pending' // 收到对方的好友申请还未回复
  | 'Rejected' // 向对方发送了好友申请但被拒绝
  | 'Declined' // 拒绝了对方的好友申请
  | 'Accepted'; // 已成为好友

router.post('/relation', async (req: JWTRequest, res: Response) => {
  const { userId: self } = req.auth as PayloadType;
  const { others } = await requestSchema['/relation'].validateAsync(req.body);

  const result = await FriendsService.getStatusBetween(self, others);

  let relation: Relation = 'Stranger';

  if (result) {
    const { user1, status } = result;
    if (status === 'AGREED') {
      relation = 'Accepted';
    } else if (status === 'WAITING') {
      if (self === user1) {
        relation = 'Requested';
      } else {
        relation = 'Pending';
      }
    } else if (status === 'REJECTED') {
      if (self === user1) {
        relation = 'Rejected';
      } else {
        relation = 'Declined';
      }
    }
  }

  res.json(responseWrapper('success', { relation }));
});

router.post('/delete', async (req: JWTRequest, res: Response) => {
  const { userId: self } = req.auth as PayloadType;
  const { others } = await requestSchema['/delete'].validateAsync(req.body);

  await FriendsService.deleteFriends(self, others);

  res.json(responseWrapper('success'));
});

router.post('/request', async (req: JWTRequest, res: Response) => {
  const { userId: self } = req.auth as PayloadType;
  const { others } = await requestSchema['/request'].validateAsync(req.body);

  await FriendsService.requestForFriends(self, others);

  logger.info(
    `Friend records between user ${self} and user ${others} have been added.`
  );

  res.json(responseWrapper('success'));
});

router.post('/response', async (req: JWTRequest, res: Response) => {
  const { userId: self } = req.auth as PayloadType;
  const { others, response } = await requestSchema['/response'].validateAsync(
    req.body
  );

  await FriendsService.responseForFriends(self, others, response);

  res.json(responseWrapper('success'));
});

export default router;
