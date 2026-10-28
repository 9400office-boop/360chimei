/* =========================================================
 * 360°深耕奇美：共識花園（手機專用）
 * 逛花園、點花看行動句、澆水讓小花長大；澆 6 次盛開
 * ========================================================= */
(function () {
  const CFG = window.ISLAND_CONFIG, C = window.ISLAND_CONTENT;
  const $g = document.getElementById("g");
  const qs = new URLSearchParams(location.search);
  let pid = null;
  try { pid = localStorage.getItem("deepisland:me:" + CFG.eventId); } catch (e) {}
  const SC = (id) => C.scopes.find((s) => s.id === Number(id));
  const PLAZA = { B: { name: "社會情緒學習廣場", icon: "🌸" }, C: { name: "復原力廣場", icon: "🌼" } };
  const TOTAL = CFG.dropsPerPerson || 10, BLOOM = bloomAt();
  const FILTERS = [["all", "全部"], ["need", "💧 需要澆水"], ["soon", "✨ 快開花了"], ["bloom", "🌸 已盛開"], ["mine", "⭐ 我的花"], ["gave", "💙 我澆過的"]];

  let S = {}, plaza = qs.get("plaza") === "C" ? "C" : qs.get("plaza") === "B" ? "B" : null, filter = "all";
  let openId = qs.get("f") || null, busy = false, lastStage = {}, lastSheetStage = null, lastUsed = null, built = false;

  const me = () => (pid && S.people && S.people[pid]) || null;
  const phase = () => (S.state && S.state.phase) || "join";
  const canWater = () => phase() === "water" && !!me();
  const myGive = () => ((S.waters || {})[pid]) || {};
  const left = () => Math.max(0, TOTAL - waterUsed(S, pid));
  const toast = (msg) => { const t = document.createElement("div"); t.className = "toast"; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 2200); };
  const dropSvg = (cls) => `<svg class="dd ${cls}" viewBox="0 0 20 26"><path d="M10,1 C14,8 18,12 18,17 A8,8 0 0 1 2,17 C2,12 6,8 10,1Z" fill="#3E95E0" stroke="#fff" stroke-width="1.6"/><ellipse cx="7" cy="16" rx="2" ry="3" fill="#fff" opacity=".6"/></svg>`;
  const pctTxt = (f) => f.bloomed ? "盛開" : f.pct + "%";

  // ---------- 畫面骨架 ----------
  function shell() {
    $g.innerHTML = `
      <div class="hud">
        <div class="hrow">
          <a class="back" href="index.html">← 詞卡</a>
          <div class="ttl"><small>360°深耕奇美</small>🌸 共識花園</div>
          ${pid ? `<a class="back" href="screen.html?me=${encodeURIComponent(pid)}">🗺️ 地圖</a>` : ""}
          <div class="meav" id="meav"></div>
        </div>
        <div class="meters"><div class="dropbar" id="drops"></div><div class="bloomcount" id="bc"></div></div>
      </div>
      <div class="banner" id="banner"></div>
      <div class="tabs" id="tabs"></div>
      <div class="filters" id="filters">${FILTERS.map(([k, n]) => `<button class="chip ${k === filter ? "on" : ""}" data-filter="${k}">${n}</button>`).join("")}</div>
      <div class="field" id="field"></div>`;
    built = true;
  }

  function render() {
    if (!built) shell();
    const all = gardenFlowers(S), m = me();
    if (!plaza) plaza = (m && m.plaza) || "B";
    // 狀態列
    $g.querySelector("#meav").innerHTML = m ? Avatar.svg(m.avatar) : "";
    const used = TOTAL - left();
    $g.querySelector("#drops").innerHTML = `<span class="lb">我的水滴</span>` +
      Array.from({ length: TOTAL }, (_, i) => dropSvg(i < TOTAL - used ? "" : "off" + (lastUsed !== null && i >= TOTAL - used && i < TOTAL - lastUsed ? " used" : ""))).join("") +
      `<span class="nn">${pid && m ? left() + " / " + TOTAL : "—"}</span>`;
    lastUsed = used;
    const nb = all.filter((f) => f.bloomed).length;
    $g.querySelector("#bc").innerHTML = `🌸 盛開 <b>${nb}</b> / ${all.length}`;
    // 階段提示
    const ph = phase();
    $g.querySelector("#banner").innerHTML = !m
      ? `👋 你還沒報到喔！可以先逛逛花園，<a href="index.html">回報到頁</a>報到後就能澆花。`
      : ph === "join" ? `🌱 大家正在種花。<b>主持人開放澆花後</b>，就能幫喜歡的句子澆水，先逛逛吧！`
      : ph === "water" ? `💧 點一朵花，看看夥伴寫了什麼，<b>幫它澆水</b>！每朵花澆 <b>${BLOOM}</b> 次就會盛開，你有 <b>${TOTAL}</b> 滴水，可以重複澆同一朵。`
      : `🌸 澆花時間結束囉！請看大螢幕，<b>揭曉盛開的花</b>，一起收成共識大樹 🌳`;
    // 廣場切換
    const cnt = (k) => all.filter((f) => f.p.plaza === k);
    $g.querySelector("#tabs").innerHTML = Object.entries(PLAZA).map(([k, z]) => {
      const l = cnt(k), b = l.filter((f) => f.bloomed).length;
      return `<button class="tab ${plaza === k ? "on" : ""}" data-plaza="${k}">${z.icon} ${z.name}<small>${l.length} 朵・盛開 ${b}</small></button>`;
    }).join("");
    $g.querySelectorAll("[data-filter]").forEach((b) => b.classList.toggle("on", b.dataset.filter === filter));
    // 花圃
    const mg = myGive();
    let list = all.filter((f) => f.p.plaza === plaza);
    if (filter === "need") list = list.filter((f) => !f.bloomed);
    if (filter === "soon") list = list.filter((f) => !f.bloomed && f.n >= BLOOM - 2);
    if (filter === "bloom") list = list.filter((f) => f.bloomed);
    if (filter === "mine") list = all.filter((f) => f.pid === pid);
    if (filter === "gave") list = all.filter((f) => mg[f.pid]);
    const html = list.map((f) => {
      const look = flowerLook(f.pid), grew = lastStage[f.pid] !== undefined && f.stage > lastStage[f.pid];
      const nm = (f.p.name || "").length > 5 ? f.p.name.slice(0, 5) + "…" : f.p.name || "";
      return `<button class="plot ${f.bloomed ? "bloom" : ""} ${f.pid === pid ? "mine" : ""} ${grew ? "grow" : ""}" data-f="${f.pid}">
        <span class="pct">${pctTxt(f)}</span>${mg[f.pid] ? `<span class="gave">💧${mg[f.pid]}</span>` : ""}
        <div class="art">${FlowerArt.svg(f.stage, look.color, look.kind, { glow: false })}</div>
        <div class="nm">${escapeHtml(nm)}</div><div class="bar"><i style="width:${f.pct}%"></i></div></button>`;
    }).join("") || `<div class="empty">${filter === "all" ? "這座廣場還沒有花，等夥伴種下行動句 🌱" : "沒有符合的花朵"}</div>`;
    const fld = $g.querySelector("#field");
    if (fld.dataset.h !== html) { fld.dataset.h = html; fld.innerHTML = html; }
    all.forEach((f) => (lastStage[f.pid] = f.stage));
    if (openId) renderSheet();
  }

  // ---------- 花朵卡 ----------
  function renderSheet() {
    const f = gardenFlowers(S).find((x) => x.pid === openId);
    let sh = document.getElementById("sheet");
    if (!f) { if (sh) sh.remove(); openId = null; return; }
    const look = flowerLook(f.pid), p = f.p, sc = SC(p.scope), mg = myGive()[f.pid] || 0;
    if (!sh) {
      sh = document.createElement("div"); sh.id = "sheet"; sh.className = "shade";
      sh.innerHTML = `<div class="card2"><button class="x" data-close aria-label="關閉">×</button><div class="handle"></div>
        <div class="stagebox" id="sbox"><div class="big" id="bigart"></div>
          <svg class="can" viewBox="-50 -70 150 110"><path d="M-36,-30 C-46,-46 -30,-62 -12,-56" fill="none" stroke="#3E7EC4" stroke-width="7" stroke-linecap="round"/><path d="M-40,-30 L36,-30 L30,30 Q0,38 -30,30 Z" fill="#5FA8E8"/><path d="M-40,-30 L36,-30 L34,-20 L-38,-20 Z" fill="#3E7EC4"/><path d="M30,-6 L84,-38 L88,-30 L34,6 Z" fill="#4E96DA"/><ellipse cx="88" cy="-36" rx="7" ry="10" transform="rotate(-30 88 -36)" fill="#3E7EC4"/></svg>
          ${Array.from({ length: 7 }, (_, i) => `<i class="wd" style="left:calc(50% + ${-22 + i * 7}px);top:${54 + (i % 3) * 8}px;animation-delay:${.45 + i * .07}s"></i>`).join("")}
        </div>
        <div class="stagelabel" id="slabel"></div><div class="steps6" id="steps"></div>
        <div class="author" id="author"></div><div class="said" id="said"></div>
        <button class="waterbtn" id="wbtn"></button><div class="mygave" id="mygave"></div>
        <div class="hint">可以重複澆同一朵，也可以澆自己的花・澆 ${BLOOM} 次盛開</div></div>`;
      document.body.appendChild(sh);
      sh.addEventListener("click", (e) => { if (e.target === sh || e.target.closest("[data-close]")) closeSheet(); if (e.target.closest("#wbtn")) doWater(); });
      lastSheetStage = f.stage;
    }
    const grew = lastSheetStage !== null && f.stage > lastSheetStage;
    const art = sh.querySelector("#bigart"), nh = FlowerArt.svg(f.stage, look.color, look.kind);
    if (art.dataset.h !== nh) { art.dataset.h = nh; art.innerHTML = nh; }
    if (grew) {
      const box = sh.querySelector("#sbox"); box.classList.remove("grow"); void box.offsetWidth; box.classList.add("grow");
      const pl = document.createElement("div"); pl.className = "plus"; pl.textContent = f.bloomed ? "🌸 盛開！" : `${f.pct}%`; box.appendChild(pl); setTimeout(() => pl.remove(), 1300);
      if (f.bloomed) { confetti(look.color); toast("🎉 這朵花盛開了！謝謝你的灌溉"); }
    }
    lastSheetStage = f.stage;
    sh.querySelector("#slabel").innerHTML = f.bloomed ? `<b class="bloomtxt">🌸 盛開 100%</b>` : `${FlowerArt.LABELS[f.stage]}・<b>${f.pct}%</b>`;
    const st = sh.querySelector("#steps"); st.classList.toggle("full", f.bloomed);
    st.innerHTML = GARDEN_STEPS.slice(1).map((v, i) => `<div class="${f.stage > i ? "on" : ""}"><i></i>${v}%</div>`).join("");
    sh.querySelector("#author").innerHTML = `${Avatar.svg(p.avatar)}<div><b>${escapeHtml(p.name || "")}${f.pid === pid ? "（我）" : ""}</b><span>${escapeHtml(p.dept || "")}・${PLAZA[p.plaza] ? PLAZA[p.plaza].name : ""}</span></div>` +
      (sc ? `<span class="tg" style="background:${sc.color}">${sc.tag}・${escapeHtml(sc.name)}</span>` : "");
    sh.querySelector("#said").innerHTML = sentenceRich({ pid: f.pid }, S.people, S.edits, true);
    const b = sh.querySelector("#wbtn");
    b.classList.toggle("done", f.bloomed);
    if (f.bloomed) { b.disabled = true; b.innerHTML = "🌸 已盛開，謝謝大家的灌溉"; }
    else if (!me()) { b.disabled = true; b.innerHTML = "報到後就能澆水"; }
    else if (phase() === "join") { b.disabled = true; b.innerHTML = "⏳ 主持人開放後就能澆水"; }
    else if (phase() !== "water") { b.disabled = true; b.innerHTML = "澆花時間已結束"; }
    else if (!left()) { b.disabled = true; b.innerHTML = "水滴用完了，看看大家的花吧"; }
    else { b.disabled = busy; b.innerHTML = `${dropSvg("").replace('class="dd ', 'style="width:20px;height:26px" class="')} 澆水（剩 ${left()} 滴）`; }
    sh.querySelector("#mygave").textContent = mg ? `你已經幫這朵花澆了 ${mg} 次 💙` : "";
  }
  function closeSheet() { const sh = document.getElementById("sheet"); if (sh) sh.remove(); openId = null; lastSheetStage = null; history.replaceState(null, "", location.pathname + (plaza ? "?plaza=" + plaza : "")); }

  async function doWater() {
    if (busy || !openId || !canWater()) return;
    const f = gardenFlowers(S).find((x) => x.pid === openId);
    if (!f || f.bloomed || !left()) return;
    busy = true; renderSheet();
    const box = document.querySelector("#sbox"); box.classList.remove("pour"); void box.offsetWidth; box.classList.add("pour");
    if (navigator.vibrate) try { navigator.vibrate(30); } catch (e) {}
    await new Promise((r) => setTimeout(r, 900));          // 等水壺倒完再長大
    const cur = myGive()[openId] || 0;
    try { await Store.set(`waters/${pid}/${openId}`, cur + 1); }
    catch (e) { toast("澆水失敗，請再試一次"); }
    busy = false; box.classList.remove("pour"); render();
  }

  function confetti(color) {
    const cols = [color, "#FFD34D", "#F4A7B9", "#8FD6E8", "#C9E265"];
    for (let i = 0; i < 26; i++) {
      const el = document.createElement("i"); el.className = "petal";
      el.style.left = "50%"; el.style.top = "34%";
      el.style.background = cols[i % cols.length];
      const a = Math.random() * Math.PI * 2, d = 90 + Math.random() * 140;
      el.style.setProperty("--dx", Math.cos(a) * d + "px"); el.style.setProperty("--dy", Math.sin(a) * d + 120 + "px"); el.style.setProperty("--rot", (Math.random() * 720 - 360) + "deg");
      el.style.animationDelay = Math.random() * .15 + "s";
      document.body.appendChild(el); setTimeout(() => el.remove(), 2600);
    }
  }

  // ---------- 事件 ----------
  $g.addEventListener("click", (e) => {
    const t = e.target.closest("[data-plaza]"); if (t) { plaza = t.dataset.plaza; if (filter === "mine" || filter === "gave") filter = "all"; render(); return; }
    const fl = e.target.closest("[data-filter]"); if (fl) { filter = fl.dataset.filter; render(); return; }
    const pl = e.target.closest("[data-f]"); if (pl) { openId = pl.dataset.f; lastSheetStage = null; renderSheet(); }
  });

  Store.init().then(() => Store.subscribe((st) => { S = st || {}; render(); }))
    .catch((err) => { $g.innerHTML = `<div class="gate">無法連線：${escapeHtml(err.message)}</div>`; });
})();
