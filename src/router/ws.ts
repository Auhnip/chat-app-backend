import express, { Request } from 'express';
import * as ws from 'ws';
import { verifyToken } from '../service/token';
import logger from '../util/logger';
import ConnectionService from '../service/connection';

const router = express.Router();

router.ws('/', async (ws: ws, req: Request) => {
  // 管理 websocket 连接
  try {
    const token = req.query.token;

    if (typeof token !== 'string') {
      throw new Error("Query param 'token' has to be of type string");
    }

    const { userId } = await verifyToken(token);

    // 设置 websocket 心跳保活
    let isAlive = true;

    const pingTimer = setInterval(() => {
      if (!isAlive) {
        ws.terminate();
      }

      isAlive = false;
      // logger.debug("Sending a 'ping' message");
      ws.ping();
    }, 3000);

    ws.on('pong', () => {
      // logger.debug("Received a 'pong' message");
      isAlive = true;
    });

    // 注册连接关闭回调
    ws.on('close', () => {
      logger.info('WebSocket disconnected');

      clearInterval(pingTimer);
    });

    // 注册连接错误事件回调
    ws.on('error', (error) => {
      logger.error(`Websocket connection error: ${error.message}`);
    });

    // 加入连接池
    await ConnectionService.addConnection(userId, ws);

    logger.info(
      `WebSocket connection established between user [${userId}] and the server`
    );
    // websocket 管理错误
  } catch (error: any) {
    logger.error(`${error.name}: ${error.message}`);
    ws.terminate();
  }
});

export default router;
