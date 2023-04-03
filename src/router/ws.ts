import express from 'express';
import * as ws from 'ws';

const router = express.Router();

const connectionPool: Map<string, ws> = new Map()

const sendMessageToEveryOne = function (message: string) {
  for (const ws of connectionPool.values()) {
    ws.send(message);
  }
};

router.ws('/:id', (ws, req) => {
  const { id } = req.params;

  // // Perform authentication here
  // const token = req.headers.authorization;
  // if (!token || !authenticate(token)) {
  //   ws.terminate();
  //   return;
  // }

  connectionPool.set(id, ws)

  ws.on('message', (data: string) => {
    const message = `[${id}] - ${data}`;
    console.log(message);
    sendMessageToEveryOne(message);
  });

  ws.on('close', () => {
    console.log('WebSocket disconnected');
  });
});

export default router;
