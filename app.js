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

console.log(GREETING);

const axios = require("axios")
const cheerio = require("cheerio")
const cron = require("node-cron")

// ==================== 設定區 ====================
const CONFIG = {
  TARGET_URL: "https://eplus.tickets/en/sf/ibt/detail/0260360001-P0030081P0030082P0030083P0030084P0030085P0030086P0030087P0030088P0030089P0030090?P6=i00", // eplus 海外站 wbc 售票網址
  CHECK_INTERVAL: "*/5 * * * *", // cron 格式，每 5 分鐘檢查一次（可自行調整）
}



// 其餘程式碼...
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});




// ==================== 主函式 ====================
async function checkTickets() {

    try {
    // 1. 抓取網頁（模擬瀏覽器 User-Agent，避免被簡單阻擋）
    const response = await axios.get(CONFIG.TARGET_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0 Herring/90.1.1640.8",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": "1",
      },
      timeout: 15000, // 15 秒超時
    })

    if (response.status !== 200) {
      console.error(`網頁請求失敗，狀態碼: ${response.status}`)
      return
    }

    // 2. 使用 Cheerio 解析 HTML（比 regex 更穩定可靠）
    const $ = cheerio.load(response.data)
    const article = $("article")

    // 3. 構建訊息
    let messageBody = ""

    article.each((index, element) => {
      const articleAllSection = $(element)
      const articleContent = articleAllSection.find(".20260308 > .block-ticket-article__content")

      articleContent.each((i, e) => {
        articleContentDetail = $(e)
        // const blockTicket = b.find(".block-ticket")
        const ticketBlocks = articleContentDetail.find(".block-ticket:not(.hidden)")
        // const ticketButtons = ticketBlocks.find("button.button.button--primary")
        const ticketButtonsPrimary = ticketBlocks.find("button.button.button--primary")

        const TKURL =  new URL('https://eplus.tickets/en/sf/ibt/detail/0260360001-P0030087');

        if (ticketButtonsPrimary.length === 0) {
          // console.log("目前沒有可購票項目（無 button--default）");
          ticketMessage = "0308沒有票";
        }else {
          ticketMessage = "搶票了!!!";
        }

        const articleTitle = articleAllSection.find(".block-ticket-article__title").text().trim() || "未知賽事"

        // 提取所需資訊（根據目前 eplus 頁面結構調整 selector）
        // const ticketTitle = b.find(".block-ticket:not(.hidden)").find(".block-ticket__title").text().trim() || "未知票種"
        messageBody += `${ticketMessage}\n⚾ 0308賽事: ${articleTitle}\n\n${TKURL}\n\n`
      })
    })

    // 4. 發送 LINE Push Message
    console.log(messageBody)
  } catch (error) {
  } 
}

// ==================== 啟動 ====================
// 手動執行一次：node your_script.js
// 或使用 cron 定時執行
cron.schedule(CONFIG.CHECK_INTERVAL, () => {
  checkTickets()
})

// 定時傳送訊息
setInterval(() => {
    const statusMsg = `系統狀態：正常 (${GREETING}`;
    io.emit('chat_message', statusMsg); 
}, 10000);

http.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});