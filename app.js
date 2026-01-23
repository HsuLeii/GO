const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: {
        origin: "https://hsuleii.github.io", // 替換成你的 GitHub Pages 網址
        methods: ["GET", "POST"]
    }
});


// Node.js 版本的 eplus 門票監控通知腳本
// 功能：定期檢查指定 eplus 頁面是否有可購票按鈕，若有則透過 LINE Push Message 通知
// 所需套件：axios（抓網頁）、cheerio（解析 HTML）、node-cron（可選，定時執行）

// 安裝依賴（第一次執行前在終端機跑一次）
// npm init -y
// npm install axios cheerio node-cron

const axios = require("axios")
const cheerio = require("cheerio")
const cron = require("node-cron")

// ==================== 設定區 ====================
const CONFIG = {
  TARGET_URL: "https://eplus.tickets/en/sf/ibt/detail/0260360001-P0030081P0030082P0030083P0030084P0030085P0030086P0030087P0030088P0030089P0030090?P6=i00", // eplus 海外站 wbc 售票網址
  TK_URL: "https://eplus.tickets/en/sf/ibt/detail/0260360001-P0030087", // eplus 台韓海外站 wbc 售票網址
  CHECK_INTERVAL: "*/1 * * * *", // cron 格式，每 5 分鐘檢查一次（可自行調整）
}

// ==================== 主函式 ====================
async function checkTickets() {
  console.log(`[${new Date().toLocaleString()}] 開始檢查門票...`)

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

    article.each((index, element) => {
      const articleAllSection = $(element)
      const articleContent = articleAllSection.find(".20260309 > .block-ticket-article__content")

      articleContent.each((i, e) => {
        articleContentDetail = $(e)
        // const blockTicket = b.find(".block-ticket")
        const ticketBlocks = articleContentDetail.find(".block-ticket:not(.hidden)")
        // const ticketButtons = ticketBlocks.find("button.button.button--primary")
        const ticketButtons = ticketBlocks.find("button.button.button--primary")

        if (ticketButtons.length === 0) {
          // console.log("目前沒有可購票項目（無 button--primary）");
          return
        }

        const articleTitle = articleAllSection.find(".block-ticket-article__title").text().trim() || "未知賽事"
        // 提取所需資訊（根據目前 eplus 頁面結構調整 selector）
        // const ticketTitle = b.find(".block-ticket:not(.hidden)").find(".block-ticket__title").text().trim() || "未知票種"
        messageBody += `\n\n⚾ 0309賽事: ${articleTitle}`
      })
    })

    

    messageBody += `\n\n🔗 購票連結:\n${CONFIG.TARGET_URL}`

    // 4. 發送 LINE Push Message
    alert(messageBody)
    console.log(messageBody)
    await sendLineMessage(messageBody)
  } catch (error) {
    console.error("執行過程中發生錯誤:", error.message)
    // 可選：錯誤時也發送 LINE 通知，避免完全沉默
    // await sendLineMessage(`⚠️ 門票檢查程式發生錯誤:\n${error.message}`);
  }
}

// ==================== LINE 發送函式 ====================
async function sendLineMessage(text) {
  const url = "https://api.line.me/v2/bot/message/push"

  const payload = {
    messages: [
      {
        type: "text",
        text: text,
      },
    ],
  }
}

// ==================== 啟動 ====================
// 手動執行一次：node your_script.js
// 或使用 cron 定時執行
cron.schedule(CONFIG.CHECK_INTERVAL, () => {
  checkTickets()
})

// 如果不要定時執行，可直接寫 checkTickets()

console.log("門票監控腳本已啟動，檢查間隔:", CONFIG.CHECK_INTERVAL)
// 啟動後會持續運行，按 Ctrl+C 停止



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