const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: {
        origin: "https://hsuleii.github.io", // 替換成你的 GitHub Pages 網址
        methods: ["GET", "POST"]
    }
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
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

http.listen(3000, () => {
    console.log('聊天室伺服器運行在 http://localhost:3000');
});