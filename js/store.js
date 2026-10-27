/* =========================================================
 * 360°深耕奇美 資料同步層
 *  - 有 Firebase 設定：使用 Firebase Realtime Database（全場即時同步）
 *  - 沒有設定：本機示範模式（同一瀏覽器分頁之間同步，用於彩排）
 * ========================================================= */
(function () {
  const CFG = window.ISLAND_CONFIG;
  const FB_VER = "10.12.2";
  const listeners = [];
  let current = {};
  let impl = null;

  function emit() { listeners.forEach((fn) => { try { fn(current); } catch (e) { console.error(e); } }); }

  function loadScript(src) {
    return new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = src; s.onload = res; s.onerror = () => rej(new Error("無法載入 " + src));
      document.head.appendChild(s);
    });
  }

  function pickBalanced(counts) {
    const c = {}; for (let i = 1; i <= 6; i++) c[i] = (counts && counts[i]) || 0;
    const min = Math.min(...Object.values(c));
    const cands = Object.keys(c).filter((k) => c[k] === min).map(Number);
    const chosen = cands[Math.floor(Math.random() * cands.length)];
    c[chosen] += 1;
    return { chosen, counts: c };
  }

  // ---------- Firebase ----------
  async function firebaseImpl() {
    await loadScript(`https://www.gstatic.com/firebasejs/${FB_VER}/firebase-app-compat.js`);
    await loadScript(`https://www.gstatic.com/firebasejs/${FB_VER}/firebase-database-compat.js`);
    if (!firebase.apps.length) firebase.initializeApp(CFG.firebase);
    const root = firebase.database().ref("events/" + CFG.eventId);
    const conn = firebase.database().ref(".info/connected");
    conn.on("value", (s) => { Store.online = !!s.val(); Store.onConnection && Store.onConnection(Store.online); });
    root.on("value", (snap) => { current = snap.val() || {}; emit(); });
    return {
      set: (p, v) => root.child(p).set(v),
      update: (p, o) => (p ? root.child(p) : root).update(o),
      remove: (p) => root.child(p).remove(),
      async claimField() {
        let chosen = null;
        const r = await root.child("fieldCounts").transaction((cur) => {
          const out = pickBalanced(cur); chosen = out.chosen; return out.counts;
        });
        if (!r.committed) throw new Error("派卡失敗，請再試一次");
        return chosen;
      },
      reset: () => root.remove()
    };
  }

  // ---------- 本機示範模式 ----------
  function localImpl() {
    const KEY = "deepisland:" + CFG.eventId;
    let bc = null;
    try { bc = new BroadcastChannel(KEY); } catch (e) {}
    const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) { return {}; } };
    const save = (obj) => {
      try { localStorage.setItem(KEY, JSON.stringify(obj)); } catch (e) {}
      current = obj; emit();
      if (bc) bc.postMessage("changed");
    };
    const refresh = () => { current = load(); emit(); };
    if (bc) bc.onmessage = refresh;
    window.addEventListener("storage", (e) => { if (e.key === KEY) refresh(); });
    current = load();
    setTimeout(emit, 0);

    function walk(obj, path, create) {
      const parts = path.split("/").filter(Boolean);
      const last = parts.pop();
      let o = obj;
      for (const k of parts) {
        if (o[k] == null || typeof o[k] !== "object") { if (!create) return [null, last]; o[k] = {}; }
        o = o[k];
      }
      return [o, last];
    }
    function setPath(obj, path, v) {
      const [o, last] = walk(obj, path, v !== null);
      if (!o) return;
      if (v === null || v === undefined) delete o[last]; else o[last] = JSON.parse(JSON.stringify(v));
    }
    Store.online = true;
    return {
      async set(p, v) { const s = load(); setPath(s, p, v); save(s); },
      async update(p, o) {
        const s = load();
        Object.keys(o).forEach((k) => setPath(s, (p ? p + "/" : "") + k, o[k]));
        save(s);
      },
      async remove(p) { const s = load(); setPath(s, p, null); save(s); },
      async claimField() {
        const s = load(); const out = pickBalanced(s.fieldCounts);
        s.fieldCounts = out.counts; save(s); return out.chosen;
      },
      async reset() { save({}); }
    };
  }

  const Store = {
    mode: CFG.firebase ? "firebase" : "local",
    online: false,
    onConnection: null,
    get state() { return current; },
    async init() {
      if (impl) return;
      impl = Store.mode === "firebase" ? await firebaseImpl() : localImpl();
    },
    subscribe(fn) { listeners.push(fn); fn(current); },
    set: (p, v) => impl.set(p, v),
    update: (p, o) => impl.update(p, o),
    remove: (p) => impl.remove(p),
    claimField: () => impl.claimField(),
    reset: () => impl.reset()
  };
  window.Store = Store;
})();

