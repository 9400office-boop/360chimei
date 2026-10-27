/* =========================================================
 * 人資熱氣球：7 顆印著 CHIMEI 的熱氣球在院區上空巡航，
 * 不定時派送人力（撐降落傘的小人），降落到各範疇展台支援
 * ========================================================= */
(function () {
  const W = window.World, C = window.ISLAND_CONTENT;
  const V3 = THREE.Vector3;
  const COLORS = [
    ["#E5704F", "#FFF4E6"], ["#2E9C8F", "#FFFFFF"], ["#F2C94C", "#FFFFFF"], ["#7B4BB0", "#F3EAFB"],
    ["#2F6FC4", "#FFFFFF"], ["#3E8E41", "#F2F7E8"], ["#E98AA0", "#FFFFFF"]
  ];
  const TEXT_COL = ["#B84A2E", "#1E6F5C", "#9A7414", "#57327F", "#1F4F93", "#2B6B2E", "#B0506A"];

  // 球身：8 片彩色瓣
  function envelopeGeo(c1, c2) {
    const g = new THREE.SphereGeometry(3.2, 24, 16).toNonIndexed();
    const pos = g.attributes.position, n = pos.count, col = new Float32Array(n * 3);
    const a = new THREE.Color(c1), b = new THREE.Color(c2);
    for (let i = 0; i < n; i += 3) {
      const x = (pos.getX(i) + pos.getX(i + 1) + pos.getX(i + 2)) / 3, z = (pos.getZ(i) + pos.getZ(i + 1) + pos.getZ(i + 2)) / 3;
      const k = Math.floor(((Math.atan2(z, x) + Math.PI) / (Math.PI * 2)) * 8) % 2;
      const c = k ? a : b;
      for (let j = 0; j < 3; j++) { col[(i + j) * 3] = c.r; col[(i + j) * 3 + 1] = c.g; col[(i + j) * 3 + 2] = c.b; }
    }
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    g.scale(1, 1.18, 1); g.computeVertexNormals();
    return g;
  }
  // CHIMEI 字樣腰帶
  function bandTexture(textCol) {
    const cv = document.createElement("canvas"); cv.width = 1024; cv.height = 128;
    const x = cv.getContext("2d");
    x.fillStyle = "#FFFFFF"; x.fillRect(0, 0, 1024, 128);
    x.fillStyle = textCol; x.font = "900 86px Arial, Helvetica, sans-serif"; x.textAlign = "center"; x.textBaseline = "middle";
    x.fillText("CHIMEI", 256, 68); x.fillText("CHIMEI", 768, 68);
    x.fillStyle = textCol; x.fillRect(0, 0, 1024, 8); x.fillRect(0, 120, 1024, 8);
    const t = new THREE.CanvasTexture(cv); t.anisotropy = 4;
    return t;
  }

  const balloons = [], drops = [];
  const std = (c) => new THREE.MeshStandardMaterial({ color: c, flatShading: true });
  let charMat = null;

  function makeBalloon(i) {
    const g = new THREE.Group();
    const [c1, c2] = COLORS[i % COLORS.length];
    const env = new THREE.Mesh(envelopeGeo(c1, c2), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .6 }));
    env.position.y = 4.4; env.castShadow = true; g.add(env);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(3.26, 3.26, 1.25, 40, 1, true), new THREE.MeshStandardMaterial({ map: bandTexture(TEXT_COL[i % TEXT_COL.length]), side: THREE.DoubleSide, roughness: .6 }));
    band.position.y = 4.4; g.add(band);
    const skirt = new THREE.Mesh(new THREE.CylinderGeometry(1.5, .75, 1.4, 16, 1, true), std(c1)); skirt.material.side = THREE.DoubleSide; skirt.position.y = .55; g.add(skirt);
    for (let k = 0; k < 4; k++) {
      const a = k / 4 * Math.PI * 2 + Math.PI / 4;
      const rope = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, 1.7, 4), std(0x6B5A48));
      rope.position.set(Math.cos(a) * .55, -.75, Math.sin(a) * .55); rope.rotation.z = Math.cos(a) * .25; rope.rotation.x = -Math.sin(a) * .25; g.add(rope);
    }
    const basket = new THREE.Mesh(new THREE.BoxGeometry(1.2, .85, 1.2), std(0xB98A5E)); basket.position.y = -1.9; basket.castShadow = true; g.add(basket);
    const rim = new THREE.Mesh(new THREE.BoxGeometry(1.3, .14, 1.3), std(0x8A6A4A)); rim.position.y = -1.45; g.add(rim);
    const fire = new THREE.Mesh(new THREE.SphereGeometry(.22, 8, 6), new THREE.MeshBasicMaterial({ color: 0xFFB347 })); fire.position.y = -.9; g.add(fire);
    W.scene.add(g);
    const b = {
      g, fire, i,
      r: 52 + (i % 4) * 14, cx: (i % 2 ? 8 : -8), cz: 6 + (i % 3) * 6, a: i / 7 * Math.PI * 2, sp: (.035 + (i % 3) * .01) * (i % 2 ? 1 : -1),
      h: 26 + (i % 4) * 4.5, ph: i * 1.7, next: 6 + i * 2.5 + Math.random() * 6
    };
    balloons.push(b);
    W.vehicles.push({ key: "hrBalloon", obj: g, h: 10.5, main: i === 0 || i === 3 });
    return b;
  }

  // 派送一位支援人力
  function drop(b) {
    if (drops.length >= 8 || !window.Life || !Life.buildChar) return;
    const items = W.tiles.filter((t) => t.kind === "item");
    const tile = items[Math.floor(Math.random() * items.length)];
    const p = Avatar.presets[Math.floor(Math.random() * Avatar.presets.length)];
    const g = new THREE.Group();
    charMat = charMat || new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .75 });
    const body = new THREE.Mesh(Life.buildChar(p.id), charMat); body.castShadow = true; g.add(body);
    const chute = new THREE.Group(); chute.position.y = 3.3; g.add(chute);
    const canopy = new THREE.Mesh(new THREE.SphereGeometry(1.5, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: COLORS[b.i % COLORS.length][0], side: THREE.DoubleSide, flatShading: true }));
    canopy.scale.y = .6; chute.add(canopy);
    for (let k = 0; k < 4; k++) {
      const a = k / 4 * Math.PI * 2;
      const line = new THREE.Mesh(new THREE.CylinderGeometry(.015, .015, 2, 3), std(0xFFFFFF));
      line.position.set(Math.cos(a) * .7, -1, Math.sin(a) * .7); line.rotation.z = Math.cos(a) * .55; line.rotation.x = -Math.sin(a) * .55; chute.add(line);
    }
    const start = b.g.position.clone(); start.y -= 2.6;
    g.position.copy(start);
    W.scene.add(g);
    const ang = Math.random() * Math.PI * 2, rr = 1.5 + Math.random() * 2.5;
    const target = new V3(tile.x + Math.cos(ang) * rr, W.TOP, tile.z + Math.sin(ang) * rr);
    drops.push({ g, chute, start, target, t: 0, dur: (start.y - W.TOP) / 2.6, landed: 0, scope: tile.scope });
    if (Balloons.onDrop) Balloons.onDrop(tile.scope, p.id);
  }

  function update(dt, t) {
    balloons.forEach((b) => {
      b.a += b.sp * dt;
      b.g.position.set(b.cx + Math.cos(b.a) * b.r, b.h + Math.sin(t * .6 + b.ph) * .8, b.cz + Math.sin(b.a) * b.r * .78);
      b.g.rotation.y += dt * .12;
      b.fire.scale.setScalar(.8 + Math.abs(Math.sin(t * 7 + b.ph)) * .5);
      b.next -= dt;
      if (b.next <= 0 && !(window.Life && Life.People.paused)) { drop(b); b.next = 16 + Math.random() * 18; }
    });
    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i];
      if (!d.landed) {
        d.t += dt / d.dur;
        const k = Math.min(1, d.t), e = k * k * (3 - 2 * k);
        d.g.position.set(d.start.x + (d.target.x - d.start.x) * e, d.start.y + (d.target.y - d.start.y) * k, d.start.z + (d.target.z - d.start.z) * e);
        d.g.rotation.z = Math.sin(t * 2 + i) * .12;
        d.chute.rotation.y += dt * .8;
        if (k >= 1) { d.landed = .001; d.g.rotation.z = 0; }
      } else {
        d.landed += dt;
        d.chute.scale.setScalar(Math.max(.001, 1 - d.landed / 1.5));
        d.chute.visible = d.landed < 1.5;
        if (d.landed > 1.5 && d.landed < 14) { d.g.rotation.y += dt * .5; d.g.children[0].position.y = Math.abs(Math.sin(d.landed * 6)) * .08; }
        if (d.landed > 14) d.g.scale.setScalar(Math.max(.001, 1 - (d.landed - 14) / 1.2));
        if (d.landed > 15.2) { W.scene.remove(d.g); drops.splice(i, 1); }
      }
    }
  }

  const Balloons = {
    balloons, drops, onDrop: null,
    init(n = 7) { for (let i = 0; i < n; i++) makeBalloon(i); W.onFrame(update); },
    dropNow() { balloons.forEach((b, i) => { if (i % 2 === 0) drop(b); }); }
  };
  window.Balloons = Balloons;
})();
