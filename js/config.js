/* =========================================================
 * 360°深耕奇美 設定檔 —— 部署前只需要改這個檔案
 * ========================================================= */
window.ISLAND_CONFIG = {
  // 活動代號：同一個資料庫可辦多場，換代號就是一場全新的活動
  eventId: "camp2026",

  // 主持人頁密碼（host.html 進入時輸入）
  hostPin: "0000",

  // 活動標題
  title: "360°深耕奇美・永續醫療",
  subtitle: "健康台灣深耕計畫・共識營",

  // 共識花園：每人可澆的水滴數（可重複澆同一朵，也可以澆自己的）
  dropsPerPerson: 10,

  // 一朵花要澆幾次才盛開（10% → 30% → 50% → 70% → 90% → 100%）
  bloomAt: 6,


  // Firebase 設定：貼上 Firebase 主控台提供的 firebaseConfig。
  // 留空（null）時會自動進入「本機示範模式」：
  // 同一台電腦同一個瀏覽器的分頁之間會同步，適合彩排與試玩。
  firebase: {
    apiKey: "AIzaSyCt8mlJBm9FFoHKHlhJVI2cGq_Z6IcJ-O0",
    authDomain: "gen-lang-client-0406113897.firebaseapp.com",
    databaseURL: "https://gen-lang-client-0406113897-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "gen-lang-client-0406113897",
    storageBucket: "gen-lang-client-0406113897.firebasestorage.app",
    messagingSenderId: "190094175868",
    appId: "1:190094175868:web:8b3bf1401aed912b2963f9"
  }
};