/* =========================================================
 * 拼句：把全場的詞拼成一句句「跨職類」的話
 * ========================================================= */
window.buildSentences = function (people, round) {
  const subs = Object.entries(people || {})
    .map(([id, p]) => ({ id, ...p }))
    .filter((p) => p.field && p.text && p.text.trim());
  const byField = {};
  for (let f = 1; f <= 6; f++) byField[f] = [];
  subs.forEach((p) => byField[p.field].push(p));
  const missing = Object.keys(byField).filter((f) => byField[f].length === 0);
  if (missing.length) return { error: "還缺第 " + missing.map((m) => "0" + m).join("、") + " 欄的詞，至少每欄要有一人填寫才能拼句。" };

  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const G = Math.max(...Object.values(byField).map((l) => l.length));

  // 每欄的「池」：每個人至少出現一次，不足 G 的欄位重複使用部分詞補齊
  const pools = {};
  for (let f = 1; f <= 6; f++) {
    const base = shuffle(byField[f].slice());
    const pool = base.slice();
    let i = 0;
    while (pool.length < G) { pool.push(base[i % base.length]); i++; }
    pools[f] = shuffle(pool);
  }

  const roleOf = (p) => (window.Avatar && Avatar.get(p.avatar) ? Avatar.get(p.avatar).role : -1);
  const groups = [];
  for (let g = 0; g < G; g++) {
    const members = {}; const roles = new Set(); const used = new Set();
    // 從選擇最少的欄位開始，盡量讓同一句的職類不重複
    for (const f of shuffle([1, 2, 3, 4, 5, 6])) {
      const pool = pools[f];
      let idx = pool.findIndex((p) => !roles.has(roleOf(p)) && !used.has(p.id));
      if (idx < 0) idx = pool.findIndex((p) => !used.has(p.id));
      if (idx < 0) idx = 0;
      const p = pool.splice(idx, 1)[0];
      members[f] = p.id; roles.add(roleOf(p)); used.add(p.id);
    }
    // 範疇：多數決，平手看「03 受詞」
    const tally = {};
    Object.values(members).forEach((pid) => { const s = people[pid].scope; if (s) tally[s] = (tally[s] || 0) + 1; });
    let scope = people[members[3]].scope || 1, best = -1;
    Object.entries(tally).forEach(([s, n]) => { if (n > best || (n === best && Number(s) === people[members[3]].scope)) { best = n; scope = Number(s); } });
    const links = Object.keys(tally).map(Number).filter((s) => s !== scope);
    groups.push({ members, scope, links, roles: roles.size });
  }
  const out = {};
  groups.forEach((g, i) => { out["r" + round + "g" + String(i + 1).padStart(2, "0")] = { ...g, order: i + 1 }; });
  return { sentences: out };
};

window.sentenceText = function (s, people) {
  const w = {};
  for (let f = 1; f <= 6; f++) w[f] = (people[s.members[f]] || {}).text || "＿＿";
  return composeSentence(w);
};

window.voteTotals = function (state) {
  const t = {};
  Object.values(state.votes || {}).forEach((v) => Object.entries(v || {}).forEach(([sid, n]) => { t[sid] = (t[sid] || 0) + (n || 0); }));
  return t;
};

window.escapeHtml = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
