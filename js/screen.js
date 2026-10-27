/* 360°深耕奇美：大螢幕 */
(function () {
  const CFG = window.ISLAND_CONFIG, C = window.ISLAND_CONTENT, G = window.GEO;
  const NS = "http://www.w3.org/2000/svg";
  const svg = document.getElementById("island");
  const SC = (id) => C.scopes.find((s) => s.id === Number(id));
  const F = (n) => C.fields[n - 1];
  let S = {};

  document.getElementById("subtitle").textContent = CFG.subtitle;
  document.getElementById("vision").textContent = "願景・" + C.vision;
  document.getElementById("mode").textContent = Store.mode === "local" ? "本機示範模式" : "";

  // ---------- QR Code ----------
  const joinUrl = new URL("index.html", location.href).href;
  document.getElementById("qrurl").textContent = joinUrl.replace(/^https?:\/\//, "");
  try {
    const qr = qrcode(0, "M"); qr.addData(joinUrl); qr.make();
    document.getElementById("qrbox").innerHTML = qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
    const q = document.querySelector("#qrbox svg"); q.style.width = "100%"; q.style.height = "100%";
  }
  catch (e) { document.getElementById("qrbox").innerHTML = `<p style="font-size:.8vw">（QR 載入失敗，請使用下方網址）</p>`; }

  // ---------- 靜態地圖 ----------
  const t = (x, y, txt, attrs = "") => `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" ${attrs}>${txt}</text>`;
  function drawBase() {
    let s = `<defs>
      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <filter id="bigglow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="9"/></filter>
      <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#8A6A2A" flood-opacity=".18"/></filter>
      <clipPath id="zoneclip"><ellipse cx="${G.CX}" cy="${G.CY}" rx="${G.ZONE.a}" ry="${G.ZONE.b}"/></clipPath>
      <radialGradient id="beam"><stop offset="0" stop-color="#FFF2B0" stop-opacity="1"/><stop offset="1" stop-color="#FFF2B0" stop-opacity="0"/></radialGradient>
      <radialGradient id="grass" cx="50%" cy="45%" r="60%"><stop offset="0" stop-color="#D6EEC6"/><stop offset="1" stop-color="#B9DFA8"/></radialGradient>
    </defs>`;
    // 海面亮點
    let r = 7;
    const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280;
    for (let i = 0; i < 70; i++) {
      const x = rnd() * 1600, y = rnd() * 1000;
      const dx = (x - G.CX) / (G.ISLE.a * 1.08), dy = (y - G.CY) / (G.ISLE.b * 1.1);
      if (dx * dx + dy * dy < 1) continue;
      s += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(1 + rnd() * 2.4).toFixed(1)}" fill="#fff" opacity="${(.4 + rnd() * .5).toFixed(2)}"/>`;
    }
    // 島
    s += `<path d="${G.blob(G.ISLE.a * 1.04, G.ISLE.b * 1.05, 1.3, .035)}" fill="#FFFFFF" opacity=".75" filter="url(#soft)"/>`;
    s += `<path d="${G.blob(G.ISLE.a, G.ISLE.b, 1.3, .035)}" fill="#F9DC97"/>`;
    for (let i = 0; i < 90; i++) {
      const a = rnd() * Math.PI * 2, k = .9 + rnd() * .08;
      s += `<circle cx="${(G.CX + G.ISLE.a * k * Math.cos(a)).toFixed(0)}" cy="${(G.CY + G.ISLE.b * k * Math.sin(a)).toFixed(0)}" r="${(1 + rnd() * 1.6).toFixed(1)}" fill="#E8B95E" opacity=".6"/>`;
    }
    s += `<path d="${G.blob(G.ISLE.a * .925, G.ISLE.b * .915, 2.4, .03)}" fill="url(#grass)"/>`;
    // 環島照護小路
    s += `<ellipse cx="${G.CX}" cy="${G.CY}" rx="${G.ROAD.a}" ry="${G.ROAD.b}" fill="none" stroke="#FFF6DF" stroke-width="28"/>`;
    s += `<ellipse cx="${G.CX}" cy="${G.CY}" rx="${G.ROAD.a}" ry="${G.ROAD.b}" fill="none" stroke="#E7C67E" stroke-width="2.4" stroke-dasharray="10 12"/>`;
    // 四區
    s += `<g clip-path="url(#zoneclip)">`;
    s += `<rect x="0" y="0" width="1600" height="1000" fill="#FFF6DF"/>`;
    const gap = 14;
    C.scopes.forEach((sc) => {
      const [sx, sy] = G.SIGN[sc.id];
      const x = sx < 0 ? G.CX - G.ZONE.a : G.CX + gap, y = sy < 0 ? G.CY - G.ZONE.b : G.CY + gap;
      s += `<rect x="${x}" y="${y}" width="${G.ZONE.a - gap}" height="${G.ZONE.b - gap}" fill="${sc.soft}"/>`;
      for (let i = 0; i < 26; i++) {
        const p = G.zonePt(sc.id, .15 + rnd() * .8, 4 + rnd() * 82);
        s += `<circle cx="${p.x.toFixed(0)}" cy="${p.y.toFixed(0)}" r="${(1.5 + rnd() * 2.5).toFixed(1)}" fill="${sc.color}" opacity=".16"/>`;
      }
    });
    s += `</g>`;
    s += `<ellipse cx="${G.CX}" cy="${G.CY}" rx="${G.ZONE.a}" ry="${G.ZONE.b}" fill="none" stroke="#fff" stroke-width="3" opacity=".9"/>`;
    // 政策關聯
    s += `<g id="links">`;
    C.links.forEach((l, i) => {
      const a = G.pointOf(l.a), b = G.pointOf(l.b);
      if (!a || !b) return;
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      const cx = mx * .55 + G.CX * .45, cy = my * .55 + G.CY * .45;
      s += `<path class="plink" data-a="${l.a}" data-b="${l.b}" d="M${a.x.toFixed(1)},${a.y.toFixed(1)} Q${cx.toFixed(1)},${cy.toFixed(1)} ${b.x.toFixed(1)},${b.y.toFixed(1)}" fill="none" stroke="#FFFFFF" stroke-width="2.6" stroke-dasharray="2 7" stroke-linecap="round" opacity=".85" filter="url(#glow)"/>`;
    });
    s += `</g>`;
    // 地標
    s += `<g id="landmarks">`;
    C.scopes.forEach((sc) => {
      G.zones[sc.id].landmarks.forEach((lm) => {
        const below = lm.y > G.CY ? 32 : -24;
        s += `<g class="lm" data-id="${lm.id}" data-scope="${sc.id}">
          <circle cx="${lm.x.toFixed(1)}" cy="${lm.y.toFixed(1)}" r="13" fill="#fff" stroke="${sc.color}" stroke-width="3"/>
          <circle cx="${lm.x.toFixed(1)}" cy="${lm.y.toFixed(1)}" r="5" fill="${sc.color}"/>
          ${t(lm.x, lm.y + below, escapeHtml(lm.short), `text-anchor="middle" font-size="15" font-weight="700" fill="${sc.deep}" stroke="#fff" stroke-width="4" paint-order="stroke" font-family="Noto Sans TC, sans-serif"`)}
        </g>`;
      });
    });
    s += `</g>`;
    // 區名
    C.scopes.forEach((sc) => {
      const p = G.zones[sc.id].label;
      s += `<g class="zl" data-scope="${sc.id}">
        <rect x="${(p.x - 118).toFixed(1)}" y="${(p.y - 30).toFixed(1)}" width="236" height="60" rx="30" fill="#fff" opacity=".93" stroke="${sc.color}" stroke-width="2.5"/>
        ${t(p.x, p.y - 7, sc.emoji + " " + sc.tag, `text-anchor="middle" font-size="15" font-weight="700" fill="${sc.color}" font-family="Noto Sans TC, sans-serif"`)}
        ${t(p.x, p.y + 19, sc.name, `text-anchor="middle" font-size="23" fill="${sc.deep}" font-family="Huninn, Noto Sans TC, sans-serif"`)}
      </g>`;
    });
    // 照護八站
    G.stages.forEach((st, i) => {
      const up = st.y < G.CY;
      const ly = up ? st.y - 32 : st.y + 42;
      const w = st.name.length * 16 + 34;
      s += `<g class="stage">
        <circle cx="${st.x.toFixed(1)}" cy="${st.y.toFixed(1)}" r="19" fill="#fff" stroke="#E9B95A" stroke-width="3"/>
        ${t(st.x, st.y + 7, st.icon, `text-anchor="middle" font-size="19"`)}
        <rect x="${(st.x - w / 2).toFixed(1)}" y="${(ly - 17).toFixed(1)}" width="${w}" height="24" rx="12" fill="#FFF3D3" stroke="#E9B95A" stroke-width="1.5"/>
        ${t(st.x, ly + 1, `<tspan font-weight="700" fill="#B4762A">${i + 1}</tspan> ${st.name}`, `text-anchor="middle" font-size="14" fill="#8A5A14" font-family="Noto Sans TC, sans-serif"`)}
      </g>`;
    });
    // 中央廣場與燈塔
    s += `<ellipse cx="${G.CX}" cy="${G.CY}" rx="118" ry="80" fill="#FFF9EA" stroke="#fff" stroke-width="6" filter="url(#soft)"/>`;
    s += `<circle class="beacon" cx="${G.CX}" cy="${G.CY - 40}" r="62" fill="url(#beam)"/>`;
    s += `<g transform="translate(${G.CX} ${G.CY - 8})">
      <path d="M-13,26 L13,26 L8,-28 L-8,-28 Z" fill="#fff" stroke="#E3C78E" stroke-width="2"/>
      <path d="M-11.4,10 L11.4,10 L10.6,2 L-10.6,2 Z M-9.6,-12 L9.6,-12 L9,-19 L-9,-19 Z" fill="#F4C9C4"/>
      <rect x="-10" y="-42" width="20" height="14" rx="3" fill="#FFE58A" stroke="#E3C78E" stroke-width="2"/>
      <path d="M-13,-42 L0,-54 L13,-42 Z" fill="#6DBE7E"/>
      <rect x="-16" y="26" width="32" height="6" rx="3" fill="#E3C78E"/>
    </g>`;
    s += t(G.CX, G.CY + 52, C.vision, `text-anchor="middle" font-size="23" fill="#B4762A" font-family="Huninn, Noto Sans TC, sans-serif"`);
    // 動態圖層
    s += `<g id="sentlinks"></g><g id="trees"></g><g id="vines"></g><g id="avatars"></g><g id="badges"></g>`;
    svg.innerHTML = s;
  }
  drawBase();
  const L = { avatars: svg.querySelector("#avatars"), trees: svg.querySelector("#trees"), vines: svg.querySelector("#vines"), sentlinks: svg.querySelector("#sentlinks"), badges: svg.querySelector("#badges") };

  // ---------- 人物 ----------
  const avNodes = {};
  let firstPaint = true;
  function peopleSorted() {
    return Object.entries(S.people || {}).map(([id, p]) => ({ id, ...p })).sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0));
  }
  function personPos(ps) { const m = {}; ps.forEach((p, i) => (m[p.id] = G.slotFor(i))); return m; }

  function renderAvatars(ps, pos, spotMembers) {
    const seen = new Set();
    ps.forEach((p) => {
      seen.add(p.id);
      const at = pos[p.id];
      const sig = [p.avatar, p.name, p.field, !!p.text].join("|");
      let n = avNodes[p.id];
      if (!n) {
        n = document.createElementNS(NS, "g");
        n.setAttribute("class", "av-g");
        n.innerHTML = `<g class="av-in${firstPaint ? "" : " new"}"></g>`;
        L.avatars.appendChild(n);
        avNodes[p.id] = n;
      }
      n.setAttribute("transform", `translate(${at.x.toFixed(1)} ${at.y.toFixed(1)})`);
      const box = n.firstChild;
      if (box.dataset.sig !== sig) {
        box.dataset.sig = sig;
        const name = (p.name || "").length > 6 ? p.name.slice(0, 6) + "…" : p.name || "";
        const seed = p.text && p.field ? `<circle class="seed-dot" cx="19" cy="-50" r="8" fill="${F(p.field).color}" stroke="#fff" stroke-width="2.5" filter="url(#glow)"/>` : "";
        box.innerHTML = `<svg x="-23" y="-56" width="46" height="56" viewBox="0 -2 100 122">${Avatar.inner(p.avatar)}</svg>${seed}` +
          `<text y="15" text-anchor="middle" font-size="14" font-weight="700" fill="#3A463E" stroke="#fff" stroke-width="4" paint-order="stroke" font-family="Noto Sans TC, sans-serif">${escapeHtml(name)}</text>`;
      }
      n.classList.toggle("dim", !!spotMembers && !spotMembers.has(p.id));
    });
    Object.keys(avNodes).forEach((id) => { if (!seen.has(id)) { avNodes[id].remove(); delete avNodes[id]; } });
    // 被聚光的人移到最上層
    if (spotMembers) spotMembers.forEach((id) => avNodes[id] && L.avatars.appendChild(avNodes[id]));
  }

  // ---------- 幼苗 / 大樹 ----------
  const treeNodes = {};
  function sentencesSorted() {
    return Object.entries(S.sentences || {}).map(([id, s]) => ({ id, ...s })).sort((a, b) => a.order - b.order);
  }
  function treePositions(sents) {
    const cnt = {}, out = {};
    sents.forEach((s) => {
      const i = cnt[s.scope] = (cnt[s.scope] || 0) + 1;
      const slots = G.zones[s.scope].treeSlots;
      const base = slots[(i - 1) % slots.length];
      const lap = Math.floor((i - 1) / slots.length);
      out[s.id] = { x: base.x + lap * 26, y: base.y + lap * 14 };
    });
    return out;
  }
  function treeSvg(color, stage) {
    const leaf = (d) => `<path d="${d}" fill="${color}" fill-opacity=".38" stroke="#fff" stroke-width="2.6" stroke-linejoin="round" filter="url(#glow)"/>`;
    let s = `<ellipse cx="0" cy="2" rx="22" ry="5" fill="#000" opacity=".1"/>`;
    if (stage >= 2) {
      s += `<circle cx="0" cy="-70" r="34" fill="${color}" fill-opacity=".22" stroke="#fff" stroke-width="2.4" filter="url(#glow)"/>`;
      s += `<circle cx="-24" cy="-56" r="20" fill="${color}" fill-opacity=".22" stroke="#fff" stroke-width="2" filter="url(#glow)"/>`;
      s += `<circle cx="24" cy="-58" r="22" fill="${color}" fill-opacity=".22" stroke="#fff" stroke-width="2" filter="url(#glow)"/>`;
    }
    s += `<path d="M0,0 C-3,-18 4,-34 0,-58" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" filter="url(#glow)"/>`;
    if (stage >= 1) {
      s += leaf("M0,-14 C-8,-26 -22,-28 -27,-22 C-21,-14 -10,-11 0,-14Z");
      s += leaf("M1,-22 C9,-34 23,-35 28,-29 C22,-21 11,-18 1,-22Z");
    }
    s += leaf("M0,-30 C-10,-50 -30,-53 -39,-45 C-31,-34 -13,-28 0,-30Z");
    s += leaf("M0,-48 C12,-72 38,-75 47,-63 C37,-51 15,-44 0,-48Z");
    s += leaf("M0,-57 C-7,-68 -3,-78 4,-82 C9,-73 7,-62 0,-57Z");
    return s;
  }

  function renderTrees(sents, tpos, totals, spot, phase) {
    const seen = new Set();
    let badges = "";
    const maxV = Math.max(1, ...sents.map((s) => totals[s.id] || 0));
    sents.forEach((s) => {
      seen.add(s.id);
      const p = tpos[s.id], sc = SC(s.scope), v = totals[s.id] || 0;
      let n = treeNodes[s.id];
      if (!n) {
        n = document.createElementNS(NS, "g");
        n.setAttribute("class", "tree-g" + (firstPaint ? "" : " new"));
        n.innerHTML = `<g class="tree-inner"></g><circle cx="0" cy="13" r="12" fill="#fff" stroke="${sc.color}" stroke-width="2.5"/><text y="18" text-anchor="middle" font-size="14" font-weight="700" fill="${sc.deep}" font-family="Noto Sans TC, sans-serif">${s.order}</text>`;
        L.trees.appendChild(n); treeNodes[s.id] = n;
      }
      n.setAttribute("transform", `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`);
      const inner = n.querySelector(".tree-inner");
      const ratio = v / maxV;
      const stage = v >= 3 && ratio >= 0.6 ? 2 : v >= 2 && ratio >= 0.25 ? 1 : 0;
      if (inner.dataset.stage !== String(stage) || inner.dataset.color !== sc.color) {
        inner.dataset.stage = stage; inner.dataset.color = sc.color;
        inner.innerHTML = treeSvg(sc.color, stage);
      }
      const k = 0.9 + 0.6 * ratio + (spot && spot.id === s.id ? 0.25 : 0);
      inner.style.transform = `scale(${k})`;
      n.classList.toggle("dim", !!spot && spot.id !== s.id);
      if ((phase === "water" || phase === "harvest") && v > 0) {
        const by = p.y - 88 * k - 12;
        badges += `<g transform="translate(${p.x.toFixed(1)} ${by.toFixed(1)})"><rect x="-25" y="-14" width="50" height="26" rx="13" fill="#fff" stroke="#7FB2E5" stroke-width="2"/><text y="5" text-anchor="middle" font-size="15" font-weight="700" fill="#2F6FC4" font-family="Noto Sans TC, sans-serif">💧${v}</text></g>`;
      }
    });
    Object.keys(treeNodes).forEach((id) => { if (!seen.has(id)) { treeNodes[id].remove(); delete treeNodes[id]; } });
    L.badges.innerHTML = badges;
  }

  // 句子長出的跨範疇藤蔓
  function renderSentLinks(sents, tpos, spot) {
    let s = "";
    sents.forEach((st) => {
      (st.links || []).forEach((to) => {
        const a = tpos[st.id], b = G.zones[to].center;
        const cx = (a.x + b.x) / 2 * .6 + G.CX * .4, cy = (a.y + b.y) / 2 * .6 + G.CY * .4 - 30;
        const on = !spot || spot.id === st.id;
        s += `<path d="M${a.x.toFixed(1)},${(a.y - 30).toFixed(1)} Q${cx.toFixed(1)},${cy.toFixed(1)} ${b.x.toFixed(1)},${b.y.toFixed(1)}" fill="none" stroke="#fff" stroke-width="${on && spot ? 4 : 2.2}" opacity="${on ? .95 : .2}" class="vine" filter="url(#glow)"/>`;
        s += `<circle cx="${b.x.toFixed(1)}" cy="${b.y.toFixed(1)}" r="${on && spot ? 7 : 4}" fill="${SC(to).color}" stroke="#fff" stroke-width="2" opacity="${on ? 1 : .3}"/>`;
      });
    });
    L.sentlinks.innerHTML = s;
  }

  // 聚光：六位作者的藤蔓連到幼苗
  let lastSpot = null;
  function renderVines(spot, pos, tpos) {
    if (!spot) { L.vines.innerHTML = ""; lastSpot = null; return; }
    if (lastSpot === spot.id + JSON.stringify(spot.members)) return;
    lastSpot = spot.id + JSON.stringify(spot.members);
    const tp = tpos[spot.id];
    let s = `<circle cx="${tp.x.toFixed(1)}" cy="${(tp.y - 40).toFixed(1)}" r="70" fill="url(#beam)" class="beacon"/>`;
    Object.entries(spot.members).forEach(([f, pid]) => {
      const a = pos[pid]; if (!a) return;
      const ax = a.x, ay = a.y - 30, bx = tp.x, by = tp.y - 40;
      const cx = (ax + bx) / 2 + (G.CX - (ax + bx) / 2) * .25, cy = Math.min(ay, by) - 90;
      const d = `M${ax.toFixed(1)},${ay.toFixed(1)} Q${cx.toFixed(1)},${cy.toFixed(1)} ${bx.toFixed(1)},${by.toFixed(1)}`;
      s += `<path d="${d}" fill="none" stroke="#fff" stroke-width="7" opacity=".85" filter="url(#glow)" stroke-linecap="round"/>`;
      s += `<path d="${d}" fill="none" stroke="${F(f).color}" stroke-width="3.4" class="vine" stroke-linecap="round"/>`;
    });
    L.vines.innerHTML = s;
  }

  // ---------- 疊加面板 ----------
  function renderPanels(ps, sents, totals, spot, phase) {
    const submitted = ps.filter((p) => p.text && p.field);
    const fc = {}; submitted.forEach((p) => (fc[p.field] = (fc[p.field] || 0) + 1));
    document.getElementById("stats").innerHTML =
      `<div class="big">報到 <b>${ps.length}</b> 人　種子 <b>${submitted.length}</b> 顆${sents.length ? `　幼苗 <b>${sents.length}</b> 棵` : ""}</div>` +
      `<div class="fields">${C.fields.map((f) => `<div class="f" style="background:${f.color}"><b>${fc[f.n] || 0}</b>0${f.n} ${f.title}</div>`).join("")}</div>`;

    document.getElementById("stats").classList.toggle("hide", !!spot);
    const usedDrops = Object.values(totals).reduce((a, b) => a + b, 0);
    const ph = {
      join: `🏥 <b>報到中</b>・掃描 QR Code，選一位捏捏人、抽一張詞卡`,
      reveal: `🌱 <b>揭曉</b>・來自全場不同角落的夥伴，一起拼出了這些話`,
      water: `💧 <b>澆水共識</b>・全場已澆 ${usedDrops} / ${ps.length * CFG.dropsPerPerson} 滴`,
      harvest: `🌳 <b>收成</b>・我們的共識大樹`
    }[phase];
    document.getElementById("phase").innerHTML = ph;
    document.getElementById("qr").classList.toggle("hide", phase !== "join");

    // 聚光句子卡
    const $spot = document.getElementById("spot");
    if (spot) {
      const people = S.people || {};
      const sc = SC(spot.scope);
      const sentence = SENTENCE_ORDER.map((x) => typeof x === "number"
        ? `<span class="w" style="background:${F(x).color}">${escapeHtml(cleanWord(x, (people[spot.members[x]] || {}).text) || "＿＿")}</span>` : x).join("");
      const pp = [1, 2, 3, 4, 5, 6].map((f) => {
        const p = people[spot.members[f]] || {}; const av = Avatar.get(p.avatar);
        return `<div class="pp">${p.avatar ? Avatar.svg(p.avatar) : ""}<br><span class="fn" style="background:${F(f).color}">0${f} ${F(f).title}</span><div class="nm">${escapeHtml(p.name || "")}</div></div>`;
      }).join("");
      const key = spot.id + JSON.stringify(spot.members);
      if ($spot.dataset.key !== key) {
        $spot.dataset.key = key;
        $spot.innerHTML = `<div class="hd"><span>幼苗 ${spot.order} / ${sents.length}</span><span class="sc" style="background:${sc.color}">${sc.tag}・${sc.name}${(spot.links || []).length ? "　↔ " + spot.links.map((l) => SC(l).tag).join("、") : ""}</span><span>${new Set(Object.values(spot.members)).size} 位夥伴合力完成</span></div>
          <div class="sentence">${sentence}</div><div class="people">${pp}</div>`;
        $spot.classList.remove("hide"); $spot.style.animation = "none"; void $spot.offsetWidth; $spot.style.animation = "";
      }
    } else { $spot.classList.add("hide"); $spot.dataset.key = ""; }

    // 收成
    const $h = document.getElementById("harvest");
    if (phase === "harvest" && sents.length && !spot) {
      const top = sents.slice().sort((a, b) => (totals[b.id] || 0) - (totals[a.id] || 0)).slice(0, 5);
      $h.innerHTML = `<h2>🌳 全場共識前五名</h2>` + top.map((s, i) => `<div class="row"><div class="rk">${i + 1}</div><div class="tx">${escapeHtml(sentenceText(s, S.people || {}))}<br><span style="color:${SC(s.scope).color};font-size:.85vw">幼苗 ${s.order}・${SC(s.scope).tag}</span></div><div class="vt">💧${totals[s.id] || 0}</div></div>`).join("");
      $h.classList.remove("hide");
    } else $h.classList.add("hide");

    // 導覽
    const tour = S.state && S.state.tour;
    const $t = document.getElementById("tour");
    svg.querySelectorAll(".lm").forEach((el) => el.style.opacity = tour && tour !== "all" && Number(el.dataset.scope) !== Number(tour) && !isLinkedTo(el.dataset.id, tour) ? .25 : 1);
    svg.querySelectorAll(".plink").forEach((el) => {
      const hit = tour === "all" || (tour && (el.dataset.a[0] === String(tour) || el.dataset.b[0] === String(tour)));
      el.setAttribute("opacity", tour ? (hit ? 1 : .12) : .85);
      el.setAttribute("stroke-width", hit ? 4.5 : 2.6);
      el.setAttribute("stroke-dasharray", hit ? "1 0" : "2 7");
    });
    if (tour && tour !== "all" && !spot) {
      const sc = SC(tour);
      const nameOf = (id) => id.startsWith("s") ? "照護・" + C.stages.find((x) => x.id === id).name : SC(id[0]).tag + "・" + SC(id[0]).items.find((i) => i.id === id).short;
      const rel = C.links.filter((l) => l.a[0] === String(tour) || l.b[0] === String(tour));
      $t.style.background = sc.soft;
      $t.innerHTML = `<h2 style="color:${sc.deep}">${sc.emoji} ${sc.tag}<br>${sc.name}</h2>` +
        sc.items.map((it) => `<div class="it">${it.text}</div>`).join("") +
        (rel.length ? `<div style="margin-top:1.2vh;font-weight:700;color:${sc.deep};font-size:1vw">↔ 和其他範疇的連結</div>` + rel.map((l) => {
          const mine = l.a[0] === String(tour) ? l.a : l.b, other = mine === l.a ? l.b : l.a;
          return `<div class="ln">🔗 ${nameOf(mine)} ↔ ${nameOf(other)}：${l.why}</div>`;
        }).join("") : "");
      $t.classList.remove("hide");
    } else $t.classList.add("hide");
  }
  function isLinkedTo(id, tour) {
    return C.links.some((l) => (l.a === id && l.b[0] === String(tour)) || (l.b === id && l.a[0] === String(tour)));
  }

  // ---------- 主渲染 ----------
  function render() {
    const phase = (S.state && S.state.phase) || "join";
    const ps = peopleSorted();
    const pos = personPos(ps);
    const sents = sentencesSorted();
    const tpos = treePositions(sents);
    const totals = voteTotals(S);
    const spotId = S.state && S.state.spotlight;
    const spot = spotId && S.sentences && S.sentences[spotId] ? { id: spotId, ...S.sentences[spotId] } : null;
    const spotMembers = spot ? new Set(Object.values(spot.members)) : null;
    renderSentLinks(sents, tpos, spot);
    renderTrees(sents, tpos, totals, spot, phase);
    renderVines(spot, pos, tpos);
    renderAvatars(ps, pos, spotMembers);
    renderPanels(ps, sents, totals, spot, phase);
    firstPaint = false;
  }

  Store.init().then(() => Store.subscribe((st) => { S = st || {}; render(); }))
    .catch((e) => { document.getElementById("phase").textContent = "無法連線：" + e.message; });
})();
