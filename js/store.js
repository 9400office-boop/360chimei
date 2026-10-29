/* =========================================================
 * 360°深耕奇美 資料同步層
 *  - 有 Firebase 設定：使用 Firebase Realtime Database（全場即時同步）
 *  - 沒有設定：本機示範模式（同一瀏覽器分頁之間同步，用於彩排）
 * ========================================================= */
(function () {
  const CFG = window.ISLAND_CONFIG;
  const FB_VER = "10.12.2";
  const listeners = [], moveListeners = [];
  let current = {}, moves = {};
  // 人物走動：獨立的輕量頻道（不觸發整體重繪）
  function emitMove(id, m) { moves[id] = m; moveListeners.forEach((fn) => { try { fn(id, m); } catch (e) { console.error(e); } }); }
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
    // 分開監聽各個資料區塊：走動資料（moves）不會讓整個畫面重算
    const KEYS = ["people", "waters", "state", "sentences", "edits", "hide", "fieldCounts"];
    let pend = false;
    const flush = () => { pend = false; emit(); };
    KEYS.forEach((k) => root.child(k).on("value", (snap) => {
      const v = snap.val(); const n = { ...current };
      if (v === null || v === undefined) delete n[k]; else n[k] = v;
      current = n;
      if (!pend) { pend = true; setTimeout(flush, 0); }
    }));
    const mv = root.child("moves");
    mv.on("child_added", (s) => emitMove(s.key, s.val()));
    mv.on("child_changed", (s) => emitMove(s.key, s.val()));
    mv.on("child_removed", (s) => emitMove(s.key, null));
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
      move: (id, m) => mv.child(id).set(m),
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
    const MKEY = KEY + ":moves";
    const loadMoves = () => { try { return JSON.parse(localStorage.getItem(MKEY) || "{}"); } catch (e) { return {}; } };
    if (bc) bc.onmessage = (e) => { if (e.data && e.data.move) emitMove(e.data.move, e.data.m); else refresh(); };
    setTimeout(() => Object.entries(loadMoves()).forEach(([id, m]) => emitMove(id, m)), 0);
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
      async move(id, m) {
        const all = loadMoves(); all[id] = m;
        try { localStorage.setItem(MKEY, JSON.stringify(all)); } catch (e) {}
        emitMove(id, m); if (bc) bc.postMessage({ move: id, m });
      },
      async reset() { try { localStorage.removeItem(MKEY); } catch (e) {} save({}); }
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
    move: (id, m) => impl.move(id, m),
    onMove(fn) { moveListeners.push(fn); Object.entries(moves).forEach(([id, m]) => fn(id, m)); },
    get moves() { return moves; },
    reset: () => impl.reset()
  };
  window.Store = Store;
})();

/* =========================================================
 * 行動句：每人一句（六欄全填），主持人可修改文字、挑選展示
 * ========================================================= */
window.personWords = function (p) { return (p && p.words) || {}; };
window.personDone = function (p) {
  const w = personWords(p);
  return !!(p && p.scope && [1, 2, 3, 4, 5, 6].every((n) => (w[n] || "").trim()));
};
window.personSentence = function (p, edits, pid) {
  if (edits && pid && edits[pid] && edits[pid].trim()) return edits[pid].trim();
  return composeSentence(personWords(p));
};
/* 揭曉清單中的一句：{ pid, scope, order, text? } */
window.sentenceText = function (s, people, edits) {
  if (s.text && s.text.trim()) return s.text.trim();
  return personSentence((people || {})[s.pid], edits, s.pid);
};
/* 依欄位著色的 HTML（未被修改時）；被修改過則回傳純文字 */
window.sentenceRich = function (s, people, edits, highlight) {
  const p = (people || {})[s.pid];
  const edited = (s.text && s.text.trim()) || (edits && edits[s.pid] && edits[s.pid].trim());
  if (edited || !p) return escapeHtml(sentenceText(s, people, edits));
  const w = personWords(p);
  return SENTENCE_ORDER.map((x) => typeof x === "number"
    ? `<span class="w" style="${highlight ? `background:${ISLAND_CONTENT.fields[x - 1].color};color:#fff;border-radius:6px;padding:0 4px` : ""}">${escapeHtml(cleanWord(x, w[x]) || "＿＿")}</span>` : x).join("");
};

/* =========================================================
 * 共識花園：每人 10 滴水，每朵花澆 6 次盛開
 * 資料：waters/{澆水者 pid}/{花主 pid} = 次數
 * ========================================================= */
window.GARDEN_STEPS = [0, 10, 30, 50, 70, 90, 100];
/* 澆花：和活動階段分開，主持人沒有關閉前，參加者隨時可以澆花 */
window.waterOpen = (state) => !(state && state.state && state.state.waterOpen === false);
window.bloomAt = () => (window.ISLAND_CONFIG && ISLAND_CONFIG.bloomAt) || 6;
window.waterTotals = function (state) {
  const t = {};
  Object.values((state && state.waters) || {}).forEach((v) => Object.entries(v || {}).forEach(([fid, n]) => { t[fid] = (t[fid] || 0) + (n || 0); }));
  return t;
};
window.waterUsed = function (state, giver) {
  return Object.values(((state && state.waters) || {})[giver] || {}).reduce((a, b) => a + (b || 0), 0);
};
window.flowerStage = (n) => Math.min(bloomAt(), n || 0);
window.flowerPct = (n) => GARDEN_STEPS[Math.round(flowerStage(n) / bloomAt() * 6)];
/* 花園裡的花（完成行動句、沒被主持人隱藏） */
window.gardenFlowers = function (state) {
  const tot = waterTotals(state), hide = (state && state.hide) || {};
  return Object.entries((state && state.people) || {}).filter(([id, p]) => personDone(p) && !hide[id])
    .map(([id, p]) => ({ pid: id, p, n: tot[id] || 0, stage: flowerStage(tot[id]), pct: flowerPct(tot[id]), bloomed: (tot[id] || 0) >= bloomAt() }))
    .sort((a, b) => (a.p.submittedAt || 0) - (b.p.submittedAt || 0));
};
/* 每朵花固定的花色與花型（3D 與手機花園一致） */
window.FLOWER_PETALS = ["#F4A7B9", "#FFD86B", "#B9A4E3", "#FF9F80", "#8FD6E8", "#F7F0E6", "#E98AA0", "#FFB347", "#C9E265", "#F28CC8"];
window.flowerLook = function (id) {
  let h = 0; for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0; h = Math.abs(h);
  return { h, ci: h % FLOWER_PETALS.length, kind: (h >> 3) % 3, color: FLOWER_PETALS[h % FLOWER_PETALS.length] };
};

window.voteTotals = function (state) {
  const t = {};
  Object.values(state.votes || {}).forEach((v) => Object.entries(v || {}).forEach(([sid, n]) => { t[sid] = (t[sid] || 0) + (n || 0); }));
  return t;
};

window.escapeHtml = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
