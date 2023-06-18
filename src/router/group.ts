import { Response, Router, response } from 'express';
import Joi from 'joi';
import {
  groupDescriptionSchema,
  groupIdSchema,
  groupNameSchema,
} from '../schemas/group';
import { Request as JWTRequest } from 'express-jwt';
import GroupService from '../service/group';
import { responseWrapper } from '../util/response_wrapper';
import { PayloadType } from '../service/token';
import { userIdSchema } from '../schemas/user';
import amqp from 'amqplib';
import configuration from '../util/config';
import { convertGroupIdToString } from '../util/utils';
import QueueService from '../service/queue';

const router = Router();

interface RequestType {
  '/details': { groupId: number };
  '/selfstatus': { groupId: number };
  '/request': { groupId: number };
  '/response': { groupId: number; userId: string; isAgree: boolean };
  '/quit': { groupId: number };
  '/create': { groupName: string; groupDescription: string };
}

const requestSchema = {
  '/details': Joi.object<RequestType['/details']>({
    groupId: groupIdSchema.required(),
  }),
  '/selfstatus': Joi.object<RequestType['/selfstatus']>({
    groupId: groupIdSchema.required(),
  }),
  '/request': Joi.object<RequestType['/request']>({
    groupId: groupIdSchema.required(),
  }),
  '/response': Joi.object<RequestType['/response']>({
    groupId: groupIdSchema.required(),
    userId: userIdSchema.required(),
    isAgree: Joi.boolean(),
  }),
  '/quit': Joi.object<RequestType['/quit']>({
    groupId: groupIdSchema.required(),
  }),
  '/create': Joi.object<RequestType['/create']>({
    groupName: groupNameSchema.required(),
    groupDescription: groupDescriptionSchema.required(),
  }),
};

router.post('/details', async (req: JWTRequest, res: Response) => {
  const { groupId } = await requestSchema['/details'].validateAsync(req.body);

  const result = await GroupService.getGroupDetails(groupId);

  res.json(responseWrapper('success', result));
});

router.post('/selfstatus', async (req: JWTRequest, res: Response) => {
  const { userId } = req.auth as PayloadType;
  const { groupId } = await requestSchema['/selfstatus'].validateAsync(
    req.body
  );

  const result = await GroupService.memberStatus(groupId, userId);

  res.json(responseWrapper('success', { status: result }));
});

router.post('/request', async (req: JWTRequest, res: Response) => {
  const { userId } = req.auth as PayloadType;
  const { groupId } = await requestSchema['/request'].validateAsync(req.body);

  await GroupService.requestJoin(groupId, userId);

  res.json(responseWrapper('success'));
});

router.post('/response', async (req: JWTRequest, res: Response) => {
  const { groupId, userId, isAgree } = await requestSchema[
    '/response'
  ].validateAsync(req.body);

  await GroupService.responseJoin(groupId, userId, isAgree);

  if (isAgree) {
    // 将该用户的消息队列绑定到对应的交换机上
    await QueueService.setUserToGroupBinding(userId, groupId, true);
  }

  res.json(responseWrapper('success'));
});

router.post('/quit', async (req: JWTRequest, res: Response) => {
  const { userId } = req.auth as PayloadType;
  const { groupId } = await requestSchema['/quit'].validateAsync(req.body);

  await GroupService.quitGroup(groupId, userId);

  /**
   * 将该用户的消息队列从对应交换机解绑
   */
  await QueueService.setUserToGroupBinding(userId, groupId, false);

  res.json(responseWrapper('success'));
});

router.get('/requestlist', async (req: JWTRequest, res: Response) => {
  const { userId } = req.auth as PayloadType;

  const result = await GroupService.requestList(userId);

  res.json(responseWrapper('success', { list: result }));
});

router.post('/create', async (req: JWTRequest, res: Response) => {
  const { userId } = req.auth as PayloadType;
  const { groupName, groupDescription } = await requestSchema[
    '/create'
  ].validateAsync(req.body);

  const groupId = await GroupService.createGroup(
    userId,
    groupName,
    groupDescription
  );

  await QueueService.setUserToGroupBinding(userId, groupId, true);

  res.json(responseWrapper('success'));
});

export default router;
