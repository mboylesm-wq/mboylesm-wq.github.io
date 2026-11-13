// PnoyChess FX engine core (FX Lab, 12 Nov 2026). ONE engine for the live FX Lab page (studio/fxlab.html) and the Remotion
// render (src/fx/FxCanvas.tsx): every effect is a pure function of (time, seed, geometry, colours), drawn on a 2D canvas,
// so the live preview and the rendered frame are the same picture. Only the seeded rng() below: deterministic by design.
//
// Files: core.js (helpers, registry, presets, runtime), fx-moves.js (move styles, captures), fx-moments.js (check, mate,
// castle/promotion, !!/?? marks, camera, screen, squares, text), backgrounds.js. engine.js loads them all for node/Remotion;
// the FX Lab page loads the four files in that order. Each file stays small (tests/ratchet.test.mjs).
//
// Layers, back to front: background -> board (host) -> "under" effects -> pieces (host, moved by a move style's pose) ->
// "over" effects -> "post" (whole frame) -> "text". Camera effects return a transform the host applies to the board.
//
// An effect: { id, name, cat, on: [events it suits], dur: seconds, layer, draw(ctx, a) | pose(k, a) | cam(a) }
// a (the "act"): t age s, k = t/dur (0..1), x,y centre of the target square (px), fx,fy centre of the from-square,
//   kx,ky the king's square (check/mate), S square size px, W,H frame px, bx,by,bs board left/top/size px,
//   c1,c2 colours, I intensity (0.2..2), seed, piece ("wq"), cap (captured piece type), img(type) -> drawable or null.
(function (root) {
  "use strict";
  const TAU = Math.PI * 2, PI = Math.PI;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v), lerp = (a, b, k) => a + (b - a) * k;
  // mulberry32: the only randomness, always seeded
  function rng(seed) { let s = (seed >>> 0) || 1; return function () { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const hash = (n) => { n = (n ^ 61) ^ (n >>> 16); n = n + (n << 3); n = n ^ (n >>> 4); n = Math.imul(n, 0x27d4eb2d); return ((n ^ (n >>> 15)) >>> 0) / 4294967296; };
  const E = {
    out: (k) => 1 - Math.pow(1 - k, 3), in: (k) => k * k * k, inOut: (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2),
    back: (k) => { const c = 1.70158, c3 = c + 1; return 1 + c3 * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); },
    elastic: (k) => (k === 0 || k === 1 ? k : Math.pow(2, -10 * k) * Math.sin((k * 10 - 0.75) * (TAU / 3)) + 1),
    bounce: (k) => { const n = 7.5625, d = 2.75; if (k < 1 / d) return n * k * k; if (k < 2 / d) return n * (k -= 1.5 / d) * k + 0.75; if (k < 2.5 / d) return n * (k -= 2.25 / d) * k + 0.9375; return n * (k -= 2.625 / d) * k + 0.984375; },
    expo: (k) => (k === 1 ? 1 : 1 - Math.pow(2, -10 * k)),
  };
  // colour helpers: "#rrggbb" -> rgba string with alpha
  function rgba(hex, a) { const h = (hex || "#ffffff").replace("#", ""); const f = h.length === 3 ? h.split("").map((c) => c + c).join("") : h; const n = parseInt(f.slice(0, 6), 16) || 0; return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${clamp(a, 0, 1).toFixed(3)})`; }
  function mix(h1, h2, k) { const p = (h) => { const f = (h || "#000").replace("#", ""); const n = parseInt(f.length === 3 ? f.split("").map((c) => c + c).join("") : f, 16) || 0; return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }; const a = p(h1), b = p(h2); return "#" + a.map((v, i) => Math.round(lerp(v, b[i], k)).toString(16).padStart(2, "0")).join(""); }
  const hsl = (h, s, l, a) => `hsla(${((h % 360) + 360) % 360},${s}%,${l}%,${a == null ? 1 : a})`;
  const fadeOut = (k, from) => (k < from ? 1 : clamp(1 - (k - from) / (1 - from), 0, 1));
  const font = (px, w) => `${w || 900} ${Math.round(px)}px "Inter","Arial Black","Segoe UI",system-ui,sans-serif`;

  // ---------- drawing primitives ----------
  function star(ctx, x, y, r, n, inner) { ctx.beginPath(); for (let i = 0; i < n * 2; i++) { const rr = i % 2 ? r * (inner || 0.45) : r, an = (i / (n * 2)) * TAU - PI / 2; ctx.lineTo(x + Math.cos(an) * rr, y + Math.sin(an) * rr); } ctx.closePath(); }
  function poly(ctx, pts) { ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath(); }
  function glowDot(ctx, x, y, r, col, a) { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgba(col, a)); g.addColorStop(0.35, rgba(col, a * 0.5)); g.addColorStop(1, rgba(col, 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
  function ring(ctx, x, y, r, w, col, a) { if (r <= 0 || a <= 0) return; ctx.strokeStyle = rgba(col, a); ctx.lineWidth = Math.max(0.5, w); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke(); }
  function bolt(ctx, x1, y1, x2, y2, R, segs, jag, col, w, a) {
    ctx.strokeStyle = rgba(col, a); ctx.lineWidth = w; ctx.lineJoin = "round"; ctx.beginPath(); ctx.moveTo(x1, y1);
    const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len;
    for (let i = 1; i < segs; i++) { const k = i / segs, o = (R() - 0.5) * jag; ctx.lineTo(x1 + dx * k + nx * o, y1 + dy * k + ny * o); }
    ctx.lineTo(x2, y2); ctx.stroke();
  }
  // big stamped word: pops in elastically, holds, fades. opts: size (squares), rot, fill, stroke, y offset (squares)
  function stamp(ctx, a, text, o) {
    o = o || {}; const k = a.k, sc = k < 0.25 ? E.elastic(k / 0.25) : 1, al = fadeOut(k, 0.7), px = (o.size || 1.1) * a.S * Math.min(1.3, a.I * 0.5 + 0.6);
    const cx = o.cx != null ? o.cx : a.bx + a.bs / 2, cy = (o.cy != null ? o.cy : a.by + a.bs / 2) + (o.dy || 0) * a.S;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(((o.rot == null ? -6 : o.rot) * PI) / 180); ctx.scale(sc, sc); ctx.globalAlpha *= al;
    ctx.font = font(px); ctx.textAlign = "center"; ctx.textBaseline = "middle";
    if (o.shadow !== false) { ctx.fillStyle = "rgba(0,0,0,0.55)"; ctx.fillText(text, px * 0.06, px * 0.08); }
    ctx.lineWidth = px * 0.16; ctx.strokeStyle = o.stroke || "#111"; ctx.lineJoin = "round"; ctx.strokeText(text, 0, 0);
    const g = ctx.createLinearGradient(0, -px / 2, 0, px / 2); g.addColorStop(0, o.fill || a.c1); g.addColorStop(1, o.fill2 || mix(o.fill || a.c1, "#000000", 0.35)); ctx.fillStyle = g; ctx.fillText(text, 0, 0);
    ctx.restore();
  }
  // generic deterministic particle emitter, the workhorse of most effects
  // o: n, speed (squares/s), dir (rad), spread (rad), grav (squares/s^2), drag, life (s), size (squares), cols [..],
  //    shape circle|square|spark|shard|star|ring|glyph|heart|smoke|coin|line, glyph, spin, add (lighter blend), ox/oy origin (px)
  function burst(ctx, a, o) {
    const R = rng(a.seed * 31 + (o.salt || 0)), S = a.S, n = Math.round((o.n || 24) * clamp(a.I, 0.3, 2.2)), t = a.t - (o.delay || 0);
    if (t < 0) return; ctx.save(); if (o.add) ctx.globalCompositeOperation = "lighter";
    const cols = o.cols || [a.c1, a.c2];
    for (let i = 0; i < n; i++) {
      const ang = (o.dir == null ? 0 : o.dir) + (R() - 0.5) * (o.spread == null ? TAU : o.spread), sp = (o.speed || 4) * S * (0.3 + R() * 0.7);
      const life = (o.life || 0.9) * (0.45 + R() * 0.55), sz = (o.size || 0.08) * S * (0.5 + R()), col = cols[(R() * cols.length) | 0], spin = (R() - 0.5) * (o.spin || 8), r0 = R();
      if (t > life) continue; const lk = t / life, d = o.drag || 2.2, dist = (sp * (1 - Math.exp(-d * t))) / d;
      const x = (o.ox != null ? o.ox : a.x) + Math.cos(ang) * dist + (o.jitter ? Math.sin(t * 9 + i) * o.jitter * S : 0), y = (o.oy != null ? o.oy : a.y) + Math.sin(ang) * dist + 0.5 * (o.grav || 0) * S * t * t;
      const al = (o.fadeIn ? Math.min(1, lk * 6) : 1) * (1 - Math.pow(lk, o.fadePow || 1.4));
      ctx.globalAlpha = al; ctx.fillStyle = col; ctx.strokeStyle = col;
      const sh = o.shape || "circle", s2 = sh === "smoke" ? sz * (1 + lk * 3) : sz * (o.shrink ? 1 - lk * 0.8 : 1);
      if (sh === "circle") { ctx.beginPath(); ctx.arc(x, y, s2, 0, TAU); ctx.fill(); }
      else if (sh === "glow") { glowDot(ctx, x, y, s2 * 3, col, al); }
      else if (sh === "smoke") { ctx.globalAlpha = al * 0.35; glowDot(ctx, x, y, s2 * 2, col, 1); }
      else if (sh === "square") { ctx.save(); ctx.translate(x, y); ctx.rotate(spin * t + r0 * 6); ctx.fillRect(-s2, -s2 * 0.6, s2 * 2, s2 * 1.2); ctx.restore(); }
      else if (sh === "spark") { const vx = Math.cos(ang) * sp * Math.exp(-d * t), vy = Math.sin(ang) * sp * Math.exp(-d * t) + (o.grav || 0) * S * t, tl = 0.04; ctx.lineWidth = Math.max(1, s2 * 0.6); ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - vx * tl, y - vy * tl); ctx.stroke(); }
      else if (sh === "line") { ctx.lineWidth = Math.max(1, s2 * 0.4); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - Math.cos(ang) * s2 * 6, y - Math.sin(ang) * s2 * 6); ctx.stroke(); }
      else if (sh === "shard") { ctx.save(); ctx.translate(x, y); ctx.rotate(spin * t + r0 * 6); poly(ctx, [[0, -s2 * 1.6], [s2 * 0.8, s2 * 0.6], [-s2 * 0.7, s2 * 0.9]]); ctx.fill(); ctx.restore(); }
      else if (sh === "star") { star(ctx, x, y, s2 * 1.4, 5, 0.45); ctx.fill(); }
      else if (sh === "ring") { ring(ctx, x, y, s2 * (1 + lk * 2), s2 * 0.3, col, al); }
      else if (sh === "heart") { ctx.save(); ctx.translate(x, y); ctx.scale(s2 / 10, s2 / 10); ctx.beginPath(); ctx.moveTo(0, 3); ctx.bezierCurveTo(-10, -6, -6, -14, 0, -7); ctx.bezierCurveTo(6, -14, 10, -6, 0, 3); ctx.fill(); ctx.restore(); }
      else if (sh === "coin") { ctx.save(); ctx.translate(x, y); ctx.scale(Math.abs(Math.cos(spin * t + r0 * 6)), 1); ctx.beginPath(); ctx.arc(0, 0, s2, 0, TAU); ctx.fill(); ctx.strokeStyle = "rgba(120,70,0,0.8)"; ctx.lineWidth = s2 * 0.2; ctx.stroke(); ctx.restore(); }
      else if (sh === "glyph") { ctx.font = font(s2 * 2.4, 700); ctx.textAlign = "center"; ctx.textBaseline = "middle"; const gl = o.glyphs || ["♚", "♛", "♜", "♝", "♞", "♟"]; ctx.fillText(gl[(r0 * gl.length) | 0], x, y); }
    }
    ctx.restore();
  }
  // draw a piece image centred at x,y with size sz (falls back to a disc with the letter)
  function piece(ctx, a, type, x, y, sz, rot, alpha) {
    const im = type && a.img ? a.img(type) : null; ctx.save(); ctx.globalAlpha *= alpha == null ? 1 : alpha; ctx.translate(x, y); if (rot) ctx.rotate(rot);
    if (im) ctx.drawImage(im, -sz / 2, -sz / 2, sz, sz);
    else if (type) { ctx.fillStyle = type[0] === "w" ? "#f4f1ea" : "#222"; ctx.beginPath(); ctx.arc(0, 0, sz * 0.32, 0, TAU); ctx.fill(); ctx.fillStyle = type[0] === "w" ? "#222" : "#f4f1ea"; ctx.font = font(sz * 0.4, 800); ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(type[1].toUpperCase(), 0, 0); }
    ctx.restore();
  }
  function sqRect(a, x, y) { return [x - a.S / 2, y - a.S / 2, a.S, a.S]; }

  // ---------- board themes ----------
  const THEMES = {
    wood: { light: "#e8cfa6", dark: "#a8774e", frame: "#4a2f1b" }, lichess: { light: "#f0d9b5", dark: "#b58863", frame: "#2b2521" }, green: { light: "#eeeed2", dark: "#769656", frame: "#262421" },
    blue: { light: "#dee3e6", dark: "#8ca2ad", frame: "#1f2a33" }, purple: { light: "#e8dff5", dark: "#8b6fb5", frame: "#2a1f3d" }, ice: { light: "#e6f7ff", dark: "#7fb3d5", frame: "#123047" },
    neon: { light: "#1a1a2e", dark: "#0f0f1a", frame: "#ff2bd6", line: "#00f0ff" }, marble: { light: "#f2f0ec", dark: "#9a9590", frame: "#3d3a36" }, coral: { light: "#f5e6da", dark: "#e07a5f", frame: "#3d1f17" },
    midnight: { light: "#4a5568", dark: "#1a202c", frame: "#0b0f17" }, gold: { light: "#f6e7b4", dark: "#c9a227", frame: "#3d2f05" }, glass: { light: "rgba(255,255,255,0.35)", dark: "rgba(255,255,255,0.12)", frame: "rgba(255,255,255,0.25)" },
  };

  // ---------- presets (what fires on which event) ----------
  const EVENTS = ["move", "capture", "check", "mate", "castle", "promo", "brilliant", "great", "blunder", "mistake", "start", "whatif"];
  const EVENT_NAMES = { move: "Every move", capture: "Capture", check: "Check", mate: "Checkmate", castle: "Castling", promo: "Promotion", brilliant: "Brilliant (!!)", great: "Great (!)", blunder: "Blunder (??)", mistake: "Mistake (?)", start: "Game start", whatif: "What if (ghost line)" };
  // the "what if" look out of the box: dashed arrows, the ghost piece, the ?/?? badge, the IF label and the rewind chip
  // (db/fx/preset.json's `map.whatif` replaces this list; a board with `visual.lines` always gets one of them)
  const WHATIF_DEFAULT = ["wi-arrow", "wi-piece", "wi-badge", "wi-label", "wi-rewind"];
  // Two profiles: long-form stays calmer (Mark, 6 Nov 2026: "the video blinks too much"); reels go big on big moments.
  const DEFAULTS = {
    long: { enabled: false, moveStyle: "mv-slide", background: { id: "gradient", b1: "#10151f", b2: "#1e293b", speed: 1 }, theme: "wood", colors: {}, c1: "#ffd166", c2: "#4cc9f0", intensity: 0.8, speed: 1,
      map: { move: ["sq-lastmove"], capture: ["cap-shockwave", "cam-punch"], check: ["chk-pulse", "chk-laser"], mate: ["mate-topple", "mate-slam", "mate-rays"], castle: ["sp-castle-shield"], promo: ["sp-promo-beam", "sp-promo-crown"], brilliant: ["an-brilliant-badge", "an-brilliant-burst"], great: ["an-great-badge"], blunder: ["an-blunder-badge", "an-blunder-red"], mistake: ["an-mistake-badge"], start: [], whatif: ["wi-arrow", "wi-piece", "wi-badge", "wi-label", "wi-rewind"] } },
    reel: { enabled: false, moveStyle: "mv-hop", background: { id: "starfield", b1: "#05030f", b2: "#1b1145", speed: 1 }, theme: "wood", colors: {}, c1: "#ffd166", c2: "#ff2d55", intensity: 1.3, speed: 1,
      map: { move: ["sq-lastmove", "sq-dust"], capture: ["cap-knockoff", "cap-explode", "cam-shake", "scr-flash"], check: ["chk-crosshair", "chk-text", "chk-siren"], mate: ["mate-topple", "mate-slam", "mate-fireworks", "mate-confetti", "mate-slowmo", "cam-shake"], castle: ["sp-castle-swirl"], promo: ["sp-promo-beam", "sp-promo-text"], brilliant: ["an-brilliant-word", "an-brilliant-burst", "scr-speedlines"], great: ["an-great-badge", "an-great-sparkle"], blunder: ["an-blunder-word", "an-blunder-crack", "an-blunder-sad"], mistake: ["an-mistake-wobble"], start: ["cam-push", "tx-subscribe-free"], whatif: ["wi-arrow", "wi-piece", "wi-badge", "wi-label", "wi-rewind"] } },
  };

  // registry: the effect and background files add themselves here
  const FX = [], BG = [], byId = {}, bgById = {};
  function addEffects(list) { list.forEach((f) => { if (byId[f.id]) throw new Error("PnoyFX: duplicate effect id " + f.id); byId[f.id] = f; FX.push(f); }); }
  function addBackgrounds(list) { list.forEach((b) => { if (bgById[b.id]) throw new Error("PnoyFX: duplicate background id " + b.id); bgById[b.id] = b; BG.push(b); }); }

  // ---------- runtime helpers for hosts ----------
  // Turn a move list (chess.js verbose moves + optional annotations/words) into timed events. moveAt[i] = seconds.
  // moveAt[i]: the piece starts to move; landAt[i]: it lands (captures, checks and the rest fire on landing)
  function eventsFor(moves, moveAt, notes, landAt) {
    const ev = [];
    moves.forEach((m, i) => {
      const t0 = moveAt[i], t = landAt && landAt[i] != null ? landAt[i] : t0, base = { i, t, from: m.from, to: m.to, san: m.san, piece: m.color + m.piece, cap: m.captured ? (m.color === "w" ? "b" : "w") + m.captured : null, king: m.kingSq, word: (notes && notes.words && notes.words[i]) || null };
      ev.push(Object.assign({ type: "move" }, base, { t: t0, land: t }));
      if (m.captured) ev.push(Object.assign({ type: "capture" }, base));
      if (/[kq]/.test(m.flags || "")) ev.push(Object.assign({ type: "castle" }, base));
      if (m.promotion) ev.push(Object.assign({ type: "promo" }, base));
      if (m.san.endsWith("#")) ev.push(Object.assign({ type: "mate" }, base, { t: t + 0.15 }));
      else if (m.san.endsWith("+")) ev.push(Object.assign({ type: "check" }, base));
      const sym = notes && notes.annotations && notes.annotations[i];
      if (sym === "!!") ev.push(Object.assign({ type: "brilliant" }, base)); else if (sym === "!") ev.push(Object.assign({ type: "great" }, base));
      else if (sym === "??") ev.push(Object.assign({ type: "blunder" }, base)); else if (sym === "?") ev.push(Object.assign({ type: "mistake" }, base)); else if (sym === "?!") ev.push(Object.assign({ type: "mistake" }, base));
    });
    return ev;
  }
  // ---------- "what if" ghost lines (14 Nov 2026) ----------
  // An alternative continuation is NOT a move played on the board, so it has no move/capture/check event: it becomes ONE
  // event that carries the whole line (`ev.line`) with every step already in canvas pixels, and the wi-* effects draw it
  // from that one clock. Before this, Board.tsx drew the line itself on a fixed 0.8 s beat: no word timing, no FX Lab.
  //   raw: { steps: [{ from, to, san, piece }], label, badge, rewind }  (Board.tsx `visual.lines`)
  //   sqXY(sq) -> [x, y] centre of a square in the canvas' own geometry
  //   o: { at: seconds per step measured from the line's start (prepare.mjs times them to the words), t0: seconds into the
  //        scene the line starts, gap, endAt: when the rewind chip takes over, after: the scene's end, only }
  // Every time inside `line` is relative to t0, because an effect's `a.t` is its age since the event fired.
  function whatIfEvent(raw, sqXY, o) {
    o = o || {};
    if (!raw || !Array.isArray(raw.steps) || !raw.steps.length) return null;
    const at = Array.isArray(o.at) ? o.at : [], gap = o.gap == null ? 0.8 : o.gap, t0 = o.t0 || 0;
    const rel = (x) => Math.max(0, +(x - t0).toFixed(3));
    const steps = raw.steps.map((s, k) => {
      const A = sqXY(s.from), B = sqXY(s.to);
      return { from: s.from, to: s.to, san: s.san || "", piece: s.piece || "", x0: A[0], y0: A[1], x1: B[0], y1: B[1],
        at: at[k] != null && isFinite(at[k]) ? rel(at[k]) : k * gap };
    });
    const last = steps[steps.length - 1].at;
    return { type: "whatif", i: o.i || 0, t: t0, land: t0, only: o.only || null,
      x: steps[0].x1, y: steps[0].y1, fx: steps[0].x0, fy: steps[0].y0, piece: steps[0].piece, san: steps[0].san,
      line: { t0: 0, endAt: o.endAt == null ? last + 1.2 : rel(o.endAt), after: o.after == null ? last + 2.5 : rel(o.after),
        label: raw.label || "", badge: raw.badge || "", rewind: raw.rewind || "", steps } };
  }
  // every active effect instance at time t: [{fx, ev, age}] for the given profile map
  function active(events, prof, t, opts) {
    const out = [], sp = (prof && prof.speed) || 1, map = (prof && prof.map) || {};
    events.forEach((ev, n) => {
      const ids = ev.only ? ev.only : (map[ev.type] || []);
      ids.forEach((id, j) => {
        const fx = byId[id]; if (!fx || !fx.draw && !fx.cam && !fx.shake && !fx.chroma) return;
        const age = (t - (ev.land != null ? ev.land : ev.t)) * sp; if (age < 0 || age > fx.dur) return;
        if (fx.dur >= 99) { const nxt = events.find((e2) => e2.type === "move" && e2.t > ev.t); if (ev.type === "move" && nxt && t >= nxt.t) return; }
        out.push({ fx, ev, age, seed: (ev.i + 1) * 977 + j * 131 + (n % 7) });
      });
    });
    return out;
  }
  // the moving piece's pose at time t (null when no move is in flight): {i, p, dx, dy, s, sx, sy, r, o, fx}
  function movePose(events, prof, t) {
    const style = byId[(prof && prof.moveStyle) || "mv-slide"] || byId["mv-slide"], sp = (prof && prof.speed) || 1;
    for (let n = events.length - 1; n >= 0; n--) { const ev = events[n]; if (ev.type !== "move") continue; const age = (t - ev.t) * sp; if (age < 0) continue; if (age > style.dur) return null; return { ev, k: age / style.dur, fx: style }; }
    return null;
  }

  // the camera this instant: zoom/pan/rotation/tilt plus shake, blur, chroma, a king to hide (toppled) and a king to shiver
  function camera(acts, mkAct, I) {
    const cam = { zoom: 1, cx: null, cy: null, rot: 0, dx: 0, dy: 0, tilt: 0, spin: 0, shake: 0, blur: 0, chroma: 0, kingShake: 0, shakeKing: null, hideKing: null };
    acts.forEach((x) => { const fx = x.fx, a = mkAct(x);
      if (fx.shake) cam.shake = Math.max(cam.shake, fx.shake * Math.exp(-x.age * 5) * (I || 1));
      if (fx.cam) { const c = fx.cam(a); if (c.zoom && c.zoom > cam.zoom) { cam.zoom = c.zoom; cam.cx = c.cx; cam.cy = c.cy; } cam.rot += c.rot || 0; cam.dx += c.dx || 0; cam.dy += c.dy || 0; cam.tilt += c.tilt || 0; cam.spin += c.spin || 0; }
      if (fx.blur) cam.blur = Math.max(cam.blur, Math.sin(PI * a.k) * 6);
      if (fx.chroma) cam.chroma = Math.max(cam.chroma, (1 - a.k) * 8 * (I || 1));
      if (fx.kingShake) { cam.kingShake = fx.kingShake; cam.shakeKing = x.ev.king; }
      if (fx.hidesKing) cam.hideKing = x.ev.king; });
    return cam;
  }
  // shake offset in px for time t (seconds)
  const shakeAt = (amp, t) => ({ x: Math.sin(t * 61) * amp + Math.sin(t * 37) * amp * 0.5, y: Math.cos(t * 53) * amp * 0.7 });

  const api = { version: "1.0.0", TAU, E, rng, hash, rgba, mix, hsl, burst, stamp, piece, glowDot, ring, bolt, FX, BG, byId, bgById, THEMES, EVENTS, EVENT_NAMES, DEFAULTS, WHATIF_DEFAULT, eventsFor, whatIfEvent, active, movePose, camera, shakeAt, addEffects, addBackgrounds,
    _lib: { TAU, PI, E, clamp, lerp, rng, hash, rgba, mix, fadeOut, font, star, poly, glowDot, ring, bolt, stamp, burst, piece, sqRect },
    count: () => ({ effects: FX.length, backgrounds: BG.length, moveStyles: FX.filter((f) => f.cat === "move").length }) };
  if (typeof module === "object" && module.exports) module.exports = api;
  root.PnoyFX = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
