/* =========================================================
 * 奇美光廊 2025–2026：畫廊風格的成果展
 * 點院區的「奇美光廊」開啟；投影片放在 assets/gallery/NN.jpg（NN_s.jpg 為縮圖）
 * 最後三幅是留白的畫框：2027、2028、2029
 * ========================================================= */
(function () {
  const SLIDES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 13, 14];   // 目前收到的投影片頁碼
  const FUTURE = [2027, 2028, 2029];
  const IMGV = "20261108k";   // 換投影片圖檔時改這個，避免手機讀到舊圖
  const pad = (n) => String(n).padStart(2, "0");
  let el = null, idx = -1;
  // ---------- 自動輪播：每幅移到中間、放大約 10 秒、縮回，再換下一幅 ----------
  const STEP_MS = 10000, ZOOM_IN_AT = 900, ZOOM_OUT_AT = 9000;
  let cur = -1, tA = null, tB = null, tC = null, pauseT = null, running = false;
  const arts = () => el ? [...el.querySelectorAll(".gl-wall .gl-art")] : [];
  function clearT() { clearTimeout(tA); clearTimeout(tB); clearTimeout(tC); }
  function center(a) {
    const w = el.querySelector(".gl-wall"), vert = w.scrollHeight > w.clientHeight + 4 && w.scrollWidth <= w.clientWidth + 4;
    if (vert) w.scrollTo({ top: a.offsetTop - (w.clientHeight - a.offsetHeight) / 2, behavior: "smooth" });
    else w.scrollTo({ left: a.offsetLeft - (w.clientWidth - a.offsetWidth) / 2, behavior: "smooth" });
  }
  function step() {
    if (!running) return;
    const list = arts(); if (!list.length) return;
    list.forEach((a) => a.classList.remove("feat"));
    cur = (cur + 1) % list.length;
    const a = list[cur]; center(a);
    // 放大時換成高畫質原圖
    const img = a.querySelector("img[data-big]"); if (img && !img.dataset.up) { img.dataset.up = 1; img.src = img.dataset.big; }
    tA = setTimeout(() => running && a.classList.add("feat"), ZOOM_IN_AT);
    tB = setTimeout(() => a.classList.remove("feat"), ZOOM_OUT_AT);
    tC = setTimeout(step, STEP_MS);
  }
  function startAuto(delay = 1200) { stopAuto(); running = true; tC = setTimeout(step, delay); }
  function stopAuto() { running = false; clearT(); clearTimeout(pauseT); arts().forEach((a) => a.classList.remove("feat")); }
  // 有人手動操作（捲動、點畫）時暫停，15 秒沒動作再接著輪播
  function nudge() { if (!el || el.classList.contains("hide")) return; stopAuto(); pauseT = setTimeout(() => { if (idx < 0 && !(window.Memories && Memories.visible)) { cur = cur - 1; startAuto(0); } else nudge(); }, 15000); }

  function frame(n, i) {
    return `<figure class="gl-art" data-i="${i}" style="--d:${(i % 6) * 80}ms">
      <div class="gl-light"></div>
      <div class="gl-frame"><div class="gl-mat"><img src="assets/gallery/${pad(n)}_s.jpg?v=${IMGV}" data-big="assets/gallery/${pad(n)}.jpg?v=${IMGV}" alt="第 ${n} 幅"></div></div>
      <figcaption><span>2025–2026</span></figcaption>
    </figure>`;
  }
  function future(y, i) {
    return `<figure class="gl-art gl-future" style="--d:${(i % 6) * 80}ms">
      <div class="gl-light"></div>
      <div class="gl-frame"><div class="gl-mat"><div class="gl-blank"><span>${y}</span></div></div></div>
      <figcaption><b>${y}</b><span>待我們一起完成</span></figcaption>
    </figure>`;
  }
  function build() {
    el = document.createElement("div"); el.className = "gl-shade";
    el.innerHTML = `<div class="gl-room">
      <button class="gl-x" data-close aria-label="關閉">×</button>
      <header class="gl-head"><small>CHI MEI GALLERY</small><h2>奇美光廊</h2><p>2025 – 2026・我們一起走過的深耕足跡</p><nav class="gl-tabs"><button class="on" type="button">🖼️ 深耕成果展</button><button class="gl-mem" type="button" data-mem>📷 深耕拾光</button></nav></header>
      <div class="gl-wall">${SLIDES.map(frame).join("")}${FUTURE.map(future).join("")}</div>
      <div class="gl-floor"></div>
      <div class="gl-view hide"><button class="gl-nav prev" aria-label="上一幅">‹</button><div class="gl-big"><img alt=""></div><button class="gl-nav next" aria-label="下一幅">›</button><div class="gl-cap"></div><button class="gl-x2" data-viewclose aria-label="關閉">×</button></div>
    </div>`;
    document.body.appendChild(el);
    el.addEventListener("click", (e) => {
      if (e.target.closest("[data-close]")) return close();
      if (e.target.closest("[data-mem]") && window.Memories) return Memories.open();
      if (e.target.closest("[data-viewclose]") || e.target.classList.contains("gl-view")) return view(-1);
      if (e.target.closest(".gl-nav.prev")) return view((idx - 1 + SLIDES.length) % SLIDES.length);
      if (e.target.closest(".gl-nav.next")) return view((idx + 1) % SLIDES.length);
      const a = e.target.closest(".gl-art[data-i]"); if (a) view(Number(a.dataset.i));
    });
    // 電腦：滑鼠滾輪橫向捲動畫廊
    const wall = el.querySelector(".gl-wall");
    ["wheel", "touchstart", "pointerdown"].forEach((ev) => wall.addEventListener(ev, (e) => { if (e.isTrusted) nudge(); }, { passive: true }));
    el.querySelector(".gl-tabs").addEventListener("click", () => nudge());
    wall.addEventListener("wheel", (e) => { if (matchMedia("(min-width: 761px)").matches && Math.abs(e.deltaY) > Math.abs(e.deltaX)) { wall.scrollLeft += e.deltaY; e.preventDefault(); } }, { passive: false });
    let sx = null;
    el.querySelector(".gl-view").addEventListener("touchstart", (e) => (sx = e.touches[0].clientX), { passive: true });
    el.querySelector(".gl-view").addEventListener("touchend", (e) => { if (sx === null) return; const dx = e.changedTouches[0].clientX - sx; sx = null; if (Math.abs(dx) > 50) view((idx + (dx < 0 ? 1 : -1) + SLIDES.length) % SLIDES.length); });
  }
  function view(i) {
    idx = i;
    const v = el.querySelector(".gl-view");
    if (i < 0) { v.classList.add("hide"); if (el && !el.classList.contains("hide")) nudge(); return; }
    stopAuto();
    const n = SLIDES[i];
    v.querySelector("img").src = `assets/gallery/${pad(n)}.jpg?v=${IMGV}`;
    v.querySelector(".gl-cap").textContent = `${i + 1} / ${SLIDES.length}`;
    v.classList.remove("hide");
  }
  function onKey(e) {
    if (!el || el.classList.contains("hide") || (window.Memories && Memories.visible)) return;
    if (e.key === "Escape") { if (idx >= 0) view(-1); else close(); }
    if (idx >= 0 && e.key === "ArrowRight") view((idx + 1) % SLIDES.length);
    if (idx >= 0 && e.key === "ArrowLeft") view((idx - 1 + SLIDES.length) % SLIDES.length);
  }
  window.addEventListener("keydown", onKey);
  function open() { if (window.World) World.skipRender = true; if (!el) build(); el.classList.remove("hide"); el.classList.remove("in"); void el.offsetWidth; el.classList.add("in"); document.body.classList.add("gallerymode"); cur = -1; const w = el.querySelector(".gl-wall"); w.scrollLeft = 0; w.scrollTop = 0; startAuto(1600); }
  function close() { stopAuto(); if (window.Memories) Memories.close(); if (el) { el.classList.add("hide"); view(-1); } document.body.classList.remove("gallerymode"); if (window.World) World.skipRender = document.body.classList.contains("finalemode") || !!(window.BigTree && BigTree.visible); }
  window.Gallery = { open, close, get visible() { return !!el && !el.classList.contains("hide"); } };
})();
