/* 360°深耕奇美：主持人控制台 */
(function () {
  const CFG = window.ISLAND_CONFIG, C = window.ISLAND_CONTENT;
  const $main = document.getElementById("main");
  const SC = (id) => C.scopes.find((s) => s.id === Number(id));
  let S = {}, msg = "", auto = null, simN = 20, pending = false, filter = 0;

  // ---------- 密碼 ----------
  const gate = document.getElementById("gate");
  const tryEnter = () => {
    if (document.getElementById("pin").value === String(CFG.hostPin)) {
      try { sessionStorage.setItem("deepisland:host", "1"); } catch (e) {}
      start();
    } else document.getElementById("gmsg").textContent = "密碼不正確";
  };
  document.getElementById("enter").onclick = tryEnter;
  document.getElementById("pin").onkeydown = (e) => { if (e.key === "Enter") tryEnter(); };
  let ok = false; try { ok = sessionStorage.getItem("deepisland:host") === "1"; } catch (e) {}
  if (ok) start();

  function start() {
    gate.classList.add("hide"); $main.classList.remove("hide");
    $main.innerHTML = "<p>連線中…</p>";
    Store.onConnection = () => render();
    Store.init().then(() => Store.subscribe((st) => { S = st || {}; render(); }))
      .catch((e) => ($main.innerHTML = `<p>無法連線：${escapeHtml(e.message)}</p>`));
  }

  const phase = () => (S.state && S.state.phase) || "join";
  const showN = () => (S.state && S.state.showN) || 12;
  const sents = () => Object.entries(S.sentences || {}).map(([id, s]) => ({ id, ...s })).sort((a, b) => a.order - b.order);
  const people = () => Object.entries(S.people || {}).map(([id, p]) => ({ id, ...p })).sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0));
  const done = () => people().filter(personDone);
  const picks = () => S.pick || {};
  const who = (p) => `${p.dept ? escapeHtml(p.dept) + " " : ""}${escapeHtml(p.name || "")}`;

  // 正在編輯句子時，暫停重繪，避免打字被洗掉
  $main.addEventListener("focusout", (e) => { if (e.target.classList && e.target.classList.contains("edit") && pending) setTimeout(() => { if (!isEditing()) render(); }, 50); });
  const isEditing = () => document.activeElement && document.activeElement.classList && document.activeElement.classList.contains("edit");

  function render() {
    if (isEditing()) { pending = true; return; }
    pending = false;
    const ps = people(), ds = done(), ss = sents(), totals = voteTotals(S);
    const sc = {}; ps.forEach((p) => { if (p.scope) sc[p.scope] = (sc[p.scope] || 0) + 1; });
    const voters = Object.keys(S.votes || {}).length;
    const drops = Object.values(totals).reduce((a, b) => a + b, 0);
    const spot = S.state && S.state.spotlight;
    const tour = S.state && S.state.tour;
    const PK = picks(), nPick = ds.filter((p) => PK[p.id]).length;
    const PH = [["join", "🏥", "報到填寫"], ["reveal", "📣", "揭曉"], ["water", "💧", "澆水"], ["harvest", "🌳", "收成大樹"]];
    const inList = new Set(ss.map((s) => s.pid));
    const list = ds.filter((p) => !filter || p.scope === filter);

    $main.innerHTML = `
    <header><h1>🔐 360°深耕奇美 主持人</h1>
      <div><span class="note" style="font-weight:700;color:${Store.mode === "local" ? "#B08A3E" : Store.online ? "#2E7D4F" : "#C9475B"}">${Store.mode === "local" ? "🟡 本機示範模式（僅本瀏覽器同步）" : (Store.online ? "🟢 已連線雲端資料庫" : "🔴 尚未連上雲端資料庫") + "・活動代號 " + escapeHtml(CFG.eventId)}</span>
      <a href="screen.html" target="_blank">開啟 3D 大螢幕 ↗</a><a href="index.html" target="_blank">開啟參加者頁 ↗</a></div></header>

    <div class="card"><h2>活動階段</h2>
      <div class="phases">${PH.map(([k, e, n], i) => `<button class="ph ${phase() === k ? "on" : ""}" data-phase="${k}"><b>${e}</b>${i + 1}. ${n}</button>`).join("")}</div>
      <p class="note">報到填寫：參加者選人物、填部門姓名、選範疇、寫完六欄行動句並種下花朵，期間可修改。進入「揭曉」後就不能再修改。<br>澆水與收成時，大螢幕會切換成全螢幕的共識大樹。</p>
      ${msg ? `<div class="msg">${escapeHtml(msg)}</div>` : ""}
    </div>

    <div class="cols" style="margin-top:14px">
      <div class="card"><h2>即時狀況</h2>
        <div class="row"><div>報到 <span class="num">${ps.length}</span> 人</div><div>完成行動句 <span class="num">${ds.length}</span> 句</div><div>花朵 <span class="num">${ds.length}</span> 朵</div></div>
        <div class="bars" style="grid-template-columns:repeat(4,1fr)">${C.scopes.map((s) => `<div class="bar" style="background:${s.color}"><b>${sc[s.id] || 0}</b>${s.tag}</div>`).join("")}</div>
        ${phase() === "water" || phase() === "harvest" ? `<p>💧 已澆水 ${voters} 人，共 ${drops} 滴</p>` : ""}
      </div>
      <div class="card"><h2>院區導覽（大螢幕）</h2>
        <div class="row tourbtns">
          <button class="chip ${!tour ? "on" : ""}" data-tour="0">全院區</button>
          ${C.scopes.map((s) => `<button class="chip ${Number(tour) === s.id ? "on" : ""}" data-tour="${s.id}" style="${Number(tour) === s.id ? `background:${s.color};border-color:${s.color};color:#fff` : ""}">${s.tag}</button>`).join("")}
          <button class="chip ${tour === "all" ? "on" : ""}" data-tour="all">所有關聯</button>
        </div>
        <p class="note">開場時可依序點各範疇，大螢幕會顯示子項目與跨範疇的關聯。</p>
      </div>
    </div>

    <div class="card" style="margin-top:14px"><h2>① 挑選與修改行動句（${ds.length} 句）</h2>
      <div class="row">
        展示數量 <input id="shown" type="number" min="1" max="100" value="${showN()}" style="width:70px;padding:6px;border-radius:8px;border:1px solid var(--line)"> 句
        <button class="btn small" data-act="autopick">🎲 依範疇平均挑選</button>
        <button class="btn small ghost" data-act="pickall">全選</button>
        <button class="btn small ghost" data-act="picknone">全不選</button>
        <span class="note">已勾選 <b>${nPick}</b> 句</span>
      </div>
      <div class="row tourbtns">篩選：<button class="chip ${!filter ? "on" : ""}" data-filter="0">全部</button>${C.scopes.map((s) => `<button class="chip ${filter === s.id ? "on" : ""}" data-filter="${s.id}">${s.tag}</button>`).join("")}</div>
      <p class="note">直接點句子就能修改文字（離開輸入框自動儲存）；按「↺」還原成原句。勾選的句子會進入揭曉清單。</p>
      <div class="plist">${list.map((p) => {
        const orig = composeSentence(personWords(p));
        const val = (S.edits && S.edits[p.id]) || orig;
        const edited = !!(S.edits && S.edits[p.id]);
        return `<div class="prow ${PK[p.id] ? "on" : ""}">
          <label class="ck"><input type="checkbox" data-pick="${p.id}" ${PK[p.id] ? "checked" : ""}></label>
          <span class="tag" style="background:${SC(p.scope).color}">${SC(p.scope).tag}</span>
          <div class="pmain"><input class="edit" data-edit="${p.id}" value="${escapeHtml(val)}" data-orig="${escapeHtml(orig)}">
            <div class="note">${who(p)}${edited ? '・<b style="color:#C9475B">已修改</b>' : ""}${inList.has(p.id) ? "・📣 揭曉中" : ""}</div></div>
          <button class="btn small ghost" data-revert="${p.id}" ${edited ? "" : "disabled"} title="還原原句">↺</button>
        </div>`;
      }).join("") || '<p class="note">還沒有人完成行動句。</p>'}</div>
    </div>

    <div class="card" style="margin-top:14px"><h2>② 揭曉清單（${ss.length} 句）</h2>
      <div class="row">
        <button class="btn small" data-act="build">${ss.length ? "🔄 用目前勾選重新產生清單" : `📣 用勾選的 ${nPick} 句產生揭曉清單`}</button>
        <button class="btn small ghost" data-act="prev" ${ss.length ? "" : "disabled"}>◀ 上一句</button>
        <button class="btn small ghost" data-act="next" ${ss.length ? "" : "disabled"}>下一句 ▶</button>
        <button class="btn small ghost" data-act="auto" ${ss.length ? "" : "disabled"}>${auto ? "⏸ 停止輪播" : "▶ 自動輪播（10 秒）"}</button>
        <button class="btn small ghost" data-act="unspot" ${spot ? "" : "disabled"}>回到全院區</button>
      </div>
      <p class="note">重新產生清單會清除已澆的水。清單產生後再修改句子文字，大螢幕和手機會即時更新。</p>
      <div>${ss.map((s) => { const p = (S.people || {})[s.pid] || {}; return `<div class="sent ${spot === s.id ? "on" : ""}"><span class="tag" style="background:${SC(s.scope).color}">${s.order}・${SC(s.scope).tag}</span><span class="tx">${escapeHtml(sentenceText(s, S.people, S.edits))}<br><span class="note">${who(p)}</span></span><span>💧${totals[s.id] || 0}</span><button class="btn small ghost" data-spot="${s.id}">聚光</button></div>`; }).join("")}</div>
    </div>

    <div class="card" style="margin-top:14px"><h2>參加者名單（${ps.length}）</h2>
      <table><tr><th></th><th>部門</th><th>姓名</th><th>範疇</th><th>行動句</th><th></th></tr>
      ${ps.map((p) => `<tr><td>${Avatar.svg(p.avatar)}</td><td>${escapeHtml(p.dept || "")}</td><td>${escapeHtml(p.name)}${p.sim ? ' <span class="note">(模擬)</span>' : ""}</td>
        <td>${p.scope ? `<span class="tag" style="background:${SC(p.scope).color}">${SC(p.scope).tag}</span>` : "—"}</td>
        <td style="font-size:13px">${personDone(p) ? escapeHtml(personSentence(p, S.edits, p.id)) : '<span class="note">填寫中…</span>'}</td>
        <td><button class="btn small ghost" data-del="${p.id}">移除</button></td></tr>`).join("")}</table>
    </div>

    <div class="cols" style="margin-top:14px">
      <div class="card"><h2>📥 匯出</h2>
        <div class="row"><button class="btn small" data-act="csv1">揭曉句子與票數 CSV</button><button class="btn small" data-act="csv2">全部行動句明細 CSV</button><button class="btn small ghost" data-act="json">完整備份 JSON</button></div>
        <p class="note">CSV 可直接用 Excel 開啟（已處理中文編碼）。JSON 是整場活動的原始資料備份。</p>
      </div>
      <div class="card"><h2>🧪 彩排工具</h2>
        <div class="row">模擬加入 <input id="simn" type="number" min="1" max="100" value="${simN}" style="width:70px;padding:6px;border-radius:8px;border:1px solid var(--line)"> 人
          <button class="btn small" data-act="sim">加入並自動填寫</button>
          <button class="btn small ghost" data-act="simvote" ${ss.length ? "" : "disabled"}>模擬澆水</button></div>
        <div class="row"><button class="btn small ghost" data-act="clearsim">清除模擬人物</button><button class="btn small warn" data-act="reset">重置整場活動</button></div>
        <p class="note">正式活動前請按「重置整場活動」清空彩排資料。</p>
      </div>
    </div>`;
  }

  // ---------- 動作 ----------
  async function setState(patch) { await Store.update("state", patch); }

  $main.addEventListener("input", (e) => {
    if (e.target.id === "simn") simN = Math.max(1, Math.min(100, Number(e.target.value) || 1));
  });
  $main.addEventListener("change", async (e) => {
    const t = e.target;
    if (t.id === "shown") { await setState({ showN: Math.max(1, Math.min(100, Number(t.value) || 12)) }); return; }
    if (t.dataset.pick) { await Store.set("pick/" + t.dataset.pick, t.checked ? true : null); return; }
    if (t.dataset.edit) {
      const v = t.value.trim();
      await Store.set("edits/" + t.dataset.edit, v && v !== t.dataset.orig ? v.slice(0, 120) : null);
    }
  });
  $main.addEventListener("keydown", (e) => { if (e.target.classList.contains("edit") && e.key === "Enter") e.target.blur(); });
  $main.addEventListener("click", async (e) => {
    const b = e.target.closest("button"); if (!b) return;
    msg = "";
    if (b.dataset.phase) {
      const ph = b.dataset.phase;
      if (ph !== "join" && !sents().length) { const r = await doBuild(); if (!r) return; }
      await setState({ phase: ph, spotlight: ph === "reveal" ? (S.state || {}).spotlight || null : null });
      return;
    }
    if (b.dataset.filter !== undefined) { filter = Number(b.dataset.filter); render(); return; }
    if (b.dataset.tour !== undefined) { const v = b.dataset.tour; await setState({ tour: v === "0" ? null : v === "all" ? "all" : Number(v) }); return; }
    if (b.dataset.spot) { await setState({ spotlight: b.dataset.spot }); return; }
    if (b.dataset.revert) { await Store.set("edits/" + b.dataset.revert, null); return; }
    if (b.dataset.del) {
      const p = S.people[b.dataset.del];
      if (confirm(`確定移除「${p.name}」？`)) {
        const id = b.dataset.del;
        await Store.update("", { ["people/" + id]: null, ["votes/" + id]: null, ["edits/" + id]: null, ["pick/" + id]: null });
      }
      return;
    }
    const act = b.dataset.act;
    if (act === "autopick") await autoPick();
    if (act === "pickall") { const u = {}; done().forEach((p) => (u[p.id] = true)); await Store.set("pick", u); }
    if (act === "picknone") await Store.set("pick", null);
    if (act === "build") {
      if (sents().length && !confirm("重新產生揭曉清單會清除已澆的水。確定？")) return;
      await doBuild();
    }
    if (act === "next" || act === "prev") step(act === "next" ? 1 : -1);
    if (act === "unspot") { stopAuto(); await setState({ spotlight: null }); }
    if (act === "auto") { if (auto) stopAuto(); else { step(1); auto = setInterval(() => step(1), 10000); } render(); }
    if (act === "csv1") exportSentences();
    if (act === "csv2") exportPeople();
    if (act === "json") exportJson();
    if (act === "sim") simulate(simN);
    if (act === "simvote") simulateVotes();
    if (act === "clearsim") {
      const upd = {};
      people().filter((p) => p.sim).forEach((p) => { ["people", "votes", "edits", "pick"].forEach((k) => (upd[k + "/" + p.id] = null)); });
      await Store.update("", upd);
    }
    if (act === "reset") {
      const v = prompt("這會清除所有報到人物、行動句、修改與投票。\n請輸入「重置」確認：");
      if (v === "重置") { stopAuto(); await Store.reset(); await setState({ phase: "join", showN: 12 }); }
    }
    render();
  });

  function stopAuto() { if (auto) clearInterval(auto); auto = null; }
  async function step(d) {
    const ss = sents(); if (!ss.length) return;
    const cur = ss.findIndex((s) => s.id === (S.state || {}).spotlight);
    const next = cur < 0 ? (d > 0 ? 0 : ss.length - 1) : (cur + d + ss.length) % ss.length;
    await setState({ spotlight: ss[next].id });
  }

  // 依範疇平均挑出 N 句（每個範疇輪流挑，隨機）
  async function autoPick() {
    const n = showN();
    const by = {}; done().forEach((p) => (by[p.scope] = by[p.scope] || []).push(p));
    Object.values(by).forEach((l) => l.sort(() => Math.random() - .5));
    const chosen = {}; let k = 0;
    while (Object.keys(chosen).length < n && Object.values(by).some((l) => l.length)) {
      const l = by[[1, 2, 3, 4][k++ % 4]]; if (l && l.length) chosen[l.shift().id] = true;
    }
    await Store.set("pick", Object.keys(chosen).length ? chosen : null);
    msg = `已挑選 ${Object.keys(chosen).length} 句`;
  }

  async function doBuild() {
    let chosen = done().filter((p) => picks()[p.id]);
    if (!chosen.length) {
      if (!done().length) { msg = "還沒有人完成行動句，無法揭曉。"; render(); return false; }
      await autoPick(); chosen = done().filter((p) => picks()[p.id]);
    }
    // 依範疇排序，讓揭曉時同範疇的句子連在一起
    chosen.sort((a, b) => a.scope - b.scope || (a.submittedAt || 0) - (b.submittedAt || 0));
    const out = {};
    chosen.forEach((p, i) => { out["s" + String(i + 1).padStart(3, "0")] = { pid: p.id, scope: p.scope, order: i + 1 }; });
    await Store.update("", { sentences: out, votes: null, "state/spotlight": null });
    msg = `揭曉清單已產生，共 ${chosen.length} 句 📣`;
    render();
    return true;
  }

  // ---------- 匯出 ----------
  function download(name, text, type) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type }));
    a.download = name; a.click();
  }
  const csv = (rows) => "﻿" + rows.map((r) => r.map((c) => `"${String(c == null ? "" : c).replace(/"/g, '""')}"`).join(",")).join("\r\n");
  const wordsCols = (p) => C.fields.map((f) => personWords(p)[f.n] || "");
  function exportSentences() {
    const totals = voteTotals(S), P = S.people || {};
    const ss = sents().sort((a, b) => (totals[b.id] || 0) - (totals[a.id] || 0));
    const rows = [["排名", "水滴數", "編號", "範疇", "部門", "姓名", "展示句子（含修改）", "原始句子", ...C.fields.map((f) => `0${f.n}${f.title}`)]];
    ss.forEach((s, i) => {
      const p = P[s.pid] || {};
      rows.push([i + 1, totals[s.id] || 0, s.order, SC(s.scope).tag + " " + SC(s.scope).name, p.dept || "", p.name || "", sentenceText(s, P, S.edits), composeSentence(personWords(p)), ...wordsCols(p)]);
    });
    download(`360深耕奇美_揭曉句子與票數_${CFG.eventId}.csv`, csv(rows), "text/csv;charset=utf-8");
  }
  function exportPeople() {
    const inList = new Set(sents().map((s) => s.pid));
    const rows = [["部門", "姓名", "人物編號", "範疇", "完整句子（含修改）", ...C.fields.map((f) => `0${f.n}${f.title}`), "是否揭曉", "花朵廣場", "報到時間"]];
    people().forEach((p) => {
      rows.push([p.dept || "", p.name, p.avatar || "", p.scope ? SC(p.scope).tag : "", personDone(p) ? personSentence(p, S.edits, p.id) : "", ...wordsCols(p),
        inList.has(p.id) ? "是" : "", p.plaza === "B" ? "社會情緒學習廣場" : p.plaza === "C" ? "復原力廣場" : "", p.joinedAt ? new Date(p.joinedAt).toLocaleString("zh-TW") : ""]);
    });
    download(`360深耕奇美_全部行動句_${CFG.eventId}.csv`, csv(rows), "text/csv;charset=utf-8");
  }
  function exportJson() {
    download(`360深耕奇美_完整備份_${CFG.eventId}_${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(S, null, 2), "application/json");
  }

  // ---------- 彩排模擬 ----------
  const SIM_NAMES = ["小美", "阿傑", "佩珊", "志明", "怡君", "建宏", "雅婷", "俊賢", "淑芬", "家豪", "欣怡", "宗翰", "惠如", "冠宇", "珮瑜", "承恩", "曉雯", "柏翰", "思妤", "國華", "美玲", "子晴", "育誠", "靜宜", "文彬", "品妍", "健民", "詩涵", "明哲", "玉珍"];
  const SIM_DEPTS = ["護理部", "內科部", "外科部", "藥劑部", "資訊室", "人資室", "教學中心", "社工室", "復健部", "營養部", "醫事檢驗部", "急診醫學部"];
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  async function simulate(n) {
    msg = `模擬加入 ${n} 人中…`; render();
    const upd = {};
    for (let i = 0; i < n; i++) {
      const pid = "sim" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6) + i;
      const words = {}; C.fields.forEach((f) => (words[f.n] = pick(f.hints)));
      upd["people/" + pid] = {
        name: pick(SIM_NAMES), dept: pick(SIM_DEPTS), avatar: pick(Avatar.presets).id, joinedAt: Date.now() + i,
        scope: 1 + Math.floor(Math.random() * 4), words, submittedAt: Date.now() + i, plaza: Math.random() < .5 ? "B" : "C", sim: true
      };
    }
    await Store.update("", upd);
    msg = `已模擬加入 ${n} 人`; render();
  }
  async function simulateVotes() {
    const ss = sents(); if (!ss.length) return;
    const upd = {};
    people().filter((p) => p.sim).forEach((p) => {
      const v = {};
      for (let k = 0; k < CFG.dropsPerPerson; k++) {
        const s = ss[Math.min(ss.length - 1, Math.floor(Math.pow(Math.random(), 1.8) * ss.length))];
        v[s.id] = (v[s.id] || 0) + 1;
      }
      upd["votes/" + p.id] = v;
    });
    await Store.update("", upd);
    msg = "已模擬澆水"; render();
  }
})();
