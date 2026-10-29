/* 360°深耕奇美：主持人控制台 */
(function () {
  const CFG = window.ISLAND_CONFIG, C = window.ISLAND_CONTENT;
  const $main = document.getElementById("main");
  const SC = (id) => C.scopes.find((s) => s.id === Number(id));
  let S = {}, msg = "", auto = null, simN = 20, pending = false, filter = 0, gfilter = "all";

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
    document.getElementById("treewrap").classList.remove("hide");
    BigTree.init(document.getElementById("treebox"), { inline: true });
    document.getElementById("tree-sim").onclick = async () => {
      if (!blooms().length) { await simulateWaters(); }
      if (!sents().length) { const r = await doBuild(true); if (!r) return; }
      renderTree(); BigTree.replay(14000);
    };
    document.getElementById("tree-clear").onclick = async () => { if (!confirm("確定清除全場的澆水紀錄？")) return; await Store.set("waters", null); msg = "已清除所有澆水"; render(); };
    Store.init().then(() => Store.subscribe((st) => { S = st || {}; render(); renderTree(); }))
      .catch((e) => ($main.innerHTML = `<p>無法連線：${escapeHtml(e.message)}</p>`));
  }

  const phase = () => (S.state && S.state.phase) || "join";
  const showN = () => (S.state && S.state.showN) || 12;
  const sents = () => Object.entries(S.sentences || {}).map(([id, s]) => ({ id, ...s })).sort((a, b) => a.order - b.order);
  const people = () => Object.entries(S.people || {}).map(([id, p]) => ({ id, ...p })).sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0));
  const done = () => people().filter(personDone);
  const hidden = () => S.hide || {};
  const blooms = () => gardenFlowers(S).filter((f) => f.bloomed);
  const who = (p) => `${p.dept ? escapeHtml(p.dept) + " " : ""}${escapeHtml(p.name || "")}`;

  // 正在編輯句子時，暫停重繪，避免打字被洗掉
  $main.addEventListener("focusout", (e) => { if (e.target.classList && e.target.classList.contains("edit") && pending) setTimeout(() => { if (!isEditing()) render(); }, 50); });
  const isEditing = () => document.activeElement && document.activeElement.classList && document.activeElement.classList.contains("edit");

  function render() {
    if (isEditing()) { pending = true; return; }
    pending = false;
    const ps = people(), ds = done(), ss = sents(), wt = waterTotals(S), HD = hidden();
    const sc = {}; ps.forEach((p) => { if (p.scope) sc[p.scope] = (sc[p.scope] || 0) + 1; });
    const waterers = Object.keys(S.waters || {}).length;
    const drops = Object.values(wt).reduce((a, b) => a + b, 0);
    const gf = gardenFlowers(S), nb = gf.filter((f) => f.bloomed).length;
    const spot = S.state && S.state.spotlight;
    const tour = S.state && S.state.tour;
    const joinOpen = !(S.state && S.state.joinOpen === false), waterOn = waterOpen(S);
    const PH = [["join", "🏥", "報到填寫"], ["water", "🌸", "澆花"], ["reveal", "📣", "揭曉盛開"], ["harvest", "🌳", "收成大樹"]];
    const inList = new Set(ss.map((s) => s.pid));
    let list = ds.filter((p) => !filter || p.scope === filter);
    if (gfilter === "bloom") list = list.filter((p) => (wt[p.id] || 0) >= bloomAt() && !HD[p.id]);
    if (gfilter === "grow") list = list.filter((p) => (wt[p.id] || 0) < bloomAt() && !HD[p.id]);
    if (gfilter === "hide") list = list.filter((p) => HD[p.id]);
    const BL = bloomAt();

    $main.innerHTML = `
    <header><h1>🔐 360°深耕奇美 主持人</h1>
      <div><span class="note" style="font-weight:700;color:${Store.mode === "local" ? "#B08A3E" : Store.online ? "#2E7D4F" : "#C9475B"}">${Store.mode === "local" ? "🟡 本機示範模式（僅本瀏覽器同步）" : (Store.online ? "🟢 已連線雲端資料庫" : "🔴 尚未連上雲端資料庫") + "・活動代號 " + escapeHtml(CFG.eventId)}</span>
      <a href="screen.html" target="_blank">開啟 3D 大螢幕 ↗</a><a href="index.html" target="_blank">開啟參加者頁 ↗</a><a href="garden.html" target="_blank">開啟共識花園 ↗</a></div></header>

    <div class="card"><h2>活動階段</h2>
      <div class="row" style="margin:0 0 10px"><button class="btn small ${joinOpen ? "" : "warn"}" data-act="joinopen">${joinOpen ? "📝 報到與填寫：開放中（點一下關閉）" : "🔒 報到與填寫：已關閉（點一下開放）"}</button>
        <button class="btn small ${waterOn ? "" : "warn"}" data-act="wateropen">${waterOn ? "💧 澆花：開放中（點一下暫停）" : "⏸ 澆花：已暫停（點一下開放）"}</button>
        <span class="note">兩者都與活動階段分開：開放時，參加者隨時可以報到填寫、進花園澆花，不用等主持人切換。</span></div>
      <div class="phases">${PH.map(([k, e, n], i) => `<button class="ph ${phase() === k ? "on" : ""}" data-phase="${k}"><b>${e}</b>${i + 1}. ${n}</button>`).join("")}</div>
      <p class="note">① 報到填寫（開場）：大螢幕顯示報到 QR Code。選人物、填部門姓名、選範疇、寫六欄行動句，種下一朵小花。報到與填寫是否開放，由上方按鈕另外控制，切到其他階段也不受影響。<br>
      ② 澆花：參加者從報到後就能隨時澆花（上方按鈕可暫停）；切到這個階段時，大螢幕鏡頭飛到花園、QR Code 換成花園頁。參加者進「共識花園」或在院區走到花園點花、按澆水；每人 ${CFG.dropsPerPerson} 滴，可重複澆同一朵、也可澆自己的；每朵澆 ${BL} 次（10%→30%→50%→70%→90%→100%）盛開。<br>
      ③ 揭曉盛開：自動用澆到 100% 的花產生揭曉清單，逐句聚光。<br>
      ④ 收成大樹：大螢幕播放共識大樹從種子長成大樹，樹上的果實就是盛開的句子，點果實看內容。</p>
      ${msg ? `<div class="msg">${escapeHtml(msg)}</div>` : ""}
    </div>

    <div class="cols" style="margin-top:14px">
      <div class="card"><h2>即時狀況</h2>
        <div class="row"><div>報到 <span class="num">${ps.length}</span> 人</div><div>花朵 <span class="num">${gf.length}</span> 朵</div><div>盛開 <span class="num" style="color:#C2410C">${nb}</span> 朵</div></div>
        <div class="bars" style="grid-template-columns:repeat(4,1fr)">${C.scopes.map((s) => `<div class="bar" style="background:${s.color}"><b>${sc[s.id] || 0}</b>${s.tag}</div>`).join("")}</div>
        <p>💧 已有 ${waterers} 人澆花，全場共 ${drops} 滴（最多 ${ps.length * CFG.dropsPerPerson} 滴；全部盛開需要 ${gf.length * BL} 滴）</p>
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

    <div class="card" style="margin-top:14px"><h2>① 花園管理與修改行動句（${ds.length} 朵）</h2>
      <div class="row tourbtns">範疇：<button class="chip ${!filter ? "on" : ""}" data-filter="0">全部</button>${C.scopes.map((s) => `<button class="chip ${filter === s.id ? "on" : ""}" data-filter="${s.id}">${s.tag}</button>`).join("")}</div>
      <div class="row tourbtns">狀態：${[["all", "全部"], ["grow", "💧 成長中"], ["bloom", "🌸 已盛開"], ["hide", "🙈 已隱藏"]].map(([k, n]) => `<button class="chip ${gfilter === k ? "on" : ""}" data-gfilter="${k}">${n}</button>`).join("")}</div>
      <p class="note">直接點句子就能修改文字（離開輸入框自動儲存）；按「↺」還原成原句。勾選「隱藏」會把那朵花從花園、大螢幕移除（不適合公開時使用）。</p>
      <div class="plist">${list.map((p) => {
        const orig = composeSentence(personWords(p));
        const val = (S.edits && S.edits[p.id]) || orig;
        const edited = !!(S.edits && S.edits[p.id]);
        const n = wt[p.id] || 0, pct = flowerPct(n), full = n >= BL;
        return `<div class="prow ${full ? "on" : ""}" style="${HD[p.id] ? "opacity:.5" : ""}">
          <span class="gprog ${full ? "full" : ""}" title="已澆 ${n} 次">${full ? "🌸" : "💧"}<b>${pct}%</b></span>
          <span class="tag" style="background:${SC(p.scope).color}">${SC(p.scope).tag}</span>
          <div class="pmain"><input class="edit" data-edit="${p.id}" value="${escapeHtml(val)}" data-orig="${escapeHtml(orig)}">
            <div class="note">${who(p)}・澆了 ${n} 次${edited ? '・<b style="color:#C9475B">已修改</b>' : ""}${inList.has(p.id) ? "・📣 揭曉清單" : ""}</div></div>
          <label class="note" style="white-space:nowrap"><input type="checkbox" data-hide="${p.id}" ${HD[p.id] ? "checked" : ""}> 隱藏</label>
          <button class="btn small ghost" data-revert="${p.id}" ${edited ? "" : "disabled"} title="還原原句">↺</button>
        </div>`;
      }).join("") || '<p class="note">沒有符合的花朵。</p>'}</div>
    </div>

    <div class="card" style="margin-top:14px"><h2>② 揭曉盛開的花（${ss.length} 句）</h2>
      <div class="row">
        <button class="btn small" data-act="build">📣 用目前 ${nb} 朵盛開的花${ss.length ? "重新" : ""}產生揭曉清單</button>
        <button class="btn small ghost" data-act="prev" ${ss.length ? "" : "disabled"}>◀ 上一句</button>
        <button class="btn small ghost" data-act="next" ${ss.length ? "" : "disabled"}>下一句 ▶</button>
        <button class="btn small ghost" data-act="auto" ${ss.length ? "" : "disabled"}>${auto ? "⏸ 停止輪播" : "▶ 自動輪播（10 秒）"}</button>
        <button class="btn small ghost" data-act="unspot" ${spot ? "" : "disabled"}>回到全院區</button>
      </div>
      <p class="note">切換到「揭曉盛開」時會自動用澆到 100% 的花產生清單；澆花期間如果又有花盛開，可按上方按鈕重新產生。這份清單也就是收成大樹上的果實。</p>
      <div>${ss.map((s) => { const p = (S.people || {})[s.pid] || {}; return `<div class="sent ${spot === s.id ? "on" : ""}"><span class="tag" style="background:${SC(s.scope).color}">${s.order}・${SC(s.scope).tag}</span><span class="tx">${escapeHtml(sentenceText(s, S.people, S.edits))}<br><span class="note">${who(p)}</span></span><span>🌸${wt[s.pid] || 0}</span><button class="btn small ghost" data-spot="${s.id}">聚光</button></div>`; }).join("")}</div>
    </div>

    <div class="card" style="margin-top:14px"><h2>參加者名單（${ps.length}）</h2>
      <table><tr><th></th><th>部門</th><th>姓名</th><th>範疇</th><th>行動句</th><th>澆出</th><th></th></tr>
      ${ps.map((p) => `<tr><td>${Avatar.svg(p.avatar)}</td><td>${escapeHtml(p.dept || "")}</td><td>${escapeHtml(p.name)}${p.sim ? ' <span class="note">(模擬)</span>' : ""}</td>
        <td>${p.scope ? `<span class="tag" style="background:${SC(p.scope).color}">${SC(p.scope).tag}</span>` : "—"}</td>
        <td style="font-size:13px">${personDone(p) ? escapeHtml(personSentence(p, S.edits, p.id)) : '<span class="note">填寫中…</span>'}</td>
        <td style="font-size:13px;white-space:nowrap">💧${waterUsed(S, p.id)}/${CFG.dropsPerPerson}</td>
        <td><button class="btn small ghost" data-del="${p.id}">移除</button></td></tr>`).join("")}</table>
    </div>

    <div class="cols" style="margin-top:14px">
      <div class="card"><h2>📥 匯出</h2>
        <div class="row"><button class="btn small" data-act="csv1">盛開句子 CSV</button><button class="btn small" data-act="csv2">全部行動句與澆水 CSV</button><button class="btn small ghost" data-act="json">完整備份 JSON</button></div>
        <p class="note">CSV 可直接用 Excel 開啟（已處理中文編碼）。JSON 是整場活動的原始資料備份。</p>
      </div>
      <div class="card"><h2>🧪 彩排工具</h2>
        <div class="row">模擬加入 <input id="simn" type="number" min="1" max="100" value="${simN}" style="width:70px;padding:6px;border-radius:8px;border:1px solid var(--line)"> 人
          <button class="btn small" data-act="sim">加入並自動填寫</button>
          <button class="btn small ghost" data-act="simvote" ${ds.length ? "" : "disabled"}>模擬澆花</button></div>
        <div class="row"><button class="btn small ghost" data-act="clearsim">清除模擬人物</button><button class="btn small warn" data-act="reset">重置整場活動</button></div>
        <p class="note">「模擬澆花」會讓每位模擬人物用完 ${CFG.dropsPerPerson} 滴水。正式活動前請按「重置整場活動」清空彩排資料。</p>
      </div>
    </div>`;
  }

  // ---------- 共識大樹預覽（收成畫面） ----------
  function renderTree() {
    const nb = blooms().length;
    document.getElementById("treenote").innerHTML = `收成時，大螢幕會播放共識大樹<b>從種子長成大樹</b>，樹上的果實就是揭曉清單中的盛開句子（目前 <b>${sents().length}</b> 顆；花園裡已盛開 <b>${nb}</b> 朵）。點果實可看句子。` +
      (sents().length ? "" : "<br>按「預覽收成」時，若還沒有盛開的花會先模擬澆花，再產生清單。");
    BigTree.update({ sents: sents(), people: S.people || {}, edits: S.edits });
  }

  // ---------- 動作 ----------
  async function setState(patch) { await Store.update("state", patch); }

  $main.addEventListener("input", (e) => {
    if (e.target.id === "simn") simN = Math.max(1, Math.min(100, Number(e.target.value) || 1));
  });
  $main.addEventListener("change", async (e) => {
    const t = e.target;
    if (t.dataset.hide) { await Store.set("hide/" + t.dataset.hide, t.checked ? true : null); return; }
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
      if (ph === "reveal" || (ph === "harvest" && !sents().length)) {
        if (!blooms().length && !confirm("目前還沒有澆到 100% 盛開的花，確定要進入「" + (ph === "reveal" ? "揭曉" : "收成") + "」嗎？")) return;
        await doBuild(true);
      }
      await setState({ phase: ph, spotlight: null });
      return;
    }
    if (b.dataset.filter !== undefined) { filter = Number(b.dataset.filter); render(); return; }
    if (b.dataset.gfilter !== undefined) { gfilter = b.dataset.gfilter; render(); return; }
    if (b.dataset.tour !== undefined) { const v = b.dataset.tour; await setState({ tour: v === "0" ? null : v === "all" ? "all" : Number(v) }); return; }
    if (b.dataset.spot) { await setState({ spotlight: b.dataset.spot }); return; }
    if (b.dataset.revert) { await Store.set("edits/" + b.dataset.revert, null); return; }
    if (b.dataset.del) {
      const p = S.people[b.dataset.del];
      if (confirm(`確定移除「${p.name}」？`)) {
        const id = b.dataset.del;
        await Store.update("", { ["people/" + id]: null, ["waters/" + id]: null, ["edits/" + id]: null, ["hide/" + id]: null });
      }
      return;
    }
    const act = b.dataset.act;
    if (act === "build") await doBuild(true);
    if (act === "wateropen") { const open = waterOpen(S); await setState({ waterOpen: open ? false : null }); msg = open ? "已暫停澆花" : "已開放澆花"; }
    if (act === "joinopen") { const open = !(S.state && S.state.joinOpen === false); await setState({ joinOpen: open ? false : null }); msg = open ? "已關閉報到與填寫" : "已開放報到與填寫"; }
    if (act === "next" || act === "prev") step(act === "next" ? 1 : -1);
    if (act === "unspot") { stopAuto(); await setState({ spotlight: null }); }
    if (act === "auto") { if (auto) stopAuto(); else { step(1); auto = setInterval(() => step(1), 10000); } render(); }
    if (act === "csv1") exportSentences();
    if (act === "csv2") exportPeople();
    if (act === "json") exportJson();
    if (act === "sim") simulate(simN);
    if (act === "simvote") simulateWaters();
    if (act === "clearsim") {
      const upd = {};
      people().filter((p) => p.sim).forEach((p) => { ["people", "waters", "edits", "hide"].forEach((k) => (upd[k + "/" + p.id] = null)); });
      await Store.update("", upd);
    }
    if (act === "reset") {
      const v = prompt("這會清除所有報到人物、行動句、修改與澆水。\n請輸入「重置」確認：");
      if (v === "重置") { stopAuto(); await Store.reset(); await setState({ phase: "join" }); }
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

  // 揭曉清單＝澆到 100% 盛開的花（依範疇排序）
  async function doBuild(quiet) {
    const chosen = blooms().map((f) => ({ id: f.pid, ...f.p }));
    chosen.sort((a, b) => a.scope - b.scope || (a.submittedAt || 0) - (b.submittedAt || 0));
    const out = {};
    chosen.forEach((p, i) => { out["s" + String(i + 1).padStart(3, "0")] = { pid: p.id, scope: p.scope, order: i + 1 }; });
    await Store.update("", { sentences: chosen.length ? out : null, "state/spotlight": null });
    msg = chosen.length ? `揭曉清單已產生：${chosen.length} 朵盛開的花 📣` : "目前沒有盛開的花，揭曉清單是空的。";
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
    const wt = waterTotals(S), P = S.people || {};
    const rows = [["編號", "澆水次數", "範疇", "部門", "姓名", "展示句子（含修改）", "原始句子", ...C.fields.map((f) => `0${f.n}${f.title}`)]];
    blooms().forEach((f, i) => {
      const p = f.p;
      rows.push([i + 1, wt[f.pid] || 0, SC(p.scope).tag + " " + SC(p.scope).name, p.dept || "", p.name || "", personSentence(p, S.edits, f.pid), composeSentence(personWords(p)), ...wordsCols(p)]);
    });
    download(`360深耕奇美_盛開句子_${CFG.eventId}.csv`, csv(rows), "text/csv;charset=utf-8");
  }
  function exportPeople() {
    const wt = waterTotals(S), HD = hidden();
    const rows = [["部門", "姓名", "人物編號", "範疇", "完整句子（含修改）", ...C.fields.map((f) => `0${f.n}${f.title}`), "被澆水次數", "成長", "是否盛開", "是否隱藏", "澆出水滴", "花朵廣場", "報到時間"]];
    people().forEach((p) => {
      const n = wt[p.id] || 0;
      rows.push([p.dept || "", p.name, p.avatar || "", p.scope ? SC(p.scope).tag : "", personDone(p) ? personSentence(p, S.edits, p.id) : "", ...wordsCols(p),
        n, flowerPct(n) + "%", n >= bloomAt() ? "是" : "", HD[p.id] ? "是" : "", waterUsed(S, p.id), p.plaza === "B" ? "社會情緒學習廣場" : p.plaza === "C" ? "復原力廣場" : "", p.joinedAt ? new Date(p.joinedAt).toLocaleString("zh-TW") : ""]);
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
  // 模擬澆花：每位模擬人物用完水滴；偏好集中在部分花朵，約一半能盛開
  async function simulateWaters() {
    const fl = gardenFlowers(S); if (!fl.length) return;
    const tot = waterTotals(S), BL = bloomAt(), upd = {};
    const fav = fl.slice().sort(() => Math.random() - .5);
    people().filter((p) => p.sim).forEach((p) => {
      const mine = { ...((S.waters || {})[p.id] || {}) };
      let leftN = CFG.dropsPerPerson - Object.values(mine).reduce((a, b) => a + b, 0);
      let guard = 0;
      while (leftN > 0 && guard++ < 200) {
        const open = fav.filter((f) => (tot[f.pid] || 0) < BL); if (!open.length) break;
        const f = open[Math.min(open.length - 1, Math.floor(Math.pow(Math.random(), 2.2) * open.length))];
        const k = Math.min(leftN, BL - (tot[f.pid] || 0), 1 + Math.floor(Math.random() * 3));
        mine[f.pid] = (mine[f.pid] || 0) + k; tot[f.pid] = (tot[f.pid] || 0) + k; leftN -= k;
      }
      upd["waters/" + p.id] = mine;
    });
    await Store.update("", upd);
    msg = "已模擬澆花"; render();
  }

})();
