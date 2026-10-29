/* =========================================================
 * 360°深耕奇美 3D 生命：捏捏人（走動）、幼苗大樹、藤蔓光流、協作線
 * ========================================================= */
(function () {
  const W = window.World, C = window.ISLAND_CONTENT;
  const V3 = THREE.Vector3, M4 = THREE.Matrix4;
  const { GEO, L, colored, merge } = W;
  const TOP = W.TOP;

  // ---------- 3D 捏捏人 ----------
  const SKIN = ["#FFE2CC", "#F6CFAE", "#E9B892", "#C9906A"];
  const HAIR = ["#2B2220", "#4A3426", "#2B2220", "#6B4A32", "#1F1E2B", "#3A2A22", "#8E8A86"];
  const charGeoCache = {};
  const charMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .75 });

  function shade(hex, amt) {
    const c = new THREE.Color(hex); c.offsetHSL(0, 0, amt); return "#" + c.getHexString();
  }

  function buildChar(id) {
    if (charGeoCache[id]) return charGeoCache[id];
    const p = Avatar.get(id) || Avatar.presets[0];
    const role = Avatar.roles[p.role];
    const color = role.colors[p.variant], skin = SKIN[p.skin], hair = HAIR[p.hair];
    const I = new M4();
    const parts = [];
    const put = (g, col, m) => parts.push(colored(GEO[g], col, m));
    const o = role.outfit;
    const coat = o === "coat";
    const bodyCol = coat ? "#FFFFFF" : color;
    const pants = o === "scrubs" ? shade(color, -.12) : "#4A5568";
    // 腳
    put("box", "#3A3A44", L(I, -.11, .05, .04, .17, .1, .27)); put("box", "#3A3A44", L(I, .11, .05, .04, .17, .1, .27));
    put("cyl", pants, L(I, -.11, .28, 0, .085, .36, .085)); put("cyl", pants, L(I, .11, .28, 0, .085, .36, .085));
    // 身體
    put("taper", bodyCol, L(I, 0, .72, 0, .3, .52, .25));
    if (coat) { put("box", color, L(I, 0, .86, .19, .13, .2, .04)); put("box", "#E6EAEF", L(I, 0, .62, .23, .02, .3, .02)); }
    if (o === "scrubs") put("box", shade(color, -.08), L(I, .1, .66, .24, .1, .1, .03));
    if (o === "blazer") { put("box", "#FFFFFF", L(I, 0, .84, .19, .12, .22, .04)); put("box", ["#C9475B", "#2F6FC4", "#E0A23A"][p.variant % 3], L(I, 0, .8, .215, .045, .2, .02)); }
    if (o === "hoodie") put("torus", shade(color, -.1), L(I, 0, .98, -.06, .2, .2, .2, 0, Math.PI / 2.4));
    if (o === "apron") put("box", "#FFFFFF", L(I, 0, .64, .2, .34, .38, .04));
    if (o === "cardigan" || o === "polo") put("torus", shade(color, .15), L(I, 0, .97, 0, .15, .15, .2, 0, Math.PI / 2));
    // 手
    put("cyl", bodyCol, L(I, -.32, .74, 0, .07, .36, .07, 0, 0, -.25)); put("cyl", bodyCol, L(I, .32, .74, 0, .07, .36, .07, 0, 0, .25));
    put("sph", skin, L(I, -.37, .54, 0, .075, .075, .075)); put("sph", skin, L(I, .37, .54, 0, .075, .075, .075));
    // 頭
    put("sph", skin, L(I, 0, 1.3, 0, .36, .34, .34));
    put("sph", skin, L(I, -.34, 1.28, 0, .07, .08, .06)); put("sph", skin, L(I, .34, 1.28, 0, .07, .08, .06));
    put("sph", "#2B2B2B", L(I, -.12, 1.31, .31, .045, .055, .03)); put("sph", "#2B2B2B", L(I, .12, 1.31, .31, .045, .055, .03));
    put("sph", "#FF97A6", L(I, -.21, 1.21, .27, .06, .035, .03)); put("sph", "#FF97A6", L(I, .21, 1.21, .27, .06, .035, .03));
    put("box", "#8A4B3A", L(I, 0, 1.17, .325, .07, .02, .02));
    // 頭髮
    const st = p.style;
    put("hemi", hair, L(I, 0, 1.32, -.02, .38, .34, .37));
    if (st !== "spiky" && st !== "curly") put("sph", hair, L(I, st === "side" ? .06 : 0, 1.53, .2, .3, .1, .14, 0, 0, st === "side" ? -.25 : 0));
    if (st === "spiky") for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; put("cone", hair, L(I, Math.cos(a) * .18, 1.66, Math.sin(a) * .18, .09, .16, .09, 0, Math.sin(a) * .5, -Math.cos(a) * .5)); }
    if (st === "curly") for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; put("sph", hair, L(I, Math.cos(a) * .28, 1.5 + (i % 2) * .08, Math.sin(a) * .26, .12, .12, .12)); }
    if (st === "long") put("sph", hair, L(I, 0, 1.12, -.16, .37, .42, .22));
    if (st === "bob") put("sph", hair, L(I, 0, 1.22, -.07, .4, .28, .34));
    if (st === "ponytail") put("sph", hair, L(I, 0, 1.24, -.42, .11, .22, .11, 0, .4));
    if (st === "bun") put("sph", hair, L(I, 0, 1.7, -.1, .14, .14, .14));
    if (p.glasses) {
      put("torus", "#3A3A44", L(I, -.12, 1.31, .33, .085, .085, .085)); put("torus", "#3A3A44", L(I, .12, 1.31, .33, .085, .085, .085));
      put("box", "#3A3A44", L(I, 0, 1.31, .34, .08, .015, .015));
    }
    // 職類配件（只用造型表現，不寫字）
    role.acc.forEach((a) => {
      if (a === "stetho") { put("torus", "#5A6B7D", L(I, 0, .98, .02, .17, .17, .25, 0, Math.PI / 2.2)); put("sph", "#A9B5C2", L(I, 0, .76, .24, .05, .05, .03)); }
      if (a === "badge") put("box", "#FFFFFF", L(I, -.11, .86, .22, .09, .11, .02));
      if (a === "housebag") put("box", "#F2A65A", L(I, -.42, .44, .05, .2, .2, .12));
      if (a === "capsule") put("box", "#E25B6B", L(I, .42, .54, .06, .07, .16, .07, 0, 0, .6));
      if (a === "tube") put("cyl", "#E25B6B", L(I, .42, .6, .05, .04, .2, .04));
      if (a === "goggles") put("box", "#A6DCEC", L(I, 0, 1.47, .27, .5, .08, .06, 0, -.25));
      if (a === "xray") put("box", "#1F3550", L(I, -.43, .58, .06, .2, .26, .03));
      if (a === "dumbbell") { put("box", "#6B7785", L(I, .42, .52, .05, .04, .04, .26)); put("box", "#3E4A57", L(I, .42, .52, .18, .1, .1, .05)); put("box", "#3E4A57", L(I, .42, .52, -.08, .1, .1, .05)); }
      if (a === "puzzle") put("box", "#F2B53A", L(I, .42, .55, .08, .13, .13, .05));
      if (a === "book") put("box", shade(color, -.2), L(I, 0, .66, .26, .26, .2, .05));
      if (a === "apple") put("sph", "#E04848", L(I, .42, .56, .07, .08, .08, .08));
      if (a === "heart") put("sph", "#E25B7A", L(I, .1, .86, .22, .05, .05, .02));
      if (a === "lungs") { put("sph", "#F28C9A", L(I, -.06, .82, .22, .04, .06, .02)); put("sph", "#F28C9A", L(I, .06, .82, .22, .04, .06, .02)); }
      if (a === "bubble") put("sph", "#FFFFFF", L(I, .32, 1.78, 0, .11, .09, .05));
      if (a === "clipboard") put("box", "#C99A5B", L(I, -.42, .56, .08, .18, .24, .03));
      if (a === "laptop") { put("box", "#5C6B7A", L(I, 0, .58, .3, .34, .03, .22)); put("box", "#5C6B7A", L(I, 0, .7, .2, .34, .22, .02, 0, -.3)); }
    });
    const g = merge(parts);
    charGeoCache[id] = g;
    return g;
  }

  // ---------- 人物管理 ----------
  const ents = {};
  const seedGeo = new THREE.OctahedronGeometry(.22, 0);
  const hash = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); };
  function randInTile(t, rMin = 2.6, rMax = 5.2) {
    if (t.kind === "hub") { rMin = 3.2; rMax = 5.6; }
    const a = Math.random() * Math.PI * 2, r = rMin + Math.random() * (rMax - rMin);
    return new V3(t.x + Math.cos(a) * r, TOP, t.z + Math.sin(a) * r);
  }
  function homeTile(p, id) {
    if (!p.scope) return W.tileById.hub;
    const ts = W.tilesOfScope(p.scope);
    return ts[hash(id) % ts.length];
  }

  const People = {
    ents,
    spot: null,
    paused: false,
    sync(people, firstPaint) {
      const seen = new Set();
      Object.entries(people || {}).forEach(([id, p]) => {
        seen.add(id);
        let e = ents[id];
        if (!e) {
          const grp = new THREE.Group();
          const body = new THREE.Mesh(buildChar(p.avatar), charMat); body.castShadow = true; grp.add(body);
          const seed = new THREE.Mesh(seedGeo, new THREE.MeshBasicMaterial({ color: 0xffffff })); seed.visible = false; seed.position.y = 2.05; grp.add(seed);
          const tile = homeTile(p, id);
          const start = firstPaint ? randInTile(tile) : randInTile(W.tileById.hub, 2.6, 4.2);
          grp.position.copy(start);
          if (!firstPaint) grp.position.y = TOP + 16;
          W.scene.add(grp);
          e = ents[id] = { id, grp, body, seed, avatar: p.avatar, tile, target: null, wait: Math.random() * 2, phase: Math.random() * 10, vy: 0, falling: !firstPaint, yaw: Math.random() * 6 };
        }
        if (e.avatar !== p.avatar) { e.body.geometry = buildChar(p.avatar); e.avatar = p.avatar; }
        const nt = homeTile(p, id);
        if (nt !== e.tile) { e.tile = nt; e.target = randInTile(nt); e.wait = 0; }
        e.name = p.name;
        const has = personDone(p);
        e.seed.visible = has;
        if (has) e.seed.material.color.set(C.scopes[p.scope - 1].color);
      });
      Object.keys(ents).forEach((id) => { if (!seen.has(id)) { W.scene.remove(ents[id].grp); delete ents[id]; } });
    },
    // 聚光：成員走到樹旁圍成一圈
    setSpot(spot, treePos) {
      People.spot = spot && treePos ? { id: spot.id, members: spot.members, pos: treePos } : null;
      Object.values(ents).forEach((e) => (e.spotTarget = null));
      if (People.spot) {
        Object.entries(spot.members).forEach(([f, pid], i) => {
          const e = ents[pid]; if (!e) return;
          const a = (Number(f) - 1) / 6 * Math.PI * 2 + .3;
          e.spotTarget = new V3(treePos.x + Math.cos(a) * 2.1, TOP, treePos.z + Math.sin(a) * 2.1);
        });
      }
    },
    update(dt, t) {
      Object.values(ents).forEach((e) => {
        const g = e.grp;
        if (e.falling) {
          e.vy -= 30 * dt; g.position.y += e.vy * dt;
          if (g.position.y <= TOP) { g.position.y = TOP; if (Math.abs(e.vy) > 4) e.vy = -e.vy * .3; else { e.vy = 0; e.falling = false; } }
          g.rotation.y += dt * 4;
          return;
        }
        if (People.paused && !e.spotTarget) { e.body.position.y = 0; e.body.rotation.z = 0; return; }
        const tgt = e.spotTarget || e.ctrl || e.target;
        let moving = false;
        if (tgt) {
          const dx = tgt.x - g.position.x, dz = tgt.z - g.position.z, d = Math.hypot(dx, dz);
          if (d > (e.ctrlSpeed ? .02 : .08)) {
            const sp = e.spotTarget ? 3.2 : e.ctrl ? (e.ctrlSpeed || (d > 30 ? 9 : 5.2)) : 1.3;   // 玩家走路比較快，遠距離小跑步
            const k = Math.min(1, sp * dt / d);
            g.position.x += dx * k; g.position.z += dz * k;
            const want = Math.atan2(dx, dz);
            let diff = ((want - g.rotation.y + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
            g.rotation.y += diff * Math.min(1, dt * 8);
            moving = true;
          } else if (e.ctrl && !e.spotTarget) {
            if (e.onArrive) { const f = e.onArrive; e.onArrive = null; try { f(); } catch (er) { console.error(er); } }
          } else if (!e.spotTarget) { e.target = null; e.wait = 1 + Math.random() * 4; }
          else {
            // 面向樹
            const pos = People.spot.pos;
            const want = Math.atan2(pos.x - g.position.x, pos.z - g.position.z);
            let diff = ((want - g.rotation.y + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
            g.rotation.y += diff * Math.min(1, dt * 6);
          }
        } else {
          e.wait -= dt;
          if (e.wait <= 0) e.target = randInTile(e.tile);
        }
        // 跟著地面高度（院區平台、環形步道、外圍地面）
        if (W.groundY) { const gy = W.groundY(g.position.x, g.position.z); g.position.y += (gy - g.position.y) * Math.min(1, dt * 8); }
        e.phase += dt * (moving ? 11 : 2);
        e.body.position.y = moving ? Math.abs(Math.sin(e.phase)) * .1 : 0;
        e.body.rotation.z = moving ? Math.sin(e.phase) * .09 : Math.sin(e.phase) * .02;
        e.seed.position.y = 2.05 + Math.sin(t * 2.4 + e.phase) * .08;
        e.seed.rotation.y += dt * 2;
      });
    },
    // 玩家操控：走到指定位置（抵達後原地站著，不再自己亂逛）
    drive(id, x, z, opts = {}) {
      const e = ents[id]; if (!e) return false;
      const c = W.clampWalk ? W.clampWalk(x, z) : { x, z };
      e.ctrl = new V3(c.x, TOP, c.z); e.onArrive = opts.onArrive || null; e.target = null; e.ctrlSpeed = opts.speed || null;
      if (opts.instant) { e.grp.position.set(c.x, W.groundY ? W.groundY(c.x, c.z) : TOP, c.z); e.falling = false; }
      return true;
    },
    release(id) { const e = ents[id]; if (e) { e.ctrl = null; e.onArrive = null; } },
    headPos(id) { const e = ents[id]; return e ? new V3(e.grp.position.x, e.grp.position.y + 1.6, e.grp.position.z) : null; }
  };

  // ---------- 幼苗與大樹 ----------
  const trees = {};
  const treeMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .8, flatShading: true });
  const SPOTS = [210, 330, 90, 150, 30, 270].map((d) => d * Math.PI / 180);
  function treeGeo(color) {
    const I = new M4(), parts = [];
    const put = (g, col, m) => parts.push(colored(GEO[g], col, m));
    const c = new THREE.Color(color), light = "#" + c.clone().lerp(new THREE.Color("#ffffff"), .35).getHexString(), mid = "#" + c.clone().lerp(new THREE.Color("#8CCB83"), .35).getHexString();
    put("cyl", "#A27B57", L(I, 0, .7, 0, .16, 1.4, .16));
    put("ico", mid, L(I, 0, 1.8, 0, 1, .9, 1, .3));
    put("ico", light, L(I, .45, 2.35, .1, .7, .65, .7, 1.1));
    put("ico", c.getStyle ? "#" + c.getHexString() : color, L(I, -.4, 2.3, -.2, .6, .55, .6, 2));
    put("ico", light, L(I, 0, 2.85, 0, .5, .45, .5, .7));
    return merge(parts);
  }
  const ringGeo = new THREE.RingGeometry(1.2, 1.6, 32); ringGeo.rotateX(-Math.PI / 2);
  const crownGeo = new THREE.TorusGeometry(.7, .12, 6, 20); crownGeo.rotateX(Math.PI / 2);

  const Trees = {
    trees,
    layout(sents) {
      // 幼苗種在行動廣場：依序填入各廣場的格位
      const slots = [];
      (W.PLAZAS || []).forEach((pz) => {
        const cols = Math.max(1, Math.floor(pz.w / 5)), rows = Math.max(1, Math.floor(pz.d / 5));
        for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++)
          slots.push(new V3(pz.x - pz.w / 2 + (c + .5) * pz.w / cols, TOP, pz.z - pz.d / 2 + (r + .5) * pz.d / rows));
      });
      // 交錯分配到三個廣場，讓每個廣場都有幼苗
      const byPlaza = []; let k = 0;
      (W.PLAZAS || []).forEach((pz) => { const n = Math.max(1, Math.floor(pz.w / 5)) * Math.max(1, Math.floor(pz.d / 5)); byPlaza.push(slots.slice(k, k + n)); k += n; });
      const order = [];
      for (let i = 0; order.length < slots.length; i++) byPlaza.forEach((l) => { if (l[i]) order.push(l[i]); });
      const pos = {}, cnt = {};
      sents.forEach((s, i) => {
        if (order[i]) { pos[s.id] = order[i].clone(); return; }
        const j = cnt[s.scope] = (cnt[s.scope] || 0); cnt[s.scope]++;
        const ts = W.tilesOfScope(s.scope), tile = ts[j % ts.length];
        const a = SPOTS[Math.floor(j / ts.length) % SPOTS.length];
        pos[s.id] = new V3(tile.x + Math.cos(a) * 6, TOP, tile.z + Math.sin(a) * 6);
      });
      return pos;
    },
    sync(sents, totals, spotId, top3) {
      const pos = Trees.layout(sents);
      const maxV = Math.max(1, ...sents.map((s) => totals[s.id] || 0));
      const seen = new Set();
      sents.forEach((s) => {
        seen.add(s.id);
        const sc = C.scopes[s.scope - 1];
        let tr = trees[s.id];
        if (!tr) {
          const g = new THREE.Group();
          const m = new THREE.Mesh(treeGeo(sc.color), treeMat); m.castShadow = true; g.add(m);
          const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: sc.color, transparent: true, opacity: .75 })); ring.position.y = .05; g.add(ring);
          const crown = new THREE.Mesh(crownGeo, new THREE.MeshBasicMaterial({ color: 0xFFD45E })); crown.visible = false; g.add(crown);
          g.scale.setScalar(.01);
          W.scene.add(g);
          tr = trees[s.id] = { g, m, ring, crown, scale: .01 };
        }
        tr.g.position.copy(pos[s.id]);
        const v = totals[s.id] || 0, ratio = v / maxV;
        tr.target = 1.3 + 1.7 * ratio + (spotId === s.id ? .5 : 0);
        tr.votes = v; tr.order = s.order; tr.scope = s.scope;
        tr.crown.visible = !!(top3 && top3.includes(s.id));
        tr.ring.material.opacity = spotId && spotId !== s.id ? .25 : .75;
      });
      Object.keys(trees).forEach((id) => { if (!seen.has(id)) { W.scene.remove(trees[id].g); delete trees[id]; } });
      return pos;
    },
    update(dt, t) {
      Object.values(trees).forEach((tr) => {
        tr.scale += (tr.target - tr.scale) * Math.min(1, dt * 3);
        tr.g.scale.setScalar(tr.scale);
        tr.ring.rotation.y += dt * .5;
        if (tr.crown.visible) { tr.crown.position.y = 3.5 + Math.sin(t * 2) * .12; tr.crown.rotation.y += dt; }
      });
    },
    topPos(id) { const tr = trees[id]; return tr ? new V3(tr.g.position.x, TOP + 3 * tr.scale, tr.g.position.z) : null; }
  };

  // ---------- 光流（作者 → 幼苗） ----------
  const BEADS = 16;
  const beadMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(.13, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }), 6 * BEADS);
  beadMesh.count = 0; beadMesh.frustumCulled = false;
  const _m = new M4(), _c = new THREE.Color();
  const Flow = {
    update(dt, t) {
      const sp = People.spot;
      if (!sp) { beadMesh.count = 0; return; }
      const dest = Trees.topPos(sp.id) || sp.pos.clone().setY(TOP + 2.5);
      let k = 0;
      Object.entries(sp.members).forEach(([f, pid]) => {
        const a = People.headPos(pid); if (!a) return;
        const mid = a.clone().lerp(dest, .5); mid.y += 5 + a.distanceTo(dest) * .15;
        const curve = new THREE.QuadraticBezierCurve3(a, mid, dest);
        _c.set(C.fields[f - 1].color);
        for (let i = 0; i < BEADS; i++) {
          const u = (i / BEADS + t * .35) % 1;
          const p = curve.getPoint(u);
          const s = .55 + Math.sin(u * Math.PI) * .7;
          _m.compose(p, new THREE.Quaternion(), new V3(s, s, s));
          beadMesh.setMatrixAt(k, _m); beadMesh.setColorAt(k, _c); k++;
        }
      });
      beadMesh.count = k;
      beadMesh.instanceMatrix.needsUpdate = true;
      if (beadMesh.instanceColor) beadMesh.instanceColor.needsUpdate = true;
    }
  };

  // ---------- 協作線（政策關聯 + 句子長出的連線） ----------
  const linkGroup = new THREE.Group();
  const sentGroup = new THREE.Group();
  function arc(a, b, h, color, opacity, radius = .12) {
    const mid = a.clone().lerp(b, .5); mid.y += h;
    const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
    const geo = new THREE.TubeGeometry(curve, 40, radius, 6, false);
    const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false }));
    return mesh;
  }
  function anchorOf(id) {
    if (id.startsWith("s")) { const st = W.stages.find((x) => x.id === id); return new V3(st.x, 2, st.z); }
    const t = W.tileById[id]; return new V3(t.x, TOP + 1.5, t.z);
  }
  const Links = {
    show: false,
    build(focusScope) {
      while (linkGroup.children.length) { const m = linkGroup.children.pop(); m.geometry.dispose(); }
      if (!Links.show && !focusScope) return;
      C.links.forEach((l) => {
        const hit = focusScope === "all" || !focusScope || l.a[0] === String(focusScope) || l.b[0] === String(focusScope);
        if (focusScope && focusScope !== "all" && !hit) return;
        const sc = l.a.startsWith("s") ? null : C.scopes[Number(l.a[0]) - 1];
        const col = focusScope && focusScope !== "all" ? C.scopes[Number(focusScope) - 1].color : "#FFFFFF";
        const a = anchorOf(l.a), b = anchorOf(l.b);
        linkGroup.add(arc(a, b, 4 + a.distanceTo(b) * .18, col, focusScope ? .95 : .7, focusScope ? .16 : .11));
      });
    },
    buildSent(sents, pos, spotId, visible) {
      while (sentGroup.children.length) { const m = sentGroup.children.pop(); m.geometry.dispose(); }
      if (!visible) return;
      sents.forEach((s) => (s.links || []).forEach((to) => {
        if (spotId && spotId !== s.id) return;
        const a = pos[s.id].clone(); a.y = TOP + 2.6;
        const b = W.scopeCenter[to].clone(); b.y = TOP + 1;
        sentGroup.add(arc(a, b, 6 + a.distanceTo(b) * .2, C.scopes[to - 1].color, spotId ? .85 : .5, spotId ? .1 : .07));
      }));
    }
  };

  // ---------- 花朵：每完成一句行動，就在社會情緒學習廣場或復原力廣場種下一朵；澆水 6 次盛開 ----------
  // stage 0 剛種下 → 1 發芽 → 2 長葉 → 3 結苞 → 4 花苞轉色 → 5 半開 → 6 盛開（與手機花園的插畫一致）
  const PETALS = window.FLOWER_PETALS;
  const flowerGeoCache = {};
  const flowerMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .7 });
  const STEM_H = [.18, .45, .7, .9, 1.0, 1.08, 1.1];
  function flowerGeo(ci, kind, st) {
    const k = ci + "_" + kind + "_" + st;
    if (flowerGeoCache[k]) return flowerGeoCache[k];
    const I = new M4(), parts = [], put = (g, col, m) => parts.push(colored(GEO[g], col, m));
    const col = PETALS[ci], h = STEM_H[st];
    put("sph", "#8C6A45", L(I, 0, .02, 0, .42, .08, .42));                      // 土堆
    if (st === 0) { put("sph", "#8A5A2B", L(I, 0, .08, 0, .13, .09, .1)); put("cyl", "#5E9E5A", L(I, .03, .16, 0, .03, .14, .03)); return (flowerGeoCache[k] = merge(parts)); }
    put("cyl", "#5E9E5A", L(I, 0, h / 2, 0, st < 2 ? .04 : .06, h, st < 2 ? .04 : .06));
    if (st === 1) { put("sph", "#86C27A", L(I, .1, h, 0, .13, .04, .07, 0, 0, -.5)); put("sph", "#6DB06A", L(I, -.1, h, 0, .13, .04, .07, 0, 0, .5)); }
    else {
      put("sph", "#6DB06A", L(I, .2, h * .32, 0, .2 + st * .01, .06, .11, 0, 0, -.5));
      put("sph", "#86C27A", L(I, -.18, h * .52, 0, .18 + st * .01, .06, .1, 0, 0, .5));
      if (st >= 4) put("sph", "#6DB06A", L(I, .16, h * .72, .05, .15, .05, .09, 0, 0, -.5));
    }
    if (st === 3) put("sph", "#7DBE6E", L(I, 0, h + .08, 0, .1, .15, .1));
    if (st === 4) { put("sph", col, L(I, 0, h + .12, 0, .13, .2, .13)); put("sph", "#6DB06A", L(I, 0, h + .03, 0, .14, .07, .14)); }
    if (st === 5) {
      for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; put("sph", col, L(I, Math.cos(a) * .1, h + .14, Math.sin(a) * .1, .09, .2, .07, -a, 0, 0)); }
      put("sph", "#6DB06A", L(I, 0, h + .03, 0, .14, .07, .14));
    }
    if (st === 6) {
      const n = kind === 0 ? 5 : kind === 1 ? 6 : 8, pr = kind === 2 ? .2 : .26;
      for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; put("sph", col, L(I, Math.cos(a) * .26, h + .05, Math.sin(a) * .26, pr, .07, .14, -a)); }
      put("sph", kind === 2 ? "#8A5A2B" : "#FFD34D", L(I, 0, h + .08, 0, .14, .1, .14));
    }
    return (flowerGeoCache[k] = merge(parts));
  }
  const flowers = {};
  const plazaSlots = {};
  const hitGeo = new THREE.SphereGeometry(.55, 8, 6);
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });   // 不繪製，只供點擊偵測
  const glowGeo = new THREE.RingGeometry(.5, .75, 24);
  function slotsFor(pz) {
    if (plazaSlots[pz.key]) return plazaSlots[pz.key];
    const sp = 2.3, cols = Math.max(1, Math.floor((pz.w - 1.2) / sp)), rows = Math.max(1, Math.floor((pz.d - 1.2) / sp));
    const rr = ((sd) => () => (sd = (sd * 9301 + 49297) % 233280) / 233280)(pz.key.charCodeAt(0) * 97);
    const out = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++)
      out.push(new V3(pz.x - pz.w / 2 + .6 + (c + .5) * (pz.w - 1.2) / cols + (rr() - .5) * .8, TOP, pz.z - pz.d / 2 + .6 + (r + .5) * (pz.d - 1.2) / rows + (rr() - .5) * .8));
    for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(rr() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
    return (plazaSlots[pz.key] = out);
  }
  const Flowers = {
    flowers,
    sync(people, instant, totals = {}, hidden = {}) {
      const plazas = (W.PLAZAS || []).filter((p) => p.flower);
      const seen = new Set(), BL = window.bloomAt ? bloomAt() : 6;
      plazas.forEach((pz) => {
        const list = Object.entries(people || {}).filter(([id, p]) => p.plaza === pz.key && personDone(p) && !hidden[id])
          .sort((a, b) => (a[1].submittedAt || 0) - (b[1].submittedAt || 0));
        const slots = slotsFor(pz);
        list.forEach(([id, p], i) => {
          seen.add(id);
          let f = flowers[id];
          const look = flowerLook(id), st = Math.round(Math.min(BL, totals[id] || 0) / BL * 6);
          if (!f) {
            const m = new THREE.Mesh(flowerGeo(look.ci, look.kind, st), flowerMat); m.castShadow = false;
            // 點擊用的透明感應球（花頭附近）
            const hit = new THREE.Mesh(hitGeo, hitMat); hit.position.y = .8; m.add(hit);
            m.userData.pid = id; hit.userData.pid = id;
            W.scene.add(m);
            f = flowers[id] = { m, s: instant ? 1 : 0, ph: (look.h % 100) / 10, st, pop: 0 };
          } else if (f.st !== st) {
            f.m.geometry = flowerGeo(look.ci, look.kind, st);
            if (st > f.st) f.pop = 1;                     // 長大時彈一下
            f.st = st;
          }
          // 盛開的花：地上一圈金色光暈
          if (st === 6 && !f.glow) {
            f.glow = new THREE.Mesh(glowGeo, new THREE.MeshBasicMaterial({ color: 0xFFD34D, transparent: true, opacity: .7, side: THREE.DoubleSide, depthWrite: false }));
            f.glow.rotation.x = -Math.PI / 2; f.glow.position.y = .06; f.m.add(f.glow);
          } else if (st < 6 && f.glow) { f.m.remove(f.glow); f.glow = null; }
          const pos = slots[i % slots.length], lap = Math.floor(i / slots.length);
          f.m.position.set(pos.x + lap * .7, pos.y, pos.z + lap * .5);
          f.m.rotation.y = (look.h % 628) / 100;
        });
      });
      Object.keys(flowers).forEach((id) => { if (!seen.has(id)) { W.scene.remove(flowers[id].m); delete flowers[id]; } });
    },
    update(dt, t) {
      Object.values(flowers).forEach((f) => {
        if (f.s < 1) f.s = Math.min(1, f.s + dt * 1.2);
        if (f.pop > 0) f.pop = Math.max(0, f.pop - dt * 1.6);
        const e = 1 - Math.pow(1 - f.s, 3), pop = Math.sin(f.pop * Math.PI) * .45;
        f.m.scale.setScalar(1.7 * e * (1 + pop + Math.sin(t * 1.8 + f.ph) * .03));
        if (f.glow) { const k = .5 + .5 * Math.sin(t * 2.4 + f.ph); f.glow.material.opacity = .35 + k * .4; f.glow.scale.setScalar(1 + k * .25); }
      });
    }
  };

  function init() {
    W.scene.add(beadMesh); W.scene.add(linkGroup); W.scene.add(sentGroup);
    W.onFrame((dt, t) => { People.update(dt, t); Trees.update(dt, t); Flow.update(dt, t); Flowers.update(dt, t); });
  }
  window.Life = { init, People, Trees, Links, Flowers, buildChar };
})();
