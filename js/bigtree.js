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

  // ---------- 生成枝幹（圓形茂密樹冠，參考指紋樹） ----------
  const r = rng(20261027);
  const TOPY = GROUND - 250;                       // 樹幹分岔點
  const CROWN = { x: CX, y: 410, R: 330 };          // 圓形樹冠
  const inCrown = (x, y, k = 1) => Math.hypot(x - CROWN.x, (y - CROWN.y) * 1.05) < CROWN.R * k;
  const branches = [], tips = [], forks = [];
  function grow(x, y, ang, len, w, depth) {
    let x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len;
    // 枝條不超出樹冠
    for (let k = 0; k < 6 && !inCrown(x2, y2, .9); k++) { len *= .82; x2 = x + Math.cos(ang) * len; y2 = y + Math.sin(ang) * len; }
    const bend = (r() - .5) * len * .3;
    const mx = (x + x2) / 2 + Math.cos(ang + Math.PI / 2) * bend, my = (y + y2) / 2 + Math.sin(ang + Math.PI / 2) * bend;
    branches.push({ d: `M${x.toFixed(1)},${y.toFixed(1)} Q${mx.toFixed(1)},${my.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`, w, depth });
    if (depth >= 1 && depth <= 3) forks.push({ x: x2, y: y2, depth, ang });
    if (depth === 0 || len < 26) { tips.push({ x: x2, y: y2, ang }); return; }
    const n = depth >= 3 ? 2 : (r() < .55 ? 2 : 3);
    for (let i = 0; i < n; i++) {
      const spread = n === 2 ? (i ? 1 : -1) * (.3 + r() * .22) : (i - 1) * (.42 + r() * .15);
      grow(x2, y2, ang + spread + (r() - .5) * .12, len * (.72 + r() * .1), w * .64, depth - 1);
    }
  }
  // 樹幹（較粗、向上漸細，根部微微外擴）
  branches.push({ d: `M${CX - 48},${GROUND} C${CX - 26},${GROUND - 40} ${CX - 30},${GROUND - 150} ${CX - 16},${TOPY} L${CX + 16},${TOPY} C${CX + 30},${GROUND - 150} ${CX + 28},${GROUND - 40} ${CX + 52},${GROUND} Z`, w: 0, depth: 9, fill: true });
  [[-2.75, 150, 18], [-2.3, 175, 22], [-1.85, 190, 24], [-1.32, 190, 24], [-.85, 175, 22], [-.4, 150, 18]]
    .forEach(([a, l, w]) => grow(CX + Math.cos(a) * 10, TOPY + 6, a, l, w, 4));

  // ---------- 葉子：在圓形樹冠內均勻鋪滿（由內往外長出） ----------
  const leafSpots = [];
  const STEP = 31;
  for (let y = CROWN.y - CROWN.R; y <= CROWN.y + CROWN.R; y += STEP * .86) {
    const row = Math.round((y - CROWN.y) / (STEP * .86));
    for (let x = CROWN.x - CROWN.R; x <= CROWN.x + CROWN.R; x += STEP) {
      const jx = x + (row % 2 ? STEP / 2 : 0) + (r() - .5) * 14, jy = y + (r() - .5) * 12;
      // 邊緣略微參差，像手指印蓋出來的樹冠
      if (!inCrown(jx, jy, .96 + r() * .1)) continue;
      if (jy > TOPY - 20 && Math.abs(jx - CX) < 70) continue;   // 樹幹分岔處留白
      const ang = Math.atan2(jy - (TOPY + 40), jx - CX);           // 由樹幹往外的方向
      const dist = Math.hypot(jx - CX, jy - (TOPY + 40));
      leafSpots.push({ x: jx, y: jy, rot: ang * 180 / Math.PI + 90 + (r() - .5) * 50, s: .9 + r() * .38, g: Math.floor(r() * 5), o: dist + r() * 160 });
    }
  }
  leafSpots.sort((a, b) => a.o - b.o);
  const MAX_LEAVES = leafSpots.length;
  // 果實（句子）位置：樹冠上層、分散
  const fruitPool = leafSpots.filter((p) => p.y < CROWN.y + 120 && inCrown(p.x, p.y, .82))
    .map((p) => ({ ...p, a: Math.atan2(p.y - TOPY, p.x - CX) }));
  function fruitSpotsFor(n) {
    const center = -Math.PI / 2;
    const ranked = fruitPool.slice().sort((a, b) => (Math.abs(a.a - center) + (a.y / 900)) - (Math.abs(b.a - center) + (b.y / 900)));
    const minD = n > 24 ? 44 : n > 12 ? 62 : 80;
    const out = [];
    for (const p of ranked) { if (out.length >= n) break; if (!out.some((q) => Math.hypot(q.x - p.x, q.y - p.y) < minD)) out.push(p); }
    for (const p of ranked) { if (out.length >= n) break; if (!out.includes(p)) out.push(p); }
    return out;
  }
  // 停在樹枝上的一對鳥：右側中層的分岔點
  const perch = forks.filter((f) => f.x > CX + 90 && f.x < CX + 230 && f.y > CROWN.y - 60 && f.y < CROWN.y + 90)
    .sort((a, b) => Math.abs(a.y - CROWN.y) - Math.abs(b.y - CROWN.y))[0] || { x: CX + 160, y: CROWN.y + 20 };
  const perch2 = forks.filter((f) => f.x < CX - 120 && f.y > CROWN.y - 160 && f.y < CROWN.y)
    .sort((a, b) => a.y - b.y)[0] || { x: CX - 200, y: CROWN.y - 80 };

  // ---------- 鳥（原創圖形）----------
  function birdSvg(c1, c2, flip, flap) {
    return `<g transform="scale(${flip ? -1 : 1} 1)">
      <path d="M-20,6 L-34,-2 L-31,10 Z" fill="${c1}"/>
      <path d="M-20,6 C-14,-10 6,-14 16,-6 C22,4 14,14 0,15 C-10,16 -17,12 -20,6 Z" fill="${c1}"/>
      <circle cx="14" cy="-8" r="8" fill="${c1}"/>
      <path d="M21,-10 L29,-7 L21,-5 Z" fill="#F2B53A"/>
      <circle cx="16" cy="-10" r="1.6" fill="#fff"/>
      <g class="${flap ? "wing flap" : "wing"}"><path d="M-6,0 C-2,-18 12,-20 12,-4 C6,2 -2,4 -6,0 Z" fill="${c2}"/></g>
      <path d="M-8,8 C-4,4 2,4 4,8 M-2,11 C0,8 4,8 6,11" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".85"/>
    </g>`;
  }

  const GREENS = ["#7DBE6E", "#5FAE63", "#9BCF7E", "#6DB97A", "#4E9E5C"];
  function leafSvg(l, i) {
    const c = GREENS[l.g];
    return `<g class="leaf" transform="translate(${l.x.toFixed(1)} ${l.y.toFixed(1)}) rotate(${l.rot.toFixed(0)}) scale(${l.s.toFixed(2)})" style="animation-delay:${(i % 12) * 40}ms">
      <ellipse rx="14" ry="20" fill="${c}" fill-opacity=".5"/>
      <ellipse rx="11" ry="16.5" fill="none" stroke="${c}" stroke-opacity=".7" stroke-width="1.2"/>
      <ellipse rx="7.5" ry="12" cy="1" fill="none" stroke="${c}" stroke-opacity=".75" stroke-width="1.1"/>
      <ellipse rx="4" ry="7.5" cy="2" fill="none" stroke="${c}" stroke-opacity=".8" stroke-width="1"/>
      <ellipse rx="1.2" ry="3" cy="3" fill="${c}" fill-opacity=".8"/>
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
            <g class="leaves"></g>
            <g class="branches">${branches.map((b) => b.fill ? `<path data-d="9" d="${b.d}" fill="#7C7F86"/>` : `<path data-d="${b.depth}" d="${b.d}" fill="none" stroke="#7C7F86" stroke-width="${Math.max(1.4, b.w).toFixed(1)}" stroke-linecap="round"/>`).join("")}</g>
            <g class="fruits"></g>
            <g class="perched">
              <g transform="translate(${(perch.x - 18).toFixed(1)} ${(perch.y - 16).toFixed(1)})">${birdSvg("#6E6BB8", "#8C89D0", false, false)}</g>
              <g transform="translate(${(perch.x + 26).toFixed(1)} ${(perch.y - 20).toFixed(1)}) scale(1.08)">${birdSvg("#5A57A6", "#7F7CC6", true, false)}</g>
            </g>
          </g>
          <g class="flyers">
            <g><g class="bird-scale">${birdSvg("#6E6BB8", "#8C89D0", false, true)}</g>
              <animateMotion dur="18s" repeatCount="indefinite" rotate="0" keyPoints="0;0.5;0.5;1" keyTimes="0;0.38;0.62;1" calcMode="linear"
                path="M-80,${(CROWN.y - 300).toFixed(0)} C150,${(CROWN.y - 360).toFixed(0)} ${(perch2.x - 120).toFixed(0)},${(perch2.y - 140).toFixed(0)} ${(perch2.x).toFixed(0)},${(perch2.y - 16).toFixed(0)} C${(perch2.x + 160).toFixed(0)},${(perch2.y - 200).toFixed(0)} 700,40 1100,${(CROWN.y - 330).toFixed(0)}"/></g>
            <g><g class="bird-scale" transform="scale(.8)">${birdSvg("#E5704F", "#F2A48A", true, true)}</g>
              <animateMotion dur="23s" begin="6s" repeatCount="indefinite" rotate="0"
                path="M1100,180 C900,120 760,260 560,150 C380,60 220,210 -100,140"/></g>
            <g><g class="bird-scale" transform="scale(.7)">${birdSvg("#2E9C8F", "#7FCFC4", false, true)}</g>
              <animateMotion dur="27s" begin="13s" repeatCount="indefinite" rotate="0"
                path="M-100,260 C120,190 300,320 520,230 C720,150 860,280 1100,210"/></g>
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
    setLeaves(Math.round(MAX_LEAVES * Math.max(0, Math.min(1, (g - .2) / .75))));
    fruitLayer.style.opacity = Math.max(0, Math.min(1, (g - .45) / .1));
    svg.querySelector(".perched").style.opacity = g >= .7 ? 1 : 0;      // 樹長茂密後，一對鳥停在枝頭
    svg.querySelector(".flyers").style.opacity = g >= .3 ? 1 : 0;       // 長出樹枝後，開始有鳥飛來
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
    init(container, opts = {}) { if (!root) { build(container); if (opts.inline) { root.classList.add("inline"); root.classList.remove("hide"); } } },
    show(on) { if (root) root.classList.toggle("hide", !on); document.body.classList.toggle("treemode", !!on); if (window.World) World.skipRender = !!on; },
    get visible() { return root && !root.classList.contains("hide"); },
    update({ sents, totals, people, edits, phase, drops, possible, full: needed }) {
      if (!root) return;
      const full = Math.max(1, needed || Math.ceil(Object.keys(people || {}).length * ((window.ISLAND_CONFIG && ISLAND_CONFIG.treeDropsPerPerson) || 1)) || 1);
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
