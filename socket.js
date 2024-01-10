import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const http = createServer(app);
const io = new Server(http);

// 测试接口
app.get('/api/test', (req, res) => {
  res.type('application/json');
  res.end(JSON.stringify({ status: 0, message: '测试成功~' }, 'utf8'));
});

// 监听客户端连接
io.on('connection', (socket) => {
  console.log('A user connected');

  // 监听客户端发送的信令消息
  socket.on('signal', (data) => {
    if (data.type === 'sdp') {
      // 处理SDP消息
      handleSDPMessage(data);
    } else if (data.type === 'ice') {
      // 处理ICE消息
      handleICEMessage(data);
    }
  });

  // 监听客户端断开连接
  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

// 处理SDP消息
function handleSDPMessage (data) {
  // 在这里处理SDP消息逻辑
  console.log('Received SDP message:', data);

  // 广播给所有连接的客户端（除了发送者）
  socket.broadcast.emit('signal', data);
}

// 处理ICE消息
function handleICEMessage (data) {
  // 在这里处理ICE消息逻辑
  console.log('Received ICE message:', data);

  // 广播给所有连接的客户端（除了发送者）
  socket.broadcast.emit('signal', data);
}

// 启动服务器
http.listen(3000, () => {
  console.log('Server is running on port 3000');
});
export default {
  app,
  io
};
