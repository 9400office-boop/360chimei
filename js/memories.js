/* =========================================================
 * 深耕拾光：活動照片回顧（從「奇美光廊」進入）
 *  - 明亮的美術館展牆：作品掛在畫軌上緩緩流動，天窗的光慢慢掃過牆面（時光流動）
 *  - 作品帶著淡淡的舊時光色調，滑過或點選才顯出原色
 *  - 時光回放：一幅幅作品在聚光下由淡轉濃地「顯影」，看過的作品掛到後方展牆
 * 照片放在 assets/memories/NN.jpg（NN_s.jpg 為縮圖）；要增減照片改 COUNT 與 IMGV
 * ========================================================= */
(function () {
  const COUNT = 20;
  const IMGV = "20261108a";          // 換照片時改這個，避免手機讀到舊圖
  const STEP_MS = 4800;              // 時光回放：每張停留時間
  const pad = (n) => String(n).padStart(2, "0");
  const IDS = Array.from({ length: COUNT }, (_, i) => i + 1);
  const src = (n, big) => `assets/memories/${pad(n)}${big ? "" : "_s"}.jpg?v=${IMGV}`;
  let el = null, pi = -1, timer = null, playing = false, pile = 0;

  // 兩道展牆：作品掛在畫軌上，緩緩向左、向右流動（時光流動）；每一列從不同的照片開始
  const SIZES = ["m", "l", "s", "m", "l", "s", "m"];
  function strip(start, dir, dur) {
    const seq = IDS.map((_, k) => IDS[(start + k) % COUNT]);
    const cells = seq.concat(seq).map((n, k) => `<button class="ms-cell ${SIZES[k % SIZES.length]}" data-n="${n}" aria-label="拾光作品">
      <span class="ms-fr"><span class="ms-mat"><img src="${src(n)}" alt="" loading="lazy" decoding="async"></span></span></button>`).join("");
    return `<div class="ms-strip" style="--dur:${dur}s"><div class="ms-rail"></div><div class="ms-track ${dir}">${cells}</div></div>`;
  }
  const dust = () => Array.from({ length: 22 }, () => {
    const s = (Math.random() * 2.4 + 1).toFixed(1);
    return `<b style="left:${(Math.random() * 100).toFixed(1)}%;top:${(Math.random() * 80).toFixed(1)}%;width:${s}px;height:${s}px;--t:${(10 + Math.random() * 14).toFixed(1)}s;--d:-${(Math.random() * 20).toFixed(1)}s;--x:${(Math.random() * 60 - 30).toFixed(0)}px"></b>`;
  }).join("");

  function build() {
    el = document.createElement("div"); el.className = "ms-shade hide";
    el.innerHTML = `<div class="ms-room">
      <div class="ms-sky"></div><div class="ms-sun"></div><div class="ms-dust">${dust()}</div>
      <button class="ms-back" data-back>‹ 回奇美光廊</button>
      <header class="ms-head">
        <h2>深耕拾光</h2>
        <i class="ms-rule"></i>
        <p>拾起一起走過的每一道光　2025 – 2026</p>
        <button class="ms-play" data-play><span>▶</span> 時光回放</button>
      </header>
      <div class="ms-flow">
        ${strip(0, "l", 90)}
        ${strip(10, "r", 104)}
      </div>
      <div class="ms-floor"><span>滑過作品讓回憶顯色・點一下欣賞</span></div>
      <div class="ms-show hide">
        <div class="ms-table"></div>
        <figure class="ms-pola"><div class="ms-ph"><img alt=""></div><div class="ms-leak"></div></figure>
        <div class="ms-label"></div>
        <div class="ms-ctrl">
          <button data-prev aria-label="上一張">‹</button>
          <button data-pause aria-label="暫停">❚❚</button>
          <span class="ms-count"></span>
          <button data-next aria-label="下一張">›</button>
        </div>
        <div class="ms-bar"><i></i></div>
        <button class="ms-x" data-stop aria-label="關閉">×</button>
      </div>
    </div>`;
    document.body.appendChild(el);
    el.addEventListener("click", (e) => {
      if (e.target.closest("[data-back]")) return close();
      if (e.target.closest("[data-play]")) return play(0);
      if (e.target.closest("[data-stop]")) return stop();
      if (e.target.closest("[data-prev]")) return go(pi - 1, true);
      if (e.target.closest("[data-next]")) return go(pi + 1, true);
      if (e.target.closest("[data-pause]")) return togglePause();
      const c = e.target.closest(".ms-cell"); if (c) return play(Number(c.dataset.n) - 1);
    });
    let sx = null;
    const show = el.querySelector(".ms-show");
    show.addEventListener("touchstart", (e) => (sx = e.touches[0].clientX), { passive: true });
    show.addEventListener("touchend", (e) => { if (sx === null) return; const dx = e.changedTouches[0].clientX - sx; sx = null; if (Math.abs(dx) > 50) go(pi + (dx < 0 ? 1 : -1), true); });
  }

  // ---------- 時光回放 ----------
  function play(i) {
    const show = el.querySelector(".ms-show");
    show.classList.remove("hide"); el.querySelector(".ms-table").innerHTML = ""; pile = 0;
    playing = true; show.classList.remove("paused"); el.querySelector("[data-pause]").textContent = "❚❚";
    go(i, false);
  }
  function go(i, manual) {
    clearTimeout(timer);
    const prev = pi;
    pi = (i + COUNT) % COUNT;
    const n = IDS[pi], show = el.querySelector(".ms-show");
    // 上一張變成桌上散落的小照片（回顧的軌跡）
    if (prev >= 0 && !manual && !show.classList.contains("hide")) dropToTable(IDS[prev]);
    const pola = show.querySelector(".ms-pola"), img = pola.querySelector("img");
    const tilt = 0;
    pola.style.setProperty("--r", tilt + "deg");
    pola.classList.remove("dev"); void pola.offsetWidth;
    const lab = show.querySelector(".ms-label");
    const start = () => { pola.classList.add("dev"); restart(show.querySelector(".ms-leak"), "go"); restart(show.querySelector(".ms-bar i"), "go"); restart(lab, "go"); };
    img.onload = start; img.src = src(n, true); if (img.complete) { img.onload = null; start(); }
    lab.innerHTML = `<b>拾光 No.${pad(n)}</b><span>健康台灣深耕計畫</span><em>2025 – 2026・奇美醫院</em>`;
    show.querySelector(".ms-count").textContent = `${pad(pi + 1)} / ${COUNT}`;
    new Image().src = src(IDS[(pi + 1) % COUNT], true);   // 預先載入下一張
    if (playing) timer = setTimeout(() => go(pi + 1, false), STEP_MS);
  }
  function restart(node, cls) { node.classList.remove(cls); void node.offsetWidth; node.classList.add(cls); }
  function dropToTable(n) {
    const t = el.querySelector(".ms-table");
    const k = pile++, ang = (k * 137.5) * Math.PI / 180, rad = 34 + (k % 5) * 4;
    const x = 50 + Math.cos(ang) * rad, y = 50 + Math.sin(ang) * rad * .78;
    const d = document.createElement("div"); d.className = "ms-old";
    d.style.cssText = `left:${x.toFixed(1)}%;top:${y.toFixed(1)}%;--r:${((k * 53) % 30 - 15)}deg`;
    d.innerHTML = `<img src="${src(n)}" alt="">`;
    t.appendChild(d);
    if (t.children.length > 14) t.firstElementChild.remove();
  }
  function togglePause() {
    playing = !playing;
    const show = el.querySelector(".ms-show");
    show.classList.toggle("paused", !playing);
    el.querySelector("[data-pause]").textContent = playing ? "❚❚" : "▶";
    clearTimeout(timer);
    if (playing) timer = setTimeout(() => go(pi + 1, false), 1800);
  }
  function stop() { clearTimeout(timer); playing = false; pi = -1; el.querySelector(".ms-show").classList.add("hide"); }

  function onKey(e) {
    if (!el || el.classList.contains("hide")) return;
    const showing = !el.querySelector(".ms-show").classList.contains("hide");
    if (e.key === "Escape") { e.stopImmediatePropagation(); showing ? stop() : close(); }
    if (showing && e.key === "ArrowRight") { e.stopImmediatePropagation(); go(pi + 1, true); }
    if (showing && e.key === "ArrowLeft") { e.stopImmediatePropagation(); go(pi - 1, true); }
    if (showing && e.key === " ") { e.preventDefault(); togglePause(); }
  }
  window.addEventListener("keydown", onKey, true);

  function open() { if (!el) build(); el.classList.remove("hide", "in"); void el.offsetWidth; el.classList.add("in"); }
  function close() { if (!el) return; stop(); el.classList.add("hide"); }
  window.Memories = { open, close, play: (i = 0) => { open(); play(i); }, get visible() { return !!el && !el.classList.contains("hide"); } };
})();
