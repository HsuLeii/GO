const express = require('express');
const app = express();
const http = require('http').Server(app); // <--- 關鍵：這行必須在 io 之前定義
const path = require('path');

// 設定 PORT
const PORT = process.env.PORT || 3000;

// 定義好 http 之後，才能傳給 socket.io
const io = require('socket.io')(http, {
    cors: {
        origin: [
            "https://hsuleii.github.io", 
            "http://localhost:3000",
            "http://127.0.0.1:5500"
        ],
        methods: ["GET", "POST"]
    }
});

// 其餘程式碼...
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 當有新連線進入
io.on('connection', (socket) => {
    console.log('一位使用者已連線');

    // 監聽來自前端的 'chat_message' 事件
    socket.on('chat_message', (msg) => {
        console.log('收到訊息: ' + msg);
        // 將訊息發送給「所有人」（包含發送者自己）
        io.emit('chat_message', msg);
    });

    socket.on('disconnect', () => {
        console.log('使用者已斷開連線');
    });
});

// 定時傳送訊息
setInterval(() => {
    const statusMsg = `系統狀態：正常 (${new Date().toLocaleTimeString()})`;
    io.emit('chat_message', statusMsg); 
}, 10000);

http.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});