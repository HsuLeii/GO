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

// 定時傳送訊息
setInterval(() => {
    const statusMsg = `系統狀態：正常 (${new Date().toLocaleTimeString()})`;
    io.emit('chat_message', statusMsg); 
}, 10000);

http.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});