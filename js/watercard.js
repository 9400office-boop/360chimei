/* =========================================================
 * 共識花園：花朵卡（點花 → 看行動句 → 澆水）
 * 手機花園頁與院區地圖（走到廣場點花）共用
 * ========================================================= */
(function () {
  const CFG = window.ISLAND_CONFIG, C = window.ISLAND_CONTENT;
  const SC = (id) => C.scopes.find((s) => s.id === Number(id));
  const PLAZA = PLAZA_NAMES;
  let getS = () => ({}), pid = null, openId = null, busy = false, lastStage = null, onClose = null;

  const S = () => getS() || {};
  const me = () => (pid && S().people && S().people[pid]) || null;
  const phase = () => (S().state && S().state.phase) || "join";
  const TOTAL = () => CFG.dropsPerPerson || 10;
  const left = () => Math.max(0, TOTAL() - waterUsed(S(), pid));
  const dropSvg = () => `<svg style="width:20px;height:26px" viewBox="0 0 20 26"><path d="M10,1 C14,8 18,12 18,17 A8,8 0 0 1 2,17 C2,12 6,8 10,1Z" fill="#3E95E0" stroke="#fff" stroke-width="1.6"/><ellipse cx="7" cy="16" rx="2" ry="3" fill="#fff" opacity=".6"/></svg>`;
  function toast(msg) { const t = document.createElement("div"); t.className = "gtoast"; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 2400); }

  function render() {
    const f = openId && gardenFlowers(S()).find((x) => x.pid === openId);
    let sh = document.getElementById("wsheet");
    if (!f) { if (sh) sh.remove(); return; }
    const BLOOM = bloomAt(), look = flowerLook(f.pid), p = f.p, sc = SC(p.scope), mg = ((S().waters || {})[pid] || {})[f.pid] || 0;
    if (!sh) {
      sh = document.createElement("div"); sh.id = "wsheet"; sh.className = "shade";
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
      sh.addEventListener("click", (e) => { if (e.target === sh || e.target.closest("[data-close]")) close(); if (e.target.closest("#wbtn")) water(); });
      lastStage = f.stage;
    }
    const grew = lastStage !== null && f.stage > lastStage;
    const art = sh.querySelector("#bigart"), nh = FlowerArt.svg(f.stage, look.color, look.kind);
    if (art.dataset.h !== nh) { art.dataset.h = nh; art.innerHTML = nh; }
    if (grew) {
      const box = sh.querySelector("#sbox"); box.classList.remove("grow"); void box.offsetWidth; box.classList.add("grow");
      const pl = document.createElement("div"); pl.className = "plus"; pl.textContent = f.bloomed ? "🌸 盛開！" : `${f.pct}%`; box.appendChild(pl); setTimeout(() => pl.remove(), 1300);
      if (f.bloomed) { confetti(look.color); toast("🎉 這朵花盛開了！謝謝你的灌溉"); }
    }
    lastStage = f.stage;
    sh.querySelector("#slabel").innerHTML = f.bloomed ? `<b class="bloomtxt">🌸 盛開 100%</b>` : `${FlowerArt.LABELS[f.stage]}・<b>${f.pct}%</b>`;
    const st = sh.querySelector("#steps"); st.classList.toggle("full", f.bloomed);
    st.innerHTML = GARDEN_STEPS.slice(1).map((v, i) => `<div class="${f.stage > i ? "on" : ""}"><i></i>${v}%</div>`).join("");
    sh.querySelector("#author").innerHTML = `${Avatar.svg(p.avatar)}<div><b>${escapeHtml(p.name || "")}${f.pid === pid ? "（我）" : ""}</b><span>${escapeHtml(p.dept || "")}・${PLAZA[p.plaza] || ""}</span></div>` +
      (sc ? `<span class="tg" style="background:${sc.color}">${sc.tag}・${escapeHtml(sc.name)}</span>` : "");
    const said = sentenceRich({ pid: f.pid }, S().people, S().edits, true);
    const sd = sh.querySelector("#said"); if (sd.dataset.h !== said) { sd.dataset.h = said; sd.innerHTML = said; }
    const b = sh.querySelector("#wbtn");
    b.classList.toggle("done", f.bloomed);
    if (f.bloomed) { b.disabled = true; b.innerHTML = "🌸 已盛開，謝謝大家的深耕"; }
    else if (!me()) { b.disabled = true; b.innerHTML = "報到後就能澆水"; }
    else if (!waterOpen(S())) { b.disabled = true; b.innerHTML = "主持人已暫停澆花"; }
    else if (!left()) { b.disabled = true; b.innerHTML = "水滴用完了，看看大家的花吧"; }
    else { b.disabled = busy; b.innerHTML = `${dropSvg()} 澆水（剩 ${left()} 滴）`; }
    sh.querySelector("#mygave").textContent = mg ? `你已經幫這朵花澆了 ${mg} 次 💙` : "";
  }

  function close() { const sh = document.getElementById("wsheet"); if (sh) sh.remove(); const was = openId; openId = null; lastStage = null; if (onClose) onClose(was); }

  async function water() {
    if (busy || !openId || !waterOpen(S()) || !me()) return;
    const f = gardenFlowers(S()).find((x) => x.pid === openId);
    if (!f || f.bloomed || !left()) return;
    busy = true; render();
    const box = document.querySelector("#sbox"); box.classList.remove("pour"); void box.offsetWidth; box.classList.add("pour");
    if (navigator.vibrate) try { navigator.vibrate(30); } catch (e) {}
    await new Promise((r) => setTimeout(r, 900));            // 等水壺倒完再長大
    const cur = ((S().waters || {})[pid] || {})[openId] || 0;
    try { await Store.set(`waters/${pid}/${openId}`, cur + 1); }
    catch (e) { toast("澆水失敗，請再試一次"); }
    busy = false; if (box) box.classList.remove("pour"); render();
  }

  function confetti(color) {
    const cols = [color, "#FFD34D", "#F4A7B9", "#8FD6E8", "#C9E265"];
    for (let i = 0; i < 26; i++) {
      const el = document.createElement("i"); el.className = "petal";
      el.style.left = "50%"; el.style.top = "34%"; el.style.background = cols[i % cols.length];
      const a = Math.random() * Math.PI * 2, d = 90 + Math.random() * 140;
      el.style.setProperty("--dx", Math.cos(a) * d + "px"); el.style.setProperty("--dy", Math.sin(a) * d + 120 + "px"); el.style.setProperty("--rot", (Math.random() * 720 - 360) + "deg");
      el.style.animationDelay = Math.random() * .15 + "s";
      document.body.appendChild(el); setTimeout(() => el.remove(), 2600);
    }
  }

  window.WaterCard = {
    init(o) { getS = o.getState; pid = o.pid || null; onClose = o.onClose || null; },
    open(fid) { openId = fid; lastStage = null; render(); },
    refresh() { if (openId) render(); },
    close,
    get openId() { return openId; },
    toast
  };
})();
