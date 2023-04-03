import express from 'express';
import 'express-async-errors';
import cors from 'cors';
import expressWs from 'express-ws';

import loginRouter from './router/login';
import signupRouter from './router/signup';
import userRouter from './router/user';
import tokenRouter from './router/token';

import { JwtVerifier, PayloadVerifier } from './middleware/jwt';
import ErrorHandler from './middleware/error_handler';
import requestLogger from './middleware/request_logger';

const originApp = express();
const { app } = expressWs(originApp);

app.use(requestLogger);

// 使用 websocket 的路由需要在 expressWs 处理 app 后再导入
import wsRouter from './router/ws';
import logger from './util/logger';
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

// 错误处理
app.use(ErrorHandler);

app.listen(9233, () => {
  logger.info('Server started at port 9233');
});
