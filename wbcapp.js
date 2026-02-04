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
  CHECK_INTERVAL: "*/3 * * * *", // cron 格式，每 1 分鐘檢查一次（可自行調整）
  NUMBER_OF_REMINDERS: 1, // 刊登數量提醒，預設 1，意即只要有刊登就會提醒
}
// 主程式
async function checkTicketsAndNotify() {
  try {
    console.log("正在檢查票務資訊...")

    // 1. 抓取網頁內容
    const response = await axios.get(CONFIG.TARGET_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.4472.124 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        Connection: "keep-alive",
      },
    })

    const html = response.data
    const $ = cheerio.load(html)

    // 2. 尋找含有 data-page 的元素
    // 注意：通常在 body 或 id="app" 的 div 上。這裡假設在 body 或某個主要容器
    // 如果找不到，請檢查網頁原始碼該屬性在哪個 tag 上
    let encodedData = $("[data-page]").attr("data-page")

    if (!encodedData) {
      console.log("未找到 data-page 屬性，可能網頁結構改變或需要登入。")
      return
    }

    //   console.log(encodedData)
    // 3. 解碼 JSON
    // 網頁通常使用 URL Encode，所以我們使用 decodeURIComponent
    const jsonString = decodeURIComponent(encodedData)
    const data = JSON.parse(jsonString)

    

    //   console.log("解碼後的資料:", JSON.stringify(data, null, 2)) // 偵錯用，第一次執行建議打開看結構

    // 4. 解析需要的資訊 (這裡需要根據實際 JSON 結構調整)
    // 假設 data 結構裡有 props -> tickets 或類似的陣列
    // 請根據實際 log 出來的結構修改以下變數路徑

    // 範例：假設資料在 data.props.initialState.tickets
    // 如果 data 本身就是陣列，直接用 data.map
    const ticketInfoList = extractTicketInfo(data)

    if (ticketInfoList.length === 0) {
      console.log("目前沒有刊登資訊。")
      return
    }

    // 5. 製作 LINE 訊息內容
    const messageText = formatLineMessage(ticketInfoList)
    console.log(messageText)

    

//     setInterval(() => {
//         const now = new Date().toLocaleString('zh-TW', {
//     timeZone: 'Asia/Taipei',
//     hour12: false, // 如果想要 24 小時制就寫 false，想要 AM/PM 就寫 true
//     hour: '2-digit',
//     minute: '2-digit',
// });

//     const statusMsg = `${messageText}\n\n\n(更新時間：${now})`;
//     io.emit('chat_message', statusMsg); 
// }, 60000);

  } catch (error) {
    console.error("發生錯誤:", error.message)
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

  // 如果找不到陣列，為了測試先回傳一個假資料 (正式上線請移除)
  //   if (results.length === 0) {
  //     results.push({ name: "WBC 2026 測試票券", date: "2026/03/08", status: "有票", price: "1000 JPY" })
  //   }

  return results
}


// async function sendLineMessage(text) {
//   const url = "https://api.line.me/v2/bot/message/push"

//   const payload = {
//     to: CONFIG.USER_ID,
//     messages: [
//       {
//         type: "text",
//         text: text,
//       },
//     ],
//   }

//   try {
//     const response = await axios.post(url, payload, {
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${CONFIG.CHANNEL_ACCESS_TOKEN}`,
//       },
//     })

//     if (response.status === 200) {
//       console.log("LINE 通知發送成功")
//     } else {
//       console.error("LINE 發送失敗:", response.data)
//     }
//   } catch (error) {
//     console.error("LINE 發送錯誤:", error.response?.data || error.message)
//   }
// }

// 輔助函式：排版 LINE 訊息

function formatLineMessage(ticketList) {
  let content = ``

  ticketList.forEach((ticket) => {
    content += `刊登數: ${ticket.listings_count}<br>`
    content += `日期：: ${ticket.date}<br>`
    //   content += `📊 狀態: ${ticket.status}\n`
  })

  content += `\n立即查看:\n${CONFIG.TARGET_URL}<br>`

  return content
}

// 6. 發送訊息
    // sendLineMessage(messageText)


    

// // 執行
// checkTicketsAndNotify()

      // 定時傳送訊息


// ==================== 啟動 ====================
// 手動執行一次：node your_script.js
// 或使用 cron 定時執行
// cron.schedule(CONFIG.CHECK_INTERVAL, () => {


cron.schedule(CONFIG.CHECK_INTERVAL, () => {
  checkTicketsAndNotify()
})
// })

// 如果不要定時執行，可直接寫 checkTicketsAndNotify()

console.log("門票監控腳本已啟動，檢查間隔:", CONFIG.CHECK_INTERVAL)
// 啟動後會持續運行，按 Ctrl+C 停止