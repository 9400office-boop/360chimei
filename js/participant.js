/* 360°深耕奇美：參加者手機頁 */
(function () {
  const CFG = window.ISLAND_CONFIG, C = window.ISLAND_CONTENT;
  const $app = document.getElementById("app");
  const ME_KEY = "deepisland:me:" + CFG.eventId;
  const F = (n) => C.fields[n - 1];
  const SC = (id) => C.scopes.find((s) => s.id === Number(id));

  let pid = null;
  try { pid = localStorage.getItem(ME_KEY); } catch (e) {}
  let local = { view: null, name: "", dept: "", avatar: null, words: null, scope: null, editing: false, rescope: false };
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
    if (phase() === "join") {
      if (!m.scope || local.rescope) return "scope";
      if (!personDone(m) || local.editing) return "write";
    }
    return "home";
  }

  function render(force) {
    const view = decideView();
    // 填寫、選人物畫面避免打字中被重繪
    const key = view + "|" + ((view === "home") ? JSON.stringify([phase(), S.sentences || null, waterTotals(S)[pid] || 0, waterUsed(S, pid), (S.hide || {})[pid] || 0, gardenFlowers(S).filter((f) => f.bloomed).length, me() && me().words, me() && me().scope, (S.edits || {})[pid]]) : "");
    if (!force && key === lastKey && (view === "pick" || view === "write" || view === "scope")) return;
    if (!force && key === lastKey && view === "home" && phase() !== "harvest") return;
    lastKey = key;
    const fn = { welcome: vWelcome, pick: vPick, scope: vScope, write: vWrite, home: vHome }[view];
    $app.innerHTML = header() + fn();
    bind(view);
  }

  function header() {
    const m = me();
    const off = Store.online ? "" : `<div class="offline">連線中斷，正在重新連線…</div>`;
    return off + `<div class="top"><div class="brand">${escapeHtml(CFG.title)}<small>${escapeHtml(CFG.subtitle)}</small></div>` +
      (m ? `<div class="me-pill">${Avatar.svg(m.avatar)}<span>${escapeHtml(m.name)}${m.dept ? `<small style="display:block;font-size:10px;color:var(--ink-soft)">${escapeHtml(m.dept)}</small>` : ""}</span></div>` : "") + `</div>`;
  }

  // ---------- 歡迎 ----------
  function vWelcome() {
    return `<div class="hero"><div class="ttl"><h1>360°深耕奇美</h1><p>${escapeHtml(C.vision)}・一起讓院區長出新的連結</p></div></div>
      <div class="steps"><div><b>🧑‍⚕️</b>選人物報到</div><div><b>🌱</b>寫一句行動種下小花</div><div><b>💧</b>進花園澆花讓花盛開</div><div><b>🌳</b>收成共識大樹</div></div>
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
    const grid = local.order.map((id) => `<button class="av ${local.avatar === id ? "on" : ""}" data-av="${id}" aria-label="人物">${Avatar.svg(id)}</button>`).join("");
    const pv = local.avatar ? `<div class="preview">${Avatar.svg(local.avatar)}</div>` : "";
    return `<label class="label">部門</label>
      <input class="name-input" id="dept" maxlength="16" placeholder="例：護理部、資訊室、內科部" value="${escapeHtml(local.dept)}" autocomplete="off">
      <label class="label">姓名或暱稱</label>
      <input class="name-input" id="name" maxlength="12" placeholder="例：王小美" value="${escapeHtml(local.name)}" autocomplete="off">
      <label class="label">點一位你喜歡的人物</label>
      <div class="grid">${grid}</div>
      <div class="sticky"><div class="inner">${pv}<button class="btn" id="join" ${local.avatar && local.name.trim() && local.dept.trim() ? "" : "disabled"}>報到！</button></div></div>`;
  }

  // ---------- 選範疇 ----------
  function vScope() {
    const m = me(); const cur = local.scope || m.scope || null;
    return `<h2 style="margin:6px 0 4px">選一個你想深耕的範疇</h2>
      <p class="muted" style="margin:0 0 12px">你的人物會走到這個範疇的大樓前，等一下要寫的行動句也以它為主</p>
      ${C.scopes.map((s) => `<button class="scope-big ${cur === s.id ? "on" : ""}" data-pickscope="${s.id}" style="--c:${s.color};--soft:${s.soft}">
        <span class="em">${s.emoji}</span><span><b>${s.tag}</b>${escapeHtml(s.name)}<small>${s.items.map((i) => escapeHtml(i.short)).join("・")}</small></span></button>`).join("")}
      <div class="sticky"><div class="inner"><button class="btn" id="toscope" ${cur ? "" : "disabled"}>下一步：寫行動句 ✍️</button></div></div>`;
  }

  // ---------- 六欄填寫 ----------
  function preview() {
    const w = local.words || {};
    return SENTENCE_ORDER.map((x) => typeof x === "number"
      ? `<span class="pv" style="${(w[x] || "").trim() ? `background:${F(x).color};color:#fff` : ""}">${escapeHtml(cleanWord(x, w[x]) || F(x).title)}</span>` : x).join("");
  }
  function vWrite() {
    const m = me(); const sc = SC(m.scope);
    if (!local.words) local.words = { ...(personWords(m)) };
    const ex = C.examples[m.scope] || C.examples[1];
    const exHtml = SENTENCE_ORDER.map((x) => typeof x === "number" ? `<b style="color:${F(x).color}">${escapeHtml(ex[x])}</b>` : x).join("");
    const order = [1, 2, 3, 4, 5, 6];
    const blocks = order.map((n) => {
      const f = F(n), v = local.words[n] || "";
      return `<div class="fblock" style="--c:${f.color}">
        <div class="fh"><span class="fn">0${n}</span><span class="ft">${f.title}</span><span class="fs">${f.sub}</span></div>
        <input class="finput" data-w="${n}" maxlength="20" placeholder="${escapeHtml(f.question)}" value="${escapeHtml(v)}" autocomplete="off">
        <div class="hints">${f.hints.map((h) => `<button class="chip ${v === h ? "on" : ""}" data-hint="${escapeHtml(h)}" data-n="${n}">${escapeHtml(h)}</button>`).join("")}</div>
      </div>`;
    }).join("");
    return `<div class="scopebar" style="background:${sc.color}">${sc.emoji} ${sc.tag}・${escapeHtml(sc.name)} <button class="link-btn" data-act="rescope" style="color:#fff">換範疇</button></div>
      <div class="example"><div class="exh">💡 參考範例</div>${exHtml}</div>
      <label class="label">你的行動句（填完六欄會自動組成）</label>
      <div class="scaffold" id="scaf">${preview()}</div>
      ${blocks}
      <div class="sticky"><div class="inner"><button class="btn" id="plant">種下行動句 🌸</button></div></div>`;
  }

  // ---------- 首頁（依活動階段） ----------
  function sentenceHtml(s) { return sentenceRich(s, S.people, S.edits, false); }
  const PLAZA_NAME = { B: "社會情緒學習廣場", C: "復原力廣場" };
  function sentencesSorted() {
    return Object.entries(S.sentences || {}).map(([id, s]) => ({ id, ...s })).sort((a, b) => a.order - b.order);
  }

  function authorOf(s) { const p = (S.people || {})[s.pid] || {}; return (p.dept ? p.dept + " " : "") + (p.name || ""); }
  function sentCard(s) {
    return `<div class="sent ${s.pid === pid ? "minebox" : ""}"><div class="text">${sentenceHtml(s)}</div><div class="meta"><span>${s.order}・${SC(s.scope).tag}</span><span>${escapeHtml(authorOf(s))}</span></div></div>`;
  }
  function vHome() {
    const m = me(); const ph = phase();
    const TOTAL = CFG.dropsPerPerson, leftN = Math.max(0, TOTAL - waterUsed(S, pid));
    const gf = gardenFlowers(S), nb = gf.filter((f) => f.bloomed).length;
    let html = "";
    if (personDone(m)) {
      const sc = SC(m.scope), n = waterTotals(S)[pid] || 0, st = flowerStage(n), look = flowerLook(pid), full = n >= bloomAt();
      html += `<div class="card seed">${Avatar.svg(m.avatar)}<div style="min-width:0">
        <span class="tagf" style="background:${sc.color}">${sc.tag}・${escapeHtml(sc.name)}</span>
        <div class="mysent">${sentenceRich({ pid }, S.people, S.edits, true)}</div>
        ${ph === "join" ? `<button class="btn small ghost" data-act="edit">修改</button>` : ""}
      </div></div>`;
      if (!(S.hide || {})[pid]) html += `<a class="myflower" href="garden.html?plaza=${m.plaza || "B"}&f=${encodeURIComponent(pid)}">
        <div class="fa">${FlowerArt.svg(st, look.color, look.kind)}</div>
        <div class="fi"><b>我的花・${full ? "🌸 盛開 100%" : `${FlowerArt.LABELS[st]} ${flowerPct(n)}%`}</b>
          <span>開在「${PLAZA_NAME[m.plaza] || ""}」・被澆了 ${n} 次</span>
          <div class="fbar"><i style="width:${flowerPct(n)}%"></i></div></div></a>`;
    } else if (ph !== "join") {
      html += `<div class="card"><b>歡迎報到！</b><p class="muted" style="margin:6px 0 0">填寫時間已經結束，你可以一起看大螢幕${ph === "water" ? "、進花園幫大家的花澆水" : ""}。</p></div>`;
    }

    if (ph === "join") {
      html += `<p class="status"><b>請看大螢幕</b>，主持人開放澆花後，就能進花園幫大家的花澆水 💧</p>`;
      html += `<a class="btn gardenbtn ghostg" href="garden.html">🌸 先逛逛共識花園</a>`;
    } else if (ph === "water") {
      html += `<a class="btn gardenbtn" href="garden.html">🌸 進共識花園澆花<small>你還有 ${leftN} / ${TOTAL} 滴水・每朵澆 ${bloomAt()} 次盛開</small></a>`;
      html += `<p class="status">全場已經有 <b>${nb}</b> 朵花盛開（共 ${gf.length} 朵）</p>`;
    } else if (ph === "reveal") {
      const list = sentencesSorted();
      const mine = list.find((s) => s.pid === pid);
      html += `<p class="status">${list.length ? (mine ? "🎉 你的花盛開了，入選揭曉！" : `📣 揭曉 <b>${list.length}</b> 朵澆到 100% 的花`) : "主持人正在整理盛開的花，請看大螢幕…"}</p>`;
      html += list.map((s) => sentCard(s)).join("");
    } else if (ph === "harvest") {
      const list = sentencesSorted();
      html += `<p class="status">🌳 收成時間！請看大螢幕，共識大樹從一顆種子長成大樹，<br>樹上的 <b>${list.length}</b> 顆果實，就是大家澆到盛開的行動句</p>`;
      html += list.map((s) => sentCard(s)).join("");
      html += `<p class="status">謝謝你和大家一起，<br><b>${escapeHtml(C.vision)}</b></p>`;
    }
    if (ph !== "water" && ph !== "join") html += `<a class="btn gardenbtn ghostg" href="garden.html">🌸 看看共識花園</a>`;
    html += `<a class="btn mapbtn" href="screen.html?me=${encodeURIComponent(pid)}">🗺️ 看院區地圖，找到我的人物</a><p class="muted" style="text-align:center;font-size:13px;margin:4px 0 0">在地圖上點廣場的花園，也能進入共識花園</p>`;
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
        if (act === "edit") { local.editing = true; local.words = null; render(true); window.scrollTo(0, 0); }
        if (act === "rescope") { local.rescope = true; local.scope = me().scope; render(true); window.scrollTo(0, 0); }
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
      if (h) {
        const n = h.dataset.n; local.words[n] = h.dataset.hint;
        const inp = $app.querySelector(`[data-w="${n}"]`); inp.value = h.dataset.hint;
        h.parentElement.querySelectorAll(".chip").forEach((c) => c.classList.toggle("on", c === h));
        updatePreview(); return;
      }
      const ps = e.target.closest("[data-pickscope]");
      if (ps) {
        local.scope = Number(ps.dataset.pickscope);
        $app.querySelectorAll(".scope-big").forEach((x) => x.classList.toggle("on", x === ps));
        document.getElementById("toscope").disabled = false; return;
      }

    };
    if (view === "pick") {
      const n = document.getElementById("name"), d = document.getElementById("dept");
      n.oninput = () => { local.name = n.value; updateJoinBtn(); };
      d.oninput = () => { local.dept = d.value; updateJoinBtn(); };
      document.getElementById("join").onclick = doJoin;
    }
    if (view === "scope") document.getElementById("toscope").onclick = doScope;
    if (view === "write") {
      $app.querySelectorAll(".finput").forEach((inp) => {
        inp.oninput = () => {
          local.words[inp.dataset.w] = inp.value; updatePreview();
          inp.parentElement.querySelectorAll(".chip").forEach((c) => c.classList.toggle("on", c.dataset.hint === inp.value));
        };
      });
      document.getElementById("plant").onclick = doPlant;
    }
  }
  function updateJoinBtn() {
    const b = document.getElementById("join");
    if (b) b.disabled = !(local.avatar && local.name.trim() && local.dept.trim());
  }
  function updatePreview() { const el = document.getElementById("scaf"); if (el) el.innerHTML = preview(); }
  async function doJoin() {
    const name = local.name.trim(), dept = local.dept.trim();
    if (!name || !dept || !local.avatar) return;
    const b = document.getElementById("join"); b.disabled = true; b.textContent = "報到中…";
    pid = "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    try { localStorage.setItem(ME_KEY, pid); } catch (e) {}
    try {
      await Store.set("people/" + pid, { name: name.slice(0, 12), dept: dept.slice(0, 16), avatar: local.avatar, joinedAt: Date.now() });
      render(true); window.scrollTo(0, 0);
    } catch (err) {
      toast("報到失敗，請再試一次"); b.disabled = false; b.textContent = "報到！";
    }
  }

  async function doScope() {
    if (!local.scope) return;
    try { await Store.update("people/" + pid, { scope: local.scope }); local.rescope = false; render(true); window.scrollTo(0, 0); }
    catch (e) { toast("送出失敗，請再試一次"); }
  }

  async function doPlant() {
    const w = local.words || {};
    const miss = [1, 2, 3, 4, 5, 6].filter((n) => !(w[n] || "").trim());
    if (miss.length) { toast("還有 " + miss.map((n) => F(n).title).join("、") + " 沒填喔"); const el = $app.querySelector(`[data-w="${miss[0]}"]`); if (el) el.focus(); return; }
    if (phase() !== "join") { toast("填寫時間已結束"); return; }
    const b = document.getElementById("plant"); b.disabled = true;
    const words = {}; [1, 2, 3, 4, 5, 6].forEach((n) => (words[n] = w[n].trim().slice(0, 20)));
    const upd = { words, submittedAt: Date.now() };
    if (!me().plaza) upd.plaza = Math.random() < .5 ? "B" : "C";
    try {
      await Store.update("people/" + pid, upd);
      local.editing = false; local.words = null;
      toast("行動句已種下，花園裡多了一朵小花 🌱"); render(true); window.scrollTo(0, 0);
    } catch (e) { toast("送出失敗，請再試一次"); b.disabled = false; }
  }

  // ---------- 啟動 ----------
  Store.onConnection = () => render(true);
  Store.init().then(() => {
    Store.subscribe((state) => {
      S = state || {};
      // 活動被重置：回到歡迎頁
      if (pid && S.people && !S.people[pid] && lastKey && local.view !== "pick") {
        pid = null; try { localStorage.removeItem(ME_KEY); } catch (e) {}
      }
      render(false);
    });
  }).catch((err) => { $app.innerHTML = `<p class="status">無法連線：${escapeHtml(err.message)}</p>`; });
})();
