import { Response, Router } from 'express';
import { Request as JWTRequest } from 'express-jwt';
import { PayloadType } from '../util/token';

const router = Router();

router.get('/do', (req: JWTRequest, res: Response) => {
  const payload = req.auth as PayloadType;
  res.send(payload);
});

export default router;
