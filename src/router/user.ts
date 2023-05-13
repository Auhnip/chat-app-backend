import { Response, Router } from 'express';
import { Request as JWTRequest } from 'express-jwt';
import { PayloadType } from '../util/token';
import UserService from '../service/user';
import { StatusError, responseWrapper } from '../util/response_wrapper';

const router = Router();

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

  // 处理后返回以特定状态好友的 user_id 值为元素的数组
  res.json(
    responseWrapper(
      'success',
      friends.map((val) => val.user_id)
    )
  );
});

function isFriendsStatusValid(
  status: string
): status is Parameters<typeof UserService.getAllFriendsByStatus>[1] {
  if (['AGREED', 'WAITING', 'REJECTED'].includes(status)) {
    return true;
  }

  return false;
}

export default router;
