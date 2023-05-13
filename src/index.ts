/*
 * @Author       : wqph
 * @Date         : 2023-03-14 17:47:04
 * @LastEditors  : wqph auhnipuiq@163.com
 * @LastEditTime : 2023-05-11 21:53:10
 * @FilePath     : \backend\src\index.ts
 * @Description  : 项目启动文件
 */

import express from 'express';
import 'express-async-errors';
import cors from 'cors';
import expressWs from 'express-ws';

import loginRouter from './router/login';
import signupRouter from './router/signup';
import userRouter from './router/user';
import tokenRouter from './router/token';
import messageRouter from './router/message';

import { JwtVerifier, PayloadVerifier } from './middleware/jwt';
import ErrorHandler from './middleware/error_handler';
import requestLogger from './middleware/request_logger';

const originApp = express();
const { app } = expressWs(originApp);

app.use(requestLogger);

// 使用 websocket 的路由需要在 expressWs 处理 app 后再导入
import wsRouter from './router/ws';
import logger from './util/logger';
import ConnectionService from './service/connection';
import redis from './util/redis';
// 由于 websocket 的特殊性，其不需要跨域处理
// 也不使用请求头的 JWT 验证
app.use('/ws', wsRouter);

// 添加跨域处理
app.use(cors());

// 添加 JWT Token 验证
app.use(JwtVerifier);
app.use(PayloadVerifier);

// 解析请求体
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// 添加路由
app.use('/login', loginRouter);
app.use('/signup', signupRouter);
app.use('/user', userRouter);
app.use('/token', tokenRouter);
app.use('/message', messageRouter);

// 错误处理
app.use(ErrorHandler);

app.listen(9233, () => {
  logger.info('Server started at port 9233');
});

process.on('SIGINT', async () => {
  // 执行清理工作
  ConnectionService.shutdownAllConnection();

  await redis.quit();
  // 退出应用程序
  process.exit(0);
});
