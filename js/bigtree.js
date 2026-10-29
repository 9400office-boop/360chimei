/* =========================================================
 * 共識大樹：澆水與收成時的全螢幕海報
 * 在樹根澆水，樹依真實生長方式長大；揭曉的行動句像果實掛在樹上，票越多越大
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
  const CROWN = { x: CX, y: 405, R: 345 };          // 圓形樹冠
  const inCrown = (x, y, k = 1) => Math.hypot(x - CROWN.x, (y - CROWN.y) * 1.05) < CROWN.R * k;
  const branches = [], tips = [], forks = [];
  function grow(x, y, ang, len, w, depth, t0 = 0) {
    let x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len;
    // 枝條不超出樹冠
    for (let k = 0; k < 6 && !inCrown(x2, y2, .9); k++) { len *= .82; x2 = x + Math.cos(ang) * len; y2 = y + Math.sin(ang) * len; }
    const bend = (r() - .5) * len * .3;
    const mx = (x + x2) / 2 + Math.cos(ang + Math.PI / 2) * bend, my = (y + y2) / 2 + Math.sin(ang + Math.PI / 2) * bend;
    const dur = .08 + len / 900;                       // 越長的枝條長得越久
    branches.push({ d: `M${x.toFixed(1)},${y.toFixed(1)} Q${mx.toFixed(1)},${my.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`, w, depth, x, y, mx, my, x2, y2, ang, len, t0, t1: t0 + dur });
    if (depth >= 1 && depth <= 3) forks.push({ x: x2, y: y2, depth, ang });
    const childT = t0 + dur * .6;                      // 母枝長到六成，子枝才開始冒出
    if (depth === 0 || len < 26) { tips.push({ x: x2, y: y2, ang }); return; }
    const n = depth >= 3 ? 2 : (r() < .55 ? 2 : 3);
    for (let i = 0; i < n; i++) {
      const spread = n === 2 ? (i ? 1 : -1) * (.3 + r() * .22) : (i - 1) * (.42 + r() * .15);
      grow(x2, y2, ang + spread + (r() - .5) * .12, len * (.72 + r() * .1), w * .64, depth - 1, childT + r() * .03);
    }
  }
  // 樹幹（較粗、向上漸細，根部微微外擴）
  const TRUNK_D = `M${CX - 48},${GROUND} C${CX - 26},${GROUND - 40} ${CX - 30},${GROUND - 150} ${CX - 16},${TOPY} L${CX + 16},${TOPY} C${CX + 30},${GROUND - 150} ${CX + 28},${GROUND - 40} ${CX + 52},${GROUND} Z`;
  // 主枝由下往上依序冒出（中間兩枝最後）
  [[-2.75, 150, 18, 0], [-.4, 150, 18, .01], [-2.3, 175, 22, .04], [-.85, 175, 22, .05], [-1.85, 190, 24, .08], [-1.32, 190, 24, .09]]
    .forEach(([a, l, w, d]) => grow(CX + Math.cos(a) * 10, TOPY + 6, a, l, w, 4, d));
  // 正規化生長時間：樹幹 0.03～0.24，枝條 0.20～0.80
  { const maxEnd = Math.max(...branches.map((b) => b.t1)); branches.forEach((b) => { b.t0 = .2 + b.t0 / maxEnd * .6; b.t1 = .2 + b.t1 / maxEnd * .6; }); }

  // ---------- 葉子：鋪滿圓形樹冠，但每一片都是從最近的樹枝上「長」出來 ----------
  const qpt = (b, f) => ({
    x: (1 - f) * (1 - f) * b.x + 2 * (1 - f) * f * b.mx + f * f * b.x2,
    y: (1 - f) * (1 - f) * b.y + 2 * (1 - f) * f * b.my + f * f * b.y2
  });
  // 枝條上的取樣點（細枝才長葉），記下枝條長到該點的時間
  const buds = [];
  branches.forEach((b) => { if (b.depth <= 3) [.3, .55, .8, 1].forEach((f) => { const p = qpt(b, f); buds.push({ x: p.x, y: p.y, t: b.t0 + (b.t1 - b.t0) * f }); }); });
  const leafSpots = [];
  const STEP = 25;                                   // 葉子更密：大螢幕上更茂盛
  for (let y = CROWN.y - CROWN.R; y <= CROWN.y + CROWN.R; y += STEP * .86) {
    const row = Math.round((y - CROWN.y) / (STEP * .86));
    for (let x = CROWN.x - CROWN.R; x <= CROWN.x + CROWN.R; x += STEP) {
      const jx = x + (row % 2 ? STEP / 2 : 0) + (r() - .5) * 14, jy = y + (r() - .5) * 12;
      if (!inCrown(jx, jy, .96 + r() * .1)) continue;
      if (jy > TOPY - 20 && Math.abs(jx - CX) < 70) continue;
      let bud = buds[0], bd = 1e9;
      buds.forEach((q) => { const d = Math.hypot(q.x - jx, q.y - jy); if (d < bd) { bd = d; bud = q; } });
      // 葉基朝向枝條、葉尖朝外；葉基稍微靠近枝條，像是從枝上冒出來
      const ang = bd < 1 ? -Math.PI / 2 : Math.atan2(jy - bud.y, jx - bud.x);
      const pull = Math.min(bd, 22);
      leafSpots.push({ x: jx - Math.cos(ang) * pull * .6, y: jy - Math.sin(ang) * pull * .6, rot: ang * 180 / Math.PI + 90 + (r() - .5) * 30,
        s: .95 + r() * .4, g: Math.floor(r() * 5), t: Math.min(.99, bud.t + .03 + Math.min(.12, bd / 900) + r() * .05) });
    }
  }
  leafSpots.sort((a, b) => a.t - b.t);
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
    // 葉基在原點（連在枝上），葉尖朝外；長出時從葉基慢慢展開
    return `<g transform="translate(${l.x.toFixed(1)} ${l.y.toFixed(1)}) rotate(${l.rot.toFixed(0)}) scale(${l.s.toFixed(2)})"><g class="leaf" style="animation-delay:${(i % 16) * 70}ms">
      <ellipse cy="-19" rx="14" ry="20" fill="${c}" fill-opacity=".5"/>
      <ellipse cy="-19" rx="11" ry="16.5" fill="none" stroke="${c}" stroke-opacity=".7" stroke-width="1.2"/>
      <ellipse cy="-18" rx="7.5" ry="12" fill="none" stroke="${c}" stroke-opacity=".75" stroke-width="1.1"/>
      <ellipse cy="-17" rx="4" ry="7.5" fill="none" stroke="${c}" stroke-opacity=".8" stroke-width="1"/>
      <ellipse cy="-16" rx="1.2" ry="3" fill="${c}" fill-opacity=".8"/>
    </g></g>`;
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
          <defs><clipPath id="trunkClip"><rect class="tclip" x="0" y="${GROUND + 10}" width="${W}" height="0"/></clipPath>
            <linearGradient id="sapG" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#C8F2B8" stop-opacity="0"/><stop offset=".5" stop-color="#DFFFD2" stop-opacity=".95"/><stop offset="1" stop-color="#C8F2B8" stop-opacity="0"/></linearGradient>
            <radialGradient id="btShadow"><stop offset="0" stop-color="#8A8FA8" stop-opacity=".45"/><stop offset="1" stop-color="#8A8FA8" stop-opacity="0"/></radialGradient></defs>
          <g class="swirl" fill="none" stroke="#C9CDE8" stroke-width="2.2" opacity=".7">
            <path d="M40,980 C90,900 170,930 150,860 C135,810 70,830 90,880"/><path d="M20,930 C60,880 120,880 120,840"/>
            <path d="M960,40 C900,110 820,90 840,150 C855,200 920,180 900,130"/><path d="M985,90 C940,130 880,130 880,170"/>
          </g>
          <ellipse cx="${CX}" cy="${GROUND + 6}" rx="190" ry="16" fill="url(#btShadow)"/>
          <g class="seed" transform="translate(${CX} ${GROUND}) scale(2)">
            <ellipse cx="0" cy="2" rx="46" ry="9" fill="#A9845E" opacity=".55"/>
            <path class="root" d="M0,-4 C1,4 -2,10 1,17 M0,6 C-4,9 -7,10 -10,14 M1,10 C4,12 7,13 9,17" stroke="#C9A27A" stroke-width="1.6" fill="none" stroke-linecap="round" pathLength="1"/>
            <g class="seedbody"><g class="shellL"><path d="M0,-17 C-8,-17 -12,-12 -12,-8 C-12,-3 -7,1 0,1 Z" fill="#8A5A2B"/><ellipse cx="-4" cy="-11" rx="3.5" ry="2.3" fill="#B98A5E"/></g>
              <g class="shellR"><path d="M0,-17 C8,-17 12,-12 12,-8 C12,-3 7,1 0,1 Z" fill="#7E5226"/></g></g>
            <g class="sprout"><path class="hypo" d="M0,-6 C0,-20 1,-30 0,-42" stroke="#5E9E5A" stroke-width="4" fill="none" stroke-linecap="round"/>
              <g class="coty"><path d="M0,-40 C-10,-52 -26,-52 -30,-44 C-22,-36 -10,-36 0,-40Z" fill="#9BCF7E"/><path d="M0,-40 C10,-52 26,-52 30,-44 C22,-36 10,-36 0,-40Z" fill="#7DBE6E"/></g></g>
          </g>
          <g class="grow">
            <g class="leaves"></g>
            <g class="trunk"><path class="tbody" d="" fill="#7C7F86"/>
              <path class="sap" d="M${CX + 2},${GROUND - 4} L${CX},${TOPY + 10}" stroke="url(#sapG)" stroke-width="16" stroke-linecap="round" pathLength="1"/></g>
            <g class="sapling"></g>
            <g class="branches">${branches.map((b, i) => `<path data-i="${i}" d="${b.d}" pathLength="1" fill="none" stroke="#7C7F86" stroke-width="${Math.max(1.4, b.w).toFixed(1)}" stroke-linecap="round"/>`).join("")}</g>
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
          <g class="soil"><ellipse class="wet" cx="${CX}" cy="${GROUND + 3}" rx="92" ry="12" fill="#6E4A2C" opacity="0"/>
            <ellipse class="ripple" cx="${CX - 12}" cy="${GROUND + 2}" rx="30" ry="5" fill="none" stroke="#6FB6F2" stroke-width="3" opacity="0"/></g>
          <g class="can" transform="translate(${CX - 160} ${GROUND - 64})">
            <g class="can-body">
              <path d="M-36,-30 C-46,-46 -30,-62 -12,-56" fill="none" stroke="#3E7EC4" stroke-width="7" stroke-linecap="round"/>
              <path d="M-40,-30 L36,-30 L30,30 Q0,38 -30,30 Z" fill="#5FA8E8"/>
              <path d="M-40,-30 L36,-30 L34,-20 L-38,-20 Z" fill="#3E7EC4"/>
              <path d="M30,-6 L84,-38 L88,-30 L34,6 Z" fill="#4E96DA"/>
              <ellipse cx="88" cy="-36" rx="7" ry="10" transform="rotate(-30 88 -36)" fill="#3E7EC4"/>
              <path d="M-22,0 C-14,-10 -4,-10 0,0 C4,-10 14,-10 20,0 C14,12 0,18 0,18 C0,18 -14,12 -22,0Z" fill="#fff" opacity=".85" transform="scale(.6) translate(-2 8)"/>
            </g>
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
    branchEls.forEach((el) => { el.style.strokeDasharray = "1 1"; el.style.strokeDashoffset = "1"; });
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

  // ---------- 生長：g = 0（種子）→ 1（滿樹），模擬真實樹木 ----------
  // 種子發芽 → 樹幹由下往上長高、慢慢變粗 → 主枝由下往上冒出、向外延伸 → 子枝接著分岔
  // → 葉子跟著枝條長到的地方冒出 → 果實（行動句）掛上 → 鳥兒停留
  const clamp = (t) => Math.max(0, Math.min(1, t));
  const ease = (t) => 1 - Math.pow(1 - clamp(t), 3);
  // 顏色漸變：嫩綠莖 → 木質灰
  const mix = (c1, c2, k) => { const a = c1.match(/\w\w/g).map((h) => parseInt(h, 16)), b = c2.match(/\w\w/g).map((h) => parseInt(h, 16)); return "#" + a.map((v, i) => Math.round(v + (b[i] - v) * k).toString(16).padStart(2, "0")).join(""); };
  const FULL_H = GROUND - TOPY;
  function trunkPath(h, bw, tw) {
    const G = GROUND, ty = G - h, f = Math.min(1, bw / 50) * 4;
    return `M${(CX - bw).toFixed(1)},${G} C${(CX - bw * .55).toFixed(1)},${(G - h * .16).toFixed(1)} ${(CX - tw - bw * .22).toFixed(1)},${(G - h * .6).toFixed(1)} ${(CX - tw).toFixed(1)},${ty.toFixed(1)} ` +
      `L${(CX + tw).toFixed(1)},${ty.toFixed(1)} C${(CX + tw + bw * .22).toFixed(1)},${(G - h * .6).toFixed(1)} ${(CX + bw * .55).toFixed(1)},${(G - h * .16).toFixed(1)} ${(CX + bw + f).toFixed(1)},${G} Z`;
  }
  const sapLeaf = (x, y, rot, sc, c) => `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(0)}) scale(${sc.toFixed(2)})"><path d="M0,0 C-9,-8 -10,-24 0,-34 C10,-24 9,-8 0,0Z" fill="${c}"/><path d="M0,-2 L0,-28" stroke="#fff" stroke-opacity=".45" stroke-width="1.2"/></g>`;

  // 真實的生長順序（g = 0 種子 → 1 大樹）
  //  0.00～0.03 種子吸水膨大、種皮裂開、胚根往下扎進土裡
  //  0.02～0.07 嫩莖頂著兩片子葉破土、子葉展開
  //  0.05～0.22 幼苗長高：莖頂不斷長出新葉，莖上的葉子一對一對展開，莖由綠轉為木質、漸漸變粗
  //  0.20～0.80 主枝、側枝依序伸出；葉子沿枝條冒出，幼苗時期的葉子自然脫落
  //  0.55～   行動句果實掛上；0.85～ 鳥兒停在枝頭
  function render(g) {
    const seed = svg.querySelector(".seed");
    // 種子：膨大 → 裂開 → 種皮淡出
    const crack = clamp(g / .025);
    seed.querySelector(".shellL").setAttribute("transform", `translate(0 -8) rotate(${(-28 * crack).toFixed(1)}) translate(0 8) translate(${(-5 * crack).toFixed(1)} 0)`);
    seed.querySelector(".shellR").setAttribute("transform", `translate(0 -8) rotate(${(24 * crack).toFixed(1)}) translate(0 8) translate(${(5 * crack).toFixed(1)} 0)`);
    seed.querySelector(".seedbody").style.opacity = 1 - clamp((g - .05) / .04);
    seed.querySelector(".seedbody").setAttribute("transform", `scale(${(1 + .12 * clamp(g / .015)).toFixed(3)})`);
    const root = seed.querySelector(".root");
    root.style.strokeDasharray = "1 1"; root.style.strokeDashoffset = (1 - ease(g / .04)).toFixed(3); root.style.opacity = 1 - clamp((g - .12) / .05);
    // 嫩芽：胚軸彎著頂出土 → 挺直、子葉展開，之後被長高的莖取代
    const sp = seed.querySelector(".sprout"), spk = ease((g - .015) / .045);
    sp.style.opacity = g <= .015 ? 0 : 1 - clamp((g - .075) / .02);
    sp.setAttribute("transform", `scale(${(.25 + .75 * spk).toFixed(3)})`);
    seed.querySelector(".coty").setAttribute("transform", `translate(0 -40) scale(${(.3 + .7 * spk).toFixed(2)}) rotate(${((1 - spk) * 40).toFixed(0)}) translate(0 40)`);
    // 莖／樹幹：高度、粗細、顏色都連續變化
    const stemK = ease((g - .06) / .17);
    const h = 84 * clamp((g - .055) / .02) + (FULL_H + 6 - 84) * stemK;            // 接續嫩芽高度（約 84）往上長
    const bw = 4 + 46 * Math.sqrt(clamp((g - .06) / .9));
    const tw = 1.6 + 14.4 * clamp((g - .12) / .4);
    const tb = svg.querySelector(".tbody");
    tb.setAttribute("d", h > 1 ? trunkPath(h, bw, tw) : "");
    tb.setAttribute("fill", mix("6FA85E", "7C7F86", clamp((g - .1) / .14)));
    svg.querySelector(".sap").setAttribute("d", `M${CX + 2},${GROUND - 4} L${CX},${(GROUND - Math.max(10, h - 10)).toFixed(1)}`);
    // 幼苗的葉子：莖頂一簇新葉＋莖上對生的葉片；長出樹枝後慢慢脫落
    const sapOp = (g < .055 ? 0 : 1) * (1 - clamp((g - .3) / .12));
    let sl = "";
    if (sapOp > 0) {
      const ty = GROUND - h, tipS = .55 + .6 * stemK;
      sl += sapLeaf(CX, ty + 2, -32, tipS, "#7DBE6E") + sapLeaf(CX, ty + 2, 30, tipS * .95, "#9BCF7E") + sapLeaf(CX, ty, 0, tipS * .7, "#A9D98A");
      [.3, .52, .74].forEach((f, i) => {
        const y = GROUND - FULL_H * f; if (GROUND - h > y - 20) return;          // 莖還沒長到這裡
        const k = clamp((GROUND - y - 20 - (GROUND - (GROUND - h))) / -60), sc = (.5 + .35 * (1 - f)) * clamp((h - (GROUND - y)) / 50);
        const off = 1.6 + 14.4 * clamp((g - .12) / .4) * (1 - f) + bw * (1 - f) * .5;
        sl += sapLeaf(CX - off, y, -62 - i * 6, sc, "#6DB97A") + sapLeaf(CX + off, y - 6, 58 + i * 6, sc, "#5FAE63");
      });
    }
    const sapG = svg.querySelector(".sapling"); sapG.innerHTML = sl; sapG.style.opacity = sapOp;
    // 枝條：依各自的生長時間，從基部往末端延伸，並隨年紀變粗
    branchEls.forEach((el) => {
      const b = branches[el.dataset.i];
      const k = clamp((g - b.t0) / (b.t1 - b.t0));
      el.style.strokeDashoffset = (1 - k).toFixed(3);
      el.style.opacity = k > 0 ? 1 : 0;
      const age = clamp((g - b.t0) / (1 - b.t0));
      el.style.strokeWidth = Math.max(1.2, b.w * (.4 + .6 * age) * Math.min(1, .3 + k)).toFixed(2);
    });
    // 葉子：已長到的枝條旁才冒出
    let n = 0; while (n < MAX_LEAVES && leafSpots[n].t <= g) n++;
    setLeaves(g >= 1 ? MAX_LEAVES : n);
    fruitLayer.style.opacity = clamp((g - .55) / .1);
    svg.querySelector(".perched").style.opacity = g >= .85 ? 1 : 0;
    svg.querySelector(".flyers").style.opacity = g >= .35 ? 1 : 0;
  }
  // 平滑過渡：每次澆水，樹從目前的樣子慢慢長到新的樣子
  let curG = -1, tween = null;
  function setGrowth(g) {
    if (Math.abs(g - lastG) < 1e-4) return;
    lastG = g;
    growG.style.transform = "none";
    if (curG < 0) { curG = g; render(g); return; }
    const from = curG, dur = Math.min(2600, 900 + Math.abs(g - from) * 5000), t0 = performance.now();
    if (tween) cancelAnimationFrame(tween);
    const step = (now) => {
      const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 2);
      curG = from + (g - from) * e; render(curG);
      tween = k < 1 ? requestAnimationFrame(step) : null;
    };
    tween = requestAnimationFrame(step);
  }


  // ---------- 在樹根澆水：澆水壺傾倒、水流到樹根、土壤吸水、養分沿樹幹往上 ----------
  let pourTimer = null;
  function drip(n) {
    const can = svg.querySelector(".can"), layer = svg.querySelector(".drips");
    can.classList.remove("pour"); void can.getBoundingClientRect(); can.classList.add("pour");
    clearTimeout(pourTimer);
    pourTimer = setTimeout(() => can.classList.remove("pour"), 2200);
    const sx = CX - 160 + 84, sy = GROUND - 64 - 20;            // 壺嘴（傾倒後的大約位置）
    const cnt = Math.min(6 + n * 2, 18);
    for (let i = 0; i < cnt; i++) {
      const d = document.createElementNS(NS, "g");
      const tx = CX - 34 + Math.random() * 30, ty = GROUND - 4 - Math.random() * 26;   // 澆在樹幹基部
      d.innerHTML = `<path d="M0,-9 C4,-3 5,1 5,4 A5,5 0 0 1 -5,4 C-5,1 -4,-3 0,-9Z" fill="#6FB6F2" stroke="#fff" stroke-width="1.5"/>`;
      d.setAttribute("class", "pdrop");
      d.style.setProperty("--sx", sx + "px"); d.style.setProperty("--sy", sy + "px");
      d.style.setProperty("--tx", tx + "px"); d.style.setProperty("--ty", ty + "px");
      d.style.animationDelay = (350 + i * 70) + "ms";
      layer.appendChild(d);
      setTimeout(() => d.remove(), 1500 + i * 70);
    }
    const restart = (sel, cls) => { const el = svg.querySelector(sel); el.classList.remove(cls); void el.getBoundingClientRect(); el.classList.add(cls); };
    setTimeout(() => { restart(".ripple", "go"); restart(".wet", "go"); }, 700);
    setTimeout(() => restart(".sap", "go"), 1100);
  }

  // ---------- 收成：從種子長成大樹，果實＝盛開（100%）的行動句 ----------
  let isInline = false;
  let fruitHtml = "", fruitsShown = false, fruitData = [], cur = { people: {}, edits: null }, played = false, pourIv = null;
  const FRUIT_AT = .62;
  function showFruits(on) {
    if (on === fruitsShown) return;
    fruitsShown = on;
    fruitLayer.innerHTML = on ? fruitHtml : "";
    fruitLayer.style.opacity = 1;
  }
  const _render = render;
  render = function (g) { _render(g); fruitLayer.style.opacity = 1; showFruits(g >= FRUIT_AT); setBar(g); };
  function setBar(g) {
    if (!root) return;
    root.querySelector(".bt-bar i").style.width = (g * 100).toFixed(1) + "%";
    const n = fruitData.length;
    root.querySelector(".bt-count").textContent = g >= 1
      ? (n ? `🌸 ${n} 朵盛開的花，結成 ${n} 顆共識果實・點果實看行動句` : "🌳 共識大樹長成了！")
      : g < .06 ? "🌱 種子吸飽了大家的水…" : g < .25 ? "🌱 發芽、長高…" : g < FRUIT_AT ? "🌿 枝葉展開中…" : "🍎 結出共識果實！";
  }
  // 播放整段生長（預設 18 秒），期間水壺持續在樹幹澆水
  function playGrow(dur = 18000) {
    if (!root) return;
    if (tween) cancelAnimationFrame(tween);
    clearInterval(pourIv);
    setLeaves(0); showFruits(false);
    curG = 0; lastG = 0; render(0);
    const t0 = performance.now();
    drip(4);
    pourIv = setInterval(() => { if (curG < .95) drip(3); else clearInterval(pourIv); }, 2600);
    const step = (now) => {
      const k = Math.min(1, (now - t0) / dur), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      curG = e; lastG = e; render(e);
      tween = k < 1 ? requestAnimationFrame(step) : null;
      if (k >= 1) startAuto(1500);
    };
    tween = requestAnimationFrame(step);
  }

  // ---------- 留言板：樹長好後，依序自動播放每一顆果實的行動句（大螢幕） ----------
  let autoT = null, autoI = -1, pauseT = null;
  const AUTO_MS = 7000;
  function stopAuto() { clearTimeout(autoT); clearTimeout(pauseT); autoT = null; }
  function startAuto(delay = 0) {
    stopAuto();
    if (isInline || !root || root.classList.contains("hide") || !fruitData.length) return;
    const tick = () => { autoI = (autoI + 1) % fruitData.length; bubble(autoI); autoT = setTimeout(tick, AUTO_MS); };
    autoT = setTimeout(tick, delay);
  }
  function bubble(i) {
    const st = root.querySelector(".bt-stage"), bb = root.querySelector(".bt-bubble"), wire = root.querySelector(".bt-wire");
    const s = fruitData[i]; if (!s || !fruitsShown) { bb.classList.add("hide"); wire.innerHTML = ""; return; }
    const fe = root.querySelector(`.fruit[data-i="${i}"]`); if (!fe) return;
    root.querySelectorAll(".fruit").forEach((f) => f.classList.toggle("on", f === fe));
    const p = (cur.people || {})[s.pid] || {}, sc = SC(s.scope);
    bb.style.setProperty("--sc", sc.color);
    bb.innerHTML = `<div class="bb-top"><span class="bb-no" style="background:${sc.color}">${s.order}</span><span class="bb-tag" style="color:${sc.color}">${sc.tag}・${escapeHtml(sc.name)}</span><span class="bb-cnt">🍎 ${i + 1} / ${fruitData.length}</span></div>
      <div class="bb-tx">${typeof sentenceRich === "function" ? sentenceRich(s, cur.people, cur.edits, false) : escapeHtml(sentenceText(s, cur.people, cur.edits))}</div>
      <div class="bb-by">${window.Avatar && p.avatar ? Avatar.svg(p.avatar) : ""}<span><b>${escapeHtml(p.name || "")}</b>${escapeHtml(p.dept || "")}</span></div>
      <div class="bb-prog"><i style="animation-duration:${AUTO_MS}ms"></i></div>`;
    const sr = st.getBoundingClientRect(), fr = fe.querySelector("circle:not(.fr-halo)").getBoundingClientRect();
    const fx = fr.left + fr.width / 2 - sr.left, fy = fr.top + fr.height / 2 - sr.top;
    const narrow = sr.width < 900;
    bb.classList.remove("hide", "left", "right", "bottom");
    bb.classList.remove("go"); void bb.offsetWidth; bb.classList.add("go");
    if (narrow) { bb.classList.add("bottom"); bb.style.top = ""; wire.innerHTML = ""; return; }
    const side = fx < sr.width / 2 ? "left" : "right";
    bb.classList.add(side);
    const h = bb.offsetHeight, top = Math.max(110, Math.min(sr.height - h - 30, fy - h / 2));
    bb.style.top = top + "px";
    const bR = bb.getBoundingClientRect();
    const x0 = side === "left" ? bR.right - sr.left : bR.left - sr.left, y0 = top + h / 2;
    const mx = (x0 + fx) / 2;
    wire.setAttribute("viewBox", `0 0 ${sr.width} ${sr.height}`);
    wire.innerHTML = `<path d="M${x0},${y0} C${mx},${y0} ${mx},${fy} ${fx},${fy}" stroke="${sc.color}" stroke-width="3" fill="none" stroke-dasharray="8 7" stroke-linecap="round" pathLength="1000"/><circle cx="${x0}" cy="${y0}" r="6" fill="${sc.color}"/><circle cx="${fx}" cy="${fy}" r="${fr.width / 2 + 8}" fill="none" stroke="${sc.color}" stroke-width="3" class="bb-ring"/>`;
  }
  function fruitCard(i) {
    const card = root.querySelector(".bt-card");
    const s = fruitData[i];
    if (!s) { card.classList.add("hide"); return; }
    const p = (cur.people || {})[s.pid] || {}, sc = SC(s.scope);
    card.style.setProperty("--sc", sc.color);
    card.innerHTML = `<button class="bt-x" aria-label="關閉">×</button>
      <div class="bt-cno" style="background:${sc.color}">${s.order}</div>
      <div class="bt-ctx">${typeof sentenceRich === "function" ? sentenceRich(s, cur.people, cur.edits, false) : escapeHtml(sentenceText(s, cur.people, cur.edits))}</div>
      <div class="bt-cby">${window.Avatar && p.avatar ? Avatar.svg(p.avatar) : ""}<span><b>${escapeHtml(p.name || "")}</b>${escapeHtml(p.dept || "")}</span><em style="background:${sc.color}">${sc.tag}・${escapeHtml(sc.name)}</em></div>`;
    card.classList.remove("hide");
    root.querySelectorAll(".fruit").forEach((f) => f.classList.toggle("on", Number(f.dataset.i) === i));
  }

  // ---------- 對外 ----------
  window.BigTree = {
    init(container, opts = {}) {
      if (root) return;
      build(container);
      if (opts.inline) { root.classList.add("inline"); root.classList.remove("hide"); }
      const stage = root.querySelector(".bt-stage");
      isInline = !!opts.inline;
      stage.insertAdjacentHTML("beforeend", `<div class="bt-card hide"></div><svg class="bt-wire"></svg><div class="bt-bubble hide"></div>`);
      window.addEventListener("resize", () => { if (autoI >= 0 && !root.querySelector(".bt-bubble").classList.contains("hide")) bubble(autoI); });
      root.addEventListener("click", (e) => {
        const f = e.target.closest(".fruit");
        if (f && !isInline) { stopAuto(); autoI = Number(f.dataset.i); bubble(autoI); pauseT = setTimeout(() => startAuto(0), 20000); return; }   // 手動點果實：暫停輪播 20 秒
        if (f) { fruitCard(Number(f.dataset.i)); return; }
        const r = e.target.closest("[data-fi]"); if (r) { fruitCard(Number(r.dataset.fi)); return; }
        if (e.target.closest(".bt-x")) fruitCard(-1);
      });
      if (opts.inline) { played = true; curG = 1; lastG = 1; render(1); } else render(0);   // 主持人預覽：先顯示長好的樹
    },
    show(on) {
      if (!root) return;
      const was = !root.classList.contains("hide");
      root.classList.toggle("hide", !on); document.body.classList.toggle("treemode", !!on);
      if (window.World) World.skipRender = !!on;
      if (on && !was) { played = false; autoI = -1; root.querySelector(".bt-bubble").classList.add("hide"); root.querySelector(".bt-wire").innerHTML = ""; }   // 每次打開大樹，都從種子開始長
      if (!on) stopAuto();
    },
    get visible() { return root && !root.classList.contains("hide"); },
    replay(dur) { played = true; fruitCard(-1); playGrow(dur); },
    update({ sents, people, edits, totals }) {
      if (!root) return;
      cur = { people: people || {}, edits };
      fruitData = sents.slice().sort((a, b) => a.order - b.order);
      root.querySelector(".bt-sub").textContent = "收成・從一顆種子，灌溉成一棵大樹";
      // 果實：每一朵盛開的花，結成一顆果實（顏色＝範疇）
      const spots = fruitSpotsFor(fruitData.length);
      const r0 = fruitData.length > 40 ? 13 : fruitData.length > 20 ? 15 : 18;
      fruitHtml = fruitData.map((s, i) => {
        const p = spots[i]; if (!p) return "";
        const sc = SC(s.scope);
        return `<g class="fruit" data-i="${i}" transform="translate(${p.x.toFixed(1)} ${(p.y + 8).toFixed(1)})" style="--d:${(i % 24) * 70}ms">
          <g class="fr-in"><line y1="-10" y2="${(-r0 + 2).toFixed(1)}" stroke="#7C7F86" stroke-width="1.5"/>
          <circle class="fr-halo" r="${r0 + 7}" fill="${sc.color}" opacity="0"/>
          <circle r="${r0}" fill="${sc.color}" stroke="#fff" stroke-width="3"/>
          <ellipse cx="${(-r0 * .35).toFixed(1)}" cy="${(-r0 * .35).toFixed(1)}" rx="${(r0 * .28).toFixed(1)}" ry="${(r0 * .18).toFixed(1)}" fill="#fff" opacity=".45"/>
          <text y="${(r0 * .36).toFixed(1)}" text-anchor="middle" font-size="${(r0 * .95).toFixed(0)}" font-weight="700" fill="#fff" font-family="Noto Sans TC, sans-serif">${s.order}</text></g></g>`;
      }).join("");
      if (fruitsShown) { fruitLayer.innerHTML = fruitHtml; fruitLayer.querySelectorAll(".fruit").forEach((f) => f.style.setProperty("--d", "0ms")); }
      setBar(curG < 0 ? 0 : curG);
      // 右側：共識果實清單
      const side = root.querySelector(".bt-side");
      const html = `<h3>🍎 共識果實（${fruitData.length}）</h3><p class="bt-more" style="text-align:left;margin:-4px 0 6px">每一顆果實都是一朵澆到 100% 盛開的花</p>` +
        (fruitData.map((s, i) => {
          const p = (people || {})[s.pid] || {}, sc = SC(s.scope);
          return `<div class="bt-row" data-fi="${i}"><div class="bt-rk" style="color:${sc.color}">${s.order}</div><div class="bt-tx">${escapeHtml(sentenceText(s, people, edits))}
            <div class="bt-meta"><span class="bt-tag" style="background:${sc.color}">${sc.tag}</span>${escapeHtml((p.dept ? p.dept + " " : "") + (p.name || ""))}</div></div></div>`;
        }).join("") || `<p class="bt-more">還沒有盛開的花</p>`);
      if (side.dataset.h !== html) { side.dataset.h = html; side.innerHTML = html; }
      if (!played && this.visible) { played = true; playGrow(); }
    }
  };
})();
