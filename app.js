const express = require('express');
const app = express();
const http = require('http').Server(app); // <--- 關鍵：這行必須在 io 之前定義
const path = require('path');

// 設定 PORT
const PORT = process.env.PORT || 3000;

// 監聽時一定要有 '0.0.0.0'
http.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});

// 定義好 http 之後，才能傳給 socket.io
const io = require('socket.io')(http, {
    cors: {
        origin: [
            "https://hsuleii.github.io", 
            "http://localhost:3000",
            "http://127.0.0.1:3000", // 有些電腦 localhost 會轉為 127.0.0.1
            "http://127.0.0.1:5500", // 補上這個（不要加斜線 /）
        ],
        methods: ["GET", "POST"],
        credentials: true
    },
    allowEIO3: true, // 增加舊版本相容性
    transports: ["websocket", "polling"] // 明確指定傳輸方式
});


const axios = require("axios")
const cheerio = require("cheerio")
const cron = require("node-cron")

// ==================== 設定區 ====================
const CONFIG = {
  TKURL: "https://eplus.tickets/en/sf/ibt/detail/0260360001-P0030087",
  TARGET_URL: "https://eplus.tickets/en/sf/ibt/detail/0260360001-P0030081P0030082P0030083P0030084P0030085P0030086P0030087P0030088P0030089P0030090?P6=i00", // eplus 海外站 wbc 售票網址
  
  KORURL: "https://tradead.tixplus.jp/wbc2026/buy/bidding/listings/1526",
  
  CHECK_INTERVAL: "*/3 * * * *", // cron 格式，每 1 分鐘檢查一次（可自行調整）

}



// 其餘程式碼...
app.get('/', (req, res) => {
   // 讓 Render 檢查時有東西可以回傳
    // res.send('Server is running!');

    // 這行會把同資料夾下的 index.html 傳送到瀏覽器
    res.sendFile(path.join(__dirname, 'index.html'));
});




// ==================== 主函式 ====================

const puppeteer = require('puppeteer');

async function checkTickets() {
  // 1. 啟動瀏覽器
  const browser = await puppeteer.launch({ 
    headless: "new" // 或設為 false 觀察它自動操作的過程
  });
  
  const page = await browser.newPage();

  try {
    // 2. 前往網址並等待網路空閒
    await page.goto("https://tradead.tixplus.jp", {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // 3. 在瀏覽器環境內執行邏輯 (這是在瀏覽器裡面跑的)
    const tickets = await page.evaluate(() => {
      // 抓取所有 Material UI 的 Paper 卡片
      const cards = Array.from(document.querySelectorAll('[class*="MuiPaper-root"]'));
      
      return cards
        .filter(card => card.innerText.includes('枚')) // 只留有票數資訊的
        .map(card => {
          const btn = card.querySelector('button');
          const isAvailable = btn && !btn.disabled && (btn.innerText.includes('購入') || btn.innerText.includes('申請'));
          return {
            status: isAvailable ? "🔥 搶票了!!!" : "☁️ 沒有票",
            info: card.innerText.split('\n')[0] // 抓第一行標題
          };
        });
    });

    // 4. 印出結果
    if (tickets.length === 0) {
        console.log("目前頁面上沒有任何掛牌票券。");
    } else {
        tickets.forEach(t => console.log(`${t.status} ⚾ ${t.info}`));
    }

  } catch (error) {
    console.error("抓取過程中發生錯誤:", error);
  } finally {
    await browser.close();
  }
}

checkTickets();




// async function checkTickets() {
//   console.log(`[${new Date().toLocaleString()}] 開始檢查門票...`)

//       // 1. 抓取網頁（模擬瀏覽器 User-Agent，避免被簡單阻擋）
//       const response = await axios.get(CONFIG.KORURL, {
//         headers: {
//           "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0 Herring/90.1.1640.8",
//           Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
//           "Accept-Language": "en-US,en;q=0.9",
//           "Accept-Encoding": "gzip, deflate, br",
//           Connection: "keep-alive",
//           "Upgrade-Insecure-Requests": "1",
//         },
//         timeout: 15000, // 15 秒超時
//       })
  
//       if (response.status !== 200) {
//         console.error(`網頁請求失敗，狀態碼: ${response.status}`)
//         return
//       }
  
//       // 2. 使用 Cheerio 解析 HTML（比 regex 更穩定可靠）
//     const $ = cheerio.load(response.data)
//       const article = $("article")
//       // 3. 構建訊息
//       let messageBody = "有票嗎?"
  
//       // article.each((index, element) => {
//       //   const articleAllSection = $(element)
//       //   const articleContent = articleAllSection.find(".20260308 > .block-ticket-article__content")
  

//       //   articleContent.each((i, e) => {
//       //     articleContentDetail = $(e)
//       //     // const blockTicket = b.find(".block-ticket")
//       //     const ticketBlocks = articleContentDetail.find(".block-ticket:not(.hidden)")
//       //     // const ticketButtons = ticketBlocks.find("button.button.button--primary")
//       //     const ticketButtonsPrimary = ticketBlocks.find("button.button.button--primary")
  
//       //     const TKURL =  new URL('https://eplus.tickets/en/sf/ibt/detail/0260360001-P0030087');
  
//       //     if (ticketButtonsPrimary.length === 0) {
//       //       // console.log("目前沒有可購票項目（無 button--default）");
//       //       ticketMessage = "0308沒有票";
//       //     }else {
//       //       ticketMessage = "搶票了!!!";
//       //     }
  
//       //     const articleTitle = articleAllSection.find(".block-ticket-article__title").text().trim() || "未知賽事"
  
//       //     // 提取所需資訊（根據目前 eplus 頁面結構調整 selector）
//       //     // const ticketTitle = b.find(".block-ticket:not(.hidden)").find(".block-ticket__title").text().trim() || "未知票種"
//       //     messageBody += `${ticketMessage}\n⚾ 0308賽事: ${articleTitle}\n\n${TKURL}\n\n`
//       //   })
//       // })

  
//       // 4. 發送 LINE Push Message
//       // console.log(messageBody)
   
//       // 定時傳送訊息
// setInterval(() => {
//     const statusMsg = `系統狀態：正常 (${messageBody})[${new Date().toLocaleString()}]${articleContent} `;
//     io.emit('chat_message', statusMsg); 
// }, 10000);
// }


// console.log(messageBody)

// ==================== 啟動 ====================
// 手動執行一次：node your_script.js
// 或使用 cron 定時執行


cron.schedule(CONFIG.CHECK_INTERVAL, () => {
  checkTickets()
})