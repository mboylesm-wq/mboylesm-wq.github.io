// FX Lab effects, part 3: "what if" ghost lines (14 Nov 2026). Registered into core.js (see there).
//
// A "what if" line is the continuation a viewer was tempted to try (plan `visual.lines`): an alternative move, the answer
// to it, and why it fails. Until 14 Nov 2026 it was hand-drawn inside src/info/Board.tsx on a fixed 24-frame beat, so it
// ran about 3 s ahead of the narrator and could not be chosen or tuned anywhere. It is an effect family now: the event
// (`type: "whatif"`) carries the whole line in `a.line`, every step already in canvas pixels and timed to its own word by
// tools/prepare.mjs, and these effects draw it — so the FX Lab preview and the render are the same picture.
//
// The line's clock lives in `a.line`: { t0, steps: [{x0,y0,x1,y1,at,piece,san}], endAt (the rewind), after (scene end),
//   label, badge, rewind }. `fx.dur` is only a safety net (98): the line's own times decide when anything is on screen.
(function (root) {
  "use strict";
  const F = typeof module === "object" && module.exports && typeof require === "function" ? require("./core.js") : root.PnoyFX;
  const { E, clamp, lerp, rgba, font, piece, fillSq, TAU } = F._lib;
  const FX = [];
  const add = (cat, on, list) => list.forEach((e) => FX.push(Object.assign({ cat, on, layer: "over", dur: 98 }, e)));

  const DRAW = 0.4;    // seconds the pen takes to draw one arrow
  const TRAVEL = 0.34; // seconds the ghost piece takes to walk its arrow (after the arrow is drawn)
  const FADE = 0.36;   // seconds the whole line lets go at the end (the board returns to the puzzle)
  const C1 = "#06B6D4"; // the tempting move
  const C2 = "#EF4444"; // the punishment it allows
  const col = (k) => (k === 0 ? C1 : C2);

  // a step's alpha: in at once, out over FADE once the line has ended (never a one-frame disappearance)
  const life = (a, st) => {
    const L = a.line, tin = clamp((a.t - st.at) / 0.12, 0, 1);
    const tout = a.t > L.endAt ? clamp(1 - (a.t - L.endAt) / FADE, 0, 1) : 1;
    return tin * tout;
  };
  const drawn = (a, st) => E.out(clamp((a.t - st.at) / DRAW, 0, 1));
  // a step's piece leaves the board when a later step takes it (a capture) or takes its square
  const goneAt = (L, k) => {
    const st = L.steps[k];
    for (let j = k + 1; j < L.steps.length; j++) {
      const o = L.steps[j];
      if (o.from === st.to) return o.at;
      if (o.to === st.to && /x/.test(o.san)) return o.at;
    }
    return Infinity;
  };
  const atEnd = (a) => a.t > a.line.after; // the scene is over: nothing of the line is on screen any more

  // the arrow: drawn over DRAW seconds by a pen that carries the head with it, so the eye follows the tip
  function arrow(ctx, a, st, k, o) {
    const al = life(a, st), p = drawn(a, st);
    if (al <= 0.01 || p <= 0.002) return;
    const c = col(k), x2 = lerp(st.x0, st.x1, p), y2 = lerp(st.y0, st.y1, p);
    const dx = st.x1 - st.x0, dy = st.y1 - st.y0, len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len, S = a.S;
    ctx.save(); ctx.globalAlpha = al; ctx.strokeStyle = rgba(c, 0.95); ctx.fillStyle = rgba(c, 0.98); ctx.lineCap = "round";
    if (o.glow) { ctx.globalCompositeOperation = "lighter"; ctx.strokeStyle = rgba(c, 0.22); ctx.lineWidth = S * 0.26; ctx.beginPath(); ctx.moveTo(st.x0, st.y0); ctx.lineTo(x2, y2); ctx.stroke(); ctx.globalCompositeOperation = "source-over"; }
    ctx.strokeStyle = rgba(c, 0.95); ctx.lineWidth = S * (o.w || 0.1);
    if (o.dash) { ctx.setLineDash([S * 0.22, S * 0.14]); ctx.lineDashOffset = -a.t * S * 1.6; }
    ctx.beginPath(); ctx.moveTo(st.x0, st.y0); ctx.lineTo(x2, y2); ctx.stroke();
    const h = clamp((p - 0.72) / 0.28, 0, 1);
    if (h > 0.01) {
      const hl = S * 0.36 * h, hw = S * 0.24 * h;
      ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - ux * hl - uy * hw, y2 - uy * hl + ux * hw);
      ctx.lineTo(x2 - ux * hl * 0.72, y2 - uy * hl * 0.72);
      ctx.lineTo(x2 - ux * hl + uy * hw, y2 - uy * hl - ux * hw);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }

  // the imagined piece: it stands on the from-square from the moment its step starts (the host hides the real piece on
  // that square at the same instant, so nothing ever blinks), waits for the arrow to reach it, then walks, hops, lands
  function ghost(ctx, a, st, k, o) {
    const al = life(a, st);
    if (!st.piece || al <= 0.01 || a.t < st.at || a.t >= goneAt(a.line, k)) return;
    const q = E.inOut(clamp((a.t - st.at - DRAW * 0.55) / TRAVEL, 0, 1));
    const x = lerp(st.x0, st.x1, q), y = lerp(st.y0, st.y1, q), S = a.S;
    const hop = Math.sin(q * Math.PI) * S * (o.hop == null ? 0.18 : o.hop);
    ctx.save(); ctx.globalAlpha = al * (o.alpha == null ? 0.94 : o.alpha);
    ctx.shadowColor = rgba(col(k), 0.75); ctx.shadowBlur = S * 0.22;
    piece(ctx, a, st.piece, x, y - hop, S * 0.96, 0, 1);
    ctx.restore();
  }

  // a rounded chip with a line of text in it (the IF label, the rewind chip): drawn on the board, never off it
  function chip(ctx, a, x, y, text, o) {
    o = o || {};
    const fs = a.S * (o.size || 0.26);
    ctx.save(); ctx.font = font(fs, 800); ctx.textAlign = "left"; ctx.textBaseline = "middle";
    const w = ctx.measureText(text).width, padX = fs * 0.6, padY = fs * 0.42, h = fs + padY * 2, tw = w + padX * 2;
    const left = clamp(x - tw / 2, a.bx - a.S + 3, a.bx + a.bs - tw - 3), top = y - h / 2;
    ctx.globalAlpha = o.alpha == null ? 1 : o.alpha;
    const r = h * 0.32;
    ctx.beginPath();
    ctx.moveTo(left + r, top); ctx.lineTo(left + tw - r, top); ctx.quadraticCurveTo(left + tw, top, left + tw, top + r);
    ctx.lineTo(left + tw, top + h - r); ctx.quadraticCurveTo(left + tw, top + h, left + tw - r, top + h);
    ctx.lineTo(left + r, top + h); ctx.quadraticCurveTo(left, top + h, left, top + h - r);
    ctx.lineTo(left, top + r); ctx.quadraticCurveTo(left, top, left + r, top); ctx.closePath();
    ctx.fillStyle = o.fill || "rgba(8,14,20,.86)"; ctx.fill();
    ctx.lineWidth = Math.max(1, fs * 0.13); ctx.strokeStyle = o.border || "rgba(120,190,255,.8)"; ctx.stroke();
    ctx.fillStyle = o.color || "#cfe6ff"; ctx.fillText(text, left + padX, top + h / 2 + fs * 0.04);
    ctx.restore();
    return { w: tw, h, left, top };
  }

  add("whatif", ["whatif"], [
    // the arrows themselves (pick one)
    { id: "wi-arrow", name: "Dashed ghost arrows", draw: (ctx, a) => { if (!a.line) return; a.line.steps.forEach((st, k) => arrow(ctx, a, st, k, { dash: true })); } },
    { id: "wi-arrow-solid", name: "Solid chalk arrows", draw: (ctx, a) => { if (!a.line) return; a.line.steps.forEach((st, k) => arrow(ctx, a, st, k, { w: 0.075 })); } },
    { id: "wi-arrow-neon", name: "Neon ghost arrows", draw: (ctx, a) => { if (!a.line) return; a.line.steps.forEach((st, k) => arrow(ctx, a, st, k, { w: 0.085, glow: true })); } },
    // what the line is drawn on
    { id: "wi-squares", name: "Lit from/to squares", dur: 98, layer: "under", draw: (ctx, a) => {
      if (!a.line) return;
      a.line.steps.forEach((st, k) => { const al = life(a, st) * 0.22; if (al <= 0.01) return;
        ctx.save(); ctx.globalAlpha = al; ctx.fillStyle = col(k);
        fillSq(ctx, a, st.x0, st.y0);
        ctx.globalAlpha = life(a, st) * 0.3; fillSq(ctx, a, st.x1, st.y1); ctx.restore(); }); } },
    // the imagined piece (pick one, or neither and the arrows carry it)
    { id: "wi-piece", name: "Ghost piece slides", draw: (ctx, a) => { if (!a.line) return; a.line.steps.forEach((st, k) => ghost(ctx, a, st, k, {})); } },
    { id: "wi-piece-heavy", name: "Heavy ghost piece (big hop)", draw: (ctx, a) => { if (!a.line) return; a.line.steps.forEach((st, k) => ghost(ctx, a, st, k, { hop: 0.34, alpha: 0.88 })); } },
    { id: "wi-piece-fade", name: "Ghost piece fades in on its square", draw: (ctx, a) => {
      if (!a.line) return;
      a.line.steps.forEach((st, k) => { const al = life(a, st); if (!st.piece || al <= 0.01 || a.t >= goneAt(a.line, k) || a.t < st.at + DRAW * 0.8) return;
        const q = clamp((a.t - st.at - DRAW * 0.8) / 0.24, 0, 1);
        ctx.save(); ctx.globalAlpha = al * 0.9 * q; ctx.shadowColor = rgba(col(k), 0.7); ctx.shadowBlur = a.S * 0.2;
        piece(ctx, a, st.piece, st.x1, st.y1, a.S * 0.96, 0, 1); ctx.restore(); }); } },
    // the marks that make it readable as "an idea, not the game"
    { id: "wi-badge", name: "? / ?? badge on the try", draw: (ctx, a) => {
      const L = a.line; if (!L || !L.badge) return;
      const st = L.steps[0], t0 = st.at + DRAW + 0.1, q = E.back(clamp((a.t - t0) / 0.22, 0, 1)), al = life(a, st);
      if (q <= 0 || al <= 0.01) return;
      const r = a.S * 0.21, x = st.x1 + a.S * 0.3, y = st.y1 - a.S * 0.28;
      ctx.save(); ctx.globalAlpha = al; ctx.translate(x, y); ctx.scale(q, q);
      ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fillStyle = L.badge === "??" ? "#d9454b" : "#e58f2a"; ctx.fill();
      ctx.lineWidth = Math.max(1.5, a.S * 0.035); ctx.strokeStyle = "#ffffff"; ctx.stroke();
      ctx.fillStyle = "#ffffff"; ctx.font = font(r * 1.15, 900); ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(L.badge, 0, r * 0.06); ctx.restore(); } },
    { id: "wi-label", name: "IF … label chip", draw: (ctx, a) => {
      const L = a.line; if (!L || !L.label) return;
      const al = clamp(Math.min(1, (a.t - L.t0) / 0.2) * (a.t > L.endAt ? 1 - (a.t - L.endAt) / FADE : 1), 0, 1);
      if (al <= 0.01) return;
      chip(ctx, a, a.bx + a.bs / 2, a.by - a.S * 0.55, L.label, { alpha: al, border: "rgba(6,182,212,.85)", color: "#cff7ff" }); } },
    { id: "wi-rewind", name: "Back to the puzzle chip", layer: "text", draw: (ctx, a) => {
      const L = a.line; if (!L || !L.rewind || a.t < L.endAt || atEnd(a)) return;
      const al = clamp((a.t - L.endAt) / 0.14, 0, 1);
      // a soft flash under the chip: the board has just changed back, and the flash covers the jump
      const g = ctx.createRadialGradient(a.bx + a.bs / 2, a.by + a.bs / 2, a.S, a.bx + a.bs / 2, a.by + a.bs / 2, a.bs * 0.75);
      g.addColorStop(0, `rgba(8,14,20,${0.5 * al})`); g.addColorStop(1, "rgba(8,14,20,0)");
      ctx.fillStyle = g; ctx.fillRect(a.bx - a.S, a.by - a.S, a.bs + a.S * 2, a.bs + a.S * 2);
      chip(ctx, a, a.bx + a.bs / 2, a.by + a.bs / 2, "\u21BA " + L.rewind, { alpha: al, size: 0.3, border: "rgba(224,174,72,.75)", color: "#fbf6ea" }); } },
  ]);

  F.addEffects(FX);
})(typeof globalThis !== "undefined" ? globalThis : this);
