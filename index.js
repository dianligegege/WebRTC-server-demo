import express from 'express';
import { createServer } from 'https';
import { Server } from 'socket.io';
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import cors from "cors";

const MAX_USER_COUNT = 2;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//httpss证书
const options = {
  key: fs.readFileSync(path.join(__dirname, "./assets/localhost+2-key.pem")),
  cert: fs.readFileSync(path.join(__dirname, "./assets/localhost+2.pem")),
};
const app = express();
app.use(express.static(path.join(__dirname, "./")));
app.use(cors());

const https = createServer(options, app);

try {
  const io = new Server(https, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      allowedHeaders: "*",
      credentials: true,
    },
    allowEIO3: true,
    transport: ['websocket']
  });

  // 测试接口
  app.get('/', (req, res) => {
    res.send('Hello World!')
  })

  app.get('/api/test', (req, res) => {
    res.type('application/json');
    res.end(JSON.stringify({ status: 0, message: '测试成功~' }, 'utf8'));
  });


  // 监听客户端连接
  io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('toJoin', (data) => {
      console.log('join~', data);
      handleUserJoin(socket, data);
    });

    socket.on('toLeave', (data) => {
      console.log('leave~', data);
      handleUserLeave(socket, data);
    });

    // 监听客户端发送的信令消息
    socket.on('toIce', (data) => {
      socket.to(data.roomId).emit('ice', data);
    });

    socket.on('toOffer', (data) => {
      socket.to(data.roomId).emit('offer', data);
    });

    socket.on('toAnswer', (data) => {
      socket.to(data.roomId).emit('answer', data);
    });

    // 监听客户端断开连接
    socket.on('disconnect', () => {
      handleUserLeave(socket);
    });

    // 监听普通消息
    socket.on('toMessage', (data) => {
      // 广播给所有连接的客户端（除了发送者）
      socket.to(data.roomId).emit('message', data);
    });
  });

  // 用户加入房间
  function handleUserJoin (socket, data) {
    // 将用户加入房间
    socket.join(data.roomId);

    // 获取房间内所有用户
    const clients = io.sockets.adapter.rooms.get(data.roomId);

    console.log('zl-clients', clients.size);

    // 判断房间内用户数量，如果超过2人则不允许加入
    if (clients.size > MAX_USER_COUNT) {
      socket.emit('full', data.roomId);
      return;
    }

    // 将用户信息存储在socket中
    socket.user = data.userName;
    socket.roomId = data.roomId;

    // 广播给所有连接的客户端（除了发送者）
    socket.to(data.roomId).emit('join', data);
  }

  // 用户断开连接或离开房间
  function handleUserLeave (socket) {
    // 将用户从房间中移除
    socket.leave(socket.roomId);

    // 广播给所有连接的客户端（除了发送者）
    socket.to(socket.roomId).emit('leave', {
      userName: socket.user,
      roomId: socket.roomId
    });

  }

} catch (error) {
  console.log('error', error);
}

// 启动服务器
https.listen(3000, () => {
  console.log('Server is running on port 3000');
});



