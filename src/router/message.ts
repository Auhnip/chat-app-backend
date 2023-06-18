/*
 * @Author       : wqph
 * @Date         : 2023-05-10 19:49:46
 * @LastEditors  : wqph auhnipuiq@163.com
 * @LastEditTime : 2023-05-18 21:06:28
 * @FilePath     : \backend\src\router\message.ts
 * @Description  : 消息发送路由
 */

import Joi from 'joi';
import { userIdSchema } from '../schemas/user';
import { Response, Router } from 'express';
import { Request as JWTRequest } from 'express-jwt';
import { PayloadType } from '../service/token';
import { responseWrapper } from '../util/response_wrapper';
import MessageService from '../service/message';
import { validMessageRecordsHistoryDateRange } from '../util/utils';

type MessageFormat =
  | {
      type: 'group';
      to: number;
      content: string;
      sendAt: Date;
    }
  | {
      type: 'private';
      to: string;
      content: string;
      sendAt: Date;
    };

const messageSchema = Joi.alternatives<MessageFormat>().try(
  Joi.object({
    type: Joi.string().valid('group').required(),
    to: Joi.number().required(),
    content: Joi.string().required(),
    sendAt: Joi.date().required(),
  }),
  Joi.object({
    type: Joi.string().valid('private').required(),
    to: userIdSchema.required(),
    content: Joi.string().required(),
    sendAt: Joi.date().required(),
  })
);

const router = Router();

interface RequestType {
  '/send': MessageFormat;
  '/history': { startBefore: number };
}

const requestSchema = {
  '/send': Joi.alternatives<RequestType['/send']>().try(
    Joi.object({
      type: Joi.string().valid('group').required(),
      to: Joi.number().required(),
      content: Joi.string().required(),
      sendAt: Joi.date().required(),
    }),
    Joi.object({
      type: Joi.string().valid('private').required(),
      to: userIdSchema.required(),
      content: Joi.string().required(),
      sendAt: Joi.date().required(),
    })
  ),
  '/history': Joi.object<RequestType['/history']>({
    startBefore: Joi.number()
      .valid(...validMessageRecordsHistoryDateRange)
      .required(),
  }),
};

router.post('/send', async (req: JWTRequest, res: Response) => {
  const { userId } = req.auth as PayloadType;

  const message = await requestSchema['/send'].validateAsync(req.body);

  if (message.type === 'group') {
    await MessageService.groupMessageSender({
      from: userId,
      ...message,
    });
  } else {
    await MessageService.privateMessageSender({
      from: userId,
      ...message,
    });
  }

  res.json(responseWrapper('success'));
});

router.post('/history', async (req: JWTRequest, res: Response) => {
  const { userId } = req.auth as PayloadType;

  const { startBefore } = await requestSchema['/history'].validateAsync(
    req.body
  );

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - startBefore);

  const messages = await MessageService.getMessageRecordsAfter(
    userId,
    startDate
  );

  res.json(responseWrapper('success', { userId, messages }));
});

export default router;
