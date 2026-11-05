/* =========================================================
 * 大螢幕背景音樂（只在大螢幕播放，參加者手機不播）
 *  - 遊戲中（報到、澆花、揭曉）：assets/music/game.mp3（循環；沒有檔案時改用程式合成配樂）
 *  - 收成大樹 → 第二期目標：assets/music/ending.mp3（同一首連續播放、循環；沒有檔案時保持安靜）
 *  瀏覽器規定要先點一下畫面才能出聲；右上角「音樂」按鈕可開關。
 * ========================================================= */
(function () {
  const FILES = { game: "assets/music/game.mp3", ending: "assets/music/ending.mp3" };
  const VOL = { game: .7, ending: .85, synth: 1 };
  let ac = null, master = null, gameBus = null, verb = null;
  let scene = null, wantOn = true, unlocked = false, timer = null, nextT = 0, step = 0;
  const files = {}, listeners = [];

  // ---------- 合成器 ----------
  function init() {
    if (ac) return;
    ac = new (window.AudioContext || window.webkitAudioContext)();
    const comp = ac.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 3;
    master = ac.createGain(); master.gain.value = 0; master.connect(comp); comp.connect(ac.destination);
    gameBus = ac.createGain(); gameBus.gain.value = 0; gameBus.connect(master);
    // 簡單殘響
    verb = ac.createConvolver();
    const len = ac.sampleRate * 2.2, buf = ac.createBuffer(2, len, ac.sampleRate);
    for (let c = 0; c < 2; c++) { const d = buf.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
    verb.buffer = buf;
    const vg = ac.createGain(); vg.gain.value = .28; verb.connect(vg); vg.connect(gameBus);
  }
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  function tone(t, midi, dur, { type = "sine", gain = .1, attack = .01, release = .3, wet = .3, bus = gameBus, detune = 0 } = {}) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.value = hz(midi); o.detune.value = detune;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + attack);
    g.gain.setTargetAtTime(0, t + Math.max(attack, dur - release), release / 3);
    o.connect(g); g.connect(bus); if (wet) { const w = ac.createGain(); w.gain.value = wet; g.connect(w); w.connect(verb); }
    o.start(t); o.stop(t + dur + release * 2);
  }
  // 木琴音色：基音＋高八度泛音，快速衰減
  function mallet(t, midi, gain = .09) {
    tone(t, midi, .5, { type: "sine", gain, attack: .004, release: .45, wet: .35 });
    tone(t, midi + 24, .12, { type: "sine", gain: gain * .25, attack: .002, release: .1, wet: .2 });
  }
  let noiseBuf = null;
  function shaker(t, gain = .018) {
    if (!noiseBuf) { noiseBuf = ac.createBuffer(1, ac.sampleRate * .1, ac.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noiseBuf; f.type = "highpass"; f.frequency.value = 7000;
    g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(.0001, t + .07);
    s.connect(f); f.connect(g); g.connect(gameBus); s.start(t); s.stop(t + .1);
  }

  // 輕快遊戲配樂：C 大調 I–vi–IV–V，每小節 8 個八分音符
  const BPM = 100, E8 = 60 / BPM / 2;
  const CHORDS = [[48, 52, 55, 60], [45, 48, 52, 57], [41, 45, 48, 53], [43, 47, 50, 55], [48, 52, 55, 60], [45, 48, 52, 57], [41, 45, 48, 53], [43, 47, 50, 55]];
  const PENTA = [72, 74, 76, 79, 81, 84, 86, 88];
  // 兩段固定旋律輪替，聽起來像有主題的遊戲音樂
  const MELODY = [
    [0, 2, 4, -1, 3, 2, 0, -1], [2, -1, 1, 0, -1, 4, 3, -1], [1, 2, 3, -1, 4, 3, 2, -1], [3, -1, 4, 5, 4, -1, 3, -1],
    [5, 4, 3, -1, 2, 3, 4, -1], [2, -1, 3, 2, 0, -1, 1, -1], [0, 1, 2, 3, -1, 2, 1, -1], [4, -1, 3, -1, 2, -1, -1, -1]
  ];
  function schedule() {
    while (nextT < ac.currentTime + .2) {
      const bar = Math.floor(step / 8) % CHORDS.length, e = step % 8, ch = CHORDS[bar], t = nextT;
      if (e === 0) ch.slice(1).forEach((n, i) => tone(t, n + 12, E8 * 8, { type: "triangle", gain: .028, attack: .4, release: .8, wet: .5, detune: (i - 1) * 4 }));   // 和弦鋪底
      if (e === 0 || e === 4) tone(t, ch[0] - 12, E8 * 1.6, { type: "triangle", gain: .13, attack: .01, release: .2, wet: 0 });          // 低音
      if (e === 6) tone(t, ch[0] - 5, E8 * .9, { type: "triangle", gain: .07, attack: .01, release: .15, wet: 0 });
      const m = MELODY[bar][e]; if (m >= 0) mallet(t, PENTA[m] + ((Math.floor(step / 64) % 2) && m < 3 ? 12 : 0), .075);                 // 木琴旋律
      if (e % 2 === 1) mallet(t, ch[1 + (e % 3)] + 12, .022);                                                                         // 分解和弦點綴
      if (e % 2 === 1) shaker(t);
      nextT += E8; step++;
    }
  }

  // ---------- 音量淡入淡出 ----------
  function fadeTo(param, v, sec) { const t = ac.currentTime; param.cancelScheduledValues(t); param.setValueAtTime(param.value, t); param.linearRampToValueAtTime(v, t + sec); }
  function fadeEl(a, v, sec, done) {
    clearInterval(a._fade); const v0 = a.volume, t0 = performance.now();
    a._fade = setInterval(() => { const k = Math.min(1, (performance.now() - t0) / (sec * 1000)); a.volume = v0 + (v - v0) * k; if (k >= 1) { clearInterval(a._fade); if (done) done(); } }, 40);
  }
  function fileEl(k) {
    if (files[k] !== undefined) return files[k];
    const a = new Audio(); a.src = FILES[k]; a.loop = true; a.preload = "auto"; a.volume = 0;
    a.onerror = () => { files[k] = null; if (k === "game") apply(); };
    return (files[k] = a);
  }

  // 場景 → 音樂：遊戲中播 game.mp3（沒有檔案時改用程式合成配樂）；收成大樹與第二期目標「同一首」連續播放 ending.mp3
  function apply(fade = 1.6) {
    if (!ac || !unlocked) return;
    const on = wantOn;
    fadeTo(master.gain, on ? 1 : 0, .5);
    const track = scene === "game" ? "game" : (scene === "tree" || scene === "finale") ? "ending" : null;
    const gEl = fileEl("game");
    const useSynth = on && track === "game" && files.game === null;          // game.mp3 不存在時的備案
    if (useSynth && !timer) { nextT = ac.currentTime + .1; timer = setInterval(schedule, 40); }
    fadeTo(gameBus.gain, useSynth ? VOL.synth : 0, fade);
    if (!useSynth && timer) { const tt = timer; setTimeout(() => { if (timer === tt) { clearInterval(timer); timer = null; } }, fade * 1000 + 200); }
    ["game", "ending"].forEach((k) => {
      const want = on && track === k, a = want ? fileEl(k) : files[k];
      if (!a) return;
      if (want) { if (a.paused) a.play().catch(() => {}); fadeEl(a, VOL[k], k === "ending" ? Math.max(fade, 3) : fade); }   // 大樹音樂慢慢淡入
      else if (!a.paused) fadeEl(a, 0, fade, () => a.pause());                // 從大樹到第二期目標是同一首，不會重新開始
    });
    void gEl;
    listeners.forEach((f) => f());
  }
  function unlock() {
    if (unlocked) return;
    init(); ac.resume(); unlocked = true; apply(1);
  }
  ["pointerdown", "keydown", "touchstart"].forEach((ev) => window.addEventListener(ev, unlock, { capture: true, passive: true }));

  window.Music = {
    // 依活動階段切換：game / tree / finale
    setScene(s) { if (s === scene) return; scene = s; fileEl("game"); fileEl("ending"); apply(); },
    toggle() { wantOn = !wantOn; if (!unlocked) unlock(); else apply(.6); },
    get on() { return wantOn && unlocked; },
    get locked() { return !unlocked; },
    onChange(f) { listeners.push(f); },
    // 花朵盛開的小鈴聲
    chime() {
      if (!ac || !unlocked || !wantOn) return;
      const t = ac.currentTime + .02;
      [84, 88, 91, 96].forEach((n, i) => { tone(t + i * .09, n, .5, { gain: .05, attack: .005, release: .5, wet: .5, bus: master }); });
    }
  };
})();
