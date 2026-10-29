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
  let lastStage = {}, lastUsed = null, built = false;
  WaterCard.init({ getState: () => S, pid, onClose: () => history.replaceState(null, "", location.pathname + (plaza ? "?plaza=" + plaza : "")) });
  let firstOpen = qs.get("f") || null;

  const me = () => (pid && S.people && S.people[pid]) || null;
  const phase = () => (S.state && S.state.phase) || "join";
  const canWater = () => waterOpen(S) && !!me();
  const myGive = () => ((S.waters || {})[pid]) || {};
  const left = () => Math.max(0, TOTAL - waterUsed(S, pid));
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
      : waterOpen(S) ? `💧 點一朵花，看看夥伴寫了什麼，<b>幫它澆水</b>！每朵花澆 <b>${BLOOM}</b> 次就會盛開，你有 <b>${TOTAL}</b> 滴水，可以重複澆同一朵。`
      : `🌸 主持人已暫停澆花，請看大螢幕，<b>揭曉盛開的花</b>，一起收成共識大樹 🌳`;
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
    WaterCard.refresh();
  }

  // ---------- 事件 ----------
  $g.addEventListener("click", (e) => {
    const t = e.target.closest("[data-plaza]"); if (t) { plaza = t.dataset.plaza; if (filter === "mine" || filter === "gave") filter = "all"; render(); return; }
    const fl = e.target.closest("[data-filter]"); if (fl) { filter = fl.dataset.filter; render(); return; }
    const pl = e.target.closest("[data-f]"); if (pl) WaterCard.open(pl.dataset.f);
  });

  Store.init().then(() => Store.subscribe((st) => { S = st || {}; render(); if (firstOpen && S.people) { WaterCard.open(firstOpen); firstOpen = null; } }))
    .catch((err) => { $g.innerHTML = `<div class="gate">無法連線：${escapeHtml(err.message)}</div>`; });
})();
