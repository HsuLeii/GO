const express = require('express');
const app = express();
const http = require('http').Server(app); // <--- 關鍵：這行必須在 io 之前定義
const path = require('path');

// 這行是關鍵！它告訴 Express：如果有人要檔案，去 Content 資料夾找
app.use('/Content', express.static(path.join(__dirname, 'Content')));

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

// 其餘程式碼...
app.get('/', (req, res) => {
   // 讓 Render 檢查時有東西可以回傳
    // res.send('Server is running!');

    // 這行會把同資料夾下的 index.html 傳送到瀏覽器
    res.sendFile(path.join(__dirname, 'index.html'));
});

const axios = require("axios")
const cheerio = require("cheerio")
const cron = require("node-cron")

// ==================== 設定區 ====================
const CONFIG = {
//   TARGET_URL: "https://tradead.tixplus.jp/wbc2026", // tixplus 售票網址
TARGET_URL: "https://tradead.tixplus.jp/wbc2026/buy/bidding/listings/1526", // tixplus 售票網址
  CHECK_INTERVAL: "*/1 * * * *", // cron 格式，每 1 分鐘檢查一次（可自行調整）
  NUMBER_OF_REMINDERS: 1, // 刊登數量提醒，預設 1，意即只要有刊登就會提醒
}

// 主程式：每分鐘由 cron 觸發
async function checkTicketsAndNotify() {
  try {
    console.log("正在檢查票務資訊...");

    const response = await axios.get(CONFIG.TARGET_URL, {
        headers: { "User-Agent": "Mozilla/5.0 ..." }
    });

    const $ = cheerio.load(response.data);
    let encodedData = $("[data-page]").attr("data-page");

    if (!encodedData) {
      console.log("未找到資料。");
      return;
    }

    const data = JSON.parse(decodeURIComponent(encodedData));
    const ticketInfoList = extractTicketInfo(data);

    if (ticketInfoList.length === 0) {
      console.log("目前沒有刊登資訊。");
      return;
    }

    // 1. 取得格式化後的訊息
    const messageText = formatLineMessage(ticketInfoList);
    
    // 2. 關鍵修正：在這裡統一發送一次 Socket 訊息
    // 這樣每分鐘只會發送「當下」這一次的結果
    io.emit('chat_message', messageText); 
    console.log(messageText);
    console.log("訊息已發送至網頁端");

  } catch (error) {
    console.error("發生錯誤:", error.message);
  }
}

// 輔助函式：提取關鍵資訊 (需根據實際 JSON 結構客製化)
function extractTicketInfo(jsonData) {
  let results = []

  // !!! 關鍵修改點 !!!
  // 以下是假設結構，你需要根據 console.log 的結果來修改路徑
  // 例如：可能是 jsonData.props.events 或 jsonData.componentProps.items

  // 模擬抓取邏輯 (範例)
const items = jsonData?.props?.concerts || []

const targetId = 1518; // 你想找的 ID


  items.forEach((item) => {
    if (item.id === targetId) {
      results.push({
        name: item.name || "未知賽事",
        date: item.concert_date || "未知日期",
        //  status: item.status || "銷售中", // 例如：有無票券
        listings_count: item.listings_count,
      })
    }
  })

  return results
}

function formatLineMessage(ticketList) {
  let content = ""; // 每次進入 function 都會是空的
  const now = new Date().toLocaleString('zh-TW', {
    timeZone: 'Asia/Taipei',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  });

  ticketList.forEach((ticket) => {
    // 這裡就是你原本要求的 if 判斷式
    // 如果刊登數為 0，可以選擇不顯示或顯示「無」
    if (ticket.listings_count > 0) {
        content += `<strong>🔥 有票了！</strong><br>`;
    }

    content += `刊登數: ${ticket.listings_count}<br>`;
    content += `日期: ${ticket.date}<br>`;
    content += `立即查看: ${CONFIG.TARGET_URL}<br>(更新時間：${now})<br>`;
  });

  return content;
}

// ==================== 啟動 ====================
// 手動執行一次：node your_script.js
// 或使用 cron 定時執行
// cron.schedule(CONFIG.CHECK_INTERVAL, () => {
// 1. 程式啟動時先立即執行一次
checkTicketsAndNotify();

// 2. 接著才交給鬧鐘，每分鐘跑一次

cron.schedule(CONFIG.CHECK_INTERVAL, () => {
    checkTicketsAndNotify()
})
// })

// 如果不要定時執行，可直接寫 checkTicketsAndNotify()

console.log("門票監控腳本已啟動，檢查間隔:", CONFIG.CHECK_INTERVAL)
// 啟動後會持續運行，按 Ctrl+C 停止