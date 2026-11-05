/* =========================================================
 * 相遇：永續噴泉許願池 —— 我的深耕關鍵字
 * 點噴泉 → 填空「回望第一期，我最有感的一個改變是＿＿」→ 投下金幣
 * 資料：wishes/{pid} = { text, t }
 * ========================================================= */
(function () {
  const PROMPT = "回望第一期，我最有感的一個改變是";
  let getS = () => ({}), pid = null, onDone = null, busy = false;
  const S = () => getS() || {};
  const mine = () => ((S().wishes || {})[pid]) || null;

  function coinSvg(cls = "") {
    return `<svg class="ws-coin ${cls}" viewBox="0 0 60 60"><defs><radialGradient id="wsCg" cx="35%" cy="30%"><stop offset="0" stop-color="#FFF6C8"/><stop offset=".5" stop-color="#F6C84A"/><stop offset="1" stop-color="#C98A1E"/></radialGradient></defs>
      <circle cx="30" cy="30" r="27" fill="url(#wsCg)" stroke="#A8701A" stroke-width="2.5"/><circle cx="30" cy="30" r="20" fill="none" stroke="#FFF1B8" stroke-width="1.6" opacity=".8"/>
      <path d="M30,16 C33,24 38,26 44,30 C38,34 33,36 30,44 C27,36 22,34 16,30 C22,26 27,24 30,16Z" fill="#FFF4C8" opacity=".9"/></svg>`;
  }
  function wellSvg() {
    return `<svg class="ws-well" viewBox="0 0 300 150">
      <defs><linearGradient id="wsW" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8FD8F2"/><stop offset="1" stop-color="#3E9BC6"/></linearGradient></defs>
      <ellipse cx="150" cy="118" rx="140" ry="28" fill="#D8CDB6"/><ellipse cx="150" cy="112" rx="128" ry="22" fill="url(#wsW)"/>
      <ellipse class="ws-rip r1" cx="150" cy="112" rx="20" ry="5" fill="none" stroke="#fff" stroke-width="2"/>
      <ellipse class="ws-rip r2" cx="150" cy="112" rx="20" ry="5" fill="none" stroke="#fff" stroke-width="2"/>
      <rect x="140" y="52" width="20" height="60" rx="6" fill="#EFE9DD"/><ellipse cx="150" cy="52" rx="34" ry="8" fill="#E6DFD0"/>
      <path class="ws-jet" d="M150,48 C150,20 150,8 150,4 M150,10 C130,14 118,30 112,50 M150,10 C170,14 182,30 188,50" stroke="#BFE9FF" stroke-width="5" fill="none" stroke-linecap="round" opacity=".85"/>
      ${[[60, 108], [96, 120], [204, 104], [236, 118], [130, 124]].map(([x, y]) => `<g transform="translate(${x} ${y}) scale(.28)">${coinSvg().replace('<svg class="ws-coin "', "<g").replace("</svg>", "</g>").replace(/viewBox="[^"]*"/, "")}</g>`).join("")}
    </svg>`;
  }
  function open() {
    if (document.getElementById("wishModal")) return;
    const m = mine();
    const el = document.createElement("div"); el.id = "wishModal"; el.className = "ws-shade";
    el.innerHTML = `<div class="ws-card">
      <button class="ws-x" data-close aria-label="關閉">×</button>
      <div class="ws-eyebrow">⛲ 永續噴泉・許願池</div>
      <h2>我的深耕關鍵字</h2>
      <div class="ws-stage">${wellSvg()}<div class="ws-fly"></div></div>
      <label class="ws-q">${PROMPT}</label>
      <div class="ws-fill"><input id="wsInput" maxlength="30" placeholder="例：跨團隊更願意互相支援" value="${m ? escapeHtml(m.text) : ""}" autocomplete="off"></div>
      ${m ? `<div class="ws-done">你已許下：「${escapeHtml(m.text)}」，可以修改後再投一次</div>` : ""}
      <button class="ws-btn" id="wsGo">${coinSvg("sm")}<span>投下金幣・許下心願</span></button>
    </div>`;
    document.body.appendChild(el);
    el.addEventListener("click", (e) => { if (e.target === el || e.target.closest("[data-close]")) close(); if (e.target.closest("#wsGo")) submit(); });
    const inp = el.querySelector("#wsInput");
    inp.addEventListener("keydown", (e) => { if (e.key === "Enter") submit(); });
    setTimeout(() => inp.focus(), 250);
  }
  function close() { const el = document.getElementById("wishModal"); if (el) el.remove(); }
  function toast(msg) { const t = document.createElement("div"); t.className = "gtoast"; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 2400); }
  async function submit() {
    if (busy) return;
    const el = document.getElementById("wishModal"); if (!el) return;
    const inp = el.querySelector("#wsInput"), text = inp.value.trim();
    if (!text) { toast("先寫下你的深耕關鍵字喔"); inp.focus(); return; }
    if (!pid) { toast("請先報到"); return; }
    busy = true; inp.blur();
    // 金幣拋進噴泉
    const fly = el.querySelector(".ws-fly"); fly.innerHTML = coinSvg("throw");
    el.querySelector(".ws-stage").classList.add("splash");
    if (navigator.vibrate) try { navigator.vibrate([20, 60, 30]); } catch (e) {}
    try { await Store.set("wishes/" + pid, { text: text.slice(0, 30), t: Date.now() }); }
    catch (e) { busy = false; toast("送出失敗，請再試一次"); return; }
    setTimeout(() => {
      el.querySelector(".ws-card").classList.add("ok");
      el.querySelector(".ws-card").insertAdjacentHTML("beforeend", `<div class="ws-thanks">✨ 心願已投進永續噴泉 ✨<small>準備走進共識花園…</small></div>`);
    }, 1100);
    setTimeout(() => { busy = false; close(); if (onDone) onDone(text); }, 2600);
  }
  window.Wish = {
    PROMPT,
    init(o) { getS = o.getState; pid = o.pid || null; onDone = o.onDone || null; },
    open, close,
    get done() { return !!mine(); }
  };
})();
