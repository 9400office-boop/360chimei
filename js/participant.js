/* 360°深耕奇美：參加者手機頁 */
(function () {
  const CFG = window.ISLAND_CONFIG, C = window.ISLAND_CONTENT;
  const $app = document.getElementById("app");
  const ME_KEY = "deepisland:me:" + CFG.eventId;
  const F = (n) => C.fields[n - 1];
  const SC = (id) => C.scopes.find((s) => s.id === Number(id));

  let pid = null;
  try { pid = localStorage.getItem(ME_KEY); } catch (e) {}
  let local = { view: null, name: "", avatar: null, filter: -1, draft: null, scope: null, editing: false, drawing: false };
  let lastKey = "";
  let S = {};

  const toast = (msg) => {
    const t = document.createElement("div"); t.className = "toast"; t.textContent = msg;
    document.body.appendChild(t); setTimeout(() => t.remove(), 2200);
  };
  const me = () => (pid && S.people && S.people[pid]) || null;
  const phase = () => (S.state && S.state.phase) || "join";

  function decideView() {
    const m = me();
    if (!m) return local.view === "pick" ? "pick" : "welcome";
    if (local.drawing) return "draw";
    if (phase() === "join") {
      if (!m.field) return "draw";
      if (!m.text || local.editing) return "write";
    }
    return "home";
  }

  function render(force) {
    const view = decideView();
    // 填寫、選人物畫面避免打字中被重繪
    const key = view + "|" + ((view === "home") ? JSON.stringify([phase(), S.sentences ? Object.keys(S.sentences).length : 0, (S.votes || {})[pid], me() && me().text, S.state && S.state.round]) : "");
    if (!force && key === lastKey && (view === "pick" || view === "write" || view === "draw")) return;
    if (!force && key === lastKey && view === "home" && phase() !== "harvest") return;
    lastKey = key;
    const fn = { welcome: vWelcome, pick: vPick, draw: vDraw, write: vWrite, home: vHome }[view];
    $app.innerHTML = header() + fn();
    bind(view);
  }

  function header() {
    const m = me();
    const off = Store.online ? "" : `<div class="offline">連線中斷，正在重新連線…</div>`;
    return off + `<div class="top"><div class="brand">${escapeHtml(CFG.title)}<small>${escapeHtml(CFG.subtitle)}</small></div>` +
      (m ? `<div class="me-pill">${Avatar.svg(m.avatar)}<span>${escapeHtml(m.name)}</span></div>` : "") + `</div>`;
  }

  // ---------- 歡迎 ----------
  function vWelcome() {
    return `<div class="hero"><div class="ttl"><h1>360°深耕奇美</h1><p>${escapeHtml(C.vision)}・一起讓院區長出新的連結</p></div></div>
      <div class="steps"><div><b>🧑‍⚕️</b>點一位捏捏人</div><div><b>🎴</b>抽一張詞卡</div><div><b>🌱</b>種下一個詞</div><div><b>💧</b>澆水共識</div></div>
      <button class="btn" style="width:100%" data-act="start">我要報到</button>
      <p style="text-align:center"><button class="link-btn" data-act="explore">先看看院區有什麼</button></p>`;
  }

  // ---------- 選人物 ----------
  function vPick() {
    const taken = {};
    Object.values(S.people || {}).forEach((p) => (taken[p.avatar] = (taken[p.avatar] || 0) + 1));
    if (!local.order) {
      // 打散排列，讓每次看到的順序不同、不按職類分組
      local.order = Avatar.presets.map((p) => p.id).sort(() => Math.random() - .5);
    }
    const grid = local.order.map((id) => `<button class="av ${local.avatar === id ? "on" : ""}" data-av="${id}" aria-label="捏捏人">${taken[id] ? `<span class="taken">${taken[id]}</span>` : ""}${Avatar.svg(id)}</button>`).join("");
    const pv = local.avatar ? `<div class="preview">${Avatar.svg(local.avatar)}</div>` : "";
    return `<label class="label">你的暱稱或姓名</label>
      <input class="name-input" id="name" maxlength="12" placeholder="例：小美、王醫師" value="${escapeHtml(local.name)}" autocomplete="off">
      <label class="label">點一位你喜歡的捏捏人</label>
      <p class="muted" style="margin:-4px 0 8px;font-size:13px">右上角的數字是已經有幾位夥伴選了他</p>
      <div class="grid">${grid}</div>
      <div class="sticky"><div class="inner">${pv}<button class="btn" id="join" ${local.avatar && local.name.trim() ? "" : "disabled"}>報到！</button></div></div>`;
  }

  // ---------- 抽卡 ----------
  function vDraw() {
    const m = me(); const f = m.field ? F(m.field) : null;
    return `<div class="stage">
      <h2 style="margin:6px 0 0">抽一張詞卡</h2>
      <p class="muted" style="margin:6px 0">六張卡裡會隨機派給你一張，<br>和全場來自不同角落的夥伴拼成一句話</p>
      <div class="flip ${f && !local.anim ? "done" : ""}" id="flip" ${f ? "" : `data-act="draw"`}><div class="in">
        <div class="face back ${f ? "" : "wiggle"}">?<small>點我抽卡</small></div>
        <div class="face front" style="background:${f ? f.color : "#999"}">${f ? `<div class="no">0${f.n}</div><div class="t">${f.title}</div><div class="s">${f.sub}</div>` : ""}</div>
      </div></div>
      ${f ? `<button class="btn" data-act="towrite" style="min-width:220px">開始填寫</button>` : `<button class="btn" data-act="draw" style="min-width:220px">抽卡</button>`}
    </div>`;
  }

  // ---------- 填寫 ----------
  function scaffold(n, word) {
    const mine = `<span class="mine" style="background:${F(n).color}">${escapeHtml(word || F(n).title)}</span>`;
    const s = (k) => (k === n ? mine : `<span class="slot">${F(k).title}</span>`);
    return SENTENCE_ORDER.map((x) => (typeof x === "number" ? s(x) : x)).join("");
  }
  function vWrite() {
    const m = me(); const f = F(m.field);
    if (local.draft === null) { local.draft = m.text || ""; local.scope = m.scope || null; }
    const hints = f.hints.map((h) => `<button class="chip" data-hint="${escapeHtml(h)}">${escapeHtml(h)}</button>`).join("");
    const scopes = C.scopes.map((s) => `<button class="scope-btn ${local.scope === s.id ? "on" : ""}" data-scope="${s.id}" style="${local.scope === s.id ? `background:${s.color};border-color:${s.color}` : `border-color:${s.soft};background:${s.soft}`}"><b>${s.tag}</b>${s.name}</button>`).join("");
    return `<div class="fieldhead" style="background:${f.color}"><div class="no">0${f.n}</div><div><div class="t">${f.title}・${f.sub}</div><div class="q">${f.question}</div></div></div>
      <div class="scaffold" id="scaf">${scaffold(f.n, local.draft)}</div>
      <p class="muted" style="font-size:13px;margin:4px 2px 10px">其他五個空格，會由全場其他夥伴填上</p>
      <textarea class="word" id="word" maxlength="20" placeholder="寫下你的詞（20 字內）">${escapeHtml(local.draft)}</textarea>
      <div class="count"><span id="cnt">${local.draft.length}</span>/20</div>
      <label class="label" style="margin-top:4px">想不到嗎？點一下參考詞</label>
      <div class="hints">${hints}</div>
      <label class="label">你的詞最貼近哪個範疇？</label>
      <div class="scopes">${scopes}</div>
      <div class="sticky"><div class="inner"><button class="btn" id="plant">種下這個詞 🌱</button></div></div>`;
  }

  // ---------- 首頁（依活動階段） ----------
  function sentenceHtml(s, highlightPid) {
    return SENTENCE_ORDER.map((x) => {
      if (typeof x !== "number") return x;
      const id = s.members[x];
      const w = escapeHtml(cleanWord(x, (S.people[id] || {}).text) || "＿＿");
      return id === highlightPid ? `<mark>${w}</mark>` : w;
    }).join("");
  }
  function sentencesSorted() {
    return Object.entries(S.sentences || {}).map(([id, s]) => ({ id, ...s })).sort((a, b) => a.order - b.order);
  }

  function vHome() {
    const m = me(); const ph = phase();
    let html = "";
    if (m.field && m.text) {
      const f = F(m.field), sc = SC(m.scope);
      html += `<div class="card seed">${Avatar.svg(m.avatar)}<div style="min-width:0">
        <span class="tagf" style="background:${f.color}">0${f.n} ${f.title}</span>
        ${sc ? `<span class="tagf" style="background:${sc.color}">${sc.tag}</span>` : ""}
        <div class="word-big">${escapeHtml(m.text)}</div>
        ${ph === "join" ? `<button class="btn small ghost" data-act="edit">修改</button>` : ""}
      </div></div>`;
    } else if (ph !== "join") {
      html += `<div class="card"><b>歡迎報到！</b><p class="muted" style="margin:6px 0 0">這一輪填寫已經結束，你可以一起看大螢幕${ph === "water" ? "、幫喜歡的句子澆水" : ""}。</p></div>`;
    }

    if (ph === "join") {
      html += `<p class="status">你的種子已種在院區 🌱<br><b>請看大螢幕</b>，等待主持人揭曉</p>`;
    } else if (ph === "reveal") {
      const mine = sentencesSorted().filter((s) => Object.values(s.members).includes(pid));
      if (!Object.keys(S.sentences || {}).length) html += `<p class="status">主持人正在拼句，請稍候…</p>`;
      else {
        html += `<p class="status">🎉 你的詞長成了這${mine.length > 1 ? "些" : "句"}話</p>`;
        html += mine.map((s) => `<div class="sent"><div class="text">${sentenceHtml(s, pid)}</div><div class="meta"><span>幼苗 ${s.order}・${SC(s.scope).tag}</span><span>${new Set(Object.values(s.members)).size} 位夥伴合力完成</span></div></div>`).join("") ||
          `<p class="muted" style="text-align:center">請看大螢幕，一起看看全場拼出了什麼</p>`;
      }
    } else if (ph === "water") {
      const total = CFG.dropsPerPerson;
      const mv = (S.votes || {})[pid] || {};
      const used = Object.values(mv).reduce((a, b) => a + (b || 0), 0);
      const left = Math.max(0, total - used);
      html += `<div class="drops">剩下的水滴 <span class="d">${"💧".repeat(left)}${"<span style='opacity:.2'>💧</span>".repeat(total - left)}</span><br><span class="muted" style="font-size:13px">把水滴給最想實現的句子，可以集中在同一句</span></div>`;
      html += sentencesSorted().map((s) => {
        const n = mv[s.id] || 0;
        return `<div class="sent"><div class="text">${sentenceHtml(s, pid)}</div>
          <div class="meta"><span>幼苗 ${s.order}・${SC(s.scope).tag}</span>
          <span class="water"><button data-vote="${s.id}" data-d="-1" ${n ? "" : "disabled"}>−</button><span class="n">${"💧".repeat(n) || "0"}</span><button data-vote="${s.id}" data-d="1" ${left ? "" : "disabled"}>＋</button></span></div></div>`;
      }).join("");
    } else if (ph === "harvest") {
      const tot = voteTotals(S);
      const top = sentencesSorted().sort((a, b) => (tot[b.id] || 0) - (tot[a.id] || 0)).slice(0, 3);
      html += `<p class="status">🌳 收成時間！全場共識最高的三棵大樹</p>`;
      html += top.map((s, i) => `<div class="sent"><div class="text"><span class="rank">${i + 1}</span>${sentenceHtml(s, pid)}</div><div class="meta"><span>${SC(s.scope).tag}</span><span>💧 ${tot[s.id] || 0}</span></div></div>`).join("");
      html += `<p class="status">謝謝你和大家一起，<br><b>${escapeHtml(C.vision)}</b></p>`;
    }
    html += `<a class="btn mapbtn" href="screen.html?me=${encodeURIComponent(pid)}">🗺️ 看院區地圖，找到我的人物</a>`;
    html += `<p style="text-align:center"><button class="link-btn" data-act="explore">📖 四大範疇與政策關聯</button></p>`;
    return html;
  }

  // ---------- 院區導覽 ----------
  function openExplore() {
    const nameOf = (id) => {
      if (id.startsWith("s")) { const st = C.stages.find((x) => x.id === id); return `照護階段・${st.name}`; }
      const sc = C.scopes.find((s) => s.items.some((i) => i.id === id));
      return `${sc.tag}・${sc.items.find((i) => i.id === id).text}`;
    };
    const cards = C.scopes.map((s) => `<div class="scope-card" style="background:${s.soft}">
      <h3 style="color:${s.deep}">${s.emoji} ${s.tag}　${s.name}</h3>
      ${s.items.map((it) => {
        const rel = C.links.filter((l) => l.a === it.id || l.b === it.id).map((l) => `🔗 ${nameOf(l.a === it.id ? l.b : l.a)}<br><span style="padding-left:1.4em;display:inline-block">${l.why}</span>`).join("<br>");
        return `<button class="item">${it.text}${rel ? ` <span style="color:${s.color}">↔</span>` : ""}<div class="rel">${rel || "（尚無標示關聯）"}</div></button>`;
      }).join("")}
    </div>`).join("");
    const el = document.createElement("div");
    el.className = "sheet";
    el.innerHTML = `<div class="panel"><div style="display:flex;justify-content:space-between;align-items:center"><h2 style="margin:0">🗺️ 探索360°深耕奇美</h2><button class="btn small ghost" data-close>關閉</button></div>
      <p class="muted" style="font-size:14px">願景：<b>${C.vision}</b><br>${C.careSystem}</p>
      <p class="muted" style="font-size:13px">點一下項目，看看它和哪些範疇相連 ↔</p>${cards}</div>`;
    el.addEventListener("click", (e) => {
      if (e.target === el || e.target.closest("[data-close]")) el.remove();
      const it = e.target.closest(".item"); if (it) it.classList.toggle("open");
    });
    document.body.appendChild(el);
  }

  // ---------- 事件 ----------
  function bind(view) {
    $app.onclick = async (e) => {
      const a = e.target.closest("[data-act]");
      if (a) {
        const act = a.dataset.act;
        if (act === "start") { local.view = "pick"; render(true); window.scrollTo(0, 0); }
        if (act === "explore") openExplore();
        if (act === "edit") { local.editing = true; local.draft = null; render(true); }
        if (act === "draw") doDraw(a);
        if (act === "towrite") { local.drawing = false; render(true); window.scrollTo(0, 0); }
        return;
      }
      const av = e.target.closest("[data-av]");
      if (av) {
        local.avatar = av.dataset.av;
        $app.querySelectorAll(".av").forEach((x) => x.classList.toggle("on", x === av));
        const pv = $app.querySelector(".sticky .inner");
        const old = pv.querySelector(".preview"); if (old) old.remove();
        pv.insertAdjacentHTML("afterbegin", `<div class="preview">${Avatar.svg(local.avatar)}</div>`);
        updateJoinBtn(); return;
      }
      const h = e.target.closest("[data-hint]");
      if (h) { local.draft = h.dataset.hint; const w = document.getElementById("word"); w.value = local.draft; onWord(); return; }
      const sb = e.target.closest("[data-scope]");
      if (sb) { local.scope = Number(sb.dataset.scope); render(true); return; }
      const v = e.target.closest("[data-vote]");
      if (v) vote(v.dataset.vote, Number(v.dataset.d));
    };
    if (view === "pick") {
      const n = document.getElementById("name");
      n.oninput = () => { local.name = n.value; updateJoinBtn(); };
      document.getElementById("join").onclick = doJoin;
    }
    if (view === "draw" && local.anim) {
      local.anim = false;
      setTimeout(() => { const fl = document.getElementById("flip"); if (fl) fl.classList.add("done"); }, 60);
    }
    if (view === "write") {
      const w = document.getElementById("word");
      w.oninput = onWord;
      document.getElementById("plant").onclick = doPlant;
    }
  }
  function updateJoinBtn() {
    const b = document.getElementById("join");
    if (b) b.disabled = !(local.avatar && local.name.trim());
  }
  function onWord() {
    const w = document.getElementById("word");
    local.draft = w.value;
    document.getElementById("cnt").textContent = w.value.length;
    document.getElementById("scaf").innerHTML = scaffold(me().field, local.draft);
  }

  async function doJoin() {
    const name = local.name.trim();
    if (!name || !local.avatar) return;
    const b = document.getElementById("join"); b.disabled = true; b.textContent = "報到中…";
    pid = "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    try { localStorage.setItem(ME_KEY, pid); } catch (e) {}
    try {
      await Store.set("people/" + pid, { name: name.slice(0, 12), avatar: local.avatar, joinedAt: Date.now() });
      local.drawing = phase() === "join";
      render(true); window.scrollTo(0, 0);
    } catch (err) {
      toast("報到失敗，請再試一次"); b.disabled = false; b.textContent = "報到！";
    }
  }

  async function doDraw() {
    if (local.busy || (me() && me().field)) return;
    local.busy = true;
    const btn = $app.querySelector("button[data-act=draw]");
    btn.disabled = true; btn.textContent = "抽卡中…";
    try {
      const f = await Store.claimField();
      local.drawing = true; local.anim = true;
      await Store.update("people/" + pid, { field: f });
      local.busy = false;
      render(true);
    } catch (err) { local.busy = false; toast(err.message || "抽卡失敗，請再試一次"); btn.disabled = false; btn.textContent = "抽卡"; }
  }

  async function doPlant() {
    const text = (local.draft || "").trim();
    if (!text) { toast("先寫下你的詞喔"); return; }
    if (!local.scope) { toast("選一個最貼近的範疇"); return; }
    if (phase() !== "join") { toast("填寫時間已結束"); return; }
    const b = document.getElementById("plant"); b.disabled = true;
    try {
      await Store.update("people/" + pid, { text: text.slice(0, 20), scope: local.scope, submittedAt: Date.now() });
      local.editing = false; local.draft = null;
      toast("種子已種下 🌱"); render(true); window.scrollTo(0, 0);
    } catch (e) { toast("送出失敗，請再試一次"); b.disabled = false; }
  }

  async function vote(sid, d) {
    const total = CFG.dropsPerPerson;
    const mv = { ...((S.votes || {})[pid] || {}) };
    const used = Object.values(mv).reduce((a, b) => a + (b || 0), 0);
    if (d > 0 && used >= total) return;
    const n = Math.max(0, (mv[sid] || 0) + d);
    try { await Store.set(`votes/${pid}/${sid}`, n || null); } catch (e) { toast("澆水失敗，請再試一次"); }
  }

  // ---------- 啟動 ----------
  Store.onConnection = () => render(true);
  Store.init().then(() => {
    Store.subscribe((state) => {
      S = state || {};
      // 活動被重置：回到歡迎頁
      if (pid && S.people && !S.people[pid] && lastKey && !local.drawing && local.view !== "pick") {
        pid = null; try { localStorage.removeItem(ME_KEY); } catch (e) {}
      }
      if (S.state && S.state.round !== local.round) { local.round = S.state.round; }
      render(false);
    });
  }).catch((err) => { $app.innerHTML = `<p class="status">無法連線：${escapeHtml(err.message)}</p>`; });
})();
