/* 360°深耕奇美：主持人控制台 */
(function () {
  const CFG = window.ISLAND_CONFIG, C = window.ISLAND_CONTENT;
  const $main = document.getElementById("main");
  const SC = (id) => C.scopes.find((s) => s.id === Number(id));
  const F = (n) => C.fields[n - 1];
  let S = {}, msg = "", auto = null, simN = 20;

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
  const sents = () => Object.entries(S.sentences || {}).map(([id, s]) => ({ id, ...s })).sort((a, b) => a.order - b.order);
  const people = () => Object.entries(S.people || {}).map(([id, p]) => ({ id, ...p })).sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0));

  function render() {
    const ps = people(), ss = sents(), totals = voteTotals(S);
    const submitted = ps.filter((p) => p.text && p.field);
    const fc = {}; submitted.forEach((p) => (fc[p.field] = (fc[p.field] || 0) + 1));
    const voters = Object.keys(S.votes || {}).length;
    const drops = Object.values(totals).reduce((a, b) => a + b, 0);
    const spot = S.state && S.state.spotlight;
    const tour = S.state && S.state.tour;
    const PH = [["join", "🏥", "報到填寫"], ["reveal", "🌱", "揭曉"], ["water", "💧", "澆水"], ["harvest", "🌳", "收成"]];

    $main.innerHTML = `
    <header><h1>🔐 360°深耕奇美 主持人</h1>
      <div><span class="note" style="font-weight:700;color:${Store.mode === "local" ? "#B08A3E" : Store.online ? "#2E7D4F" : "#C9475B"}">${Store.mode === "local" ? "🟡 本機示範模式（僅本瀏覽器同步）" : (Store.online ? "🟢 已連線雲端資料庫" : "🔴 尚未連上雲端資料庫") + "・活動代號 " + escapeHtml(CFG.eventId)}</span>
      <a href="screen.html" target="_blank">開啟 3D 大螢幕 ↗</a><a href="screen-lite.html" target="_blank">簡易版大螢幕 ↗</a><a href="index.html" target="_blank">開啟參加者頁 ↗</a></div></header>

    <div class="card"><h2>活動階段</h2>
      <div class="phases">${PH.map(([k, e, n], i) => `<button class="ph ${phase() === k ? "on" : ""}" data-phase="${k}"><b>${e}</b>${i + 1}. ${n}</button>`).join("")}</div>
      <p class="note">報到填寫：參加者可報到、抽卡、填寫與修改。進入「揭曉」後就不能再修改詞。</p>
      ${msg ? `<div class="msg">${escapeHtml(msg)}</div>` : ""}
    </div>

    <div class="cols" style="margin-top:14px">
      <div class="card"><h2>即時狀況</h2>
        <div class="row"><div>報到 <span class="num">${ps.length}</span> 人</div><div>種子 <span class="num">${submitted.length}</span> 顆</div><div>幼苗 <span class="num">${ss.length}</span> 棵</div></div>
        <div class="bars">${C.fields.map((f) => `<div class="bar" style="background:${f.color}"><b>${fc[f.n] || 0}</b>0${f.n} ${f.title}</div>`).join("")}</div>
        <p class="note">已派卡：${C.fields.map((f) => `0${f.n}=${(S.fieldCounts || {})[f.n] || 0}`).join("　")}</p>
        ${phase() === "water" || phase() === "harvest" ? `<p>💧 已投票 ${voters} 人，共 ${drops} 滴</p>` : ""}
      </div>

      <div class="card"><h2>院區導覽（大螢幕）</h2>
        <div class="row tourbtns">
          <button class="chip ${!tour ? "on" : ""}" data-tour="0">全院區</button>
          ${C.scopes.map((s) => `<button class="chip ${Number(tour) === s.id ? "on" : ""}" data-tour="${s.id}" style="${Number(tour) === s.id ? `background:${s.color};border-color:${s.color}` : ""}">${s.tag}</button>`).join("")}
          <button class="chip ${tour === "all" ? "on" : ""}" data-tour="all">所有關聯</button>
        </div>
        <p class="note">開場時可依序點各範疇，大螢幕會顯示子項目與跨範疇的關聯。</p>
      </div>
    </div>

    <div class="card" style="margin-top:14px"><h2>拼句與揭曉</h2>
      <div class="row">
        <button class="btn small" data-act="build">${ss.length ? "🔀 重新洗牌拼句" : "🌱 拼句，長出幼苗"}</button>
        <button class="btn small ghost" data-act="prev" ${ss.length ? "" : "disabled"}>◀ 上一句</button>
        <button class="btn small ghost" data-act="next" ${ss.length ? "" : "disabled"}>下一句 ▶</button>
        <button class="btn small ghost" data-act="auto" ${ss.length ? "" : "disabled"}>${auto ? "⏸ 停止輪播" : "▶ 自動輪播（10 秒）"}</button>
        <button class="btn small ghost" data-act="unspot" ${spot ? "" : "disabled"}>回到全院區</button>
      </div>
      <p class="note">每湊齊 01–06 各一個詞就拼成一句，會盡量讓同一句來自不同造型的夥伴；每個人的詞至少出現在一句裡。重新洗牌會清除已澆的水。</p>
      <div>${ss.map((s) => `<div class="sent ${spot === s.id ? "on" : ""}"><span class="tag" style="background:${SC(s.scope).color}">${s.order}・${SC(s.scope).tag}</span><span class="tx">${escapeHtml(sentenceText(s, S.people || {}))}</span><span class="note">${new Set(Object.values(s.members)).size}人</span><span>💧${totals[s.id] || 0}</span><button class="btn small ghost" data-spot="${s.id}">聚光</button></div>`).join("")}</div>
    </div>

    <div class="card" style="margin-top:14px"><h2>參加者名單（${ps.length}）</h2>
      <table><tr><th></th><th>暱稱</th><th>欄位</th><th>詞</th><th>範疇</th><th></th></tr>
      ${ps.map((p) => { const av = Avatar.get(p.avatar); return `<tr><td>${Avatar.svg(p.avatar)}</td><td>${escapeHtml(p.name)}${p.sim ? ' <span class="note">(模擬)</span>' : ""}</td>
        <td>${p.field ? `<span class="tag" style="background:${F(p.field).color}">0${p.field} ${F(p.field).title}</span>` : "—"}</td><td>${escapeHtml(p.text || "")}</td>
        <td>${p.scope ? `<span class="tag" style="background:${SC(p.scope).color}">${SC(p.scope).tag}</span>` : ""}</td>
        <td><button class="btn small ghost" data-del="${p.id}">移除</button></td></tr>`; }).join("")}</table>
    </div>

    <div class="cols" style="margin-top:14px">
      <div class="card"><h2>📥 匯出</h2>
        <div class="row"><button class="btn small" data-act="csv1">句子與票數 CSV</button><button class="btn small" data-act="csv2">個人填寫明細 CSV</button></div>
        <p class="note">CSV 可直接用 Excel 開啟（已處理中文編碼）。</p>
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

  $main.addEventListener("input", (e) => { if (e.target.id === "simn") simN = Math.max(1, Math.min(100, Number(e.target.value) || 1)); });
  $main.addEventListener("click", async (e) => {
    const b = e.target.closest("button"); if (!b) return;
    msg = "";
    if (b.dataset.phase) {
      const ph = b.dataset.phase;
      if (ph !== "join" && !sents().length) {
        const r = await doBuild(); if (!r) return;
      }
      await setState({ phase: ph, spotlight: ph === "harvest" ? null : (S.state || {}).spotlight || null });
      return;
    }
    if (b.dataset.tour !== undefined) { const v = b.dataset.tour; await setState({ tour: v === "0" ? null : v === "all" ? "all" : Number(v) }); return; }
    if (b.dataset.spot) { await setState({ spotlight: b.dataset.spot }); return; }
    if (b.dataset.del) {
      const p = S.people[b.dataset.del];
      if (confirm(`確定移除「${p.name}」？`)) {
        await Store.remove("people/" + b.dataset.del);
        if (p.field) await Store.set("fieldCounts/" + p.field, Math.max(0, ((S.fieldCounts || {})[p.field] || 1) - 1));
        await Store.remove("votes/" + b.dataset.del);
      }
      return;
    }
    const act = b.dataset.act;
    if (act === "build") {
      if (sents().length && !confirm("重新洗牌會產生新的句子組合，並清除已澆的水。確定？")) return;
      await doBuild();
    }
    if (act === "next" || act === "prev") step(act === "next" ? 1 : -1);
    if (act === "unspot") { stopAuto(); await setState({ spotlight: null }); }
    if (act === "auto") { if (auto) stopAuto(); else { step(1); auto = setInterval(() => step(1), 10000); } render(); }
    if (act === "csv1") exportSentences();
    if (act === "csv2") exportPeople();
    if (act === "sim") simulate(simN);
    if (act === "simvote") simulateVotes();
    if (act === "clearsim") {
      const sims = people().filter((p) => p.sim);
      const upd = {};
      sims.forEach((p) => { upd["people/" + p.id] = null; upd["votes/" + p.id] = null; });
      const fc = { ...(S.fieldCounts || {}) };
      sims.forEach((p) => { if (p.field) fc[p.field] = Math.max(0, (fc[p.field] || 0) - 1); });
      upd.fieldCounts = fc;
      await Store.update("", upd);
    }
    if (act === "reset") {
      const v = prompt("這會清除所有報到人物、句子與投票。\n請輸入「重置」確認：");
      if (v === "重置") { stopAuto(); await Store.reset(); await setState({ phase: "join", round: 1 }); }
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

  async function doBuild() {
    const round = ((S.state && S.state.round) || 1) + (sents().length ? 1 : 0);
    const r = buildSentences(S.people || {}, round);
    if (r.error) { msg = r.error; render(); return false; }
    await Store.update("", { sentences: r.sentences, votes: null, "state/round": round, "state/spotlight": null });
    msg = `已拼出 ${Object.keys(r.sentences).length} 句話 🌱`;
    render();
    return true;
  }

  // ---------- 匯出 CSV ----------
  function download(name, rows) {
    const csv = "﻿" + rows.map((r) => r.map((c) => `"${String(c == null ? "" : c).replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = name; a.click();
  }
  function exportSentences() {
    const totals = voteTotals(S), P = S.people || {};
    const ss = sents().sort((a, b) => (totals[b.id] || 0) - (totals[a.id] || 0));
    const head = ["排名", "水滴數", "幼苗編號", "主要範疇", "延伸範疇", "完整句子"];
    C.fields.forEach((f) => head.push(`0${f.n}${f.title}`, `0${f.n}填寫者`));
    const rows = [head];
    ss.forEach((s, i) => {
      const r = [i + 1, totals[s.id] || 0, s.order, SC(s.scope).tag + " " + SC(s.scope).name, (s.links || []).map((l) => SC(l).tag).join("、"), sentenceText(s, P)];
      C.fields.forEach((f) => { const p = P[s.members[f.n]] || {}; r.push(p.text || "", p.name || ""); });
      rows.push(r);
    });
    download(`360深耕奇美_句子與票數_${CFG.eventId}.csv`, rows);
  }
  function exportPeople() {
    const rows = [["暱稱", "人物編號", "欄位", "填寫的詞", "範疇", "報到時間"]];
    people().forEach((p) => {
      const av = Avatar.get(p.avatar);
      rows.push([p.name, p.avatar || "", p.field ? `0${p.field} ${F(p.field).title}` : "", p.text || "", p.scope ? SC(p.scope).tag : "", p.joinedAt ? new Date(p.joinedAt).toLocaleString("zh-TW") : ""]);
    });
    download(`360深耕奇美_個人填寫_${CFG.eventId}.csv`, rows);
  }

  // ---------- 彩排模擬 ----------
  const SIM_NAMES = ["小美", "阿傑", "佩珊", "志明", "怡君", "建宏", "雅婷", "俊賢", "淑芬", "家豪", "欣怡", "宗翰", "惠如", "冠宇", "珮瑜", "承恩", "曉雯", "柏翰", "思妤", "國華", "美玲", "子晴", "育誠", "靜宜", "文彬", "品妍", "健民", "詩涵", "明哲", "玉珍"];
  const SIM_WORDS = {
    1: ["我們的跨專業團隊", "三院區的深耕夥伴", "第一線同仁與主管", "護理部與醫師團隊", "新進同仁與導師", "各職類的種子教師"],
    2: ["簡化", "串聯", "共同設計", "優化", "整合", "數位化"],
    3: ["重複填寫的行政表單", "出院後的照護服務", "符合同仁需求的學習活動", "交班與溝通流程", "跨院轉介資訊", "病人衛教資源"],
    4: ["資訊室及行政單位", "社區醫療與居家護理團隊", "教學單位及各職類同仁", "AI 中心", "地方衛生所", "病友與家屬"],
    5: ["流程盤點與小規模試行", "固定聯繫窗口與轉介機制", "需求訪談與跨職類交流", "AI 輔助工具", "每月共學工作坊", "數據儀表板追蹤"],
    6: ["減少重工，留出更多照護時間", "返家後仍能獲得持續支持", "讓學習貼近工作並容易應用", "同仁更願意留下來", "病人更安心", "資源更公平地送到社區"]
  };
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  async function simulate(n) {
    msg = `模擬加入 ${n} 人中…`; render();
    for (let i = 0; i < n; i++) {
      const pid = "sim" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      const f = await Store.claimField();
      await Store.set("people/" + pid, {
        name: pick(SIM_NAMES) + (Math.random() < .3 ? "醫師" : ""), avatar: pick(Avatar.presets).id, joinedAt: Date.now(),
        field: f, text: pick(SIM_WORDS[f]), scope: 1 + Math.floor(Math.random() * 4), submittedAt: Date.now(), sim: true
      });
      await new Promise((r) => setTimeout(r, 120));
    }
    msg = `已模擬加入 ${n} 人`; render();
  }
  async function simulateVotes() {
    const ss = sents(); if (!ss.length) return;
    const upd = {};
    people().filter((p) => p.sim).forEach((p) => {
      const v = {};
      for (let k = 0; k < CFG.dropsPerPerson; k++) {
        // 讓前幾句比較受歡迎，看得出樹的差異
        const s = ss[Math.min(ss.length - 1, Math.floor(Math.pow(Math.random(), 1.8) * ss.length))];
        v[s.id] = (v[s.id] || 0) + 1;
      }
      upd["votes/" + p.id] = v;
    });
    await Store.update("", upd);
    msg = "已模擬澆水"; render();
  }
})();
