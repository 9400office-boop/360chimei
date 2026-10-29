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
  supportsTitle: "行政後勤，與大家一同",
  supports: {
    fountain: { name: "永續噴泉", icon: "⛲", text: "象徵「照顧台南一輩子」的永續精神，每位夥伴都從這裡出發。" },
    infoPlaza: { name: "AI智慧光廊", icon: "✨", text: "讓人才匯聚、讓創意發生、讓AI落地的智慧樞紐。" },
    infoCar: { name: "資訊車", icon: "🚐", text: "確保醫療資料安全與系統穩定運作，成為支撐智慧醫療與連續性照護的重要後盾，讓醫療服務安全、順暢地持續前行。" },
    careRoad: { name: "連續照護大道", icon: "🔄", text: "院區前的大道與 360° 環狀大道，串起生活型態醫學、急性、慢性、復健、居家、社區、長照到安寧八個照護站。" },
    purchaseBridge: { name: "採購橋", icon: "🌉", text: "肩負資源整合、品質把關、成本效益及供應穩定的重要使命，讓每一項資源都能在適當的時間送達需要的地方。" },
    hrBalloon: { name: "人資熱氣球", icon: "🎈", text: "派送人力，精準降落至需要支援的各個範疇，化身人才補給隊，讓合適的人才能在需要的地方發揮價值，協助各範疇共同達成目標。" },
    accountBoat: { name: "會計船", icon: "🛥️", text: "三艘會計船（金色貨船、拖船、帆船），載著資源與經費穩穩前進，在會計碼頭靠岸並回報各範疇的核銷進度，把每一筆經費送到需要的地方。" },
    proPlaza: { name: "專業續航廣場", icon: "🌻", text: "每位夥伴種下的希望花，會開在三座花園其中一座。專業能量持續充電、經驗代代傳承，讓照護走得長長久久。" },
    selPlaza: { name: "社會情緒學習廣場", icon: "🌸", text: "每位夥伴種下的希望花，會開在三座花園其中一座。照顧好彼此的情緒與關係，是一切行動的土壤。" },
    resPlaza: { name: "復原力廣場", icon: "🌼", text: "每位夥伴種下的希望花，會開在三座花園其中一座。面對壓力也能彼此支持、重新站起來。" },
    accountDock: { name: "會計碼頭", icon: "⚓", text: "守護每一筆經費與資源，讓各項計畫安穩靠岸、穩健前行，讓每一分投入都能發揮最大價值，成為支持醫院永續經營與連續性照護不可或缺的重要後盾。" }
  },

  // 院區直播：交通工具停靠時出現的訊息（可自行增修）
  live: {
    // 資訊車停靠照護站時，輪流顯示範疇三（導入智慧科技）的建置進度
    infoCar: ["建置 FHIR 中", "導入智慧平台", "AI 協助臨床上線測試", "醫療數據共享串接中", "資安防護升級", "智慧病房系統建置", "國際醫療資訊標準接軌", "遠距照護平台佈署"],
    // 會計船靠岸會計碼頭時，隨機顯示某範疇已完成核銷
    accountBoat: "已完成{scope}核銷",
    // 人資熱氣球派送人力
    hrBalloon: "派送人力，支援{scope}"
  },

  // 行動句：六個欄位（每人全部填寫）
  // pre/post 是組成句子時自動加上的連接詞
  fields: [
    {
      n: 1, key: "who", title: "我的部門名稱", sub: "誰來發起", color: "#2E9C8F",
      question: "填入你的部門名稱",
      hints: ["護理部", "資訊室", "人資室", "教學中心"],
      pre: "", post: ""
    },
    {
      n: 2, key: "verb", title: "動詞", sub: "核心行動與執行方向", color: "#3E8E41",
      question: "要採取什麼核心行動？",
      hints: ["提升", "優化", "建立", "促進", "引進", "整合", "推動"],
      pre: "", post: ""
    },
    {
      n: 3, key: "obj", title: "受詞", sub: "行動作用的對象", color: "#2F6FC4",
      question: "行動要作用在誰或什麼上？",
      hints: ["醫事人員", "工作環境", "醫療資源", "科技", "人才", "照護體系"],
      pre: "", post: ""
    },
    {
      n: 4, key: "with", title: "合作夥伴", sub: "和誰一起", color: "#E07A1F",
      question: "可以邀請誰共同參與？",
      hints: ["資訊室及行政單位", "社區醫療與居家護理團隊", "教學單位及各職類同仁", "人資室"],
      pre: "和", post: "一起"
    },
    {
      n: 5, key: "how", title: "方式", sub: "達成目標的策略與途徑", color: "#7B4BB0",
      question: "用什麼策略與途徑達成？",
      hints: ["科技投資", "持續教育", "跨域合作", "創新培訓", "國際接軌", "社區醫療"],
      pre: "透過", post: ""
    },
    {
      n: 6, key: "why", title: "目的", sub: "預期成果與最終價值", color: "#C2467A",
      question: "希望達成什麼成果與價值？",
      hints: ["人才留任", "減輕負荷", "提升效率", "照護可及性", "醫療永續"],
      pre: "達成", post: ""
    }
  ],

  // 各範疇的參考範例句（依報到時選的範疇顯示）
  examples: {
    1: { 1: "護理部", 4: "資訊室及行政單位", 5: "科技投資", 2: "優化", 3: "工作環境", 6: "減輕負荷" },
    2: { 1: "教學中心", 4: "教學單位及各職類同仁", 5: "創新培訓", 2: "提升", 3: "醫事人員", 6: "人才留任" },
    3: { 1: "資訊室", 4: "資訊室及行政單位", 5: "國際接軌", 2: "引進", 3: "科技", 6: "提升效率" },
    4: { 1: "社工室", 4: "社區醫療與居家護理團隊", 5: "社區醫療", 2: "整合", 3: "照護體系", 6: "照護可及性" }
  }
};

/* 三座花園（希望花隨機種在其中一座） */
window.PLAZA_NAMES = { B: "社會情緒學習廣場", C: "復原力廣場", D: "專業續航廣場" };
window.PLAZA_ICONS = { B: "🌸", C: "🌼", D: "🌻" };
window.PLAZA_SUPPORT = { B: "selPlaza", C: "resPlaza", D: "proPlaza" };
window.pickPlaza = function (people) {               // 平均分配：挑目前花最少的花園
  const n = { B: 0, C: 0, D: 0 };
  Object.values(people || {}).forEach((p) => { if (p && n[p.plaza] !== undefined) n[p.plaza]++; });
  const min = Math.min(...Object.values(n)), c = Object.keys(n).filter((k) => n[k] === min);
  return c[Math.floor(Math.random() * c.length)];
};

/* 把六個詞拼成一句話 */
window.cleanWord = function (n, text) {
  const f = window.ISLAND_CONTENT.fields[n - 1];
  let t = (text || "").trim().replace(/[，。,.、！!\s]+$/g, "").replace(/^[，。,.、\s]+/g, "");
  if (f.pre && t.startsWith(f.pre)) t = t.slice(f.pre.length);
  if (n === 6 && t.startsWith("讓")) t = t.slice(1);
  if (f.post && t.endsWith(f.post)) t = t.slice(0, -f.post.length);
  return t.trim();
};
/* 句子的組成片段：數字代表欄位，字串是連接詞 */
window.SENTENCE_ORDER = [1, "，和", 4, "一起，透過", 5, "，", 2, 3, "，達成", 6, "。"];
window.composeSentence = function (words) {
  return SENTENCE_ORDER.map((x) => (typeof x === "number" ? cleanWord(x, words[x]) || "＿＿" : x)).join("");
};
