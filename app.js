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

const GREETING = 'Hello, world!';


const axios = require("axios")
const cheerio = require("cheerio")
const cron = require("node-cron")

// ==================== 設定區 ====================
const CONFIG = {
  TKURL: "https://eplus.tickets/en/sf/ibt/detail/0260360001-P0030087",
  TARGET_URL: "https://eplus.tickets/en/sf/ibt/detail/0260360001-P0030081P0030082P0030083P0030084P0030085P0030086P0030087P0030088P0030089P0030090?P6=i00", // eplus 海外站 wbc 售票網址
  CHECK_INTERVAL: "*/5 * * * *", // cron 格式，每 5 分鐘檢查一次（可自行調整）
}



// 其餘程式碼...
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});




// ==================== 主函式 ====================
function runHourlyTask() {
  console.log("Running the hourly task!");
}

// ==================== 啟動 ====================
// 手動執行一次：node your_script.js
// 或使用 cron 定時執行
cron.schedule(CONFIG.CHECK_INTERVAL, () => {
  checkTickets()
})

// 定時傳送訊息
setInterval(() => {
    const statusMsg = `系統狀態：正常 (${GREETING})`;
    io.emit('chat_message', statusMsg); 
}, 10000);

http.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});