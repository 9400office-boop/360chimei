/* =========================================================
 * 360°深耕奇美 捏捏人：16 種醫療職類、50 種可選樣貌
 * 全部為原創向量圖，由程式組合產生
 * ========================================================= */
(function () {
  const SKIN = ["#FFE2CC", "#F6CFAE", "#E9B892", "#C9906A"];
  const HAIR = ["#2B2220", "#4A3426", "#2B2220", "#6B4A32", "#1F1E2B", "#3A2A22", "#8E8A86"];
  const STYLES = ["short", "long", "side", "ponytail", "bob", "spiky", "bun", "curly"];

  const ROLES = [
    { key: "doc", name: "醫師", outfit: "coat", colors: ["#7FB2E5", "#9AD0C2", "#F2B8C6", "#C9B6E4", "#F4D58D"], acc: ["stetho"] },
    { key: "nurse", name: "護理師", outfit: "scrubs", colors: ["#7EC8E3", "#F4A7B9", "#8FD6C2", "#B8A9E3", "#7FA7E8"], acc: ["badge", "pen"] },
    { key: "home", name: "居家護理師", outfit: "scrubs", colors: ["#8FD1B8", "#79B8D9", "#F2B48A", "#A8CC84", "#E3A2C4"], acc: ["housebag", "badge"] },
    { key: "pharm", name: "藥師", outfit: "coat", colors: ["#8FD6C2", "#F7C59F", "#A9C8F0", "#F2B8C6", "#BFD98A"], acc: ["capsule"] },
    { key: "lab", name: "醫事檢驗師", outfit: "coat", colors: ["#B8A9E3", "#7EC8E3", "#F4D58D", "#9AD0C2", "#F4A7B9"], acc: ["tube", "goggles"] },
    { key: "rad", name: "醫事放射師", outfit: "scrubs", colors: ["#4C6FA8", "#5D5A9E", "#3F8A8C", "#6A7FB5", "#7A5C9E"], acc: ["xray"] },
    { key: "pt", name: "物理治療師", outfit: "polo", colors: ["#3FA36B", "#2F8FC4", "#E07A3F", "#4D9C9A", "#8A6FC4"], acc: ["dumbbell"] },
    { key: "ot", name: "職能治療師", outfit: "polo", colors: ["#E8A33D", "#D9677F", "#5BAE8C", "#6C8FD6", "#B07CC9"], acc: ["puzzle"] },
    { key: "diet", name: "營養師", outfit: "apron", colors: ["#9CCB6B", "#F2A65A", "#7EC8B8", "#E79AA8", "#B6A3DE"], acc: ["apple"] },
    { key: "sw", name: "社工師", outfit: "cardigan", colors: ["#E69A6E", "#86B97A", "#C98BB9", "#E8C25C", "#7AA6D6"], acc: ["heart"] },
    { key: "rt", name: "呼吸治療師", outfit: "scrubs", colors: ["#56B4B0", "#6E9BD9", "#9C86D4", "#4FAE84", "#E08C8C"], acc: ["lungs", "badge"] },
    { key: "psy", name: "臨床心理師", outfit: "cardigan", colors: ["#9DB7D9", "#C9A7D9", "#A8D1A1", "#F0B98C", "#E3A5B5"], acc: ["bubble"] },
    { key: "cm", name: "個案管理師", outfit: "blazer", colors: ["#3F5B7A", "#6B4E71", "#4E6E58", "#8A5A44", "#2F4F6F"], acc: ["clipboard"] },
    { key: "it", name: "資訊／AI工程師", outfit: "hoodie", colors: ["#4A5A6E", "#3E7CB1", "#7B5EA7", "#2F8C7E", "#D9774A"], acc: ["laptop"] },
    { key: "admin", name: "行政管理", outfit: "blazer", colors: ["#2E3E56", "#5A4A6E", "#3C5A4A", "#6E4A3A", "#3A4A6A"], acc: ["tie", "idcard"] },
    { key: "edu", name: "教學研究人員", outfit: "coat", colors: ["#F4D58D", "#C9B6E4", "#9AD0C2", "#F2B8C6", "#7FB2E5"], acc: ["book"] }
  ];

  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) + amt, g = ((n >> 8) & 255) + amt, b = (n & 255) + amt;
    r = Math.max(0, Math.min(255, r)); g = Math.max(0, Math.min(255, g)); b = Math.max(0, Math.min(255, b));
    return "#" + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
  }

  // ---------- 頭髮 ----------
  function hairBack(style, c) {
    switch (style) {
      case "long": return `<path d="M19,50 C17,22 34,14 50,14 C66,14 83,22 81,50 L82,86 C74,90 68,86 66,80 L34,80 C32,86 26,90 18,86 Z" fill="${c}"/>`;
      case "bob": return `<path d="M20,50 C18,24 34,15 50,15 C66,15 82,24 80,50 L80,67 C74,70 70,67 68,63 L32,63 C30,67 26,70 20,67 Z" fill="${c}"/>`;
      case "ponytail": return `<ellipse cx="79" cy="44" rx="8" ry="15" transform="rotate(18 79 44)" fill="${c}"/>`;
      case "bun": return `<circle cx="50" cy="17" r="10" fill="${c}"/>`;
      default: return "";
    }
  }
  function hairFront(style, c) {
    const hi = shade(c, 28);
    switch (style) {
      case "short": return `<path d="M23,48 C21,24 36,17 50,17 C66,17 80,24 77,48 C75,39 69,32 60,30 C52,34 40,34 31,38 C27,41 25,44 23,48 Z" fill="${c}"/>`;
      case "spiky": return `<path d="M24,45 L22,32 L30,34 L31,22 L39,28 L44,16 L50,25 L57,15 L61,27 L70,21 L70,33 L78,31 L76,45 C70,35 60,31 50,31 C40,31 30,35 24,45 Z" fill="${c}"/>`;
      case "side":
      case "long": return `<path d="M23,52 C20,25 37,16 52,16 C68,17 81,28 77,52 C76,42 72,34 64,30 C57,34 47,33 39,31 C32,36 26,44 23,52 Z" fill="${c}"/><path d="M40,22 C48,19 58,20 64,25" stroke="${hi}" stroke-width="2" fill="none" stroke-linecap="round" opacity=".6"/>`;
      case "bob": return `<path d="M24,48 C22,27 36,19 50,19 C64,19 78,27 76,48 C71,38 62,35 50,37 C39,35 29,38 24,48 Z" fill="${c}"/>`;
      case "ponytail":
      case "bun": return `<path d="M24,46 C22,26 36,19 50,19 C64,19 78,26 76,46 C72,36 64,31 55,31 C47,35 36,35 29,38 C27,40 25,43 24,46 Z" fill="${c}"/>`;
      case "curly": {
        let s = "";
        const pts = [[26, 42], [27, 32], [33, 24], [41, 19], [50, 17], [59, 19], [67, 24], [73, 32], [74, 42], [36, 30], [46, 27], [56, 27], [65, 31]];
        pts.forEach(([x, y]) => (s += `<circle cx="${x}" cy="${y}" r="8" fill="${c}"/>`));
        return s;
      }
    }
    return "";
  }

  // ---------- 服裝 ----------
  function outfit(o, color, skin) {
    const dk = shade(color, -30);
    const torso = (fill, stroke) =>
      `<path d="M31,108 C31,86 36,74 50,74 C64,74 69,86 69,108 Z" fill="${fill}" ${stroke ? `stroke="${stroke}" stroke-width="1.2"` : ""}/>`;
    const arms = (fill, stroke) =>
      `<ellipse cx="30" cy="90" rx="6" ry="12" transform="rotate(14 30 90)" fill="${fill}" ${stroke ? `stroke="${stroke}" stroke-width="1"` : ""}/>` +
      `<ellipse cx="70" cy="90" rx="6" ry="12" transform="rotate(-14 70 90)" fill="${fill}" ${stroke ? `stroke="${stroke}" stroke-width="1"` : ""}/>` +
      `<circle cx="27.5" cy="101" r="4.6" fill="${skin}"/><circle cx="72.5" cy="101" r="4.6" fill="${skin}"/>`;
    switch (o) {
      case "coat":
        return arms("#FFFFFF", "#D5DCE5") + torso("#FFFFFF", "#D5DCE5") +
          `<path d="M43,75 L50,89 L57,75 C55,74 45,74 43,75 Z" fill="${color}"/>` +
          `<path d="M43,75 L48,98 M57,75 L52,98" stroke="#CBD3DD" stroke-width="1.4" fill="none"/>` +
          `<rect x="55" y="92" width="9" height="6" rx="1.5" fill="none" stroke="#CBD3DD" stroke-width="1.2"/>`;
      case "scrubs":
        return arms(color) + torso(color) +
          `<path d="M43,75 L50,86 L57,75" stroke="${dk}" stroke-width="2" fill="${shade(color, -12)}"/>` +
          `<rect x="36" y="93" width="9" height="7" rx="1.5" fill="${shade(color, -14)}"/>`;
      case "polo":
        return arms(color) + torso(color) +
          `<path d="M42,74 L50,81 L58,74 L56,71 L50,77 L44,71 Z" fill="${shade(color, 40)}"/>` +
          `<circle cx="50" cy="85" r="1.3" fill="${shade(color, 50)}"/><circle cx="50" cy="90" r="1.3" fill="${shade(color, 50)}"/>`;
      case "cardigan":
        return arms(color) + torso(color) +
          `<path d="M45,75 L50,108 L55,75 Z" fill="#FFFDF7"/>` +
          `<path d="M45,75 L50,108 M55,75 L50,108" stroke="${dk}" stroke-width="1.2"/>` +
          `<circle cx="47" cy="90" r="1.4" fill="${dk}"/><circle cx="48" cy="99" r="1.4" fill="${dk}"/>`;
      case "hoodie":
        return arms(color) + torso(color) +
          `<path d="M37,77 Q50,69 63,77 Q50,84 37,77 Z" fill="${dk}"/>` +
          `<path d="M46,80 L45,92 M54,80 L55,92" stroke="#FFFFFF" stroke-width="1.4" stroke-linecap="round"/>` +
          `<rect x="40" y="97" width="20" height="8" rx="3" fill="${shade(color, -16)}"/>`;
      case "blazer":
        return arms(color) + torso(color) +
          `<path d="M43,75 L50,93 L57,75 C55,74 45,74 43,75 Z" fill="#FFFFFF"/>` +
          `<path d="M43,75 L47,92 L50,93 M57,75 L53,92 L50,93" stroke="${shade(color, 30)}" stroke-width="1.4" fill="none"/>`;
      case "apron":
        return arms(color) + torso(color) +
          `<path d="M38,85 L62,85 L65,108 L35,108 Z" fill="#FFFFFF" stroke="#E2E6EA" stroke-width="1"/>` +
          `<path d="M41,85 L45,75 M59,85 L55,75" stroke="#FFFFFF" stroke-width="2.4"/>` +
          `<rect x="45" y="92" width="10" height="7" rx="1.5" fill="none" stroke="#E2E6EA" stroke-width="1.2"/>`;
    }
    return torso(color);
  }

  // ---------- 職類配件 ----------
  function accessory(a, color) {
    switch (a) {
      case "stetho":
        return `<path d="M42,76 C40,90 45,97 50,97 C55,97 60,90 58,76" stroke="#5A6B7D" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="50" cy="99" r="3.4" fill="#A9B5C2" stroke="#5A6B7D" stroke-width="1.4"/>`;
      case "badge":
        return `<rect x="54" y="84" width="9" height="11" rx="1.6" fill="#FFFFFF" stroke="#C5CDD6" stroke-width=".8"/><rect x="55.5" y="86" width="6" height="2" rx="1" fill="${shade(color, -40)}"/><circle cx="58.5" cy="91.5" r="1.6" fill="#E25B6B"/>`;
      case "pen":
        return `<rect x="38" y="88" width="2" height="7" rx="1" fill="#2F6FC4"/>`;
      case "housebag":
        return `<rect x="12" y="92" width="16" height="14" rx="3" fill="#F2A65A"/><path d="M16,92 C16,86 24,86 24,92" stroke="#B9732F" stroke-width="1.6" fill="none"/><path d="M15.5,100 L20,96 L24.5,100 L24.5,104 L15.5,104 Z" fill="#FFFFFF"/>`;
      case "capsule":
        return `<g transform="translate(77 95) rotate(-35)"><rect x="-7" y="-3.5" width="14" height="7" rx="3.5" fill="#FFFFFF" stroke="#C5CDD6"/><path d="M0,-3.5 L3.5,-3.5 A3.5,3.5 0 0 1 3.5,3.5 L0,3.5 Z" fill="#E25B6B"/><rect x="0" y="-3.5" width="3.6" height="7" fill="#E25B6B"/><path d="M3.5,-3.5 A3.5,3.5 0 0 1 3.5,3.5" fill="#E25B6B"/></g>`;
      case "tube":
        return `<rect x="73" y="82" width="6.5" height="18" rx="3.2" fill="#EAF6FF" stroke="#7A8FA6" stroke-width="1"/><rect x="73.6" y="91" width="5.3" height="8.4" rx="2.6" fill="#E25B6B"/>`;
      case "goggles":
        return `<rect x="33" y="27" width="34" height="8" rx="4" fill="#A6DCEC" stroke="#4A7C8F" stroke-width="1.2" opacity=".95"/>`;
      case "xray":
        return `<rect x="14" y="83" width="15" height="19" rx="2" fill="#1F3550"/><path d="M21.5,86 L21.5,99 M17,89 Q21.5,91 26,89 M17,93 Q21.5,95 26,93 M17,97 Q21.5,99 26,97" stroke="#CFE3F7" stroke-width="1" fill="none"/>`;
      case "dumbbell":
        return `<rect x="68" y="99.5" width="16" height="3" rx="1.5" fill="#6B7785"/><rect x="66" y="96" width="4" height="10" rx="1.5" fill="#3E4A57"/><rect x="82" y="96" width="4" height="10" rx="1.5" fill="#3E4A57"/>`;
      case "puzzle":
        return `<g transform="translate(76 96)"><rect x="-5" y="-5" width="10" height="10" rx="1.5" fill="#F2B53A"/><circle cx="0" cy="-6" r="2.6" fill="#F2B53A"/><circle cx="6" cy="0" r="2.6" fill="#F2B53A"/></g>`;
      case "book":
        return `<rect x="39" y="90" width="22" height="14" rx="1.5" fill="${shade(color, -40)}"/><rect x="41" y="91.5" width="18" height="11" rx="1" fill="#FFFDF5"/><path d="M50,91.5 L50,102.5" stroke="${shade(color, -40)}" stroke-width="1"/>`;
      case "apple":
        return `<circle cx="77" cy="98" r="5.4" fill="#E04848"/><path d="M77,93 C77,90 79,89 80,89" stroke="#6B4A32" stroke-width="1.2" fill="none"/><ellipse cx="80" cy="91.5" rx="2.4" ry="1.3" fill="#5BAE5B"/>`;
      case "heart":
        return `<path d="M58,86 C58,83.5 61.5,83.5 61.5,86 C61.5,83.5 65,83.5 65,86 C65,89 61.5,91 61.5,92 C61.5,91 58,89 58,86 Z" fill="#E25B7A"/>`;
      case "lungs":
        return `<path d="M41,85 L41,88" stroke="#C95C6E" stroke-width="1.2"/><ellipse cx="38.5" cy="92" rx="2.6" ry="4" fill="#F28C9A"/><ellipse cx="43.5" cy="92" rx="2.6" ry="4" fill="#F28C9A"/>`;
      case "bubble":
        return `<path d="M76,10 h16 a4,4 0 0 1 4,4 v9 a4,4 0 0 1 -4,4 h-9 l-4,4 v-4 h-3 a4,4 0 0 1 -4,-4 v-9 a4,4 0 0 1 4,-4 Z" fill="#FFFFFF" stroke="#D0C4E4" stroke-width="1.2"/><path d="M81,17 C81,15 84,15 84,17 C84,15 87,15 87,17 C87,19.5 84,21 84,22 C84,21 81,19.5 81,17 Z" fill="#E25B7A"/>`;
      case "clipboard":
        return `<rect x="13" y="84" width="15" height="19" rx="2" fill="#C99A5B"/><rect x="15" y="88" width="11" height="13" rx="1" fill="#FFFFFF"/><rect x="17" y="82.5" width="7" height="3.5" rx="1.2" fill="#8A8F96"/><path d="M17,92 h7 M17,95 h7 M17,98 h5" stroke="#9AA4AF" stroke-width="1"/>`;
      case "laptop":
        return `<rect x="35" y="88" width="30" height="17" rx="2" fill="#5C6B7A"/><rect x="31" y="104" width="38" height="3.5" rx="1.5" fill="#3E4A57"/><circle cx="50" cy="96" r="2.4" fill="#9FE3D8"/>`;
      case "tie":
        return `<path d="M50,79 L47.5,83 L50,96 L52.5,83 Z" fill="${["#C9475B", "#2F6FC4", "#E0A23A", "#3E8E41", "#7B4BB0"][Math.abs(color.charCodeAt(3)) % 5]}"/>`;
      case "idcard":
        return `<path d="M44,76 L56,92" stroke="#2F6FC4" stroke-width="0" fill="none"/>`;
    }
    return "";
  }

  // ---------- 臉 ----------
  function face(eyeStyle) {
    let eyes;
    if (eyeStyle === "happy") {
      eyes = `<path d="M36.5,51 Q40,46.5 43.5,51 M56.5,51 Q60,46.5 63.5,51" stroke="#2B2B2B" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
    } else {
      eyes = `<ellipse cx="40" cy="50" rx="2.6" ry="3.3" fill="#2B2B2B"/><ellipse cx="60" cy="50" rx="2.6" ry="3.3" fill="#2B2B2B"/>` +
        `<circle cx="41" cy="48.8" r="1" fill="#FFFFFF"/><circle cx="61" cy="48.8" r="1" fill="#FFFFFF"/>`;
    }
    return eyes +
      `<ellipse cx="34.5" cy="57" rx="4.2" ry="2.5" fill="#FF97A6" opacity=".45"/><ellipse cx="65.5" cy="57" rx="4.2" ry="2.5" fill="#FF97A6" opacity=".45"/>` +
      `<path d="M45.5,58.5 Q50,62.8 54.5,58.5" stroke="#8A4B3A" stroke-width="2" fill="none" stroke-linecap="round"/>`;
  }

  function build(p) {
    const role = ROLES[p.role];
    const skin = SKIN[p.skin], hair = HAIR[p.hair], color = role.colors[p.variant];
    const pants = role.outfit === "scrubs" ? shade(color, -18) : "#3C4A5C";
    let s = "";
    s += `<ellipse cx="50" cy="115" rx="24" ry="3.6" fill="#000" opacity=".12"/>`;
    s += hairBack(p.style, hair);
    s += `<rect x="39" y="102" width="9" height="12" rx="3" fill="${pants}"/><rect x="52" y="102" width="9" height="12" rx="3" fill="${pants}"/>`;
    s += `<ellipse cx="43" cy="114" rx="6" ry="2.6" fill="#3A3A44"/><ellipse cx="57" cy="114" rx="6" ry="2.6" fill="#3A3A44"/>`;
    s += outfit(role.outfit, color, skin);
    role.acc.forEach((a) => { if (a !== "goggles" && a !== "bubble") s += accessory(a, color); });
    s += `<circle cx="23.5" cy="51" r="4.6" fill="${skin}"/><circle cx="76.5" cy="51" r="4.6" fill="${skin}"/>`;
    s += `<circle cx="50" cy="47" r="27" fill="${skin}"/>`;
    s += hairFront(p.style, hair);
    s += face(p.eyes);
    if (p.glasses) {
      s += `<circle cx="40" cy="50" r="6.2" fill="#FFFFFF" fill-opacity=".18" stroke="#3A3A44" stroke-width="1.7"/><circle cx="60" cy="50" r="6.2" fill="#FFFFFF" fill-opacity=".18" stroke="#3A3A44" stroke-width="1.7"/><path d="M46.2,50 L53.8,50" stroke="#3A3A44" stroke-width="1.7"/>`;
    }
    role.acc.forEach((a) => { if (a === "goggles" || a === "bubble") s += accessory(a, color); });
    return s;
  }

  // ---------- 產生預設（共 50 種可選）----------
  const all = [];
  ROLES.forEach((role, r) => {
    for (let v = 0; v < 5; v++) {
      all.push({
        id: "a" + String(r * 5 + v + 1).padStart(2, "0"),
        role: r,
        roleName: role.name,
        variant: v,
        skin: (r + v * 3) % 4,
        hair: (r * 2 + v * 3) % HAIR.length,
        style: STYLES[(v * 3 + r) % STYLES.length],
        eyes: (r + v) % 3 === 0 ? "happy" : "dot",
        glasses: (r * 5 + v) % 6 === 0 || (role.key === "edu" && v % 2 === 0) || (role.key === "it" && v === 1)
      });
    }
  });
  // 每個職類挑 3 種樣貌（髮型差異最大的 0、2、4），醫師與護理師各多 1 種 → 16×3+2 = 50
  const KEEP = (p) => [0, 2, 4].includes(p.variant) || (p.variant === 1 && (ROLES[p.role].key === "doc" || ROLES[p.role].key === "nurse"));
  const presets = all.filter(KEEP);
  const byId = {};
  all.forEach((p) => (byId[p.id] = p));   // 舊資料仍可顯示

  window.Avatar = {
    roles: ROLES,
    presets,
    get: (id) => byId[id],
    // 回傳完整 <svg> 字串
    svg(id, attrs = "") {
      const p = byId[id] || presets[0];
      return `<svg viewBox="0 -2 100 122" xmlns="http://www.w3.org/2000/svg" ${attrs}>${build(p)}</svg>`;
    },
    // 回傳內部圖形（嵌入大 SVG 用）
    inner(id) { return build(byId[id] || presets[0]); }
  };
})();
