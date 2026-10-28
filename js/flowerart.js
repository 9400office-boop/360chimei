/* =========================================================
 * 共識花園：小花的成長插畫（手機花園、參加者首頁共用）
 * stage 0 種下 → 1 發芽(10%) → 2 長葉(30%) → 3 結苞(50%) → 4 花苞轉色(70%) → 5 半開(90%) → 6 盛開(100%)
 * ========================================================= */
(function () {
  const HS = [9, 20, 34, 46, 54, 60, 62];            // 各階段莖的高度
  // 葉子：葉基在 (x,y)，side = -1 往左長、1 往右長，tilt 為往上翹的角度
  const leaf = (x, y, side, tilt, s, c) => `<g transform="translate(${x} ${y}) scale(${side * s} ${s}) rotate(${-tilt})"><path d="M0,0 C5,-5 14,-6 19,-1 C14,4 5,4 0,0Z" fill="${c}"/><path d="M1,0 L15,-1" stroke="#fff" stroke-opacity=".35" stroke-width="1"/></g>`;
  function petals(n, r, rx, ry, color, open) {
    let out = "";
    for (let i = 0; i < n; i++) {
      const a = i / n * 360 + (n === 6 ? 30 : 0);
      out += `<ellipse cx="0" cy="${-r}" rx="${rx}" ry="${ry}" transform="rotate(${a})" fill="${color}" stroke="#fff" stroke-width="1.6"${open < 1 ? ` opacity="${open}"` : ""}/>`;
    }
    return out;
  }
  function shade(hex, k) {
    const n = parseInt(hex.slice(1), 16), f = (v) => Math.max(0, Math.min(255, Math.round(v * k)));
    return "#" + [n >> 16, (n >> 8) & 255, n & 255].map(f).map((v) => v.toString(16).padStart(2, "0")).join("");
  }
  function svg(stage, color, kind, opt = {}) {
    stage = Math.max(0, Math.min(6, stage | 0));
    const H = HS[stage], dark = shade(color, .82), stem = "#5E9E5A", lf = "#6DB06A", lf2 = "#86C27A";
    let s = `<ellipse cx="0" cy="3" rx="31" ry="7" fill="#000" opacity=".08"/>
      <ellipse cx="0" cy="1" rx="27" ry="7.5" fill="#8C6A45"/><ellipse cx="-2" cy="-.6" rx="21" ry="4.2" fill="#A88560"/>`;
    if (stage === 0) {
      // 剛種下：種子露出一點，冒出小芽尖
      s += `<ellipse cx="0" cy="-2" rx="6.5" ry="4.5" fill="#8A5A2B"/><ellipse cx="-2" cy="-3.4" rx="2.2" ry="1.3" fill="#B98A5E"/>
        <path d="M1,-5 C1,-8 2,-10 3,-11" stroke="${stem}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
    } else {
      const w = stage < 2 ? 2.6 : 3.4;
      s += `<path d="M0,0 C2.5,${-H * .35} -2.5,${-H * .7} 0,${-H}" stroke="${stem}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`;
      if (stage === 1) {                                   // 發芽：兩片子葉
        s += leaf(0, -H + 1, -1, 28, .62, lf2) + leaf(0, -H + 1, 1, 28, .62, lf);
      } else {
        // 長葉：莖上左右交錯的葉子，階段越高越多越大
        const pairs = stage >= 4 ? 3 : 2;
        for (let i = 0; i < pairs; i++) {
          const y = -H * (.22 + i * .2), sc = .8 + Math.min(stage, 5) * .06 - i * .08;
          s += leaf(i % 2 ? 1 : -1, y, i % 2 ? 1 : -1, 22, sc, i % 2 ? lf : lf2);
        }
      }
      const T = -H;
      if (stage === 3) {                                   // 結苞：綠色花苞
        s += `<g transform="translate(0 ${T})"><path d="M-6,1 C-7,-6 -3,-12 0,-14 C3,-12 7,-6 6,1 Z" fill="#7DBE6E"/><path d="M-6,1 C-3,-3 3,-3 6,1 C3,4 -3,4 -6,1Z" fill="${lf}"/></g>`;
      } else if (stage === 4) {                            // 花苞轉色：頂端露出花色
        s += `<g transform="translate(0 ${T})"><path d="M-8,1 C-9,-9 -4,-17 0,-20 C4,-17 9,-9 8,1 Z" fill="${color}" stroke="#fff" stroke-width="1.2"/>
          <path d="M-8,1 C-9,-5 -6,-9 -3,-11 C-2,-6 -1,-2 0,1 Z" fill="#7DBE6E"/><path d="M8,1 C9,-5 6,-9 3,-11 C2,-6 1,-2 0,1 Z" fill="#6DB06A"/><path d="M-8,1 C-3,4 3,4 8,1" stroke="${lf}" stroke-width="3" fill="none"/></g>`;
      } else if (stage === 5) {                            // 半開：花瓣向上張開成杯狀
        s += `<g transform="translate(0 ${T})">
          <ellipse cx="-8" cy="-10" rx="6" ry="12" transform="rotate(-28 -8 -10)" fill="${dark}" stroke="#fff" stroke-width="1.4"/>
          <ellipse cx="8" cy="-10" rx="6" ry="12" transform="rotate(28 8 -10)" fill="${dark}" stroke="#fff" stroke-width="1.4"/>
          <ellipse cx="0" cy="-13" rx="7" ry="13" fill="${color}" stroke="#fff" stroke-width="1.4"/>
          <path d="M-9,1 C-4,5 4,5 9,1 C5,-2 -5,-2 -9,1Z" fill="#7DBE6E"/></g>`;
      } else if (stage === 6) {                            // 盛開
        const n = kind === 0 ? 5 : kind === 1 ? 6 : 8, rx = kind === 2 ? 5.6 : 7.4, ry = kind === 2 ? 10 : 11.5, r = kind === 2 ? 10 : 10.5;
        s += `<g transform="translate(0 ${T - 4})">
          ${opt.glow !== false ? `<circle r="26" fill="${color}" opacity=".18"/>` : ""}
          ${kind === 1 ? petals(n, r + 3, rx * .9, ry * .9, dark, 1) : ""}
          ${petals(n, r, rx, ry, color, 1)}
          <circle r="${kind === 2 ? 6.5 : 6}" fill="${kind === 2 ? "#8A5A2B" : "#FFD34D"}" stroke="#fff" stroke-width="1.5"/>
          <circle cx="-1.8" cy="-1.8" r="1.6" fill="#fff" opacity=".7"/></g>`;
        if (opt.sparkle !== false) s += `<g class="spk" fill="#FFD34D"><path d="M-24,${T - 22} l2,5 5,2 -5,2 -2,5 -2,-5 -5,-2 5,-2z"/><path d="M22,${T - 30} l1.5,4 4,1.5 -4,1.5 -1.5,4 -1.5,-4 -4,-1.5 4,-1.5z"/><path d="M26,${T + 2} l1.2,3 3,1.2 -3,1.2 -1.2,3 -1.2,-3 -3,-1.2 3,-1.2z"/></g>`;
      }
    }
    return `<svg class="fart st${stage}" viewBox="-36 -100 72 108" aria-hidden="true">${s}</svg>`;
  }
  window.FlowerArt = { svg, LABELS: ["剛種下", "發芽", "長葉", "結苞", "花苞轉色", "半開", "盛開"] };
})();
