/* =========================================================
 * 360°深耕奇美 內容資料：願景、照護階段、四大範疇、關聯、六欄
 * 要改文字，改這個檔案即可
 * ========================================================= */
window.ISLAND_CONTENT = {
  vision: "照顧台南一輩子",
  careSystem: "建立涵蓋預防、急性、慢性、復健、居家、社區、長照及安寧的連續性照護體系",

  // 環島照護小路的八站
  stages: [
    { id: "s1", name: "生活型態醫學", icon: "🛡️" },
    { id: "s2", name: "急性", icon: "🚑" },
    { id: "s3", name: "慢性", icon: "🦯" },
    { id: "s4", name: "復健", icon: "🚶" },
    { id: "s5", name: "居家", icon: "🏠" },
    { id: "s6", name: "社區", icon: "👥" },
    { id: "s7", name: "長照", icon: "🤝" },
    { id: "s8", name: "安寧", icon: "💗" }
  ],

  scopes: [
    {
      id: 1, tag: "範疇一", name: "優化醫療工作條件", emoji: "🩺",
      color: "#3E8E41", soft: "#DCEFD6", deep: "#2B6B2E",
      items: [
        { id: "1a", text: "提高醫事人員核心價值與環境", short: "核心價值與環境" },
        { id: "1b", text: "優化醫院內資源配置", short: "院內資源配置" },
        { id: "1c", text: "擴大科技投資降低工作負荷", short: "科技降低負荷" },
        { id: "1d", text: "制定醫事人力留任策略", short: "人力留任策略" }
      ]
    },
    {
      id: 2, tag: "範疇二", name: "培育多元人才培訓", emoji: "🎓",
      color: "#2F6FC4", soft: "#DCE8F8", deep: "#1F4F93",
      items: [
        { id: "2a", text: "提供持續教育和專業發展機會", short: "持續教育發展" },
        { id: "2b", text: "跨領域合作與學習", short: "跨領域合作學習" },
        { id: "2c", text: "提升數位工具和技術方面能力", short: "數位工具能力" },
        { id: "2d", text: "建立明確職涯發展路徑", short: "職涯發展路徑" }
      ]
    },
    {
      id: 3, tag: "範疇三", name: "導入智慧科技", emoji: "🤖",
      color: "#E07A1F", soft: "#FBE6D2", deep: "#A85614",
      items: [
        { id: "3a", text: "AI科技協助臨床醫療", short: "AI協助臨床" },
        { id: "3b", text: "國際接軌的醫療科技及技術", short: "國際接軌科技" },
        { id: "3c", text: "醫療數據共享和安全", short: "數據共享安全" },
        { id: "3d", text: "朝智慧醫院發展", short: "智慧醫院" }
      ]
    },
    {
      id: 4, tag: "範疇四", name: "社會責任與永續", emoji: "🌏",
      color: "#7B4BB0", soft: "#EADFF5", deep: "#57327F",
      items: [
        { id: "4a", text: "分級醫療整合照護體系", short: "分級整合照護" },
        { id: "4b", text: "醫療資源的可及性和公平性", short: "可及與公平" },
        { id: "4c", text: "營造健康生活型態", short: "健康生活型態" },
        { id: "4d", text: "減少碳足跡，推動綠色醫院", short: "綠色醫院" },
        { id: "4e", text: "ESG管理模式", short: "ESG管理" }
      ]
    }
  ],

  // 政策關聯（暫定版，依四範疇圖面推論，可自行增刪）
  // a、b 可以是子項目 id，或照護階段 id（s1~s8）
  links: [
    { a: "1c", b: "3a", why: "用 AI 與科技分擔臨床工作，直接減輕負荷" },
    { a: "1a", b: "2a", why: "持續教育與成長，是醫事人員價值感的來源" },
    { a: "1d", b: "2d", why: "看得見的職涯路徑，是留任的關鍵" },
    { a: "1b", b: "4b", why: "院內資源配置得當，才能讓資源公平可及" },
    { a: "2c", b: "3d", why: "智慧醫院需要具備數位能力的人才" },
    { a: "2b", b: "4a", why: "跨領域合作是整合照護體系的基礎" },
    { a: "3c", b: "4a", why: "資料共享讓轉介與分級醫療無縫接軌" },
    { a: "3b", b: "2a", why: "接軌國際的新技術，需要持續培訓落地" },
    { a: "3d", b: "4d", why: "智慧化管理能源與流程，推動綠色醫院" },
    { a: "4c", b: "s1", why: "健康生活型態是連續性照護的起點" },
    { a: "4a", b: "s6", why: "分級醫療把照護延伸到社區" },
    { a: "4b", b: "s5", why: "照護走進家裡，讓資源更可及" },
    { a: "4e", b: "1a", why: "ESG 也包含照顧好自己的員工" }
  ],

  // 行政後勤夥伴：橋、路、車、船、碼頭，渡大家一程、一同完成
  supportsTitle: "行政後勤・渡大家一程",
  supports: {
    fountain: { name: "永續噴泉", icon: "⛲", text: "院區中心的源頭活水，象徵「照顧台南一輩子」的永續精神，每位夥伴都從這裡出發。" },
    infoPlaza: { name: "資訊廣場", icon: "📡", text: "資訊室打造的數位廣場，資料在這裡匯流，大家的想法在這裡被看見。" },
    infoCar: { name: "資訊車", icon: "🚐", text: "七台各式資訊車（廂型車、巴士、接駁小巴、行動資訊車、電動園區車、轎車、吉普車）沿著連續照護大道繞行，把系統與數據送到每一站，載大家一程。" },
    careRoad: { name: "連續照護大道", icon: "🔄", text: "院區前的大道與 360° 環狀大道，串起生活型態醫學、急性、慢性、復健、居家、社區、長照到安寧八個照護站。" },
    purchaseBridge: { name: "採購橋", icon: "🌉", text: "採購單位搭起的橋，把院區和外圍的照護站連在一起，資源走得到、送得到。" },
    hrBoat: { name: "人資船", icon: "⛴️", text: "五艘人資船（渡輪、雙層客船、快艇、遮陽觀光船、明輪船），載著新夥伴與人才渡河，在人資碼頭靠岸，一路同行。" },
    accountBoat: { name: "會計船", icon: "🛥️", text: "三艘會計船（金色貨船、拖船、帆船），載著資源與經費穩穩前進，在會計碼頭靠岸，把每一筆經費送到需要的地方。" },
    hrDock: { name: "人資碼頭", icon: "⚓", text: "人資船靠岸的地方，新夥伴在這裡上岸、加入團隊，也從這裡出發到更遠的地方。" },
    accountDock: { name: "會計碼頭", icon: "⚓", text: "會計守護的碼頭，讓每一筆資源都安穩靠岸、用在刀口上。" }
  },

  // 合作加一詞：六個欄位
  // pre/post 是拼句時自動加上的連接詞
  fields: [
    {
      n: 1, key: "who", title: "主詞", sub: "誰", color: "#2E9C8F",
      question: "誰可以發起這項行動？",
      hints: ["我們的跨專業團隊", "三院區的深耕夥伴", "第一線同仁與主管"],
      pre: "", post: ""
    },
    {
      n: 2, key: "verb", title: "動詞", sub: "做什麼", color: "#3E8E41",
      question: "可以採取什麼行動？",
      hints: ["簡化", "串聯", "共同設計"],
      pre: "", post: ""
    },
    {
      n: 3, key: "obj", title: "受詞", sub: "對象或事情", color: "#2F6FC4",
      question: "想支持誰，或改善什麼？",
      hints: ["重複填寫的行政表單", "出院後的照護服務", "符合同仁需求的學習活動"],
      pre: "", post: ""
    },
    {
      n: 4, key: "with", title: "合作夥伴", sub: "和誰一起", color: "#E07A1F",
      question: "可以邀請誰共同參與？",
      hints: ["資訊室及行政單位", "社區醫療與居家護理團隊", "教學單位及各職類同仁"],
      pre: "和", post: "一起"
    },
    {
      n: 5, key: "how", title: "方式", sub: "怎麼做", color: "#7B4BB0",
      question: "用什麼方式讓行動發生？",
      hints: ["流程盤點與小規模試行", "固定聯繫窗口與轉介機制", "需求訪談與跨職類交流"],
      pre: "透過", post: ""
    },
    {
      n: 6, key: "why", title: "目的", sub: "帶來什麼改變", color: "#C2467A",
      question: "希望工作或照護有何不同？",
      hints: ["減少重工，留出更多照護時間", "返家後仍能獲得持續支持", "讓學習貼近工作並容易應用"],
      pre: "讓", post: ""
    }
  ]
};

/* 把六個詞拼成一句話 */
window.cleanWord = function (n, text) {
  const f = window.ISLAND_CONTENT.fields[n - 1];
  let t = (text || "").trim().replace(/[，。,.、！!\s]+$/g, "").replace(/^[，。,.、\s]+/g, "");
  if (f.pre && t.startsWith(f.pre)) t = t.slice(f.pre.length);
  if (f.post && t.endsWith(f.post)) t = t.slice(0, -f.post.length);
  return t.trim();
};
/* 句子的組成片段：數字代表欄位，字串是連接詞 */
window.SENTENCE_ORDER = [1, "，和", 4, "一起，透過", 5, "，", 2, 3, "，讓", 6, "。"];
window.composeSentence = function (words) {
  return SENTENCE_ORDER.map((x) => (typeof x === "number" ? cleanWord(x, words[x]) || "＿＿" : x)).join("");
};
