/* =========================================================
 * 活動最後：第二期深耕目標（奇美的承諾）—— 深綠金色版
 * 大螢幕：共識大樹 → 果實化光匯聚到台南 →「深耕台南・健康台灣」光芒擴散全台 → 閃光 → 222 定格
 * 手機：台南光點閃現後直接顯示 222
 * 內容在 js/content.js 的 FINALE 修改
 * ========================================================= */
(function () {
  const F = () => window.FINALE;
  const arrow = (dir) => dir === "down"
    ? `<svg viewBox="0 0 60 70" class="fn-arrow down"><path d="M18,4 H42 V34 H56 L30,66 L4,34 H18 Z"/></svg>`
    : `<svg viewBox="0 0 60 70" class="fn-arrow up"><path d="M18,66 H42 V36 H56 L30,4 L4,36 H18 Z"/></svg>`;
  function goalHtml(g, i) {
    return `<div class="fn-goal" style="--i:${i}">
      <div class="fn-label">${escapeHtml(g.label)}</div>
      <div class="fn-big">
        <span class="fn-num">${escapeHtml(g.num)}</span>
        <div class="fn-notes">${g.notes.map((n) => `<div>${escapeHtml(n)}</div>`).join("")}</div>
        <div class="fn-badge"><b>${escapeHtml(g.badge)}</b>${arrow(g.dir)}</div>
      </div>
    </div>`;
  }
  const rays = () => `<svg class="fn-rays" viewBox="0 0 1000 1000" preserveAspectRatio="none">${
    [120, 240, 380, 540].map((r) => `<circle cx="160" cy="760" r="${r}"/>`).join("") +
    Array.from({ length: 14 }, (_, i) => { const a = -1.5 + i * .21; return `<line x1="160" y1="760" x2="${(160 + Math.cos(a) * 1400).toFixed(0)}" y2="${(760 + Math.sin(a) * 1400).toFixed(0)}"/>`; }).join("")}</svg>`;
  function html(stats) {
    const f = F();
    return `<div class="fn-bg"></div>${rays()}
      <div class="fn-band"><span class="fn-t1">${escapeHtml(f.title)}</span><span class="fn-t2">${escapeHtml(f.headline)}</span></div>
      <div class="fn-body">
        <div class="fn-map"><img src="assets/taiwan_gold.png" alt=""><i class="fn-pin"></i><svg class="fn-cone" viewBox="0 0 100 100" preserveAspectRatio="none"><polygon points="0,62 100,0 100,100"/></svg></div>
        <div class="fn-goals">${f.goals.map(goalHtml).join("")}</div>
      </div>
      <div class="fn-foot"><span class="fn-eyebrow">${escapeHtml(f.eyebrow)}</span>${stats ? `<span class="fn-stats">${stats}</span>` : ""}<span class="fn-tag">深耕台南・健康台灣</span></div>`;
  }

  let root = null, shown = false, cine = null;
  function ensureRoot() { if (!root) { root = document.createElement("div"); root.className = "finale hide"; document.body.appendChild(root); } }
  function show222(stats) {
    ensureRoot();
    root.innerHTML = html(stats); root.classList.remove("hide", "play"); void root.offsetWidth; root.classList.add("play");
    shown = true; document.body.classList.add("finalemode");
    if (window.World) World.skipRender = true;            // 222 蓋住院區時，不必繪製 3D
  }
  // ---------- 收尾場景「深耕台南・健康台灣」：以程式繪製（完整台灣輪廓、台南光芒擴散），不需影片檔 ----------
  const SCENE_MS = 10000;
  function sceneGeo() {
    const W = innerWidth, H = innerHeight, T = window.TAIWAN_SHAPE;
    const mh = H * .84, mw = mh * T.w / T.h, left = W * .3 - mw / 2, top = H * .08;
    return { W, H, mw, mh, left, top, px: left + T.tainan.x * mw, py: top + T.tainan.y * mh };
  }
  function buildScene() {
    const g = sceneGeo(), T = window.TAIWAN_SHAPE, f = F(), C = window.ISLAND_CONTENT || {};
    const el = document.createElement("div"); el.className = "fn-scene";
    const R = Math.hypot(g.W, g.H);
    const rays = Array.from({ length: 12 }, (_, i) => { const a = -2.6 + i * .42 + (i % 3) * .07; const L = R * (.35 + (i % 4) * .2); return `<line x1="${g.px}" y1="${g.py}" x2="${(g.px + Math.cos(a) * L).toFixed(0)}" y2="${(g.py + Math.sin(a) * L).toFixed(0)}" style="--d:${(1.2 + i * .12).toFixed(2)}s"/>`; }).join("");
    const rings = [.16, .3, .5, .75].map((k, i) => `<circle cx="${g.px}" cy="${g.py}" r="${(g.H * k).toFixed(0)}" style="--d:${(.6 + i * .5).toFixed(1)}s"/>`).join("");
    const arcs = [[-.25, 1.15], [.35, 1.6], [-.75, .95]].map(([a0, k], i) => {
      const r = g.H * k, x0 = g.px + Math.cos(Math.PI + a0) * r * .1;
      return `<path d="M${(g.px - r * .2).toFixed(0)},${(g.py + r * .05 * (i - 1)).toFixed(0)} Q${(g.px + r * .6).toFixed(0)},${(g.py - r * (.35 + i * .15)).toFixed(0)} ${(g.W + 40).toFixed(0)},${(g.py - r * (.25 + i * .2)).toFixed(0)}" style="--d:${(2.2 + i * .6).toFixed(1)}s" pathLength="1"/>`;
    }).join("");
    const dots = Array.from({ length: 40 }, () => `<circle cx="${(Math.random() * g.W).toFixed(0)}" cy="${(Math.random() * g.H).toFixed(0)}" r="${(Math.random() * 1.4 + .4).toFixed(1)}" style="--t:${(4 + Math.random() * 6).toFixed(1)}s;--o:${(Math.random() * .5 + .2).toFixed(2)}"/>`).join("");
    el.innerHTML = `<svg class="sc-svg" viewBox="0 0 ${g.W} ${g.H}" preserveAspectRatio="none">
      <defs>
        <filter id="scGlow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <radialGradient id="scFlare"><stop offset="0" stop-color="#FFFFF2"/><stop offset=".12" stop-color="#FBEFB8"/><stop offset=".35" stop-color="rgba(246,222,140,.45)"/><stop offset="1" stop-color="rgba(246,222,140,0)"/></radialGradient>
      </defs>
      <g class="sc-dots">${dots}</g>
      <g class="sc-rings">${rings}</g>
      <g class="sc-rays">${rays}</g>
      <g class="sc-arcs">${arcs}</g>
      <g transform="translate(${g.left.toFixed(1)} ${g.top.toFixed(1)}) scale(${(g.mw / T.w).toFixed(4)})">
        <path class="sc-fill" d="${T.d}"/>
        <g filter="url(#scGlow)">${T.d.split(/(?=M)/).map((d) => `<path class="sc-line" d="${d}" pathLength="1"/>`).join("")}</g>
      </g>
      <circle class="sc-flare" cx="${g.px}" cy="${g.py}" r="${(g.H * .17).toFixed(0)}" fill="url(#scFlare)"/>
      <g class="sc-star" style="transform-origin:${g.px}px ${g.py}px">${[0, 45, 90, 135].map((a) => `<line x1="${g.px - 70}" y1="${g.py}" x2="${g.px + 70}" y2="${g.py}" transform="rotate(${a} ${g.px} ${g.py})"/>`).join("")}</g>
      <circle class="sc-core" cx="${g.px}" cy="${g.py}" r="9"/>
    </svg>
    <div class="sc-text" style="left:${(g.W * .56).toFixed(0)}px;top:${(g.H * .3).toFixed(0)}px">
      <b><span>深耕台南</span><span>健康台灣</span></b>
      <i class="sc-rule"></i>
      <small>奇美醫院・深耕共識之夜</small>
      <small class="sc-em">今晚，讓朵朵繁花，匯聚成一棵大樹</small>
    </div>`;
    document.body.appendChild(el);
    return { el, g };
  }
  function flash(x, y) {
    const f = document.createElement("div"); f.className = "fn-flash";
    f.style.setProperty("--x", x + "px"); f.style.setProperty("--y", y + "px");
    document.body.appendChild(f); setTimeout(() => f.remove(), 2600);
  }

  window.Finale = {
    preload() {},
    // 大螢幕：完整轉場（共識大樹 → 果實化光 → 深耕台南・健康台灣 → 閃光 → 222）
    cinematic(statsFn) {
      if (cine) return;
      cine = { cancelled: false };
      const my = cine, g = sceneGeo();
      document.body.classList.add("finalemode", "cinema");
      const hasTree = !!(window.BigTree && BigTree.visible);
      const gather = hasTree ? BigTree.gather(g.px, g.py) : Promise.resolve(null);
      if (!hasTree) { const d = document.createElement("div"); d.className = "fn-dusk"; document.body.appendChild(d); my.dusk = d; }
      gather.then((fx) => {
        if (my.cancelled) { if (fx) fx.remove(); return; }
        my.fx = fx;
        const sc = buildScene(); my.scene = sc.el;
        requestAnimationFrame(() => sc.el.classList.add("on"));
        setTimeout(() => { if (fx) { fx.classList.add("out"); setTimeout(() => fx.remove(), 900); } }, 700);
        my.t = setTimeout(() => {
          if (my.cancelled) return;
          flash(g.px, g.py);
          setTimeout(() => {
            if (my.cancelled) return;
            show222(statsFn ? statsFn() : "");
            sc.el.classList.add("out"); setTimeout(() => sc.el.remove(), 900);
            if (window.BigTree) { BigTree.show(false); BigTree.resetDusk(); }
            if (my.dusk) my.dusk.remove();
            document.body.classList.remove("cinema");
            cine = null;
          }, 450);
        }, SCENE_MS);
      });
    },
    // 一般顯示（手機、重新整理後）：直接顯示 222
    show(on, stats) {
      if (on) {
        if (cine) return;
        if (!shown) show222(stats);
        else if (stats) { const s = root.querySelector(".fn-stats"); if (s && s.innerHTML !== stats) s.innerHTML = stats; }
      } else {
        if (cine) { cine.cancelled = true; clearTimeout(cine.t); if (cine.fx) cine.fx.remove(); if (cine.dusk) cine.dusk.remove(); if (cine.scene) cine.scene.remove(); cine = null; if (window.BigTree) BigTree.resetDusk(); }
        if (root) { root.classList.add("hide"); root.classList.remove("play"); }
        if (shown && window.World) World.skipRender = false;
        shown = false; document.body.classList.remove("finalemode", "cinema");
      }
    },
    get visible() { return shown || !!cine; },
    get playing() { return !!cine; },
    card() { return `<div class="finale card-mode play">${html("")}</div>`; }
  };
})();
