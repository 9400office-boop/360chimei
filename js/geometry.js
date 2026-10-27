/* 360°深耕奇美 地圖幾何：島形、四區、環島小路、人物站位、幼苗位置 */
(function () {
  const C = window.ISLAND_CONTENT;
  const CX = 800, CY = 560;
  const ZONE = { a: 500, b: 255 };      // 四區所在橢圓
  const ROAD = { a: 548, b: 298 };      // 環島照護小路
  const ISLE = { a: 742, b: 420 };      // 島
  const RING_A = { a: 688, b: 384 };    // 外圈站位（沙灘）
  const RING_B = { a: 618, b: 342 };    // 內圈站位（小路外側）
  const SIGN = { 1: [-1, -1], 2: [1, -1], 3: [1, 1], 4: [-1, 1] };
  const deg = Math.PI / 180;

  // 區內座標：比例 r（相對區塊橢圓）與角度 t（0~90，0=水平、90=垂直）
  function zonePt(scope, r, t) {
    const [sx, sy] = SIGN[scope];
    return { x: CX + sx * ZONE.a * r * Math.cos(t * deg), y: CY + sy * ZONE.b * r * Math.sin(t * deg) };
  }

  // 有機島形
  function blob(a, b, seed, amp) {
    const N = 72, pts = [];
    for (let i = 0; i < N; i++) {
      const t = (i / N) * Math.PI * 2;
      const k = 1 + amp * (0.5 * Math.sin(3 * t + seed) + 0.35 * Math.sin(5 * t + seed * 2) + 0.25 * Math.sin(8 * t + seed * 3));
      pts.push([CX + a * k * Math.cos(t), CY + b * k * Math.sin(t)]);
    }
    let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
    for (let i = 0; i < N; i++) {
      const p0 = pts[(i - 1 + N) % N], p1 = pts[i], p2 = pts[(i + 1) % N], p3 = pts[(i + 2) % N];
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += `C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
    }
    return d + "Z";
  }

  // 照護八站：沿小路順時針，從左上開始
  const stageAngles = C.stages.map((_, i) => -150 + i * 45);
  const stages = C.stages.map((s, i) => {
    const t = stageAngles[i] * deg;
    return { ...s, x: CX + ROAD.a * Math.cos(t), y: CY + ROAD.b * Math.sin(t), ang: stageAngles[i] };
  });

  // 人物站位
  function ring(R, n, offset, skipNearStages) {
    const out = [];
    for (let i = 0; i < n; i++) {
      const angDeg = offset + (360 / n) * i;
      if (skipNearStages && stageAngles.some((s) => {
        let d = Math.abs(((angDeg - s) % 360 + 540) % 360 - 180); return d < 7;
      })) continue;
      // 上方標題與右上 QR 區域避開
      const t = angDeg * deg;
      const x = CX + R.a * Math.cos(t), y = CY + R.b * Math.sin(t);
      out.push({ x, y });
    }
    return out;
  }
  const slotsRaw = ring(RING_A, 50, 3, false).concat(ring(RING_B, 46, 0, true));
  // 打散順序，讓先報到的人平均分布在全島
  const n = slotsRaw.length; const step = 37;
  const used = new Set(); const ordered = [];
  for (let i = 0, k = 0; ordered.length < n; i++) {
    k = (i * step) % n;
    while (used.has(k)) k = (k + 1) % n;
    used.add(k); ordered.push(slotsRaw[k]);
  }
  function slotFor(i) {
    if (i < ordered.length) return ordered[i];
    // 超過時：在沙灘最外圈再排
    const extra = ring({ a: 730, b: 410 }, 60, 1.5, false);
    return extra[(i - ordered.length) % extra.length];
  }

  // 幼苗往上長：上方兩區的幼苗種在區塊下緣，下方兩區種在區塊下緣（角度鏡射）
  const G_SIGN_DOWN = (id) => SIGN[id][1] > 0;
  // 每區：標題、地標、幼苗位置
  const zones = {};
  C.scopes.forEach((s) => {
    const nItems = s.items.length;
    const lmT = nItems === 4 ? [12, 34, 56, 78] : [9, 27, 45, 63, 81];
    const landmarks = s.items.map((it, i) => ({ ...it, ...zonePt(s.id, 0.86, lmT[i]) }));
    const label = zonePt(s.id, 0.52, 46);
    const treeSlots = [
      [0.62, 22], [0.36, 34], [0.8, 20], [0.66, 46], [0.84, 42], [0.45, 62], [0.75, 66], [0.5, 82]
    ].map(([r, t]) => zonePt(s.id, r, G_SIGN_DOWN(s.id) ? 90 - t : t));
    zones[s.id] = { label, landmarks, treeSlots, center: zonePt(s.id, 0.55, 45) };
  });

  function pointOf(id) {
    if (id.startsWith("s")) return stages.find((s) => s.id === id);
    const sc = Number(id[0]);
    return zones[sc].landmarks.find((l) => l.id === id);
  }

  window.GEO = { CX, CY, ZONE, ROAD, ISLE, SIGN, zonePt, blob, stages, slotFor, zones, pointOf, totalSlots: ordered.length };
})();
