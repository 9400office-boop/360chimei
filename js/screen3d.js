/* 360°深耕奇美：3D 大螢幕控制 */
(function () {
  const CFG = window.ISLAND_CONFIG, C = window.ISLAND_CONTENT, W = window.World, Life = window.Life;
  const { People, Trees, Links } = Life;
  const $ = (id) => document.getElementById(id);
  const SC = (id) => C.scopes[Number(id) - 1];
  const F = (n) => C.fields[n - 1];
  const ITEM = {}; C.scopes.forEach((s) => s.items.forEach((it, i) => (ITEM[it.id] = { ...it, scope: s, n: i + 1 })));
  const itemNo = (id) => `${id[0]}-${ITEM[id].n}`;
  const nameOf = (id) => id.startsWith("s") ? "照護・" + C.stages.find((x) => x.id === id).name : SC(id[0]).tag + "・" + ITEM[id].short;

  // ---------- 啟動 3D ----------
  const stage = $("stage");
  W.capture = /capture/.test(location.search);
  W.init(stage);
  Life.init();
  W.flyTo({ x: 0, y: 0, z: 30 }, 345, .72, 0, .01);
  if (!W.capture) W.start();

  // ---------- 手機「找我的人物」模式：?me=<參加者 id> ----------
  const ME = new URLSearchParams(location.search).get("me");
  let follow = !!ME, meFound = false;
  if (ME) {
    document.body.classList.add("memode", "nopanel");
    W.resize(); setTimeout(W.resize, 100); setTimeout(W.resize, 600);
    const _fly = W.flyTo;
    W.flyTo = (...a) => { if (!follow) _fly(...a); };   // 跟隨時忽略主持人鏡頭指令
    W._flyRaw = _fly;
    // 腳下金色光圈與頭上箭頭
    const ring = new THREE.Mesh(new THREE.RingGeometry(.9, 1.35, 32), new THREE.MeshBasicMaterial({ color: 0xE8B84A, transparent: true, opacity: .9, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2;
    const arrow = new THREE.Mesh(new THREE.ConeGeometry(.45, .9, 4), new THREE.MeshBasicMaterial({ color: 0xE8B84A }));
    arrow.rotation.x = Math.PI;
    ring.visible = arrow.visible = false;
    W.scene.add(ring); W.scene.add(arrow);
    W.controls.addEventListener("start", () => {});
    W.onFrame((dt, t) => {
      const e = People.ents[ME];
      if (!e) return;
      const p = e.grp.position;
      ring.visible = arrow.visible = true;
      ring.position.set(p.x, p.y + .08, p.z); ring.scale.setScalar(1 + Math.sin(t * 3) * .08);
      arrow.position.set(p.x, p.y + 3.3 + Math.sin(t * 4) * .25, p.z); arrow.rotation.y += dt * 2;
      if (!meFound) { meFound = true; _fly({ x: p.x, y: p.y + 1, z: p.z }, 34, .72, 0, 1.4); return; }
      if (follow) {
        const k = Math.min(1, dt * 3);
        const dx = (p.x - W.controls.target.x) * k, dz = (p.z - W.controls.target.z) * k;
        W.controls.target.x += dx; W.controls.target.z += dz;
        W.camera.position.x += dx; W.camera.position.z += dz;
      }
    });
  }
  function renderMeBar() {
    if (!ME) return;
    const p = (S.people || {})[ME];
    const bar = $("mebar");
    bar.innerHTML = (p ? `<div class="who">${Avatar.svg(p.avatar)}<span>${escapeHtml(p.name)}</span></div>` : `<div class="who"><span>找不到你的人物，請回到報到頁</span></div>`) +
      `<button data-me="follow" class="${follow ? "on" : ""}">📍 跟著我</button><button data-me="all">🗺️ 全景</button><a href="index.html">← 詞卡</a>`;
  }
  if (ME) $("mebar").addEventListener("click", (e) => {
    const b = e.target.closest("[data-me]"); if (!b) return;
    if (b.dataset.me === "follow") { follow = true; meFound = false; }
    if (b.dataset.me === "all") { follow = false; W._flyRaw({ x: 0, y: 0, z: 30 }, 345, .72, 0); }
    renderMeBar();
  });
  $("mode").textContent = Store.mode === "local" ? "本機示範模式" : "";
  $("subline").textContent = (CFG.subtitle || "").replace("健康台灣深耕計畫・", "") + "・" + C.vision;

  // ---------- 標籤 ----------
  const $labels = $("labels");
  const tileLabels = [];
  function mkLabel(cls, html, anchor, onClick) {
    const el = document.createElement("div");
    el.className = "lbl"; el.innerHTML = `<div class="${cls}">${html}</div>`;
    $labels.appendChild(el);
    if (onClick) el.firstChild.addEventListener("click", onClick);
    return { el, inner: el.firstChild, anchor };
  }
  W.tiles.forEach((t) => {
    const a = new THREE.Vector3(t.x, W.TOP + .3, t.z + W.R * .8);
    if (t.kind === "item") {
      const sc = SC(t.scope);
      tileLabels.push({ ...mkLabel("tl", `<span class="n" style="color:${sc.color}">No.${itemNo(t.id)}</span>${escapeHtml(ITEM[t.id].short)}`, a, () => focusItem(t.id)), id: t.id, scope: t.scope });
    } else if (t.kind === "hub") {
      tileLabels.push({ ...mkLabel("tl hub", `⛲ 永續噴泉`, new THREE.Vector3(t.x, W.TOP + 2.6, t.z), () => { W.flyTo({ x: t.x, y: 2, z: t.z }, 40, .95); showSupport("fountain"); }), id: "hub" });
    }
  });
  // 行政後勤夥伴說明卡
  function showSupport(key) {
    const sp = C.supports[key]; if (!sp) return;
    showInfo(`<div class="eyebrow">${escapeHtml(C.supportsTitle)}</div><h3>${sp.icon} ${escapeHtml(sp.name)}</h3><div class="ln">${escapeHtml(sp.text)}</div>`);
  }
  // 範疇標籤（只標範疇，不標大樓名稱）
  (W.BUILDINGS || []).forEach((bd) => {
    if (!bd.scope) return;
    const sc = SC(bd.scope);
    tileLabels.push({ ...mkLabel("tl bldg", `<span class="n" style="color:${sc.color}">${sc.tag}</span>${escapeHtml(sc.name)}`, new THREE.Vector3(bd.lx, W.TOP + bd.ly, bd.lz), () => focusScope(bd.scope)), id: bd.id, scope: bd.scope });
  });
  (W.ROADS || []).forEach((r) => {
    const pts = r.vertical ? [[r.x, -48], [r.x, 60]] : [[0, r.z]];
    if (!r.care) return;   // 只標連續照護大道
    pts.forEach(([x, z]) => tileLabels.push({ ...mkLabel("tl road care", escapeHtml(r.name), new THREE.Vector3(x, .5, z), () => showSupport("careRoad")), id: "road" }));
  });
  (W.PLAZAS || []).forEach((pz) => tileLabels.push({ ...mkLabel(pz.info ? "tl plaza sup" : "tl plaza", pz.info ? `📡 ${escapeHtml(pz.name)}` : `🌱 ${escapeHtml(pz.name)}`, new THREE.Vector3(pz.x, W.TOP + .3, pz.z + pz.d / 2 + 1), pz.info ? () => { W.flyTo({ x: pz.x, y: 0, z: pz.z }, 45, .85); showSupport("infoPlaza"); } : null), id: "plaza" }));
  W.stages.forEach((st) => { if (st.bridgeMid) tileLabels.push({ ...mkLabel("tl sup small", `🌉 採購橋`, st.bridgeMid, () => showSupport("purchaseBridge")), id: "bridge" }); });
  [-137.5, -47.5, 0, 180].map((d) => d * Math.PI / 180).forEach((a) => {
    const x = Math.cos(a) * W.RX, z = Math.sin(a) * W.RZ;
    tileLabels.push({ ...mkLabel("tl road care", `連續照護大道`, new THREE.Vector3(x, W.ringY(x, z) + .6, z), () => showSupport("careRoad")), id: "ring" });
  });
  (W.docks || []).forEach((dk) => tileLabels.push({ ...mkLabel("tl sup", `⚓ ${escapeHtml(C.supports[dk.key].name)}`, dk.pos.clone().add(new THREE.Vector3(0, 4.4, 0)), () => { W.flyTo({ x: dk.pos.x, y: 0, z: dk.pos.z }, 50, .85); showSupport(dk.key); }), id: "dock" }));
  // 會移動的交通工具標籤
  const vehLabels = (W.vehicles || []).map((v) => {
    const sp = C.supports[v.key];
    const l = mkLabel("tl sup veh", `${sp.icon} ${escapeHtml(sp.name)}`, new THREE.Vector3(), () => { const p = v.obj.position; W.flyTo({ x: p.x, y: 0, z: p.z }, 40, .85); showSupport(v.key); });
    return { ...l, v };
  });
  W.onFrame(() => {
    const far = W.camera.position.distanceTo(W.controls.target) > 200;
    vehLabels.forEach((l) => { if (far && !l.v.main) { l.el.style.display = "none"; return; } l.anchor.copy(l.v.obj.position); l.anchor.y += l.v.h; place(l, l.anchor); });
  });
  W.stages.forEach((st) => {
    tileLabels.push({ ...mkLabel("tl stage", `<span class="n">${st.n}</span>${st.icon} ${escapeHtml(st.name)}`, new THREE.Vector3(st.x, 1.2, st.z + 6.6), () => W.flyTo({ x: st.x, y: 0, z: st.z }, 38, .9)), id: st.id });
  });
  const nameTags = {}, treeTags = {};
  function place(l, v3) {
    const p = W.project(v3.x, v3.y, v3.z);
    if (!p.vis) { l.el.style.display = "none"; return; }
    l.el.style.display = "";
    l.el.style.transform = `translate(${p.x.toFixed(1)}px,${p.y.toFixed(1)}px) translate(-50%,-100%)`;
  }
  const _a = new THREE.Vector3();
  W.onFrame(() => {
    const far = W.camera.position.distanceTo(W.controls.target) > 200;
    tileLabels.forEach((l) => { if (far && l.scope && !String(l.id).match(/^b|^edu|^lab/) && l.id !== activeItem) { l.el.style.display = "none"; return; } place(l, l.anchor); });
    Object.entries(nameTags).forEach(([id, l]) => {
      const e = People.ents[id]; if (!e) return;
      if (far && !l.inner.classList.contains("big")) { l.el.style.display = "none"; return; }
      _a.set(e.grp.position.x, e.grp.position.y + (e.seed.visible ? 2.55 : 2.05), e.grp.position.z);
      place(l, _a);
    });
    Object.entries(treeTags).forEach(([id, l]) => { const p = Trees.topPos(id); if (p) { p.y += .8; place(l, p); } });
  });

  // ---------- 右側索引 ----------
  let tab = "scopes", openScope = null, activeItem = null, query = "";
  const totalItems = C.scopes.reduce((a, s) => a + s.items.length, 0);
  $("counts").innerHTML = `${C.scopes.length} 大範疇 ／ ${totalItems} 個子項目 ／ ${C.stages.length} 個照護站<br>選一個範疇，走進它的院區風景。`;
  $("tabLinks").textContent = `協作關係 ${C.links.length}`;
  function renderList() {
    const $l = $("list");
    if (tab === "links") {
      $l.innerHTML = C.links.map((l, i) => {
        const ca = l.a.startsWith("s") ? "#E9B95A" : SC(l.a[0]).color, cb = l.b.startsWith("s") ? "#E9B95A" : SC(l.b[0]).color;
        return `<div class="lrow" data-link="${i}"><b><span class="tag" style="background:${ca}">${l.a.startsWith("s") ? "照護" : SC(l.a[0]).tag}</span>${escapeHtml(nameOf(l.a).split("・")[1])} ↔ <span class="tag" style="background:${cb}">${l.b.startsWith("s") ? "照護" : SC(l.b[0]).tag}</span>${escapeHtml(nameOf(l.b).split("・")[1])}</b><div class="why">${escapeHtml(l.why)}</div></div>`;
      }).join("");
      return;
    }
    const q = query.trim();
    $l.innerHTML = C.scopes.map((s) => {
      const items = s.items.filter((it) => !q || it.text.includes(q) || s.name.includes(q));
      if (q && !items.length) return "";
      const open = q || openScope === s.id;
      return `<div class="srow ${open ? "open" : ""}"><button data-scope="${s.id}"><span class="no" style="color:${s.color}">0${s.id}</span><span class="nmz">${escapeHtml(s.name)}<small>${s.tag}</small></span><span class="ct">${s.items.length} ↗</span></button>
        <div class="items">${items.map((it) => `<button class="item ${activeItem === it.id ? "on" : ""}" data-item="${it.id}"><span class="dt" style="background:${s.color}"></span>${escapeHtml(it.text)}</button>`).join("")}</div></div>`;
    }).join("") + `<div class="srow"><button data-stages="1"><span class="no" style="color:#E9B95A">08</span><span class="nmz">360° 永續照護環<small>${C.stages.map((s) => s.name).join("・")}</small></span><span class="ct">${C.stages.length} ↗</span></button></div>` +
      `<div class="srow ${openScope === "sup" ? "open" : ""}"><button data-sup-open="1"><span class="no" style="color:#2E9C8F">09</span><span class="nmz">${escapeHtml(C.supportsTitle)}<small>車、船、橋與碼頭，陪大家一同完成</small></span><span class="ct">${Object.keys(C.supports).length} ↗</span></button>
      <div class="items">${Object.entries(C.supports).map(([k, sp]) => `<button class="item" data-sup="${k}">${sp.icon} ${escapeHtml(sp.name)}</button>`).join("")}</div></div>`;
  }
  $("list").addEventListener("click", (e) => {
    const sb = e.target.closest("[data-scope]");
    if (sb) { const id = Number(sb.dataset.scope); if (openScope === id) { openScope = null; clearFocus(); } else focusScope(id); return; }
    const ib = e.target.closest("[data-item]"); if (ib) { focusItem(ib.dataset.item); return; }
    if (e.target.closest("[data-sup-open]")) { openScope = openScope === "sup" ? null : "sup"; renderList(); return; }
    const sb2 = e.target.closest("[data-sup]");
    if (sb2) {
      const k = sb2.dataset.sup;
      const target = { fountain: () => W.tileById.hub, infoPlaza: () => W.PLAZAS.find((p) => p.info), accountDock: () => W.docks.find((d) => d.key === "accountDock").pos, hrDock: () => W.docks.find((d) => d.key === "hrDock").pos, accountBoat: () => W.vehicles.find((v) => v.key === k).obj.position, purchaseBridge: () => W.stages[1].bridgeMid, careRoad: () => ({ x: 0, z: 0 }), infoCar: () => W.vehicles.find((v) => v.key === k).obj.position, hrBoat: () => W.vehicles.find((v) => v.key === k).obj.position }[k];
      const p = target && target();
      if (p) W.flyTo({ x: p.x, y: 0, z: p.z }, k === "careRoad" ? 330 : 55, k === "careRoad" ? .3 : .85);
      showSupport(k); return;
    }
    if (e.target.closest("[data-stages]")) { clearFocus(); W.top(); return; }
    const lr = e.target.closest("[data-link]");
    if (lr) {
      const l = C.links[Number(lr.dataset.link)];
      const p = (id) => id.startsWith("s") ? W.stages.find((s) => s.id === id) : W.tileById[id];
      const a = p(l.a), b = p(l.b);
      setLinks(true); W.flyTo({ x: (a.x + b.x) / 2, y: 0, z: (a.z + b.z) / 2 }, 140, .8);
      showInfo(`<div class="eyebrow">協作關係</div><h3>${escapeHtml(nameOf(l.a))}<br>↔ ${escapeHtml(nameOf(l.b))}</h3><div class="ln">${escapeHtml(l.why)}</div>`);
    }
  });
  document.querySelectorAll(".tab").forEach((b) => b.addEventListener("click", () => setTab(b.dataset.tab)));
  function setTab(t) { tab = t; document.querySelectorAll(".tab").forEach((x) => x.classList.toggle("on", x.dataset.tab === t)); renderList(); }
  $("q").addEventListener("input", (e) => { query = e.target.value; renderList(); });

  function dimLabels(scope, item) {
    tileLabels.forEach((l) => {
      const linked = item && C.links.some((k) => (k.a === item && k.b === l.id) || (k.b === item && k.a === l.id));
      const on = !scope || l.scope === scope || l.id === item || linked;
      l.inner.classList.toggle("dim", !on);
      l.inner.classList.toggle("hot", !!item && l.id === item);
      if (l.scope) l.inner.style.color = item && l.id === item ? SC(l.scope).deep : "";
    });
  }
  function focusScope(id, fromHost) {
    openScope = id; activeItem = null; tab = "scopes"; setTab("scopes");
    const c = W.scopeCenter[id];
    W.flyTo({ x: c.x, y: 0, z: c.z - 6 }, 95, .82);
    Links.build(id); dimLabels(id, null);
    const sc = SC(id);
    const rel = C.links.filter((l) => l.a[0] === String(id) || l.b[0] === String(id));
    showInfo(`<div class="eyebrow" style="color:${sc.color}">${sc.tag}</div><h3>${sc.emoji} ${escapeHtml(sc.name)}</h3>` +
      sc.items.map((it) => `<div class="ln">● ${escapeHtml(it.text)}</div>`).join("") +
      (rel.length ? `<div class="ln" style="margin-top:10px;color:${sc.deep};font-weight:700">↔ 和其他範疇的連結 ${rel.length} 條</div>` : ""));
  }
  function focusItem(id) {
    const it = ITEM[id], t = W.tileById[id];
    openScope = it.scope.id; activeItem = id; setTab("scopes");
    W.flyTo({ x: t.x, y: 0, z: t.z }, 32, .86);
    Links.build(it.scope.id); dimLabels(it.scope.id, id);
    const rel = C.links.filter((l) => l.a === id || l.b === id);
    showInfo(`<div class="eyebrow" style="color:${it.scope.color}">${it.scope.tag}・${itemNo(id)}</div><h3>${escapeHtml(it.text)}</h3>` +
      (rel.length ? rel.map((l) => `<div class="ln">🔗 ${escapeHtml(nameOf(l.a === id ? l.b : l.a))}<br>${escapeHtml(l.why)}</div>`).join("") : `<div class="ln">這一區正等待大家的想法長出新連結。</div>`));
  }
  function clearFocus() {
    openScope = null; activeItem = null; Links.build(null); dimLabels(null, null); hideInfo(); renderList();
  }
  function showInfo(html) {
    if (S.state && S.state.spotlight) return;
    $("info").innerHTML = `<button class="x" data-x>×</button>${html}`; $("info").classList.remove("hide");
    $("log").classList.add("hide"); document.querySelector('[data-mode="log"]').classList.remove("on");
  }
  function hideInfo() { $("info").classList.add("hide"); }
  $("info").addEventListener("click", (e) => { if (e.target.closest("[data-x]")) clearFocus(); });
  renderList();

  // ---------- 工具列 ----------
  let linksOn = false;
  function setLinks(on) {
    linksOn = on; Links.show = on;
    document.querySelector('[data-mode="links"]').classList.toggle("on", on);
    Links.build(openScope); refreshSentLinks(true);
  }
  document.querySelectorAll("[data-time]").forEach((b) => b.addEventListener("click", () => {
    W.setTime(b.dataset.time);
    document.querySelectorAll("[data-time]").forEach((x) => x.classList.toggle("on", x === b));
  }));
  let topView = false;
  document.querySelectorAll("[data-mode]").forEach((b) => b.addEventListener("click", () => {
    const m = b.dataset.mode;
    if (m === "tags") { document.body.classList.toggle("notags"); b.classList.toggle("on", !document.body.classList.contains("notags")); }
    if (m === "roam") { W.autoRotate = !W.autoRotate; b.classList.toggle("on", W.autoRotate); }
    if (m === "links") setLinks(!linksOn);
    if (m === "pause") { People.paused = !People.paused; b.classList.toggle("on", People.paused); }
    if (m === "top") { topView = !topView; topView ? W.top() : W.home(); b.classList.toggle("on", topView); }
    if (m === "log") { const lg = $("log"); lg.classList.toggle("hide"); b.classList.toggle("on", !lg.classList.contains("hide")); renderLog(); if (!lg.classList.contains("hide")) hideInfo(); }
  }));
  document.querySelectorAll("[data-act]").forEach((b) => b.addEventListener("click", () => {
    const a = b.dataset.act;
    if (a === "home") { clearFocus(); topView = false; document.querySelector('[data-mode="top"]').classList.remove("on"); W.home(); }
    if (a === "panel") { document.body.classList.toggle("nopanel"); b.classList.toggle("on", document.body.classList.contains("nopanel")); setTimeout(W.resize, 420); }
    if (a === "help") $("help").classList.toggle("hide");
  }));

  // ---------- 日誌 ----------
  const events = [];
  const fmt = (t) => new Date(t).toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit", hour12: false });
  function addEvent(html, avatar) {
    const ev = { html, avatar, t: Date.now() };
    events.unshift(ev); if (events.length > 200) events.pop();
    const el = document.createElement("div"); el.className = "ev";
    el.innerHTML = (avatar ? Avatar.svg(avatar) : "") + `<span>${html}</span>`;
    const feed = $("feed"); feed.prepend(el);
    while (feed.children.length > 4) feed.lastChild.remove();
    setTimeout(() => { el.style.opacity = 0; setTimeout(() => el.remove(), 700); }, 7000);
    if (!$("log").classList.contains("hide")) renderLog();
  }
  function renderLog() {
    $("log").innerHTML = `<h3>📜 院區日誌</h3>` + (events.map((e) => `<div class="e"><time>${fmt(e.t)}</time><span>${e.html}</span></div>`).join("") || `<p style="color:#6B7772">還沒有動靜，等第一位夥伴報到 🌱</p>`);
  }

  // ---------- 資料 ----------
  let S = {};
  const loadedAt = Date.now();
  let prevPeople = null, prevSentCount = 0, lastSpot = null, lastTour = "init", lastPhase = null, sentKey = "", firstSync = true;
  const sentsSorted = () => Object.entries(S.sentences || {}).map(([id, s]) => ({ id, ...s })).sort((a, b) => a.order - b.order);
  let treePos = {};

  function refreshSentLinks(force) {
    const sents = sentsSorted(), spot = S.state && S.state.spotlight;
    const key = JSON.stringify([sents.map((s) => s.id), spot, linksOn]);
    if (!force && key === sentKey) return;
    sentKey = key;
    Links.buildSent(sents, treePos, spot && S.sentences && S.sentences[spot] ? spot : null, linksOn || !!spot);
  }

  function apply() {
    const people = S.people || {};
    const phase = (S.state && S.state.phase) || "join";
    const settling = Date.now() - loadedAt < 2500;
    People.sync(people, firstSync || settling);
    if (Object.keys(people).length) firstSync = false;

    // 日誌
    if (prevPeople && !settling) {
      Object.entries(people).forEach(([id, p]) => {
        const o = prevPeople[id];
        if (!o) addEvent(`<b>${escapeHtml(p.name)}</b> 報到了`, p.avatar);
        else if (p.text && !o.text) addEvent(`<b>${escapeHtml(p.name)}</b> 種下了一顆 <span style="color:${F(p.field).color}">0${p.field} ${F(p.field).title}</span> 種子`, p.avatar);
      });
    }
    prevPeople = JSON.parse(JSON.stringify(people));

    // 名牌
    Object.entries(people).forEach(([id, p]) => {
      if (!nameTags[id]) nameTags[id] = mkLabel("nm", "", null);
      const nm = (p.name || "").length > 6 ? p.name.slice(0, 6) + "…" : p.name || "";
      if (nameTags[id].inner.textContent !== nm) nameTags[id].inner.textContent = nm;
    });
    Object.keys(nameTags).forEach((id) => { if (!people[id]) { nameTags[id].el.remove(); delete nameTags[id]; } });

    // 幼苗
    const sents = sentsSorted();
    const totals = voteTotals(S);
    const spotId = S.state && S.state.spotlight && S.sentences && S.sentences[S.state.spotlight] ? S.state.spotlight : null;
    const top3 = phase === "harvest" ? sents.slice().sort((a, b) => (totals[b.id] || 0) - (totals[a.id] || 0)).slice(0, 3).filter((s) => totals[s.id]).map((s) => s.id) : [];
    treePos = Trees.sync(sents, totals, spotId, top3);
    if (sents.length && sents.length !== prevSentCount && !settling) addEvent(`🌱 全場拼出 <b>${sents.length}</b> 句話，行動廣場長出了幼苗`);
    prevSentCount = sents.length;
    sents.forEach((s) => {
      if (!treeTags[s.id]) treeTags[s.id] = mkLabel("tr", "", null);
      const sc = SC(s.scope), v = totals[s.id] || 0;
      treeTags[s.id].inner.style.borderColor = sc.color;
      treeTags[s.id].inner.innerHTML = `<span style="color:${sc.color}">🌱 ${s.order}</span>${(phase === "water" || phase === "harvest") ? `<span class="d">💧${v}</span>` : ""}`;
      treeTags[s.id].el.style.opacity = spotId && spotId !== s.id ? .3 : 1;
    });
    Object.keys(treeTags).forEach((id) => { if (!S.sentences || !S.sentences[id]) { treeTags[id].el.remove(); delete treeTags[id]; } });

    // 聚光
    const spotKey = spotId ? spotId + JSON.stringify(S.sentences[spotId].members) : null;
    if (spotKey !== lastSpot) {
      lastSpot = spotKey;
      if (spotId) {
        const sp = { id: spotId, ...S.sentences[spotId] };
        People.setSpot(sp, treePos[spotId]);
        const p = treePos[spotId];
        W.flyTo({ x: p.x, y: 1.5, z: p.z + 3 }, 52, .86);
        hideInfo(); dimLabels(null, null);
        renderSpot(sp, sents.length);
      } else {
        People.setSpot(null);
        $("spot").classList.add("hide");
        if (phase !== "join" && !openScope) W.home();
      }
    }
    const members = spotId ? new Set(Object.values(S.sentences[spotId].members)) : null;
    Object.entries(nameTags).forEach(([id, l]) => { l.inner.classList.toggle("me", id === ME); l.inner.classList.toggle("big", (!!members && members.has(id)) || id === ME); l.inner.classList.toggle("dim", !!members && !members.has(id) && id !== ME); });
    renderMeBar();
    refreshSentLinks();

    // 主持人導覽
    const tour = (S.state && S.state.tour) || null;
    if (tour !== lastTour && lastTour !== "init") {
      if (tour === "all") { clearFocus(); setLinks(true); setTab("links"); W.home(); }
      else if (tour) { setLinks(false); focusScope(Number(tour), true); }
      else { clearFocus(); setLinks(false); if (!spotId) W.home(); }
    }
    lastTour = tour;

    // 階段
    if (phase !== lastPhase) {
      if (lastPhase && phase === "harvest") { W.home(); }
      lastPhase = phase;
    }
    renderPhase(phase, sents, totals);
  }

  function renderSpot(sp, n) {
    const people = S.people || {};
    const sc = SC(sp.scope);
    const sentence = SENTENCE_ORDER.map((x) => typeof x === "number"
      ? `<span class="w" style="background:${F(x).color}">${escapeHtml(cleanWord(x, (people[sp.members[x]] || {}).text) || "＿＿")}</span>` : x).join("");
    const uniq = new Set(Object.values(sp.members)).size;
    const pp = [1, 2, 3, 4, 5, 6].map((f) => {
      const p = people[sp.members[f]] || {};
      return `<div class="pp">${p.avatar ? Avatar.svg(p.avatar) : ""}<span class="fn" style="background:${F(f).color}">0${f} ${F(f).title}</span><div class="nmm">${escapeHtml(p.name || "")}</div></div>`;
    }).join("");
    $("spot").innerHTML = `<div class="hd"><span><span class="no">${sp.order}</span>/ ${n} 棵幼苗</span><span><span class="tag" style="background:${sc.color}">${sc.tag}・${escapeHtml(sc.name)}</span>${(sp.links || []).map((l) => `<span class="tag" style="background:${SC(l).color}">↔ ${SC(l).tag}</span>`).join("")}</span><span>${uniq} 位夥伴合力完成</span></div>
      <div class="sentence">${sentence}</div><div class="people">${pp}</div>`;
    $("spot").classList.remove("hide");
  }

  const joinUrl = new URL("index.html", location.href).href;
  let qrSvg = "";
  try { const qr = qrcode(0, "M"); qr.addData(joinUrl); qr.make(); qrSvg = qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true }); } catch (e) {}

  function renderPhase(phase, sents, totals) {
    const ps = Object.values(S.people || {});
    const seeds = ps.filter((p) => p.text && p.field);
    const drops = Object.values(totals).reduce((a, b) => a + b, 0);
    $("phase").innerHTML = {
      join: ME ? `🏥 <b>報到中</b>・你的人物正在院區散步，金色箭頭就是你` : `🏥 <b>報到中</b>・掃描右側 QR Code，選一位捏捏人、抽一張詞卡`,
      reveal: `🌱 <b>揭曉</b>・全場的詞拼成了 ${sents.length} 句話`,
      water: `💧 <b>澆水共識</b>・全場已澆 ${drops} / ${ps.length * CFG.dropsPerPerson} 滴`,
      harvest: `🌳 <b>收成</b>・我們的共識大樹`
    }[phase];
    const fc = {}; seeds.forEach((p) => (fc[p.field] = (fc[p.field] || 0) + 1));
    const nums = `報到 <b>${ps.length}</b> 人　種子 <b>${seeds.length}</b> 顆${sents.length ? `　幼苗 <b>${sents.length}</b> 棵` : ""}`;
    const key = phase + nums + JSON.stringify(fc);
    if ($("live").dataset.key !== key) {
      $("live").dataset.key = key;
      $("live").innerHTML = (phase === "join"
        ? `<div class="live"><div class="qr">${qrSvg}</div><div><div class="t">掃描報到</div><div class="u">${escapeHtml(joinUrl.replace(/^https?:\/\//, ""))}</div><div class="nums">${nums}</div></div></div>`
        : `<div class="live"><div class="nums">${nums}</div></div>`) +
        `<div class="fbar">${C.fields.map((f) => `<div style="background:${f.color}" title="0${f.n} ${f.title}"><b>${fc[f.n] || 0}</b>${f.title}</div>`).join("")}</div>`;
    }
    // 收成排名
    const $h = $("harvest");
    if (phase === "harvest" && sents.length && !(S.state && S.state.spotlight)) {
      const top = sents.slice().sort((a, b) => (totals[b.id] || 0) - (totals[a.id] || 0)).slice(0, 5);
      const html = `<h2>🌳 全場共識前五名</h2>` + top.map((s, i) => `<div class="row"><div class="rk">${i + 1}</div><div style="flex:1">${escapeHtml(sentenceText(s, S.people || {}))}<br><span class="tag" style="background:${SC(s.scope).color}">🌱${s.order}・${SC(s.scope).tag}</span></div><div class="vt">💧${totals[s.id] || 0}</div></div>`).join("");
      if ($h.innerHTML !== html) $h.innerHTML = html;
      $h.classList.remove("hide"); hideInfo();
    } else $h.classList.add("hide");
  }

  Store.init().then(() => Store.subscribe((st) => { S = st || {}; apply(); }))
    .catch((e) => { $("phase").textContent = "無法連線：" + e.message; });

  // 測試用
  window.__screen = { apply, focusScope, focusItem, setLinks };
})();
