/* =========================================================
 * 360°深耕奇美・永續醫療 3D 世界：院區大樓、範疇展台、行動廣場、360° 照護環、晝夜
 * 院區建築為參考配置的原創風格化造型，不含任何標誌或照片
 * 依賴 three.min.js（r147）、OrbitControls.js、BufferGeometryUtils.js
 * ========================================================= */
(function () {
  const C = window.ISLAND_CONTENT;
  const V3 = THREE.Vector3, M4 = THREE.Matrix4;
  const R = 4.6, S = 7.6, TOP = 1.0;     // 展台半徑、（保留）、院區地面高度
  const SQ3 = Math.sqrt(3);

  // ---------- 基本幾何 ----------
  function prep(g) { let x = g.index ? g.toNonIndexed() : g; if (x.attributes.uv) x.deleteAttribute("uv"); if (x.attributes.uv2) x.deleteAttribute("uv2"); x.computeVertexNormals(); return x; }
  const roofShape = new THREE.Shape([new THREE.Vector2(-.5, 0), new THREE.Vector2(.5, 0), new THREE.Vector2(0, .5)]);
  const roofGeo = new THREE.ExtrudeGeometry(roofShape, { depth: 1, bevelEnabled: false }); roofGeo.translate(0, 0, -.5);
  const GEO = {
    box: prep(new THREE.BoxGeometry(1, 1, 1)),
    hex: prep(new THREE.CylinderGeometry(1, 1, 1, 6)),
    cyl: prep(new THREE.CylinderGeometry(1, 1, 1, 10)),
    cyl16: prep(new THREE.CylinderGeometry(1, 1, 1, 18)),
    taper: prep(new THREE.CylinderGeometry(.62, 1, 1, 12)),
    cone: prep(new THREE.ConeGeometry(1, 1, 8)),
    cone6: prep(new THREE.ConeGeometry(1, 1, 6)),
    ico: prep(new THREE.IcosahedronGeometry(1, 0)),
    ico1: prep(new THREE.IcosahedronGeometry(1, 1)),
    sph: prep(new THREE.SphereGeometry(1, 12, 9)),
    hemi: prep(new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2)),
    torus: prep(new THREE.TorusGeometry(1, .12, 6, 20)),
    roof: prep(roofGeo),
    ring: prep(new THREE.TorusGeometry(1, .5, 3, 32)),
    thinring: prep(new THREE.TorusGeometry(1, .16, 3, 40))
  };

  // ---------- 合併工具 ----------
  function mkList() { return []; }
  function colored(geo, hex, m) {
    const g = geo.clone(); g.applyMatrix4(m);
    const c = new THREE.Color(hex), n = g.attributes.position.count, a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; }
    g.setAttribute("color", new THREE.BufferAttribute(a, 3));
    return g;
  }
  const _q = new THREE.Quaternion(), _e = new THREE.Euler();
  function L(T, x, y, z, sx, sy, sz, ry = 0, rx = 0, rz = 0, order = "XYZ") {
    _e.set(rx, ry, rz, order); _q.setFromEuler(_e);
    return T.clone().multiply(new M4().compose(new V3(x, y, z), _q, new V3(sx, sy, sz)));
  }
  function merge(list) { return list.length ? THREE.BufferGeometryUtils.mergeBufferGeometries(list, false) : null; }

  // 三種材質清單：實體（受光）、窗戶（依晝夜換色）、發光（燈、標誌）
  let SOLID, WIN, GLOW;
  const put = (geo, col, m) => SOLID.push(colored(GEO[geo] || geo, col, m));
  const win = (geo, m) => WIN.push(colored(GEO[geo] || geo, "#ffffff", m));
  const glow = (geo, col, m) => GLOW.push(colored(GEO[geo] || geo, col, m));

  // ---------- 小道具 ----------
  const GREENS = ["#7DBE7A", "#8CCB83", "#6FB37A", "#A3D18A", "#5FA97A"];
  const Pr = {
    tree(T, x, z, s = 1, col) {
      col = col || GREENS[Math.abs(Math.floor(x * 7 + z * 13)) % GREENS.length];
      put("cyl", "#A27B57", L(T, x, .45 * s, z, .13 * s, .9 * s, .13 * s));
      put("sph", col, L(T, x, 1.3 * s, z, .7 * s, .7 * s, .7 * s));
      put("sph", col, L(T, x, 1.95 * s, z, .42 * s, .42 * s, .42 * s));
    },
    pine(T, x, z, s = 1) {
      put("cyl", "#9A7350", L(T, x, .3 * s, z, .1 * s, .6 * s, .1 * s));
      put("cone", "#5E9E6E", L(T, x, 1 * s, z, .6 * s, 1.1 * s, .6 * s));
      put("cone", "#6DB07A", L(T, x, 1.6 * s, z, .44 * s, .9 * s, .44 * s));
    },
    cypress(T, x, z, s = 1, y0 = 0) {
      put("cyl", "#8A6A4A", L(T, x, y0 + .25 * s, z, .1 * s, .5 * s, .1 * s));
      put("cone", "#4E8A5E", L(T, x, y0 + 1.6 * s, z, .55 * s, 2.6 * s, .55 * s));
      put("sph", "#4E8A5E", L(T, x, y0 + .55 * s, z, .5 * s, .4 * s, .5 * s));
    },
    topiary(T, x, z, s = 1, y0 = 0) {
      put("box", "#D9CDB5", L(T, x, y0 + .2 * s, z, .7 * s, .4 * s, .7 * s));
      put("cyl", "#8A6A4A", L(T, x, y0 + .65 * s, z, .07 * s, .6 * s, .07 * s));
      put("sph", "#5E9E6A", L(T, x, y0 + 1.25 * s, z, .55 * s, .55 * s, .55 * s));
      put("sph", "#6DAA74", L(T, x, y0 + 1.95 * s, z, .3 * s, .3 * s, .3 * s));
    },
    bush(T, x, z, s = 1, col = "#86C27F") { put("ico", col, L(T, x, .3 * s, z, .45 * s, .38 * s, .45 * s, x + z)); },
    flowers(T, x, z, w = 1.6, d = .8) {
      put("box", "#A9845E", L(T, x, .12, z, w, .24, d));
      put("box", "#7BB86F", L(T, x, .26, z, w * .92, .06, d * .85));
      const cols = ["#F4A7B9", "#FFD86B", "#F7F0E6", "#E98AA0", "#B9A4E3"];
      for (let i = 0; i < 6; i++) put("sph", cols[i % 5], L(T, x - w * .38 + (i % 3) * w * .38, .36, z + (i < 3 ? -d * .2 : d * .2), .11, .11, .11));
    },
    bench(T, x, z, ry = 0) {
      put("box", "#C8935B", L(T, x, .42, z, 1.3, .1, .45, ry));
      put("box", "#C8935B", L(T, x, .7, z, 1.3, .35, .08, ry, 0, 0));
      put("box", "#6B6F78", L(T, x, .2, z, 1.1, .4, .4, ry));
    },
    lamp(T, x, z) {
      put("cyl", "#5B6470", L(T, x, .9, z, .05, 1.8, .05));
      glow("sph", "#FFE7A3", L(T, x, 1.86, z, .16, .16, .16));
    },
    // 院區醫療大樓：白色量體、四面窗格、頂部範疇色帶
    tower(x, z, w, d, h, opts = {}) {
      const T = new M4().makeTranslation(x, TOP, z);
      const wall = opts.wall || "#F4F2EC";
      put("box", wall, L(T, 0, h / 2, 0, w, h, d));
      put("box", "#E4E0D6", L(T, 0, h + .2, 0, w + .2, .4, d + .2));
      put("box", "#DCD8CE", L(T, 0, .5, 0, w + .1, 1, d + .1));
      if (opts.accent) glow("box", opts.accent, L(T, 0, h - .35, 0, w + .06, .32, d + .06));
      const fh = opts.fh || 1.15, floors = Math.max(1, Math.floor((h - 1.6) / fh));
      const cw = opts.cw || 1.3;
      const faces = [[w, d / 2 + .03, 0], [w, -d / 2 - .03, Math.PI], [d, w / 2 + .03, Math.PI / 2], [d, -w / 2 - .03, -Math.PI / 2]];
      faces.forEach(([len, off, ry], fi) => {
        const cols = Math.max(1, Math.floor(len / cw));
        const F = L(T, 0, 0, 0, 1, 1, 1, ry).multiply(new M4().makeTranslation(0, 0, off));
        for (let f = 0; f < floors; f++) for (let c = 0; c < cols; c++) {
          const wx = -len / 2 + (c + .5) * (len / cols);
          win("box", L(F, wx, 1.6 + f * fh + fh * .45, 0, len / cols * .62, fh * .55, .04));
        }
        if (fi === 0 && opts.door) { put("box", "#7FA7B9", L(F, 0, .9, .05, Math.min(4, w * .3), 1.6, .1)); put("box", "#E9E6DF", L(F, 0, 1.95, .9, Math.min(5, w * .36), .2, 1.8)); }
      });
      // 頂樓設備
      put("box", "#E9E6DF", L(T, w * .2, h + .9, -d * .15, w * .22, 1.2, d * .3));
      put("box", "#D6D2C8", L(T, -w * .25, h + .6, d * .1, 1.2, .8, 1.2));
    },
    // 弧形大樓（橫向條帶立面）
    curved(cx, cz, rad, a0, a1, d, h, accent) {
      const N = 8;
      for (let i = 0; i < N; i++) {
        const u = a0 + (a1 - a0) * (i + .5) / N, seg = rad * Math.abs(a1 - a0) / N + .15;
        const x = cx + Math.sin(u) * rad, z = cz - Math.cos(u) * rad;
        const T = L(new M4().makeTranslation(x, TOP, z), 0, 0, 0, 1, 1, 1, -u);
        put("box", "#F2F0EA", L(T, 0, h / 2, 0, seg, h, d));
        put("box", "#E4E0D6", L(T, 0, h + .2, 0, seg + .1, .4, d + .2));
        for (let f = 0; f < 4; f++) win("box", L(T, 0, 1.3 + f * (h - 1.6) / 4, d / 2 + .03, seg, .5, .04));
        for (let f = 0; f < 4; f++) win("box", L(T, 0, 1.3 + f * (h - 1.6) / 4, -d / 2 - .03, seg, .5, .04));
        if (accent) glow("box", accent, L(T, 0, h - .35, 0, seg + .02, .3, d + .06));
      }
    },
    car2(x, z, ry, col) { const T = L(new M4().makeTranslation(x, 0, z), 0, 0, 0, 1, 1, 1, ry); put("box", col, L(T, 0, .55, 0, 1.6, .7, 3)); put("box", col, L(T, 0, 1.05, -.2, 1.5, .5, 1.6)); win("box", L(T, 0, 1.05, .62, 1.4, .4, .04)); },
    // 有窗戶的建築；cross: 頂上綠十字
    building(T, x, z, w, d, h, opts = {}) {
      const wall = opts.wall || "#F7F4EE", ry = opts.ry || 0;
      const m = L(T, x, 0, z, 1, 1, 1, ry);
      put("box", wall, L(m, 0, h / 2, 0, w, h, d));
      put("box", opts.trim || "#7FC4B8", L(m, 0, h + .08, 0, w + .14, .16, d + .14));
      if (opts.roof === "gable") put("roof", opts.roofCol || "#E58B6B", L(m, 0, h + .1, 0, w + .3, opts.roofH || 1.1, d + .3));
      const floors = Math.max(1, Math.floor(h / 1.1));
      const cols = Math.max(1, Math.floor(w / 1.1));
      for (let f = 0; f < floors; f++) for (let c = 0; c < cols; c++) {
        const wx = -w / 2 + (c + .5) * (w / cols), wy = .75 + f * (h - .4) / floors;
        win("box", L(m, wx, wy, d / 2 + .02, w / cols * .55, .5, .05));
        if (opts.back !== false) win("box", L(m, wx, wy, -d / 2 - .02, w / cols * .55, .5, .05));
      }
      if (opts.door !== false) put("box", "#7FC4B8", L(m, 0, .45, d / 2 + .03, .7, .9, .06));
      if (opts.cross) {
        const cy = h + .9;
        glow("box", "#3FBF7F", L(m, 0, cy, d / 2 - .2, .9, .28, .2));
        glow("box", "#3FBF7F", L(m, 0, cy, d / 2 - .2, .28, .9, .2));
        put("box", "#E9EEF0", L(m, 0, cy, d / 2 - .32, 1.1, 1.1, .1));
      }
    },
    house(T, x, z, ry = 0, wall = "#FBEFD9", roof = "#E58B6B", s = 1) {
      const m = L(T, x, 0, z, s, s, s, ry);
      put("box", wall, L(m, 0, .7, 0, 1.8, 1.4, 1.6));
      put("roof", roof, L(m, 0, 1.4, 0, 2.1, 1.1, 1.9));
      win("box", L(m, -.45, .8, .81, .45, .45, .04)); win("box", L(m, .45, .8, .81, .45, .45, .04));
      put("box", "#B98A5E", L(m, 0, .4, .82, .4, .8, .04));
    },
    car(T, x, z, ry, col = "#F2F2F2", stripe = "#E85A5A", siren = false) {
      const m = L(T, x, 0, z, 1, 1, 1, ry);
      put("box", col, L(m, 0, .55, 0, 1, .7, 2));
      put("box", col, L(m, 0, .95, .5, .95, .4, 1));
      put("box", stripe, L(m, 0, .55, 0, 1.02, .14, 2.02));
      win("box", L(m, 0, .95, -.02, .9, .3, .05));
      for (const [a, b] of [[-.5, .65], [.5, .65], [-.5, -.65], [.5, -.65]]) put("cyl", "#3A3F48", L(m, a, .22, b, .22, .14, .22, 0, 0, Math.PI / 2));
      if (siren) { glow("box", "#FF6B6B", L(m, -.2, 1.22, .5, .25, .12, .2)); glow("box", "#6BA8FF", L(m, .2, 1.22, .5, .25, .12, .2)); }
    },
    table(T, x, z, n = 4, col = "#F5F1E8") {
      put("cyl", col, L(T, x, .72, z, .75, .08, .75));
      put("cyl", "#7C838C", L(T, x, .36, z, .06, .72, .06));
      const ch = ["#F4A7B9", "#8FD6C2", "#FFD86B", "#9DB7E8", "#C9B6E4", "#F2B48A"];
      for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; put("box", ch[i % 6], L(T, x + Math.cos(a) * 1.15, .3, z + Math.sin(a) * 1.15, .42, .6, .42, -a)); }
    },
    umbrella(T, x, z, col = "#F28C7A") {
      put("cyl", "#EDEDED", L(T, x, 1.1, z, .05, 2.2, .05));
      put("cone", col, L(T, x, 2.2, z, 1.3, .5, 1.3));
    },
    crate(T, x, z, s = .6, col = "#D7B07A") { put("box", col, L(T, x, s / 2, z, s, s, s, x)); },
    rack(T, x, z, ry = 0) {
      const m = L(T, x, 0, z, 1, 1, 1, ry);
      put("box", "#4C5666", L(m, 0, .9, 0, .7, 1.8, .7));
      for (let i = 0; i < 5; i++) glow("box", i % 2 ? "#5FE0C8" : "#7FB2FF", L(m, 0, .35 + i * .3, .36, .5, .06, .02));
    },
    robot(T, x, z, ry = 0, col = "#9FD6E8") {
      const m = L(T, x, 0, z, 1, 1, 1, ry);
      put("box", "#FFFFFF", L(m, 0, .45, 0, .8, .6, 1));
      put("box", col, L(m, 0, .8, -.2, .7, .12, .5));
      put("cyl", "#3A3F48", L(m, -.42, .15, .3, .15, .1, .15, 0, 0, Math.PI / 2)); put("cyl", "#3A3F48", L(m, .42, .15, .3, .15, .1, .15, 0, 0, Math.PI / 2));
      put("cyl", "#3A3F48", L(m, -.42, .15, -.3, .15, .1, .15, 0, 0, Math.PI / 2)); put("cyl", "#3A3F48", L(m, .42, .15, -.3, .15, .1, .15, 0, 0, Math.PI / 2));
      put("cyl", "#DDE3EA", L(m, 0, 1.05, .3, .05, .5, .05));
      glow("sph", "#5FE0C8", L(m, 0, 1.35, .3, .16, .16, .16));
    },
    desk(T, x, z, ry = 0) {
      const m = L(T, x, 0, z, 1, 1, 1, ry);
      put("box", "#EFE6D6", L(m, 0, .62, 0, 1.1, .08, .6));
      put("box", "#8A8F96", L(m, -.45, .3, 0, .06, .6, .5)); put("box", "#8A8F96", L(m, .45, .3, 0, .06, .6, .5));
      put("box", "#3E4752", L(m, 0, .95, -.12, .6, .4, .04));
      glow("box", "#8FD8FF", L(m, 0, .96, -.095, .52, .32, .02));
      put("box", "#7FB2E5", L(m, 0, .3, .55, .4, .6, .4));
    },
    flag(T, x, z, col) {
      put("cyl", "#E6E6E6", L(T, x, 1.3, z, .04, 2.6, .04));
      put("box", col, L(T, x + .45, 2.3, z, .9, .55, .04));
    },
    solar(T, x, z, ry = 0) {
      const m = L(T, x, 0, z, 1, 1, 1, ry);
      put("box", "#9AA3AD", L(m, 0, .35, 0, .12, .7, .12));
      put("box", "#2F4F8F", L(m, 0, .75, 0, 1.6, .06, 1.1, 0, -.45));
      put("box", "#DDE6F2", L(m, 0, .78, 0, .04, .065, 1.1, 0, -.45));
    },
    bed(T, x, z, ry = 0) { const m = L(T, x, 0, z, 1, 1, 1, ry); put("box", "#FFFFFF", L(m, 0, .45, 0, .9, .25, 1.8)); put("box", "#9AD0C2", L(m, 0, .6, .2, .92, .06, 1.2)); put("box", "#BFC6CF", L(m, 0, .2, 0, .8, .4, 1.6)); },
    heart(T, x, z, s = 1, col = "#F27A8C") {
      put("sph", col, L(T, x - .32 * s, 1.1 * s, z, .42 * s, .42 * s, .3 * s));
      put("sph", col, L(T, x + .32 * s, 1.1 * s, z, .42 * s, .42 * s, .3 * s));
      put("cone", col, L(T, x, .6 * s, z, .6 * s, .9 * s, .3 * s, 0, Math.PI));
      put("box", "#D9D2C5", L(T, x, .15, z, .8, .3, .5));
    },
    stone(T, x, z, s = .4) { put("ico", "#C9C2B6", L(T, x, s * .5, z, s, s * .7, s, x)); }
  };

  // ---------- 地塊主題 ----------
  const THEMES = {
    hub(T) { // 永續廣場：圓形噴泉、長椅、願景銘環
      put("cyl16", "#EFE9DD", L(T, 0, .03, 0, 6.2, .06, 6.2));
      put("thinring", "#D8B65E", L(T, 0, .08, 0, 5.6, 5.6, .5, 0, Math.PI / 2));
      put("cyl16", "#E6DFD0", L(T, 0, .25, 0, 2.6, .5, 2.6));
      put("cyl", "#F4F1EA", L(T, 0, .9, 0, .3, 1.3, .3));
      put("cyl16", "#E6DFD0", L(T, 0, 1.55, 0, 1, .14, 1));
      glow("sph", "#CFEFFF", L(T, 0, 1.9, 0, .35, .5, .35));
      for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + .5; Pr.bench(T, Math.cos(a) * 4.3, Math.sin(a) * 4.3, -a + Math.PI / 2); }
      for (const [x, z] of [[-5.4, -3], [5.4, -3], [-5.4, 3], [5.4, 3]]) Pr.lamp(T, x, z);
    },
    "1a"(T) { // 療癒花園：休憩、涼亭、小池
      put("cyl16", "#8FCBE0", L(T, -1.2, .04, -.6, 1.6, .08, 1.2));
      for (const [x, z] of [[1.2, -1.2], [2.6, -1.2], [1.2, .4], [2.6, .4]]) put("box", "#C8935B", L(T, x, .8, z, .14, 1.6, .14));
      for (let i = 0; i < 6; i++) put("box", "#E8C08A", L(T, 1.9, 1.64, -1.4 + i * .36, 1.8, .08, .14));
      Pr.bench(T, 1.9, -.4, 0);
      Pr.flowers(T, -1.4, 1.4); Pr.flowers(T, .2, 2.2, 1.2, .7);
      Pr.umbrella(T, -2.6, 1.6, "#F4A7B9"); Pr.table(T, -2.6, 1.6, 3);
      Pr.tree(T, -3.5, -2.2, 1.1); Pr.tree(T, 3.6, 2.4, 1); Pr.tree(T, -.2, -3.6, .9, "#F4B6C2"); Pr.tree(T, 4.4, -2, .8, "#F4B6C2");
      Pr.bush(T, -2.8, -1); Pr.bush(T, .2, -2.2); Pr.stone(T, -.5, -.1); Pr.stone(T, -2, -.2, .3);
    },
    "1b"(T) { // 院內資源：物流倉儲
      Pr.building(T, -1.2, -1.4, 3.6, 2.4, 2, { wall: "#F2EBDD", roof: "gable", roofCol: "#7FA7C9", cross: false, back: false });
      for (let i = 0; i < 3; i++) for (let j = 0; j <= (i % 2); j++) Pr.crate(T, 1.8 + i * .7, 1.2 + j * .0, .6, ["#D7B07A", "#C99A62", "#E3C08E"][i]);
      for (let i = 0; i < 2; i++) { put("box", "#8A8F96", L(T, 2.6, .9, -1.6 + i * 1.2, 1.4, 1.8, .4)); for (let k = 0; k < 3; k++) put("box", ["#9AD0C2", "#F4A7B9", "#FFD86B"][k], L(T, 2.6, .5 + k * .55, -1.4 + i * 1.2, 1.2, .3, .2)); }
      Pr.car(T, -1.6, 2.2, Math.PI / 2, "#FFFFFF", "#3FA67F");
      Pr.tree(T, -4, 1.4, .9); Pr.tree(T, 3.8, 2.8, .8); Pr.bush(T, .2, 3.2);
    },
    "1c"(T) { // 科技減負：機器人推車
      put("thinring", "#DCE6EE", L(T, 0, .06, 0, 2.6, 2.6, .3, 0, Math.PI / 2));
      Pr.robot(T, 2.6, 0, 0); Pr.robot(T, -1.8, 1.9, 2.2, "#F4A7B9"); Pr.robot(T, -1.4, -2.2, 4, "#FFD86B");
      Pr.building(T, 0, 0, 2, 2, 1.6, { wall: "#EAF4F8", cross: false });
      glow("box", "#5FE0C8", L(T, 0, 2, 0, .8, .2, .8));
      Pr.tree(T, 4, -2.4, .9); Pr.tree(T, -4.2, .2, .9); Pr.bush(T, 3.2, 3);
    },
    "1d"(T) { // 留任：宿舍與托育
      Pr.house(T, -2.2, -1.6, .3, "#FBEFD9", "#E58B6B"); Pr.house(T, .4, -2.6, -.2, "#EAF4F8", "#7FA7C9");
      // 溜滑梯
      put("box", "#FFD86B", L(T, 2.2, .7, .8, .8, 1.4, .8));
      put("box", "#6BB6E8", L(T, 2.2, .55, 1.9, .5, .08, 1.8, 0, .55));
      put("box", "#F28C7A", L(T, 3.4, 1.2, -.6, .1, 2.4, .1)); put("box", "#F28C7A", L(T, 4.6, 1.2, -.6, .1, 2.4, .1)); put("box", "#F28C7A", L(T, 4, 2.4, -.6, 1.3, .1, .1));
      put("box", "#8FD6C2", L(T, 3.8, .6, -.6, .4, .06, .2)); put("box", "#C9B6E4", L(T, 4.25, .6, -.6, .4, .06, .2));
      put("cyl16", "#F2D8A8", L(T, -.8, .04, 1.8, 1.6, .08, 1.6));
      Pr.tree(T, -4, 1.2, 1); Pr.tree(T, 3.6, -3, .8); Pr.bush(T, -2.4, 3);
    },
    "2a"(T) { // 持續教育：講堂
      Pr.building(T, 0, -2, 4.6, 2.2, 2.2, { wall: "#F5F1E8", trim: "#7FA7C9" });
      glow("box", "#CFE6F5", L(T, 0, 1, -.88, 3, 1.2, .04));
      for (let r = 0; r < 3; r++) for (let c = -2; c <= 2; c++) put("box", ["#9DB7E8", "#8FD6C2", "#FFD86B"][r], L(T, c * .8, .3, 1 + r * .9, .5, .6, .5));
      put("box", "#C8935B", L(T, 0, .5, -.3, 1, 1, .5));
      Pr.tree(T, -4.2, 1, 1); Pr.tree(T, 4.2, 1.4, .9); Pr.lamp(T, -2.8, .3); Pr.lamp(T, 2.8, .3);
    },
    "2b"(T) { // 跨領域合作：圓桌
      Pr.table(T, -1.8, -1.2, 5); Pr.table(T, 1.8, -1.2, 5); Pr.table(T, 0, 1.8, 6);
      Pr.umbrella(T, 0, 1.8, "#8FD6C2");
      put("box", "#FFFFFF", L(T, 0, 1.1, -3.2, 2.4, 1.4, .08)); put("box", "#9AA3AD", L(T, -1.1, .5, -3.2, .08, 1, .08)); put("box", "#9AA3AD", L(T, 1.1, .5, -3.2, .08, 1, .08));
      for (let i = 0; i < 3; i++) put("box", ["#F4A7B9", "#FFD86B", "#9DB7E8"][i], L(T, -.6 + i * .6, 1.2, -3.15, .45, .45, .02));
      Pr.tree(T, -4, 1.6, 1); Pr.tree(T, 4, 2, .9); Pr.bush(T, 3.8, -2.4);
    },
    "2c"(T) { // 數位工具：數位教室
      for (const [x, z] of [[-2.6, -2], [2.6, -2], [-2.6, 2], [2.6, 2]]) put("box", "#C8D2DC", L(T, x, 1.2, z, .14, 2.4, .14));
      put("box", "#EAF4F8", L(T, 0, 2.45, 0, 5.8, .16, 4.6));
      put("box", "#7FC4B8", L(T, 0, 2.6, 0, 6, .1, 4.8));
      for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) Pr.desk(T, -1.6 + c * 1.6, -.8 + r * 1.8, 0);
      Pr.tree(T, -4.4, -.4, .9); Pr.tree(T, 4.4, .4, .9);
    },
    "2d"(T) { // 職涯路徑：階梯與路標
      for (let i = 0; i < 5; i++) put("box", ["#F2D8A8", "#FFD86B", "#F4A7B9", "#9DB7E8", "#8FD6C2"][i], L(T, -2 + i * .9, .25 + i * .3, -.6, .9, .5 + i * .6, 1.6));
      put("cyl", "#FFD86B", L(T, 1.6, 3.2, -.6, .3, .5, .3)); put("cyl", "#FFD86B", L(T, 1.6, 2.85, -.6, .15, .3, .15));
      for (let i = 0; i < 6; i++) put("cyl", "#E9DCC6", L(T, -3 + i * 1.1, .05, 2 + Math.sin(i) * .4, .4, .1, .4));
      put("box", "#B98A5E", L(T, 3.4, .9, 1.8, .1, 1.8, .1));
      put("box", "#8FD6C2", L(T, 3.75, 1.5, 1.8, .7, .25, .06)); put("box", "#F4A7B9", L(T, 3.05, 1.15, 1.8, .7, .25, .06, .3));
      Pr.tree(T, -4.2, -2.6, .9); Pr.tree(T, 4, -2.6, .9); Pr.bush(T, -3.6, 1);
    },
    "3a"(T) { // AI 協助臨床：AI 中心
      put("cyl16", "#E7EEF3", L(T, 0, .1, 0, 2.6, .2, 2.6));
      glow("sph", "#9FE8FF", L(T, 0, 1.4, 0, .7, .7, .7));
      put("hemi", "#BFE6F2", L(T, 0, .2, 0, 2.4, 2.3, 2.4));
      put("cyl", "#C8D2DC", L(T, 2.7, 1.6, -1.8, .06, 3.2, .06)); glow("sph", "#FF8F8F", L(T, 2.7, 3.25, -1.8, .14, .14, .14));
      Pr.rack(T, -3, -1.6, .3); Pr.rack(T, -3.6, -.4, .3);
      Pr.tree(T, 3.6, 2, .9); Pr.tree(T, -3.2, 2.6, .9); Pr.bush(T, 1.2, 3.6);
    },
    "3b"(T) { // 國際接軌：地球儀與旗幟
      put("cyl16", "#D9D2C5", L(T, 0, .3, 0, 1, .6, 1));
      put("ico1", "#7FB2E5", L(T, 0, 2, 0, 1.3, 1.3, 1.3));
      put("ico", "#8CCB83", L(T, .5, 2.4, .7, .6, .45, .4)); put("ico", "#8CCB83", L(T, -.7, 1.6, .6, .5, .5, .4));
      put("torus", "#FFD86B", L(T, 0, 2, 0, 1.75, 1.75, 1.75, 0, 1.2, .3));
      const fc = ["#E85A5A", "#5A8DE8", "#3FBF7F", "#FFD86B", "#B57BE8"];
      for (let i = 0; i < 5; i++) Pr.flag(T, -3 + i * 1.5, -3, fc[i]);
      // 無人機停機坪
      put("cyl16", "#E9EEF0", L(T, 3, .06, 2, 1.2, .1, 1.2)); put("box", "#3FA67F", L(T, 3, .13, 2, .9, .02, .2)); put("box", "#3FA67F", L(T, 3, .13, 2, .2, .02, .9));
      Pr.tree(T, -3.6, 2, 1); Pr.bush(T, -1.2, 3.2);
    },
    "3c"(T) { // 數據共享安全：資料中心與盾牌
      Pr.building(T, -1.4, -1.4, 3.2, 2.4, 1.8, { wall: "#EEF1F5", trim: "#7F9BC9" });
      for (let i = 0; i < 4; i++) Pr.rack(T, 1.6 + (i % 2) * .9, -1.6 + Math.floor(i / 2) * 1.1);
      put("box", "#5F8FD6", L(T, 1.6, 1.5, 2, 1.4, 1.6, .25)); put("cone", "#5F8FD6", L(T, 1.6, .5, 2, .99, .7, .25, Math.PI / 4, Math.PI));
      glow("box", "#FFFFFF", L(T, 1.6, 1.6, 2.14, .25, .7, .02)); glow("box", "#FFFFFF", L(T, 1.6, 1.75, 2.14, .6, .22, .02));
      Pr.tree(T, -3.8, 1.8, .9); Pr.tree(T, 4.2, -.6, .8); Pr.bush(T, -1.4, 2.6);
    },
    "3d"(T) { // 智慧醫院
      Pr.building(T, -.8, -1.2, 3, 2.6, 5.2, { wall: "#FFFFFF", trim: "#7FC4B8", cross: true });
      Pr.building(T, 2.2, -.8, 2.2, 2.2, 2.2, { wall: "#F2F6F7", trim: "#7FC4B8" });
      put("cyl16", "#C9D3D8", L(T, -.8, 5.35, -1.2, 1.1, .12, 1.1));
      Pr.car(T, 2, 2.4, -Math.PI / 2, "#FFFFFF", "#E85A5A", true);
      Pr.tree(T, -3.8, 1.6, 1); Pr.tree(T, -2.2, 3, .8); Pr.lamp(T, .6, 2.2);
    },
    "4a"(T) { // 分級整合照護：診所串連
      for (const [x, z, r] of [[-2.4, -1.8, .2], [2.2, -2, -.3], [0, 1.4, 0]]) {
        Pr.house(T, x, z, r, "#FFFFFF", "#7FC4B8", .95);
        glow("box", "#3FBF7F", L(T, x, 2.3, z, .5, .16, .16)); glow("box", "#3FBF7F", L(T, x, 2.3, z, .16, .5, .16));
      }
      for (let i = 0; i < 8; i++) put("cyl", "#F3E6CB", L(T, -2 + i * .6, .04, -.2 + Math.sin(i * .8) * .4, .3, .08, .3));
      Pr.car(T, 3.4, 1.8, .4, "#FFFFFF", "#E85A5A", true);
      Pr.tree(T, -4, 1.4, .9); Pr.tree(T, 4.2, -.4, .8);
    },
    "4b"(T) { // 可及與公平：巡迴醫療車、無障礙坡道
      Pr.car(T, -1.6, -.6, .5, "#FFFFFF", "#7FA7C9", false);
      Pr.car(T, .6, -1.6, .5, "#FFFFFF", "#3FA67F", false);
      put("box", "#9AA3AD", L(T, 2.6, 1.1, 1.2, .08, 2.2, .08)); put("box", "#9AA3AD", L(T, 4, 1.1, 1.2, .08, 2.2, .08));
      put("box", "#8FD6C2", L(T, 3.3, 2.25, 1.2, 1.8, .1, 1.1)); Pr.bench(T, 3.3, 1.3, 0);
      put("box", "#E9DCC6", L(T, -1.4, .3, 2.4, 2.4, .6, 1.2)); put("box", "#E9DCC6", L(T, .4, .15, 2.4, 1.4, .3, 1.2, 0, 0, -.2));
      put("box", "#C9C2B6", L(T, -1.4, .85, 1.85, 2.4, .08, .06));
      Pr.tree(T, -4, -2, 1); Pr.tree(T, 3.8, -2.6, .9);
    },
    "4c"(T) { // 健康生活：跑道與公園
      put("ring", "#E98B6E", L(T, 0, .06, 0, 3, 2.1, .12, 0, Math.PI / 2));
      put("cyl16", "#8FCB7F", L(T, 0, .05, 0, 2.5, .06, 1.6));
      put("box", "#FFFFFF", L(T, 0, .09, 0, .06, .02, 3));
      put("box", "#FFFFFF", L(T, 0, 1, -1.2, .08, 2, .08)); put("box", "#FFFFFF", L(T, 0, 1.6, -.6, .08, .08, 1.2));
      Pr.tree(T, -4.2, -1.6, 1); Pr.tree(T, 4.2, 1.6, 1); Pr.tree(T, -3.6, 2.6, .8); Pr.tree(T, 3.8, -2.6, .8);
      Pr.bench(T, 0, 3.4, 0);
    },
    "4d"(T) { // 綠色醫院：太陽能、風車
      for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) Pr.solar(T, -2.6 + c * 1.8, -2.2 + r * 1.6, 0);
      put("cyl", "#9FCBE0", L(T, 2.8, .9, 2, .7, 1.8, .7)); put("cone", "#7FB2C9", L(T, 2.8, 2, 2, .75, .4, .75));
      Pr.tree(T, -3.8, 2.2, 1); Pr.tree(T, -.8, 3, .8); Pr.bush(T, 1, 1.6);
    },
    "4e"(T) { // ESG：社區菜園、回收、溫室
      for (let i = 0; i < 3; i++) { put("box", "#A9845E", L(T, -2.4 + i * 1.5, .15, 1.6, 1.1, .3, 2.2)); for (let k = 0; k < 4; k++) put("ico", "#6FB37A", L(T, -2.4 + i * 1.5, .45, .9 + k * .5, .22, .2, .22, k)); }
      put("box", "#E3F4EE", L(T, 1.2, .9, -1.8, 2.6, 1.8, 1.8)); put("roof", "#CFEDE2", L(T, 1.2, 1.8, -1.8, 2.8, 1, 2));
      for (const [i, c] of [["#5A8DE8", 0], ["#3FBF7F", 1], ["#FFD86B", 2]].map((x, j) => [j, x[0]])) put("cyl", c, L(T, 3.4 + i * .6, .4, 1.2, .25, .8, .25));
      Pr.tree(T, -4, -1.8, 1); Pr.tree(T, -1.8, -3.4, .8);
    },
    port(T) { // 迎賓庭園：花圃與小噴泉
      put("cyl16", "#EFE8DA", L(T, 0, .03, 0, 4.4, .06, 4.4));
      for (let k = 0; k < 4; k++) { const b = k / 4 * Math.PI * 2 + .78; put("box", "#6FA466", L(T, Math.cos(b) * 2.6, .25, Math.sin(b) * 2.6, 1.8, .5, 1.1, -b)); put("box", "#F4A7B9", L(T, Math.cos(b) * 2.6, .52, Math.sin(b) * 2.6, 1.4, .08, .7, -b)); }
      put("cyl16", "#8FC8E0", L(T, 0, .2, 0, 1, .3, 1)); glow("sph", "#CFEFFF", L(T, 0, .7, 0, .2, .35, .2));
      Pr.cypress(T, -4.6, -1.6, .9); Pr.cypress(T, 4.6, 1.6, .9); Pr.bench(T, 0, 3.9, 0);
    }
  };

  // 照護八站小島
  const STAGE_SCENES = [
    (T) => { Pr.tree(T, -1, -.6, .8, "#E86B6B"); Pr.tree(T, .9, -.9, .7); Pr.bench(T, 0, 1, 0); },                // 生活型態醫學
    (T) => { Pr.car(T, 0, .2, .6, "#FFFFFF", "#E85A5A", true); Pr.bush(T, -1.5, -1); },                            // 急性
    (T) => { Pr.house(T, 0, -.4, 0, "#FFFFFF", "#7FC4B8", .9); glow("box", "#3FBF7F", L(T, 0, 2.2, -.4, .45, .14, .14)); glow("box", "#3FBF7F", L(T, 0, 2.2, -.4, .14, .45, .14)); }, // 慢性
    (T) => { put("box", "#C8D2DC", L(T, -.8, .6, 0, .08, 1.2, 1.6)); put("box", "#C8D2DC", L(T, .8, .6, 0, .08, 1.2, 1.6)); put("box", "#FFFFFF", L(T, -.8, 1.2, 0, .1, .1, 1.8)); put("box", "#FFFFFF", L(T, .8, 1.2, 0, .1, .1, 1.8)); put("sph", "#8FD6C2", L(T, 1.6, .5, 1, .5, .5, .5)); }, // 復健
    (T) => { Pr.house(T, 0, -.3, .3, "#FBEFD9", "#E58B6B"); Pr.flowers(T, 0, 1.4, 1.2, .6); },                     // 居家
    (T) => { for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; put("box", "#C8935B", L(T, Math.cos(a) * 1.2, .7, Math.sin(a) * 1.2, .1, 1.4, .1)); } put("cone6", "#E58B6B", L(T, 0, 1.75, 0, 1.6, .8, 1.6)); Pr.table(T, 0, 0, 0); }, // 社區
    (T) => { Pr.building(T, 0, -.3, 2.4, 1.6, 1.4, { wall: "#FFF7EC", trim: "#F2B48A" }); Pr.tree(T, 1.6, 1.2, .6); },  // 長照
    (T) => { Pr.heart(T, 0, -.2, 1.1); Pr.flowers(T, 0, 1.4, 1.4, .6); }                                          // 安寧
  ];

  // ---------- 佈局 ----------
  function axialRing(k) {
    if (k === 0) return [[0, 0]];
    const dirs = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
    const out = []; let q = -k, r = k; // 從方向 4 開始
    for (let d = 0; d < 6; d++) for (let i = 0; i < k; i++) { out.push([q, r]); q += dirs[d][0]; r += dirs[d][1]; }
    return out;
  }
  const toXZ = (q, r) => ({ x: S * SQ3 * (q + r / 2), z: S * 1.5 * r });

  // 院區配置（單位約為公尺的 1/2；參考院區相對位置的風格化配置）
  const BUILDINGS = [
    { id: "b2", name: "第二醫療大樓", x: 0, z: -26, w: 28, d: 12, h: 17, scope: 0, accent: "#D8B65E", hub: true },
    { id: "b1", name: "第一醫療大樓", x: -30, z: -27, w: 13, d: 10, h: 13, scope: 1 },
    { id: "edu", name: "教學大樓", x: -56, z: -18, w: 9, d: 8, h: 6, scope: 2 },
    { id: "lab", name: "研究大樓", x: 24, z: -19, w: 13, d: 9, h: 5, scope: 3 },
    { id: "b5", name: "第五醫療大樓", x: 58, z: -24, w: 16, d: 12, h: 10, scope: 4 },
    { id: "b3", name: "第三醫療大樓", x: -38, z: 37, curved: true, scope: 4 }
  ];
  const STATIONS = {
    "1a": [-40, -8], "1b": [-28, -8], "1c": [-40, 4], "1d": [-28, 4],
    "2a": [-62, -4], "2b": [-52, -4], "2c": [-62, 8], "2d": [-52, 8],
    "3a": [14, 0], "3b": [26, 0], "3c": [14, 12], "3d": [26, 12],
    "4a": [-52, 21], "4b": [-38, 21], "4c": [-24, 21], "4d": [46, -2], "4e": [58, -2]
  };
  const PLAZAS = [
    { name: "AI智慧光廊", x: -6, z: 14, w: 16, d: 10, info: true },
    { name: "社會情緒學習廣場", key: "B", flower: true, x: 22, z: 31, w: 26, d: 12 },
    { name: "復原力廣場", key: "C", flower: true, x: 52, z: 20, w: 20, d: 14 }
  ];
  const CAMPUS = { x0: -72, x1: 72, z0: -40, z1: 46 };
  const RIVER = { z: 101, d: 22, docks: [{ key: "accountDock", x: 0 }] };
  const ROADS = [
    { name: "中華路", x: -80, z: 3, w: 9, d: 220, vertical: true },
    { name: "連續照護大道", x: 0, z: 54, w: 220, d: 9, care: true },
    { name: "大武街", x: 80, z: 3, w: 8, d: 220, vertical: true }
  ];
  function layout() {
    const tiles = [{ id: "hub", kind: "hub", x: 0, z: -7 }];
    C.scopes.forEach((sc) => sc.items.forEach((it) => {
      const p = STATIONS[it.id] || [0, 0];
      tiles.push({ id: it.id, kind: "item", scope: sc.id, item: it, x: p[0], z: p[1] });
    }));
    return tiles;
  }

  // ---------- 世界 ----------
  const W = {
    R, TOP, tiles: [], tileById: {}, stages: [], scopeCenter: {},
    scene: null, camera: null, renderer: null, controls: null, mats: {}
  };

  W.init = function (container) {
    const scene = new THREE.Scene();
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: !!W.capture });
    W.phone = /[?&]me=/.test(location.search) || Math.min(screen.width, screen.height) < 600;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, W.phone ? 1.25 : 1.5));
    renderer.shadowMap.enabled = !W.phone; renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.shadowMap.autoUpdate = false; renderer.shadowMap.needsUpdate = true;
    container.appendChild(renderer.domElement);
    const camera = new THREE.PerspectiveCamera(30, 1, 1, 1600);
    camera.position.set(0, 120, 128);
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0, 4);
    controls.enableDamping = true; controls.dampingFactor = .08;
    controls.minDistance = 20; controls.maxDistance = 420;
    controls.maxPolarAngle = 1.25; controls.minPolarAngle = .15;
    controls.screenSpacePanning = false;
    Object.assign(W, { scene, renderer, camera, controls });

    // 光
    W.hemi = new THREE.HemisphereLight(0xffffff, 0x8fbfb8, .75); scene.add(W.hemi);
    W.sun = new THREE.DirectionalLight(0xffffff, .85);
    W.sun.position.set(-60, 110, 50); W.sun.castShadow = true;
    W.sun.shadow.mapSize.set(2048, 2048);
    Object.assign(W.sun.shadow.camera, { left: -135, right: 135, top: 110, bottom: -110, near: 10, far: 420 });
    W.sun.shadow.bias = -0.0006; W.sun.shadow.normalBias = .04;
    scene.add(W.sun);
    W.ambient = new THREE.AmbientLight(0xffffff, .15); scene.add(W.ambient);

    // 材質
    W.mats.solid = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .9, metalness: 0, flatShading: true });
    W.mats.win = new THREE.MeshBasicMaterial({ vertexColors: true, color: 0xBFE3F5 });
    W.mats.glow = new THREE.MeshBasicMaterial({ vertexColors: true });

    // 草地（院區外）
    W.sea = new THREE.Mesh(new THREE.CircleGeometry(800, 64), new THREE.MeshStandardMaterial({ color: 0x9CC98A, roughness: .95 }));
    W.sea.rotation.x = -Math.PI / 2; W.sea.receiveShadow = true; scene.add(W.sea);
    scene.fog = new THREE.Fog(0xd8ecea, 360, 820);

    W.tiles = layout();
    SOLID = mkList(); WIN = mkList(); GLOW = mkList();
    const P = (x, z) => new M4().makeTranslation(x, 0, z);

    // 院區地坪
    const cw = CAMPUS.x1 - CAMPUS.x0, cd = CAMPUS.z1 - CAMPUS.z0, ccx = (CAMPUS.x0 + CAMPUS.x1) / 2, ccz = (CAMPUS.z0 + CAMPUS.z1) / 2;
    put("box", "#D8D2C4", L(P(ccx, ccz), 0, TOP / 2 - .05, 0, cw + 1.2, TOP - .1, cd + 1.2));
    put("box", "#EEEAE1", L(P(ccx, ccz), 0, TOP - .05, 0, cw, .1, cd));
    // 院內車道
    for (const [x, z, w, d] of [[0, -12.5, cw - 4, 4], [-66, 3, 4, cd - 4], [66, 3, 4, cd - 4], [6, 3, 4, 26], [0, 41, cw - 4, 4]]) {
      put("box", "#C9C6BF", L(P(x, z), 0, TOP + .02, 0, w, .04, d));
    }
    for (let i = -16; i <= 16; i++) put("box", "#FFFFFF", L(P(i * 4.2, -12.5), 0, TOP + .05, 0, 1.6, .02, .16));

    // 大樓
    BUILDINGS.forEach((bd) => {
      const sc = bd.scope ? C.scopes[bd.scope - 1] : null;
      const accent = bd.accent || (sc && sc.color);
      if (bd.curved) { Pr.curved(bd.x, bd.z + 30, 30, -.55, .55, 10, 7, accent); bd.lx = bd.x; bd.lz = bd.z + 3; bd.ly = 9.5; return; }
      Pr.tower(bd.x, bd.z, bd.w, bd.d, bd.h, { accent, door: true });
      bd.lx = bd.x; bd.lz = bd.z + bd.d / 2; bd.ly = bd.h + 1.6;
    });
    // 第二醫療大樓：兩側樓梯塔、前方低層裙樓與入口雨遮
    Pr.tower(-15.5, -27, 3.5, 6, 19, { cw: 1.6 }); Pr.tower(15.5, -27, 3.5, 6, 19, { cw: 1.6 });
    Pr.tower(0, -17.5, 30, 5, 3.2, { door: true, cw: 1.8 });
    Pr.tower(-21.5, -28, 4.5, 7, 16, { wall: "#EFEDE7" });           // 一、二大樓之間的連接塔
        Pr.tower(13, -10.5, 9, 5, 3, {});                                   // 研究大樓旁低樓
    put("box", "#E9E6DF", L(P(-56, -18), 0, TOP + 6.9, 0, 3, 1.8, 3)); // 教學大樓屋突
    // 研究大樓階梯量體
    Pr.tower(24, -21, 10, 5, 7.5, { accent: C.scopes[2].color });
    // 綠十字（醫療意象，非標誌）
    for (const [x, z, y] of [[0, -19.9, 15.5], [58, -17.9, 8.5]]) {
      glow("box", "#3FBF7F", L(P(x, z), 0, TOP + y, 0, 2, .6, .2)); glow("box", "#3FBF7F", L(P(x, z), 0, TOP + y, 0, .6, 2, .2));
    }

    // 範疇展台
    W.tiles.forEach((t) => {
      W.tileById[t.id] = t;
      const T = P(t.x, t.z);
      if (t.kind === "hub") { THEMES.hub(L(T, 0, TOP, 0, 1, 1, 1)); return; }
      const sc = C.scopes[t.scope - 1];
      put("cyl16", sc.color, L(T, 0, TOP + .02, 0, R + .25, .08, R + .25));
      put("cyl16", "#" + new THREE.Color(sc.soft).lerp(new THREE.Color("#FFFFFF"), .35).getHexString(), L(T, 0, TOP + .06, 0, R, .08, R));
      const fn = THEMES[t.id];
      if (fn) fn(L(T, 0, TOP + .08, 0, .72, .72, .72));
    });
    // 範疇中心點
    C.scopes.forEach((sc) => {
      const ts = W.tiles.filter((t) => t.scope === sc.id);
      W.scopeCenter[sc.id] = new V3(ts.reduce((a, t) => a + t.x, 0) / ts.length, TOP, ts.reduce((a, t) => a + t.z, 0) / ts.length);
    });
    // 行動廣場（幼苗種植區）
    PLAZAS.forEach((pz) => {
      put("box", pz.info ? "#DCE3EC" : "#B9D9A2", L(P(pz.x, pz.z), 0, TOP + .03, 0, pz.w, .06, pz.d));
      put("box", "#E5E0D3", L(P(pz.x, pz.z - pz.d / 2), 0, TOP + .1, 0, pz.w + .6, .2, .6));
      put("box", "#E5E0D3", L(P(pz.x, pz.z + pz.d / 2), 0, TOP + .1, 0, pz.w + .6, .2, .6));
      put("box", "#E5E0D3", L(P(pz.x - pz.w / 2, pz.z), 0, TOP + .1, 0, .6, .2, pz.d + .6));
      put("box", "#E5E0D3", L(P(pz.x + pz.w / 2, pz.z), 0, TOP + .1, 0, .6, .2, pz.d + .6));
    });
    // AI智慧光廊：科技鋪面（不是草皮）＋一列發光拱門串成的走廊
    PLAZAS.filter((pz) => pz.info).forEach((pz) => {
      const T = P(pz.x, pz.z);
      // 鋪面：淺灰藍石板＋發光導引線
      for (let i = 1; i < 8; i++) if (i !== 4) glow("box", "#8FE3FF", L(T, -pz.w / 2 + i * pz.w / 8, TOP + .07, 0, .07, .02, pz.d - .6));
      for (const z of [-3.6, 3.6]) glow("box", "#8FE3FF", L(T, 0, TOP + .07, z, pz.w - .6, .02, .07));
      // 中央步道：深色地板，兩側光帶
      put("box", "#56688A", L(T, 0, TOP + .08, 0, pz.w - .4, .06, 3.2));
      for (const z of [-1.7, 1.7]) glow("box", "#5FD0FF", L(T, 0, TOP + .13, z, pz.w - .4, .04, .12));
      // 七道拱門：白色門框＋藍紫交錯的內緣光
      const N = 7, HW = 2.3, H = 3.6;
      for (let i = 0; i < N; i++) {
        const x = -pz.w / 2 + 1.1 + i * (pz.w - 2.2) / (N - 1), c = i % 2 ? "#B48CFF" : "#5FD0FF";
        for (const z of [-HW, HW]) {
          put("box", "#F4F7FB", L(T, x, TOP + H / 2, z, .38, H, .38));
          glow("box", c, L(T, x, TOP + H / 2, z * .9, .4, H - .4, .06));
        }
        put("box", "#F4F7FB", L(T, x, TOP + H + .15, 0, .38, .3, HW * 2 + .38));
        glow("box", c, L(T, x, TOP + H - .02, 0, .4, .06, HW * 2 - .3));
      }
      // 屋脊：兩條縱向樑
      for (const z of [-HW, HW]) put("box", "#E2E8F0", L(T, 0, TOP + H + .36, z, pz.w - 1.8, .14, .2));
      // 兩端入口：AI 互動查詢機
      for (const sx of [-1, 1]) {
        put("box", "#E9EEF4", L(T, sx * (pz.w / 2 - .5), TOP + .7, -3.6, .6, 1.4, .9));
        glow("box", "#8FD8FF", L(T, sx * (pz.w / 2 - .5) - sx * .31, TOP + 1.1, -3.6, .02, .5, .7));
      }
      W._corridor = { x: pz.x, z: pz.z, y: TOP, len: pz.w - 2.2, HW, H };
    });
    // 行道樹
    for (let x = -68; x <= 68; x += 8) { Pr.tree(P(0, 0), x, -37, .9); Pr.tree(P(0, 0), x, 44, .95); }
    for (let z = -30; z <= 38; z += 8) { Pr.tree(P(0, 0), -70, z, .9); Pr.tree(P(0, 0), 70, z, .9); }
    for (let x = -10; x <= 10; x += 5) Pr.bush(P(0, 0), x, -2, .9);

    // 外部道路
    ROADS.forEach((r) => {
      put("box", "#8E949C", L(P(r.x, r.z), 0, .04, 0, r.w, .08, r.d));
      const n = 28;
      for (let i = 0; i < n; i++) {
        const u = -r.d / 2 + (i + .5) * (r.d / n);
        if (r.vertical) put("box", "#F5F5F0", L(P(r.x, r.z + u), 0, .1, 0, .22, .02, 3.2)); else put("box", "#F5F5F0", L(P(r.x + (-r.w / 2 + (i + .5) * (r.w / n)), r.z), 0, .1, 0, 3.2, .02, .22));
      }
      for (const sx of [-1, 1]) put("box", "#D5D2CA", r.vertical ? L(P(r.x + sx * (r.w / 2 + .7), r.z), 0, .12, 0, 1.4, .24, r.d) : L(P(r.x, r.z + sx * (r.d / 2 + .7)), 0, .12, 0, r.w, .24, 1.4));
    });
    // 周邊街廓（低矮房舍）
    const rnd = ((sd) => () => (sd = (sd * 9301 + 49297) % 233280) / 233280)(7);
    for (let i = 0; i < 34; i++) {
      const a = rnd() * Math.PI * 2, rr = 1.32 + rnd() * .25;
      const x = Math.cos(a) * 118 * rr, z = Math.sin(a) * 90 * rr;
      if (Math.abs(z - RIVER.z) < RIVER.d / 2 + 5) continue;
      Pr.house(P(0, 0), x, z, rnd() * 3, ["#FBEFD9", "#F2F0EA", "#EAF1F4"][i % 3], ["#E58B6B", "#9AA7B4", "#C9A27A"][i % 3], 1.6);
    }

    // 河道與會計碼頭
    W.river = new THREE.Mesh(new THREE.PlaneGeometry(900, RIVER.d), new THREE.MeshStandardMaterial({ color: 0x7FB9D6, roughness: .25, metalness: .05 }));
    W.river.rotation.x = -Math.PI / 2; W.river.position.set(0, .06, RIVER.z); W.river.receiveShadow = true; scene.add(W.river);
    for (const sz of [-1, 1]) put("box", "#D9D2C2", L(P(0, RIVER.z + sz * (RIVER.d / 2 + .5)), 0, .2, 0, 900, .4, 1));
    // 兩座碼頭：會計碼頭（金幣招牌）、人資碼頭（人像招牌）
    W.docks = [];
    const bankZ = RIVER.z - RIVER.d / 2;
    RIVER.docks.forEach((dk) => {
      const dx = dk.x, z0 = 80 * Math.sqrt(Math.max(0, 1 - (dx / 106) ** 2)) + 2.2, z1 = bankZ + 7;
      for (let z = z0; z < bankZ; z += 1) put("box", "#C9A27A", L(P(dx, z + .5), 0, .45, 0, 3.6, .14, .9));
      put("box", "#B98A5E", L(P(dx, bankZ + 3.5), 0, .5, 0, 12, .2, 7));
      for (const [x, z] of [[-5.6, .4], [5.6, .4], [-5.6, 6.6], [5.6, 6.6], [-1.6, -2], [1.6, -2]]) put("cyl", "#8A6A4A", L(P(dx + x, bankZ + z), 0, .2, 0, .22, 1.4, .22));
      const hr = dk.key === "hrDock";
      const H = P(dx - 3.4, bankZ + 2.4);
      put("box", hr ? "#EAF4F2" : "#FBEFD9", L(H, 0, 1.6, 0, 3, 2.2, 2.4)); put("roof", hr ? "#E5704F" : "#C99A5B", L(H, 0, 2.7, 0, 3.4, 1.2, 2.8));
      win("box", L(H, .6, 1.7, 1.22, .9, .7, .04)); put("box", "#B98A5E", L(H, -.6, 1.2, 1.22, .7, 1.3, .04));
      if (hr) {
        glow("cyl", "#FFFFFF", L(H, 0, 3.9, 0, .75, .14, .75, 0, Math.PI / 2));
        glow("sph", "#E5704F", L(H, -.22, 4.02, .09, .13, .13, .04)); glow("sph", "#2E9C8F", L(H, .22, 4.02, .09, .13, .13, .04));
        glow("box", "#E5704F", L(H, -.22, 3.75, .09, .22, .2, .04)); glow("box", "#2E9C8F", L(H, .22, 3.75, .09, .22, .2, .04));
        for (let i = 0; i < 2; i++) Pr.bench(P(0, 0), dx + 2.6, bankZ + 2 + i * 2, Math.PI / 2);
      } else {
        glow("cyl", "#F2C94C", L(H, 0, 3.9, 0, .7, .14, .7, 0, Math.PI / 2)); glow("box", "#B8862E", L(H, 0, 3.9, .08, .14, .45, .02));
        for (let i = 0; i < 3; i++) Pr.crate(P(0, 0), dx + 2.5 + i * .7, bankZ + 1.6, .6);
      }
      put("cyl", "#E85A5A", L(P(dx + 5, bankZ + 6.4), 0, .6, 0, .35, .6, .35));
      W.docks.push({ key: dk.key, x: dx, pos: new V3(dx, 1.2, bankZ + 3) });
    });
    W.dockPos = W.docks[0].pos;
    // 道路跨河的車行橋
    ROADS.filter((r) => r.vertical).forEach((r) => {
      const B = P(r.x, RIVER.z);
      put("box", "#B9BDC4", L(B, 0, .55, 0, r.w + 2, .5, RIVER.d + 3));
      put("box", "#8E949C", L(B, 0, .82, 0, r.w, .06, RIVER.d + 3));
      for (const sx of [-1, 1]) put("box", "#F2F2EE", L(B, sx * (r.w / 2 + .7), 1.2, 0, .3, .7, RIVER.d + 3));
      for (const sz of [-1, 0, 1]) put("box", "#D5D2CA", L(B, 0, .2, sz * RIVER.d * .3, r.w * .6, .6, 1.2));
    });
    // 河岸樹與房舍
    for (let x = -160; x <= 160; x += 12) if (Math.abs(x) > 10) { Pr.tree(P(0, 0), x, RIVER.z + RIVER.d / 2 + 3.5, 1.1); }

    // 360° 永續照護環：八站涼亭
    const RX = 106, RZ = 80;
    W.stageRing = RX;
    const DOMES = ["#9CCB8A", "#E98A8A", "#E8B86B", "#8FC7D9", "#F2B48A", "#B9A4E3", "#C9A27A", "#F2A7B8"];
    const STAGE_Y = .9;
    C.stages.forEach((st, i) => {
      const a = (-160 + i * 45) * Math.PI / 180;
      const x = Math.cos(a) * RX, z = Math.sin(a) * RZ;
      const T = P(x, z);
      put("cyl16", "#DCD3C2", L(T, 0, .2, 0, 6, .4, 6));
      put("cyl16", "#F8F4EC", L(T, 0, .6, 0, 5.4, .5, 5.4));
      for (let k = 0; k < 6; k++) { const b = k / 6 * Math.PI * 2; put("cyl", "#FFFFFF", L(T, Math.cos(b) * 2.6, 2.6, Math.sin(b) * 2.6, .2, 3.4, .2)); }
      put("cone6", DOMES[i], L(T, 0, 5, 0, 3.6, 1.8, 3.6));
      glow("sph", "#FFD86B", L(T, 0, 6.1, 0, .25, .25, .25));
      glow("ico", DOMES[i], L(T, 0, 2.2, 0, .6, .6, .6));
      STAGE_SCENES[i] && STAGE_SCENES[i](L(T, 3.6, STAGE_Y - .05, 2.2, .5, .5, .5));
      W.stages.push({ ...st, x, z, n: i + 1, dome: DOMES[i] });
    });
    // 棧道工具
    function span(ax, az, ay, bx, bz, by, width = 1.8, arch = 0, deck = "#EFE8DA", opts = {}) {
      const len = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.ceil(len / 1.4));
      const ry = Math.atan2(bx - ax, bz - az);
      for (let k = 0; k < n; k++) {
        const u0 = k / n, u1 = (k + 1) / n, um = (u0 + u1) / 2;
        const y0 = ay + (by - ay) * u0 + Math.sin(u0 * Math.PI) * arch, y1 = ay + (by - ay) * u1 + Math.sin(u1 * Math.PI) * arch;
        const x = ax + (bx - ax) * um, z = az + (bz - az) * um, y = (y0 + y1) / 2;
        const seg = len / n, pitch = -Math.atan2(y1 - y0, seg);
        const T = P(x, z);
        put("box", deck, L(T, 0, y, 0, width, .2, seg + .06, ry, pitch, 0, "YXZ"));
        if (opts.rails !== false) for (const sx of [-1, 1]) {
          put("box", "#FFFFFF", L(T, 0, y + .55, 0, .12, .1, seg + .06, ry, pitch, 0, "YXZ").multiply(new M4().makeTranslation(sx * (width / 2 - .1) / .12, 0, 0)));
          if (opts.lamps && k % 5 === 2) {
            const ox = Math.cos(ry) * (width / 2 - .1) * sx, oz = -Math.sin(ry) * (width / 2 - .1) * sx;
            put("cyl", "#4A4F57", new M4().compose(new V3(x + ox, y + 1.1, z + oz), new THREE.Quaternion(), new V3(.05, 2, .05)));
            glow("sph", "#FFE7A3", new M4().compose(new V3(x + ox, y + 2.15, z + oz), new THREE.Quaternion(), new V3(.16, .16, .16)));
          }
        }
        if (opts.piers && k % 2 === 1 && y > .8) put("box", "#D8D2C4", new M4().compose(new V3(x, y / 2 - .05, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), new V3(width * .7, y - .1, .5)));
      }
    }
    // 環形綠廊：一整圈連續步道，金色箭頭依 1→8→1 循環
    const NSEG = 260, DECK_Y = .35;
    // 跨越道路處架高成天橋
    const ringY = (x, z) => {
      let y = DECK_Y;
      ROADS.forEach((r) => {
        const d = r.vertical ? Math.abs(x - r.x) : Math.abs(z - r.z), half = (r.vertical ? r.w : r.d) / 2 + 1.6;
        const t = Math.max(0, Math.min(1, (half + 7 - d) / 7));
        y = Math.max(y, DECK_Y + 3.2 * t * t * (3 - 2 * t));
      });
      return y;
    };
    W.ringY = ringY; W.RX = RX; W.RZ = RZ;
    for (let i = 0; i < NSEG; i++) {
      const a0 = i / NSEG * Math.PI * 2, a1 = (i + 1) / NSEG * Math.PI * 2, am = (a0 + a1) / 2;
      const p0 = { x: Math.cos(a0) * RX, z: Math.sin(a0) * RZ }, p1 = { x: Math.cos(a1) * RX, z: Math.sin(a1) * RZ }, pm = { x: Math.cos(am) * RX, z: Math.sin(am) * RZ };
      if (W.stages.some((st) => Math.hypot(pm.x - st.x, pm.z - st.z) < 5.6)) continue;
      const y0 = ringY(p0.x, p0.z), y1 = ringY(p1.x, p1.z), ym = (y0 + y1) / 2;
      const raised = ym > DECK_Y + .3;
      span(p0.x, p0.z, y0, p1.x, p1.z, y1, 3.4, 0, "#E9DFC6", { rails: raised, piers: raised });
      if (!raised) put("box", "#7FB06C", L(P(pm.x, pm.z), 0, DECK_Y + .02, 0, .5, .06, .5));
      if (i % 6 === 3) glow("cone", "#E8B84A", L(P(pm.x, pm.z), 0, ym + .14, 0, .5, .7, .06, Math.atan2(p1.x - p0.x, p1.z - p0.z), Math.PI / 2, 0, "YXZ"));
      if (i % 9 === 0 && !raised && ringY(Math.cos(am) * (RX + 3.2), Math.sin(am) * (RZ + 3.2)) < DECK_Y + .1) Pr.tree(P(0, 0), Math.cos(am) * (RX + 3.2), Math.sin(am) * (RZ + 3.2), 1.05);
    }
    // 院區 ↔ 八站：跨越道路的空橋
    W.stages.forEach((st) => {
      const cx = Math.max(CAMPUS.x0 + 2, Math.min(CAMPUS.x1 - 2, st.x * .62)), cz = Math.max(CAMPUS.z0 + 2, Math.min(CAMPUS.z1 - 2, st.z * .62));
      const dx = st.x - cx, dz = st.z - cz, d = Math.hypot(dx, dz), ux = dx / d, uz = dz / d;
      const crosses = ROADS.some((r) => r.vertical ? (Math.sign(cx - r.x) !== Math.sign(st.x - r.x)) : (Math.sign(cz - r.z) !== Math.sign(st.z - r.z)));
      span(cx, cz, TOP, st.x - ux * 5.6, st.z - uz * 5.6, STAGE_Y, 3, crosses ? 3.2 : 1.2, "#EFE8DA", { lamps: true, piers: true });
      st.bridgeFrom = "campus";
      st.bridgeMid = new V3((cx + st.x - ux * 5.6) / 2, TOP + (crosses ? 3.6 : 1.6), (cz + st.z - uz * 5.6) / 2);
    });

    const addMesh = (geo, mat, shadow = true) => {
      if (!geo) return null;
      const m = new THREE.Mesh(geo, mat); m.castShadow = shadow; m.receiveShadow = true; scene.add(m); return m;
    };
    addMesh(merge(SOLID), W.mats.solid);
    W.winMesh = addMesh(merge(WIN), W.mats.win, false);
    W.glowMesh = addMesh(merge(GLOW), W.mats.glow, false);
    SOLID = WIN = GLOW = null;

    // 動態物件：風車、湖上天鵝、噴泉水光
    W.anim = [];
    if (W._corridor) {   // 光廊：半透明玻璃頂、沿走廊流動的光點、地面光波
      const c = W._corridor, grp = new THREE.Group(); grp.position.set(c.x, c.y, c.z); scene.add(grp);
      const glass = new THREE.Mesh(new THREE.BoxGeometry(c.len + 1, .06, c.HW * 2), new THREE.MeshBasicMaterial({ color: 0xBFEFFF, transparent: true, opacity: .28, depthWrite: false }));
      glass.position.y = c.H + .45; grp.add(glass);
      const dotMat = [0x9FEAFF, 0xD3B8FF].map((col) => new THREE.MeshBasicMaterial({ color: col }));
      const dots = [];
      for (let i = 0; i < 10; i++) {
        const m = new THREE.Mesh(new THREE.SphereGeometry(.16, 8, 6), dotMat[i % 2]);
        m.userData = { u: i / 10, z: [-c.HW + .3, c.HW - .3][i % 2], y: [c.H - .25, .35][Math.floor(i / 2) % 2], sp: .12 + (i % 3) * .03 };
        grp.add(m); dots.push(m);
      }
      const wave = new THREE.Mesh(new THREE.BoxGeometry(.5, .03, 3.1), new THREE.MeshBasicMaterial({ color: 0x8FE3FF, transparent: true, opacity: .8, depthWrite: false }));
      wave.position.y = .16; grp.add(wave);
      let tt = 0;
      W.anim.push((dt) => {
        tt += dt;
        dots.forEach((m) => { const d = m.userData; d.u = (d.u + dt * d.sp) % 1; m.position.set(-c.len / 2 + d.u * c.len, d.y, d.z); });
        const u = (tt * .25) % 1; wave.position.x = -c.len / 2 + u * c.len; wave.material.opacity = .8 * Math.sin(u * Math.PI);
        glass.material.opacity = .22 + .08 * Math.sin(tt * 1.5);
      });
    }
    const t4d = W.tileById["4d"];
    if (t4d) for (const [ox, oz] of [[2.6, -.6], [4.2, .6]]) {
      const g = new THREE.Group(); g.position.set(t4d.x + ox, TOP, t4d.z + oz);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(.08, .14, 4, 8), new THREE.MeshStandardMaterial({ color: 0xffffff }));
      pole.position.y = 2; pole.castShadow = true; g.add(pole);
      const hub = new THREE.Group(); hub.position.set(0, 4, .2); g.add(hub);
      for (let k = 0; k < 3; k++) {
        const bl = new THREE.Mesh(new THREE.BoxGeometry(.18, 1.8, .05), new THREE.MeshStandardMaterial({ color: 0xffffff }));
        bl.position.y = .9; const p = new THREE.Group(); p.rotation.z = k * Math.PI * 2 / 3; p.add(bl); hub.add(p); bl.castShadow = true;
      }
      scene.add(g); W.anim.push((dt) => (hub.rotation.z += dt * 1.6));
    }
    const carCols = [0xF2F2F2, 0xE58B6B, 0x7FA7C9, 0xF2D27A, 0x9BC8A0, 0xC9C9D1];
    ROADS.forEach((r, ri) => {
      for (let i = 0; i < 5; i++) {
        const car = new THREE.Group();
        const mat = new THREE.MeshStandardMaterial({ color: carCols[(i + ri) % carCols.length], flatShading: true });
        const body = new THREE.Mesh(new THREE.BoxGeometry(1.6, .7, 3), mat); body.position.y = .5; car.add(body);
        const top = new THREE.Mesh(new THREE.BoxGeometry(1.4, .5, 1.6), mat); top.position.set(0, 1.05, -.2); car.add(top);
        car.traverse((o) => (o.castShadow = true)); scene.add(car);
        let u = i / 5, dir = i % 2 ? 1 : -1; const lane = dir * (r.vertical ? r.w : r.d) * .22, sp = .03 + (i % 3) * .01;
        W.anim.push((dt) => {
          u = (u + dt * sp + 1) % 1; const v = (u - .5) * (r.vertical ? r.d : r.w) * dir;
          if (r.vertical) { car.position.set(r.x + lane, 0, r.z + v); car.rotation.y = dir > 0 ? 0 : Math.PI; }
          else { car.position.set(r.x + v, 0, r.z + lane); car.rotation.y = dir > 0 ? Math.PI / 2 : -Math.PI / 2; }
        });
      }
    });
    // 噴泉水池（晝夜換色）
    W.lake = new THREE.Mesh(new THREE.CircleGeometry(2.3, 24), new THREE.MeshStandardMaterial({ color: 0x7FB9D6, roughness: .2 }));
    W.lake.rotation.x = -Math.PI / 2; W.lake.position.set(0, TOP + .52, -7); scene.add(W.lake);
    W.vehicles = [];
    const MAT = {}; const mat = (c, basic) => MAT[c + (basic ? "b" : "")] || (MAT[c + (basic ? "b" : "")] = basic ? new THREE.MeshBasicMaterial({ color: c }) : new THREE.MeshStandardMaterial({ color: c, flatShading: true }));
    const bx = (g, w, h, d, x, y, z, c, basic) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(c, basic)); m.position.set(x, y, z); g.add(m); return m; };
    const cy = (g, r1, r2, h, x, y, z, c, rz = 0, rx = 0) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, 12), mat(c)); m.position.set(x, y, z); m.rotation.z = rz; m.rotation.x = rx; g.add(m); return m; };
    const wheels = (g, xs, zs, r = .33) => xs.forEach((x) => zs.forEach((z) => cy(g, r, r, .22, x, r, z, 0x2F3236, Math.PI / 2)));
    const beacon = (g, x, y, z) => { cy(g, .03, .03, .6, x, y + .3, z, 0xFFFFFF); const b = new THREE.Mesh(new THREE.SphereGeometry(.11, 8, 6), mat(0x5FE0C8, true)); b.position.set(x, y + .65, z); g.add(b); return b; };
    // 七種資訊車
    const CARS = [
      (g) => { bx(g, 1.9, 1.5, 3.8, 0, 1.05, 0, 0xFFFFFF); bx(g, 1.94, .32, 3.84, 0, .85, 0, 0x2E9C8F); bx(g, 1.3, .65, .06, 0, 2.15, .15, 0x2F3640); bx(g, 1.2, .55, .08, 0, 2.15, .2, 0x7FD3F5, true); bx(g, 1.7, .5, .05, 0, 1.45, 1.92, 0xBFE3F5, true); wheels(g, [-.85, .85], [1.2, -1.2]); return beacon(g, .6, 1.8, -1.2); },          // 廂型車
      (g) => { bx(g, 2.2, 2.1, 6.4, 0, 1.4, 0, 0x2F6FC4); bx(g, 2.24, .7, 6.1, 0, 1.75, 0, 0xBFE3F5, true); bx(g, 2.26, .25, 6.44, 0, .65, 0, 0xFFFFFF); bx(g, 2, .12, 6, 0, 2.5, 0, 0xFFFFFF); wheels(g, [-1, 1], [2.1, -2.1], .4); return beacon(g, 0, 2.5, -2.4); },              // 巴士
      (g) => { bx(g, 2, 1.7, 4.6, 0, 1.15, 0, 0xF2A65A); bx(g, 2.04, .55, 4.2, 0, 1.45, -.1, 0xBFE3F5, true); bx(g, 1.8, .4, 1.2, 0, 2.1, -.8, 0xFFFFFF); wheels(g, [-.9, .9], [1.5, -1.5]); return beacon(g, .7, 2, 1.4); },                                 // 接駁小巴
      (g) => { bx(g, 1.9, 1.4, 1.6, 0, 1, 1.9, 0xFFFFFF); bx(g, 1.7, .5, .05, 0, 1.35, 2.72, 0xBFE3F5, true); bx(g, 2.1, 2.2, 3.8, 0, 1.5, -.9, 0x7B4BB0); bx(g, .05, 1.2, 2.6, 1.08, 1.6, -.9, 0x9FE8FF, true); bx(g, .05, 1.2, 2.6, -1.08, 1.6, -.9, 0x9FE8FF, true); wheels(g, [-.9, .9], [1.9, -.3, -2.2]); return beacon(g, 0, 2.6, -2.4); }, // 行動資訊車
      (g) => { bx(g, 1.6, .5, 2.8, 0, .7, 0, 0xFFFFFF); bx(g, 1.4, .45, 1.2, 0, 1.15, -.5, 0x3E8E41); bx(g, 1.4, .45, 1, 0, 1.15, .8, 0x3E8E41); for (const [x, z] of [[-.7, 1.2], [.7, 1.2], [-.7, -1.2], [.7, -1.2]]) cy(g, .04, .04, 1.4, x, 1.6, z, 0xDDDDDD); bx(g, 1.7, .1, 2.8, 0, 2.3, 0, 0x8FD6C2); wheels(g, [-.75, .75], [.95, -.95], .28); return beacon(g, 0, 2.35, 0); }, // 電動園區車
      (g) => { bx(g, 1.8, .7, 3.8, 0, .7, 0, 0xE5704F); bx(g, 1.6, .6, 2, 0, 1.35, -.2, 0xE5704F); bx(g, 1.62, .45, 1.8, 0, 1.35, -.2, 0xBFE3F5, true); wheels(g, [-.85, .85], [1.25, -1.25], .32); return beacon(g, .5, 1.65, -.9); },                // 轎車
      (g) => { bx(g, 1.9, 1, 3.9, 0, .95, 0, 0xF2C94C); bx(g, 1.8, .75, 2.4, 0, 1.8, -.3, 0xF2C94C); bx(g, 1.82, .5, 2.2, 0, 1.85, -.3, 0xBFE3F5, true); bx(g, 1.6, .1, 1.8, 0, 2.3, -.3, 0x4A4F57); cy(g, .45, .45, .25, 0, 1, -2.05, 0x2F3236, 0, Math.PI / 2); wheels(g, [-.9, .9], [1.3, -1.3], .4); return beacon(g, .6, 2.3, .6); } // 吉普車
    ];
    const TAU = Math.PI * 2;
    const stageAng = () => W.stages.map((st) => (Math.atan2(st.z / RZ, st.x / RX) + TAU) % TAU);
    CARS.forEach((build, i) => {
      const g = new THREE.Group(); const bulb = build(g); W.bake(g, [bulb]);
      g.traverse((o) => (o.castShadow = true)); scene.add(g);
      let a = (i / CARS.length) * TAU + .15, wait = 0;
      const sa = stageAng();
      W.anim.push((dt, t) => {
        bulb.material = (Math.sin((t || performance.now() / 1000) * 6 + i) > 0) ? mat(0x5FE0C8, true) : mat(0xBFFFF2, true);
        if (wait > 0) { wait -= dt; return; }
        const prev = a; a = (a + dt * .045) % TAU;
        sa.forEach((s, si) => { if (prev < a ? (prev < s && s <= a) : (s > prev || s <= a)) { wait = 2.2; if (W.onCarStop) W.onCarStop(i, W.stages[si]); } });
        const x = Math.cos(a) * RX, z = Math.sin(a) * RZ, nx = Math.cos(a + .01) * RX, nz = Math.sin(a + .01) * RZ;
        g.rotation.order = "YXZ";
        g.position.set(x, W.ringY(x, z) + .1, z);
        g.rotation.y = Math.atan2(nx - x, nz - z);
        g.rotation.x = -Math.atan2(W.ringY(nx, nz) - W.ringY(x, z), Math.hypot(nx - x, nz - z));
      });
      W.vehicles.push({ key: "infoCar", obj: g, h: 3.6, main: i === 0 || i === 2 || i === 4 });
    });
    // 船：會計船 3 艘、人資船 5 艘，八種樣式，沿河道三條航道循環，靠岸各自的碼頭
    const passengers = (g, n, y, z0) => {
      const skins = [0xF6CFAE, 0xE9B892, 0xFFE2CC, 0xC9906A], shirts = [0x7EC8E3, 0xF4A7B9, 0x8FD6C2, 0xB8A9E3, 0xFFD86B, 0xF2B48A];
      for (let i = 0; i < n; i++) {
        const x = i % 2 ? .6 : -.6, z = z0 + Math.floor(i / 2) * 1.1;
        cy(g, .2, .26, .55, x, y + .28, z, shirts[i % 6]);
        const hd = new THREE.Mesh(new THREE.SphereGeometry(.2, 10, 8), mat(skins[i % 4])); hd.position.set(x, y + .75, z); g.add(hd);
        const hr = new THREE.Mesh(new THREE.SphereGeometry(.21, 10, 6, 0, TAU, 0, Math.PI / 2), mat(0x2B2220)); hr.position.set(x, y + .8, z); g.add(hr);
      }
    };
    const hull = (g, w, h, l, c, stripe) => { bx(g, w, h, l, 0, h / 2, 0, c); const bow = new THREE.Mesh(new THREE.ConeGeometry(w / 2, w * .8, 4), mat(c)); bow.rotation.x = Math.PI / 2; bow.rotation.y = Math.PI / 4; bow.scale.set(1, 1, .5); bow.position.set(0, h / 2, l / 2 + w * .2); g.add(bow); if (stripe) bx(g, w + .04, .22, l + .04, 0, h * .8, 0, stripe); };
    const BOATS = [
      { kind: "accountBoat", build: (g) => { hull(g, 3, 1, 7, 0xFFFFFF, 0xD8B65E); bx(g, 2.6, .1, 6.6, 0, 1.05, 0, 0xC9A27A); for (let i = 0; i < 3; i++) bx(g, .8, .7, .8, -.6 + (i % 2) * 1.2, 1.45, -1.6 + i * 1.3, 0xD7B07A); bx(g, 2, 1.3, 1.8, 0, 1.7, -2.4, 0xF2C94C); cy(g, .35, .35, .1, 0, 2.6, -2.4, 0xF2C94C, Math.PI / 2); } },     // 金色貨船
      { kind: "accountBoat", build: (g) => { hull(g, 2.6, .9, 6, 0x1F3550, 0xF2C94C); bx(g, 1.8, 1.1, 2.2, 0, 1.45, -.8, 0xFFFFFF); cy(g, .3, .35, 1.4, 0, 2.6, -1.4, 0xF2C94C); bx(g, 1.6, .3, .05, 0, 1.6, .35, 0xBFE3F5, true); } },   // 拖船
      { kind: "accountBoat", build: (g) => { hull(g, 2.4, .8, 6.4, 0xF7F2E8, 0xB8862E); cy(g, .07, .07, 6, 0, 3.8, 0, 0xEDEDED); const sail = new THREE.Mesh(new THREE.ConeGeometry(1.6, 4.6, 3), mat(0xF2C94C)); sail.scale.set(.06, 1, 1); sail.position.set(0, 3.8, -1); g.add(sail); passengers(g, 2, .85, .8); } },     // 帆船
    ];
    const LANES = [{ z: RIVER.z + 1.5, dir: 1 }, { z: RIVER.z + 5.5, dir: -1 }, { z: RIVER.z + 9.2, dir: 1 }];
    const XMIN = -180, XMAX = 180, SPAN = XMAX - XMIN;
    const laneOf = BOATS.map((_, i) => i % 3);
    const laneCount = [0, 0, 0]; laneOf.forEach((l) => laneCount[l]++);
    const laneIdx = [0, 0, 0];
    const dockX = (k) => (W.docks.find((d) => d.key === (k === "hrBoat" ? "hrDock" : "accountDock")) || {}).x;
    BOATS.forEach((bt, i) => {
      const g = new THREE.Group(); bt.build(g); W.bake(g);
      g.traverse((o) => (o.castShadow = true)); scene.add(g);
      const lane = LANES[laneOf[i]], k = laneIdx[laneOf[i]]++;
      let x = XMIN + SPAN * (k + .5) / laneCount[laneOf[i]] + laneOf[i] * 17, wait = 0;
      const dx = dockX(bt.kind), ph = i * 1.3;
      g.rotation.y = lane.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
      W.anim.push((dt, t) => {
        g.position.y = Math.sin((t || performance.now() / 1000) * 1.5 + ph) * .08;
        if (wait > 0) { wait -= dt; } else {
          const px = x; x += lane.dir * dt * 6;
          if ((px - dx) * (x - dx) <= 0 && px !== dx) { x = dx + lane.dir * .01; wait = 3.5; if (W.onBoatDock) W.onBoatDock(bt.kind, i); }
          if (x > XMAX) x -= SPAN; if (x < XMIN) x += SPAN;
        }
        g.position.x = x; g.position.z = lane.z;
      });
      W.vehicles.push({ key: bt.kind, obj: g, h: bt.kind === "accountBoat" && i === 2 ? 6.6 : 4.2, main: i === 0 || i === 1 });
    });
    W.beam = new THREE.PointLight(0xFFE58A, 0, 70); W.beam.position.set(0, TOP + 20, -20); scene.add(W.beam);

    W.setTime("day");
    W.resize();
    window.addEventListener("resize", W.resize);
    // 畫面區域大小一改變（清單收合、手機轉向、網址列伸縮）就重新調整 3D 畫布
    if (window.ResizeObserver) new ResizeObserver(() => W.resize()).observe(W.renderer.domElement.parentElement);
  };

  W.resize = function () {
    const el = W.renderer.domElement.parentElement;
    const w = el.clientWidth, h = el.clientHeight;
    if (!w || !h) return;
    W.renderer.setSize(w, h); W.camera.aspect = w / h; W.camera.updateProjectionMatrix();
    W.vw = w; W.vh = h;
    const fk = W.fitK();
    if (W.controls) W.controls.maxDistance = 420 * fk;
    // 鏡頭拉遠時，霧與可視距離跟著放寬，畫面才不會被霧蓋住
    if (W.scene && W.scene.fog) { W.scene.fog.near = 360 * fk; W.scene.fog.far = 820 * fk; }
    if (W.camera.far !== 1600 * fk) { W.camera.far = 1600 * fk; W.camera.updateProjectionMatrix(); }
  };

  // ---------- 晝夜 ----------
  const TIMES = {
    dawn: { lake: 0x8DB6CC, bg: 0xF3D9CC, fog: 0xF3D9CC, sea: 0x95B97F, hs: 0xFFE6D6, hg: 0x86B7B2, hi: .42, sun: 0xFFC9A0, si: .5, sp: [-90, 50, 30], win: 0xFFE3B0, am: .04, beam: 0 },
    day: { lake: 0x7FB9D6, bg: 0xCFE4F0, fog: 0xD4E7F0, sea: 0x8EC07C, hs: 0xFFFFFF, hg: 0x9CC4BE, hi: .5, sun: 0xFFF7EC, si: .62, sp: [-60, 110, 50], win: 0xBFE3F5, am: .04, beam: 0 },
    dusk: { lake: 0x8A9EC0, bg: 0xEDB49E, fog: 0xEAB3A0, sea: 0x8AA877, hs: 0xFFF0E6, hg: 0xB8C4D8, hi: .55, sun: 0xFFB38A, si: .5, sp: [-90, 45, 60], win: 0xFFD98A, am: .04, beam: 1.2 },
    night: { lake: 0x23405E, bg: 0x1C2A44, fog: 0x1C2A44, sea: 0x2E4A3E, hs: 0x9FB2E6, hg: 0x2A3D60, hi: .32, sun: 0xA8B8FF, si: .22, sp: [40, 100, 60], win: 0xFFD98A, am: .03, beam: 2.4 }
  };
  W.setTime = function (k) {
    const t = TIMES[k]; if (!t) return;
    W.time = k;
    W.scene.background = new THREE.Color(t.bg); W.scene.fog.color.set(t.fog);
    W.sea.material.color.set(t.sea); W.lake.material.color.set(t.lake); if (W.river) W.river.material.color.set(t.lake);
    W.hemi.color.set(t.hs); W.hemi.groundColor.set(t.hg); W.hemi.intensity = t.hi;
    W.sun.color.set(t.sun); W.sun.intensity = t.si; W.sun.position.set(...t.sp);
    W.ambient.intensity = t.am;
    W.mats.win.color.set(t.win);
    W.beam.intensity = t.beam;
    document.body.dataset.time = k;
  };

  // ---------- 鏡頭 ----------
  let fly = null;
  // 依螢幕比例調整鏡頭距離：直式手機畫面較窄，鏡頭自動拉遠，讓院區完整入鏡
  W.fitK = () => Math.min(2.2, Math.max(1, 1.45 / (W.camera.aspect || 1.6)));
  W.flyTo = function (target, dist = 70, polar = .82, az = null, dur = 1.6) {
    const c = W.controls, cam = W.camera;
    const fk = W.fitK(); dist *= dist > 60 ? fk : Math.sqrt(fk);
    const from = { t: c.target.clone(), p: cam.position.clone() };
    const curOff = cam.position.clone().sub(c.target);
    const sph = new THREE.Spherical().setFromVector3(curOff);
    sph.radius = dist; sph.phi = polar; if (az !== null) sph.theta = az;
    const toT = new V3(target.x, target.y || 0, target.z);
    const toP = toT.clone().add(new V3().setFromSpherical(sph));
    fly = { from, to: { t: toT, p: toP }, t: 0, dur };
  };
  W.home = function () { W.flyTo({ x: 0, y: 0, z: 30 }, 345, .72, 0); };
  W.campus = function () { W.flyTo({ x: 0, y: 0, z: 2 }, 175, .82, 0); };
  W.top = function () { W.flyTo({ x: 0, y: 0, z: 0 }, 300, .12, 0); };

  // ---------- 標籤投影 ----------
  const _v = new V3();
  W.project = function (x, y, z) {
    _v.set(x, y, z).project(W.camera);
    // 使用快取的畫布尺寸，避免每個標籤都觸發瀏覽器重新排版
    return { x: (_v.x + 1) / 2 * (W.vw || 1), y: (1 - _v.y) / 2 * (W.vh || 1), vis: _v.z < 1 && _v.z > -1 };
  };

  // ---------- 合併：把一個物件群組裡不會動的零件合成一個網格，大幅減少繪製次數 ----------
  const bakeMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .75, flatShading: true });
  W.bake = function (g, keep = []) {
    g.updateMatrixWorld(true);
    const inv = new M4().copy(g.matrixWorld).invert();
    const parts = [], remove = [];
    g.traverse((o) => {
      if (!o.isMesh || keep.includes(o) || o.userData.keep) return;
      const m = o.material;
      if (!m || Array.isArray(m) || m.map || m.transparent || !m.color) return;
      let geo = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
      ["uv", "uv2"].forEach((k) => geo.attributes[k] && geo.deleteAttribute(k));
      if (!geo.attributes.normal) geo.computeVertexNormals();
      geo.applyMatrix4(new M4().multiplyMatrices(inv, o.matrixWorld));
      if (!geo.attributes.color) {
        const n = geo.attributes.position.count, a = new Float32Array(n * 3), c = m.color;
        for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; }
        geo.setAttribute("color", new THREE.BufferAttribute(a, 3));
      }
      parts.push(geo); remove.push(o);
    });
    if (parts.length < 2) return g;
    remove.forEach((o) => o.parent.remove(o));
    const mesh = new THREE.Mesh(THREE.BufferGeometryUtils.mergeBufferGeometries(parts, false), bakeMat);
    mesh.castShadow = true; mesh.receiveShadow = false;
    g.add(mesh);
    return g;
  };

  // ---------- 主迴圈 ----------
  const listeners = [];
  W.onFrame = (fn) => listeners.push(fn);
  let last = performance.now();
  W.paused = false;
  W.frozen = false;
  const perf = { t: 0, n: 0 };
  // 降載：不重新編譯材質（避免整個畫面卡住數秒），改為陰影停止即時更新、降低解析度
  W.setLowPower = function (on) {
    if (W.lowPower === on) return;
    W.lowPower = on;
    W.renderer.shadowMap.needsUpdate = true;
    W.renderer.setPixelRatio(on ? 1 : Math.min(window.devicePixelRatio, W.phone ? 1.25 : 1.5));
    W.resize();
    document.body.classList.toggle("lowpower", on);
  };
  let started = 0, errCount = 0, frameNo = 0;
  function loop(now) {
    requestAnimationFrame(loop);              // 先排下一格：就算某個動畫出錯，畫面也不會停住
    if (W.frozen) return;
    if (!started) started = now;
    const rawDt = (now - last) / 1000;
    const dt = Math.min(.05, rawDt); last = now;
    // 自動效能保護：開場 6 秒後才開始量；切換分頁等長暫停不算
    if (!W.lowPower && !W.capture && now - started > 6000 && rawDt < 3 && !document.hidden) {
      perf.t += rawDt; perf.n++;
      if (perf.t > 4) { if (perf.n / perf.t < 24) W.setLowPower(true); perf.t = 0; perf.n = 0; }
    }
    try {
      if (fly) {
        fly.t += dt / fly.dur; const k = fly.t >= 1 ? 1 : 1 - Math.pow(1 - fly.t, 3);
        W.controls.target.lerpVectors(fly.from.t, fly.to.t, k);
        W.camera.position.lerpVectors(fly.from.p, fly.to.p, k);
        if (fly.t >= 1) fly = null;
      }
      if (W.autoRotate && !fly) { W.controls.autoRotate = true; W.controls.autoRotateSpeed = .35; } else W.controls.autoRotate = false;
      W.controls.update();
    } catch (e) { if (errCount++ < 5) console.error(e); }
    W.anim.forEach((f) => { try { f(dt, now / 1000); } catch (e) { if (errCount++ < 5) console.error(e); } });
    listeners.forEach((f) => { try { f(dt, now / 1000); } catch (e) { if (errCount++ < 5) console.error(e); } });
    if (W.skipRender) return;                 // 全螢幕大樹蓋住 3D 時，不必繪製 3D
    // 陰影不必每格重算：一般每 3 格、降載時每 12 格更新一次
    frameNo++;
    if (W.renderer.shadowMap.enabled && frameNo % (W.lowPower ? 12 : 3) === 0) W.renderer.shadowMap.needsUpdate = true;
    W.renderer.render(W.scene, W.camera);
  }
  W.start = () => requestAnimationFrame(loop);
  // 測試用：快轉 n 影格後凍結
  W.step = function (n = 1, dt = 1 / 30) {
    for (let i = 0; i < n; i++) {
      if (fly) { fly.t = 1; W.controls.target.copy(fly.to.t); W.camera.position.copy(fly.to.p); fly = null; }
      W.controls.update(); W.anim.forEach((f) => f(dt, 0)); listeners.forEach((f) => f(dt, performance.now() / 1000));
    }
    W.renderer.render(W.scene, W.camera);
  };

  // 給人物與樹用的工具
  W.GEO = GEO; W.L = L; W.colored = colored; W.merge = merge;
  W.tilesOfScope = (s) => W.tiles.filter((t) => t.scope === Number(s));
  W.BUILDINGS = BUILDINGS; W.PLAZAS = PLAZAS; W.ROADS = ROADS; W.RIVER = RIVER; W.CAMPUS = CAMPUS;
  // 地面高度（人物走動用）：院區平台、環形步道、外圍地面
  W.groundY = function (x, z) {
    if (x > CAMPUS.x0 - 1 && x < CAMPUS.x1 + 1 && z > CAMPUS.z0 - 1 && z < CAMPUS.z1 + 1) return TOP;
    if (W.RX) { const e = Math.hypot(x / W.RX, z / W.RZ); if (Math.abs(e - 1) * Math.min(W.RX, W.RZ) < 2.2) return W.ringY(x, z) + .05; }
    return .1;
  };
  // 可以走的範圍：不走進河裡（碼頭除外）、不走出地圖
  W.clampWalk = function (x, z) {
    x = Math.max(-150, Math.min(150, x)); z = Math.max(-110, z);
    const bank = RIVER.z - RIVER.d / 2;
    const dock = (W.docks || []).find((d) => Math.abs(x - d.x) < 6);
    z = Math.min(z, dock ? bank + 6.5 : bank - 1.2);
    return { x, z };
  };
  window.World = W;
})();
