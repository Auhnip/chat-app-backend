import { Response, Router } from 'express';
import { Request as JWTRequest } from 'express-jwt';
import { PayloadType } from '../service/token';
import UserService from '../service/user';
import { StatusError, responseWrapper } from '../util/response_wrapper';
import multer from 'multer';
import logger from '../util/logger';
import { uploadAvatar } from '../service/objectStore';
import configuration from '../util/config';
import { get } from 'config';
import Joi from 'joi';
import { userIdSchema } from '../schemas/user';

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = Router();

/**
 * GET METHODS
 */

router.get('/friends', async (req: JWTRequest, res: Response) => {
  const payload = req.auth as PayloadType;

  // 未提供 status 则默认为 AGREED
  let status = req.query.status || 'AGREED';

  // 检查参数是否合法
  if (
    typeof status !== 'string' ||
    !isFriendsStatusValid((status = status.toUpperCase()))
  ) {
    throw new StatusError(
      `Unexpected query [status]: ${status}`,
      'params invalid'
    );
  }

  // 获取结果
  const friends = await UserService.getAllFriendsByStatus(
    payload.userId,
    status
  );

  res.json(responseWrapper('success', friends));
});

function isFriendsStatusValid(
  status: string
): status is Parameters<typeof UserService.getAllFriendsByStatus>[1] {
  return ['AGREED', 'WAITING', 'REJECTED'].includes(status);
}

router.get('/groups', async (req: JWTRequest, res: Response) => {
  const payload = req.auth as PayloadType;

  // 未提供 status 则默认为 AGREED
  let status = req.query.status || 'JOINED';

  // 检查参数是否合法
  if (
    typeof status !== 'string' ||
    !isGroupMemberStatusValid((status = status.toUpperCase()))
  ) {
    throw new StatusError(
      `Unexpected query [status]: ${status}`,
      'params invalid'
    );
  }

  // 获取结果
  const groups = await UserService.getAllGroupsByStatus(payload.userId, status);

  res.json(responseWrapper('success', groups));
});

function isGroupMemberStatusValid(
  status: string
): status is Parameters<typeof UserService.getAllGroupsByStatus>[1] {
  return ['JOINED', 'WAITING', 'REJECTED'].includes(status);
}

/**
 * POST METHODS
 */

interface RequestType {
  ['/details']: { userId: string };
}

const requestSchema = {
  ['/details']: Joi.object<RequestType['/details']>({
    userId: userIdSchema.required(),
  }),
};

router.post('/details', async (req: JWTRequest, res: Response) => {
  const { userId } = await requestSchema['/details'].validateAsync(req.body);

  const result = await UserService.getUserDetails(userId);

  logger.info(result);

  if (!result) {
    throw new StatusError(`No user named ${userId}`, 'params invalid');
  }

  res.json(responseWrapper('success', result));
});

router.post(
  '/avatar/upload',
  upload.single('avatar'),
  async (req: JWTRequest, res: Response) => {
    const { userId } = req.auth as PayloadType;

    const { file } = req;
    logger.info(`${userId} send file as avatar:`);
    logger.info(file);

    if (!file) {
      throw new StatusError('No file received', 'params invalid');
    }

    const avatarUrl = await uploadAvatar(userId, file.buffer);

    logger.info(avatarUrl);

    await UserService.updateUser({ userId, avatar: avatarUrl });

    res.json(responseWrapper('success', { avatar: avatarUrl }));
  }
);

export default router;
