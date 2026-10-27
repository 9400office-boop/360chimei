/* =========================================================
 * 共識大樹：澆水與收成時的全螢幕海報
 * 每一滴水長出一片指紋葉；揭曉的行動句像果實掛在樹上，票越多越大
 * ========================================================= */
(function () {
  const C = window.ISLAND_CONTENT;
  const NS = "http://www.w3.org/2000/svg";
  const SC = (id) => C.scopes[Number(id) - 1];
  const W = 1000, H = 1000, CX = 500, GROUND = 905;

  // ---------- 固定亂數，讓每次畫出的樹一樣 ----------
  function rng(seed) { return () => (seed = (seed * 9301 + 49297) % 233280) / 233280; }

  // ---------- 生成枝幹 ----------
  const r = rng(20261027);
  const branches = [], tips = [], forks = [], mids = [];
  function grow(x, y, ang, len, w, depth) {
    const x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len;
    const bend = (r() - .5) * len * .35;
    const mx = (x + x2) / 2 + Math.cos(ang + Math.PI / 2) * bend, my = (y + y2) / 2 + Math.sin(ang + Math.PI / 2) * bend;
    branches.push({ d: `M${x.toFixed(1)},${y.toFixed(1)} Q${mx.toFixed(1)},${my.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`, w, depth });
    if (depth <= 2) { mids.push({ x: (x + x2) / 2, y: (y + y2) / 2, ang }); mids.push({ x: x2, y: y2, ang }); }
    if (depth >= 2 && depth <= 4) forks.push({ x: x2, y: y2, depth });
    if (depth === 0 || len < 22) { tips.push({ x: x2, y: y2, ang }); return; }
    const n = depth > 3 ? 2 : (r() < .5 ? 2 : 3);
    for (let i = 0; i < n; i++) {
      const spread = n === 2 ? (i ? 1 : -1) * (.32 + r() * .28) : (i - 1) * (.45 + r() * .2);
      grow(x2, y2, ang + spread + (r() - .5) * .15, len * (.68 + r() * .1), w * .66, depth - 1);
    }
  }
  // 主幹，再分成五大枝
  branches.push({ d: `M${CX - 34},${GROUND} C${CX - 22},${GROUND - 90} ${CX - 30},${GROUND - 170} ${CX - 12},${GROUND - 230} L${CX + 14},${GROUND - 230} C${CX + 30},${GROUND - 170} ${CX + 24},${GROUND - 90} ${CX + 40},${GROUND} Z`, w: 0, depth: 9, fill: true });
  [[-2.45, 128], [-2.0, 140], [-1.57, 150], [-1.14, 140], [-.69, 128]].forEach(([a, l]) => grow(CX + (a + 1.57) * 8, GROUND - 226, a, l, 22, 5));

  // ---------- 葉子位置（依生長順序排好） ----------
  const CROWN = { x: CX, y: 470, rx: 400, ry: 330 };
  const inCrown = (x, y) => ((x - CROWN.x) / CROWN.rx) ** 2 + ((y - CROWN.y) / CROWN.ry) ** 2 < 1;
  const leafSpots = [];
  tips.concat(mids).forEach((t, ti) => {
    const n = ti < tips.length ? 6 : 3;
    for (let k = 0; k < n; k++) {
      const a = r() * Math.PI * 2, d = 4 + r() * 40;
      const x = t.x + Math.cos(a) * d, y = t.y + Math.sin(a) * d * .9;
      if (y > GROUND - 240 || !inCrown(x, y)) continue;
      leafSpots.push({ x, y, rot: (t.ang * 180 / Math.PI) + 90 + (r() - .5) * 70, s: .75 + r() * .5, g: Math.floor(r() * 5), o: r() });
    }
  });
  leafSpots.sort((a, b) => a.o - b.o);
  // 均勻抽樣，最多約 420 片，接近指紋樹的密度，也讓畫面流暢
  if (leafSpots.length > 420) leafSpots.length = 420;
  const MAX_LEAVES = leafSpots.length;
  // 果實（句子）位置：在樹冠上均勻分布（依角度排序後等距挑選）
  const fruitPool = forks.concat(tips).filter((p) => p.y < GROUND - 280 && inCrown(p.x, p.y))
    .map((p) => ({ ...p, a: Math.atan2(p.y - (GROUND - 200), p.x - CX) }))
    .sort((a, b) => a.a - b.a);
  function fruitSpotsFor(n) {
    // 先選上層（票多），再往外圍
    const out = [], used = new Set();
    const order = [];
    for (let i = 0; i < n; i++) order.push(i);
    const center = -Math.PI / 2;
    // 依與正上方的角度距離交錯：中、左、右、左、右…
    const ranked = fruitPool.slice().sort((a, b) => Math.abs(a.a - center) - Math.abs(b.a - center));
    const minD = n > 24 ? 38 : 60;
    for (const p of ranked) {
      if (out.length >= n) break;
      if (out.some((q) => Math.hypot(q.x - p.x, q.y - p.y) < minD)) continue;
      out.push(p);
    }
    for (const p of ranked) { if (out.length >= n) break; if (!out.includes(p)) out.push(p); }
    return out;
  }

  const GREENS = ["#7DBE6E", "#5FAE63", "#9BCF7E", "#6DB97A", "#4E9E5C"];
  function leafSvg(l, i) {
    const c = GREENS[l.g];
    return `<g class="leaf" transform="translate(${l.x.toFixed(1)} ${l.y.toFixed(1)}) rotate(${l.rot.toFixed(0)}) scale(${l.s.toFixed(2)})" style="animation-delay:${(i % 12) * 40}ms">
      <ellipse rx="13" ry="19" fill="${c}" fill-opacity=".55"/>
      <ellipse rx="9.5" ry="14.5" fill="none" stroke="${c}" stroke-opacity=".75" stroke-width="1.2"/>
      <ellipse rx="6" ry="10" cy="1" fill="none" stroke="${c}" stroke-opacity=".75" stroke-width="1.1"/>
      <ellipse rx="2.2" ry="4.5" cy="2" fill="none" stroke="${c}" stroke-opacity=".8" stroke-width="1"/>
    </g>`;
  }

  // ---------- 主體 ----------
  let root = null, svg = null, leafLayer = null, fruitLayer = null, shownLeaves = 0, growG = null, branchEls = [], lastDrops = null, lastG = -1;
  function build(container) {
    root = document.createElement("div");
    root.className = "bigtree hide";
    root.innerHTML = `
      <div class="bt-stage">
        <div class="bt-title"><small>360°深耕奇美・永續醫療</small><b>共識大樹</b><span class="bt-sub"></span></div>
        <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">
          <defs><radialGradient id="btShadow"><stop offset="0" stop-color="#8A8FA8" stop-opacity=".45"/><stop offset="1" stop-color="#8A8FA8" stop-opacity="0"/></radialGradient></defs>
          <g class="swirl" fill="none" stroke="#C9CDE8" stroke-width="2.2" opacity=".7">
            <path d="M40,980 C90,900 170,930 150,860 C135,810 70,830 90,880"/><path d="M20,930 C60,880 120,880 120,840"/>
            <path d="M960,40 C900,110 820,90 840,150 C855,200 920,180 900,130"/><path d="M985,90 C940,130 880,130 880,170"/>
          </g>
          <ellipse cx="${CX}" cy="${GROUND + 6}" rx="190" ry="16" fill="url(#btShadow)"/>
          <g class="seed" transform="translate(${CX} ${GROUND}) scale(2)">
            <ellipse cx="0" cy="2" rx="46" ry="9" fill="#A9845E" opacity=".55"/>
            <g class="seedbody"><ellipse cx="0" cy="-8" rx="12" ry="9" fill="#8A5A2B"/><ellipse cx="-3" cy="-11" rx="4" ry="2.5" fill="#B98A5E"/></g>
            <g class="sprout"><path d="M0,-6 C0,-20 1,-30 0,-42" stroke="#5E9E5A" stroke-width="4" fill="none" stroke-linecap="round"/>
              <path d="M0,-34 C-10,-46 -26,-46 -30,-38 C-22,-30 -10,-30 0,-34Z" fill="#7DBE6E"/><path d="M0,-40 C10,-54 28,-54 32,-46 C24,-38 10,-38 0,-40Z" fill="#6DB97A"/></g>
          </g>
          <g class="grow">
            <g class="branches">${branches.map((b) => b.fill ? `<path data-d="9" d="${b.d}" fill="#7C7F86"/>` : `<path data-d="${b.depth}" d="${b.d}" fill="none" stroke="#7C7F86" stroke-width="${Math.max(1.4, b.w).toFixed(1)}" stroke-linecap="round"/>`).join("")}</g>
            <g class="leaves"></g>
            <g class="fruits"></g>
          </g>
          <g class="drips"></g>
          <g class="ground"></g>
        </svg>
        <div class="bt-foot"><b>${C.vision}</b><div class="bt-bar"><i></i></div><span class="bt-count"></span></div>
      </div>
      <aside class="bt-side"></aside>`;
    container.appendChild(root);
    svg = root.querySelector("svg"); leafLayer = svg.querySelector(".leaves"); fruitLayer = svg.querySelector(".fruits");
    growG = svg.querySelector(".grow"); branchEls = [...svg.querySelectorAll(".branches path")];
    // 地面的四範疇小花
    let fl = "";
    for (let i = 0; i < 22; i++) {
      if (i >= 9 && i <= 12) continue;   // 中央留給種子與樹幹
      const x = 260 + i * 22 + (i % 2) * 6, y = GROUND + 4 + (i % 3) * 5, c = SC(1 + (i % 4)).color;
      fl += `<g transform="translate(${x} ${y})"><path d="M0,0 L0,-14" stroke="#6DAA74" stroke-width="2"/>${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="0" cy="-18" rx="3.2" ry="5" fill="${c}" transform="rotate(${a} 0 -14)"/>`).join("")}<circle cy="-14" r="2.4" fill="#FFD86B"/></g>`;
    }
    svg.querySelector(".ground").innerHTML = fl;
  }

  function setLeaves(n) {
    n = Math.max(0, Math.min(MAX_LEAVES, n));
    if (n > shownLeaves) {
      let html = "";
      for (let i = shownLeaves; i < n; i++) html += leafSvg(leafSpots[i], i - shownLeaves);
      leafLayer.insertAdjacentHTML("beforeend", html);
    } else if (n < shownLeaves) {
      while (leafLayer.childNodes.length > n) leafLayer.lastChild.remove();
    }
    shownLeaves = n;
  }

  // ---------- 生長：g = 0（種子）→ 1（滿樹）----------
  // 樹幹 0.06 出現；枝條依層級 0.10～0.40 逐層長出；葉子 0.25～1 逐片長滿；果實 0.45 之後掛上
  const BR_AT = { 9: .06, 5: .10, 4: .16, 3: .22, 2: .28, 1: .34, 0: .40 };
  const ease = (t) => 1 - Math.pow(1 - Math.max(0, Math.min(1, t)), 3);
  function setGrowth(g) {
    if (Math.abs(g - lastG) < 1e-4) return;
    lastG = g;
    const sc = .32 + .68 * ease(g / .6);
    growG.style.transform = `scale(${sc.toFixed(3)})`;
    branchEls.forEach((el) => { const at = BR_AT[el.dataset.d] ?? .4; const k = Math.max(0, Math.min(1, (g - at) / .06)); el.style.opacity = k; });
    const seed = svg.querySelector(".seed");
    seed.querySelector(".seedbody").style.opacity = g < .02 ? 1 : Math.max(0, 1 - (g - .02) / .04);
    const sp = seed.querySelector(".sprout");
    const spk = g <= 0 ? 0 : Math.min(1, g / .03) * Math.max(0, 1 - (g - .07) / .05);
    sp.style.opacity = spk; sp.setAttribute("transform", `scale(${(.3 + .7 * Math.min(1, g / .04)).toFixed(2)})`);
    setLeaves(Math.round(MAX_LEAVES * Math.max(0, Math.min(1, (g - .25) / .75))));
    fruitLayer.style.opacity = Math.max(0, Math.min(1, (g - .45) / .1));
  }
  // 每次有人澆水，從上方落下水滴
  function drip(n) {
    const layer = svg.querySelector(".drips");
    for (let i = 0; i < Math.min(n, 12); i++) {
      const x = CX + (Math.random() - .5) * 360, d = document.createElementNS(NS, "g");
      d.innerHTML = `<path d="M0,-14 C6,-4 8,2 8,6 A8,8 0 0 1 -8,6 C-8,2 -6,-4 0,-14Z" fill="#6FB6F2" stroke="#fff" stroke-width="2"/>`;
      d.setAttribute("class", "drip"); d.style.setProperty("--x", x + "px"); d.style.animationDelay = (i * 90) + "ms";
      d.setAttribute("transform", `translate(${x} 120)`);
      layer.appendChild(d);
      setTimeout(() => d.remove(), 1800 + i * 90);
    }
  }

  // ---------- 對外 ----------
  window.BigTree = {
    init(container) { if (!root) build(container); },
    show(on) { if (root) root.classList.toggle("hide", !on); document.body.classList.toggle("treemode", !!on); if (window.World) World.skipRender = !!on; },
    get visible() { return root && !root.classList.contains("hide"); },
    update({ sents, totals, people, edits, phase, drops, possible }) {
      if (!root) return;
      const full = Math.max(1, (window.ISLAND_CONFIG && ISLAND_CONFIG.treeFullDrops) || 140);
      const g = Math.min(1, drops / full);
      if (lastDrops !== null && drops > lastDrops) drip(drops - lastDrops);
      lastDrops = drops;
      setGrowth(g);
      root.querySelector(".bt-bar i").style.width = (g * 100).toFixed(1) + "%";
      root.querySelector(".bt-count").textContent = g >= 1
        ? `💧 全場澆了 ${drops} 滴・🌳 共識大樹長成了！`
        : `💧 全場澆了 ${drops} 滴・再 ${full - drops} 滴長成大樹（${Math.floor(g * 100)}%）`;
      root.querySelector(".bt-sub").textContent = phase === "harvest" ? "收成・全場共識" : "澆水中・從一顆種子，灌溉成一棵大樹";
      // 果實：每一句
      const maxV = Math.max(1, ...sents.map((s) => totals[s.id] || 0));
      const ranked = sents.slice().sort((a, b) => (totals[b.id] || 0) - (totals[a.id] || 0));
      const rank = {}; ranked.forEach((s, i) => (rank[s.id] = i));
      // 票多的句子放在越靠中央上方的位置
      let fr = "";
      const spots = fruitSpotsFor(ranked.length);
      ranked.forEach((s, i) => {
        const p = spots[i]; if (!p) return;
        const v = totals[s.id] || 0, k = v / maxV, sc = SC(s.scope);
        const rr = 13 + k * 15, top = i < 3 && v > 0;
        fr += `<g class="fruit" transform="translate(${p.x.toFixed(1)} ${(p.y + 8).toFixed(1)})">
          <line y1="-10" y2="${(-rr + 2).toFixed(1)}" stroke="#7C7F86" stroke-width="1.5"/>
          ${top ? `<circle r="${(rr + 6).toFixed(1)}" fill="#F2C94C" opacity=".35"/>` : ""}
          <circle r="${rr.toFixed(1)}" fill="${sc.color}" stroke="#fff" stroke-width="3"/>
          <text y="${(rr * .36).toFixed(1)}" text-anchor="middle" font-size="${(rr * .95).toFixed(0)}" font-weight="700" fill="#fff" font-family="Noto Sans TC, sans-serif">${s.order}</text>
          ${v ? `<text y="${(rr + 16).toFixed(1)}" text-anchor="middle" font-size="13" font-weight="700" fill="#2F6FC4" stroke="#fff" stroke-width="3" paint-order="stroke" font-family="Noto Sans TC, sans-serif">💧${v}</text>` : ""}
        </g>`;
      });
      fruitLayer.innerHTML = fr;
      // 右側排行
      const n = phase === "harvest" ? 5 : 8;
      const side = root.querySelector(".bt-side");
      const html = `<h3>${phase === "harvest" ? "🌳 全場共識前五名" : "💧 即時共識排行"}</h3>` +
        ranked.slice(0, n).map((s, i) => {
          const p = (people || {})[s.pid] || {}, sc = SC(s.scope);
          return `<div class="bt-row ${i < 3 && (totals[s.id] || 0) ? "top" : ""}"><div class="bt-rk">${i + 1}</div><div class="bt-tx">${escapeHtml(sentenceText(s, people, edits))}
            <div class="bt-meta"><span class="bt-tag" style="background:${sc.color}">${s.order}・${sc.tag}</span>${escapeHtml((p.dept ? p.dept + " " : "") + (p.name || ""))}</div></div><div class="bt-v">💧${totals[s.id] || 0}</div></div>`;
        }).join("") + (sents.length > n ? `<p class="bt-more">樹上共有 ${sents.length} 顆行動果實</p>` : "");
      if (side.dataset.h !== html) { side.dataset.h = html; side.innerHTML = html; }
    }
  };
})();
