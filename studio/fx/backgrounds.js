// FX Lab animated backgrounds: shared drawing helpers + classic, weather, space & abstract backgrounds.
// Scenic forest, beach, landscape & venue backgrounds live in backgrounds-scenes.js. Registered into core.js.
(function (root) {
  "use strict";
  const F = typeof module === "object" && module.exports && typeof require === "function" ? require("./core.js") : root.PnoyFX;
  const { TAU, PI, lerp, rng, hash, rgba, mix, poly, glowDot, ring, bolt, star } = F._lib;
  const BG = [];
  const bg = (id, name, draw, opts) => BG.push(Object.assign({ id, name, draw }, opts || {}));

  // ---------- shared drawing helpers (exported on F._bg for backgrounds-scenes.js) ----------
  const lin = (ctx, W, H, c1, c2, an) => {
    const g = ctx.createLinearGradient(0, 0, Math.cos(an || PI / 2) * W, Math.sin(an || PI / 2) * H);
    g.addColorStop(0, c1); g.addColorStop(1, c2); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  };
  const sky = (ctx, W, H, stops, y0, y1) => {
    const g = ctx.createLinearGradient(0, y0 || 0, 0, y1 == null ? H : y1);
    stops.forEach(([k, col]) => g.addColorStop(k, col));
    ctx.fillStyle = g; ctx.fillRect(0, y0 || 0, W, (y1 == null ? H : y1) - (y0 || 0));
  };
  const rad = (ctx, x, y, r, stops) => {
    const rr = Math.max(0.5, r), g = ctx.createRadialGradient(x, y, 0, x, y, rr);
    stops.forEach(([k, col]) => g.addColorStop(k, col));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, rr, 0, TAU); ctx.fill();
  };
  const stars = (ctx, W, H, n, seed, t, sp) => {
    const R = rng(seed);
    for (let i = 0; i < n; i++) {
      const x = R() * W, y = R() * H, s = 0.6 + R() * 1.6, tw = 0.35 + 0.65 * Math.abs(Math.sin(t * (0.8 + R() * 1.8) * (sp || 1) + i * 1.7));
      ctx.fillStyle = `rgba(255,255,255,${tw.toFixed(3)})`; ctx.fillRect(x, y, s, s);
    }
  };
  function hills(ctx, W, H, baseY, amp, seed, col, jag) {
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, H);
    const step = Math.max(12, W / 56);
    for (let x = 0; x <= W + step; x += step) {
      const k = x / W, n1 = Math.sin(k * 6.2 + seed) * 0.5 + Math.sin(k * 13.7 + seed * 2.1) * 0.3;
      const n2 = jag ? Math.abs(Math.sin(k * 19 + seed * 3)) * -jag : Math.sin(k * 27 + seed * 1.3) * 0.15;
      ctx.lineTo(x, baseY + (n1 + n2) * amp);
    }
    ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
  }
  function pine(ctx, x, baseY, h, w, col, sway) {
    ctx.save(); ctx.translate(x, baseY); ctx.rotate(sway || 0); ctx.fillStyle = col;
    ctx.fillRect(-w * 0.08, -h * 0.18, w * 0.16, h * 0.18);
    for (let i = 0; i < 4; i++) {
      const y0 = -h * (0.14 + i * 0.19), y1 = y0 - h * (0.34 - i * 0.04), tw = w * (1 - i * 0.19) * 0.5;
      poly(ctx, [[-tw, y0], [0, y1], [tw, y0]]); ctx.fill();
    }
    ctx.restore();
  }
  function canopyTree(ctx, x, baseY, h, w, col, sway) {
    ctx.save(); ctx.translate(x, baseY); ctx.rotate(sway || 0); ctx.fillStyle = col;
    ctx.fillRect(-w * 0.09, -h * 0.65, w * 0.18, h * 0.65);
    [[0, -h * 0.72, w * 0.42], [-w * 0.24, -h * 0.58, w * 0.32], [w * 0.24, -h * 0.56, w * 0.3], [0, -h * 0.88, w * 0.3]].forEach(([cx, cy, r]) => {
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fill();
    });
    ctx.restore();
  }
  function palm(ctx, bx, by, h, lean, col, t, sp, phase) {
    const sw = Math.sin(t * 1.1 * sp + phase) * 0.06, tx = bx + lean * h + sw * h * 0.4, ty = by - h;
    ctx.strokeStyle = col; ctx.lineCap = "round";
    for (let i = 0; i < 10; i++) {
      const k0 = i / 10, k1 = (i + 1) / 10;
      const x0 = lerp(bx, tx, k0 * k0 * 0.4 + k0 * 0.6), y0 = lerp(by, ty, k0);
      const x1 = lerp(bx, tx, k1 * k1 * 0.4 + k1 * 0.6), y1 = lerp(by, ty, k1);
      ctx.lineWidth = Math.max(2, (1 - k0 * 0.65) * h * 0.065);
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    }
    ctx.fillStyle = col;
    for (let f = 0; f < 7; f++) {
      const baseAng = -PI + (f / 6) * PI + (lean > 0 ? 0.15 : -0.15) + Math.sin(t * 1.5 * sp + phase + f) * 0.07;
      const fl = h * (0.36 + (f % 2) * 0.08), ex = tx + Math.cos(baseAng) * fl, ey = ty + Math.sin(baseAng) * fl * 0.7 + fl * 0.25;
      const cx = tx + Math.cos(baseAng) * fl * 0.5, cy = ty + Math.sin(baseAng) * fl * 0.35 - fl * 0.12;
      ctx.lineWidth = Math.max(1.5, h * 0.014);
      ctx.beginPath(); ctx.moveTo(tx, ty); ctx.quadraticCurveTo(cx, cy, ex, ey); ctx.stroke();
      for (let lf = 1; lf <= 9; lf++) {
        const lk = lf / 10, lx = (1 - lk) * (1 - lk) * tx + 2 * (1 - lk) * lk * cx + lk * lk * ex;
        const ly = (1 - lk) * (1 - lk) * ty + 2 * (1 - lk) * lk * cy + lk * lk * ey;
        const ll = fl * 0.22 * Math.sin(lk * PI), side = baseAng > -PI / 2 ? 1 : -1;
        ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx + Math.cos(baseAng + side * 1.15) * ll * 0.4, ly + ll); ctx.lineTo(lx + Math.cos(baseAng) * fl * 0.05, ly + ll * 0.3); ctx.closePath(); ctx.fill();
      }
    }
  }
  function wave(ctx, W, H, baseY, amp, freq, phase, col, foamCol, foamW) {
    ctx.beginPath(); const pts = [];
    for (let x = 0; x <= W + 16; x += 14) {
      const y = baseY + Math.sin(x * freq + phase) * amp + Math.sin(x * freq * 2.1 - phase * 1.3) * amp * 0.35;
      pts.push([x, y]); x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fillStyle = col; ctx.fill();
    if (foamCol) {
      ctx.strokeStyle = foamCol; ctx.lineWidth = foamW || 2.5; ctx.lineCap = "round"; ctx.beginPath();
      pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
    }
  }
  function beams(ctx, sx, sy, len, n, a0, a1, col, alpha, t, sp) {
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < n; i++) {
      const an = lerp(a0, a1, i / Math.max(1, n - 1)) + Math.sin(t * 0.4 * sp + i * 1.7) * 0.04;
      const w = 0.05 + (i % 3) * 0.025, g = ctx.createLinearGradient(sx, sy, sx + Math.cos(an) * len, sy + Math.sin(an) * len);
      g.addColorStop(0, rgba(col, alpha * (0.65 + 0.35 * Math.sin(t * 0.7 * sp + i)))); g.addColorStop(1, rgba(col, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(sx, sy);
      ctx.lineTo(sx + Math.cos(an - w) * len, sy + Math.sin(an - w) * len);
      ctx.lineTo(sx + Math.cos(an + w) * len, sy + Math.sin(an + w) * len);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }
  function cloud(ctx, x, y, s, col, alpha) {
    ctx.save(); ctx.fillStyle = rgba(col, alpha);
    [[0, 0, 0.36], [0.34, -0.08, 0.42], [0.72, -0.02, 0.34], [1.02, 0.06, 0.26], [-0.3, 0.08, 0.25]].forEach(([dx, dy, r]) => {
      ctx.beginPath(); ctx.arc(x + dx * s, y + dy * s, r * s, 0, TAU); ctx.fill();
    });
    ctx.restore();
  }
  function shimmer(ctx, cx, y0, y1, w0, w1, t, sp, col, n) {
    const R = rng(91);
    for (let i = 0; i < n; i++) {
      const k = R(), y = lerp(y0, y1, k * k), ww = lerp(w0, w1, k);
      const x = cx + Math.sin(t * (1.2 + R() * 1.6) * sp + i * 2.3) * ww * 0.55;
      const len = ww * (0.18 + R() * 0.25) * (0.6 + 0.4 * Math.sin(t * 2.5 * sp + i));
      ctx.fillStyle = rgba(col, (1 - k * 0.45) * (0.25 + 0.45 * Math.abs(Math.sin(t * 1.9 * sp + i))));
      ctx.fillRect(x - len / 2, y, len, Math.max(1.5, 1.5 + k * 2.5));
    }
  }
  function leafShape(ctx, x, y, sz, rot, col, kind) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.fillStyle = col; ctx.beginPath();
    if (kind === "petal") {
      ctx.moveTo(0, -sz); ctx.bezierCurveTo(sz * 0.9, -sz * 0.3, sz * 0.7, sz * 0.8, 0, sz * 0.9);
      ctx.bezierCurveTo(-sz * 0.7, sz * 0.8, -sz * 0.9, -sz * 0.3, 0, -sz);
    } else if (kind === "bamboo") {
      ctx.moveTo(0, -sz * 1.4); ctx.quadraticCurveTo(sz * 0.55, 0, 0, sz * 1.4); ctx.quadraticCurveTo(-sz * 0.55, 0, 0, -sz * 1.4);
    } else {
      ctx.moveTo(0, -sz); ctx.lineTo(sz * 0.4, -sz * 0.3); ctx.lineTo(sz * 0.95, -sz * 0.2); ctx.lineTo(sz * 0.45, sz * 0.2);
      ctx.lineTo(sz * 0.65, sz * 0.85); ctx.lineTo(0, sz * 0.55); ctx.lineTo(-sz * 0.65, sz * 0.85); ctx.lineTo(-sz * 0.45, sz * 0.2);
      ctx.lineTo(-sz * 0.95, -sz * 0.2); ctx.lineTo(-sz * 0.4, -sz * 0.3);
    }
    ctx.closePath(); ctx.fill(); ctx.restore();
  }
  F._bg = { lin, sky, rad, stars, hills, pine, canopyTree, palm, wave, beams, cloud, shimmer, leafShape };

  // ---------- WEATHER & SKY ----------
  bg("clouds", "Golden Hour Clouds", (ctx, t, W, H, c) => {
    const b1 = c.b1 || "#3a86ff", b2 = c.b2 || "#ffd6a5";
    sky(ctx, W, H, [[0, mix(b1, "#0d254d", 0.3)], [0.55, b1], [1, b2]]);
    rad(ctx, W * 0.25, H * 0.25, Math.min(W, H) * 0.28, [[0, "#fff8e7"], [0.35, rgba(b2, 0.5)], [1, rgba(b2, 0)]]);
    const R = rng(43);
    for (let i = 0; i < 12; i++) {
      const x = ((R() * W * 1.4 + t * (8 + R() * 16) * c.sp) % (W * 1.4)) - W * 0.2;
      cloud(ctx, x, H * (0.12 + R() * 0.72), Math.min(W, H) * (0.1 + R() * 0.14), mix("#ffffff", b2, 0.25), 0.55 + (i % 3) * 0.12);
    }
  }, { cat: "Weather & Sky", b1: "#3a86ff", b2: "#ffd6a5" });

  bg("snow", "Snowfall", (ctx, t, W, H, c) => {
    lin(ctx, W, H, "#162436", "#314964"); hills(ctx, W, H, H * 0.84, H * 0.04, 17, "#0d1724", 0);
    const R = rng(17);
    for (let i = 0; i < 180; i++) {
      const sp = (15 + R() * 45) * c.sp, s = 1 + R() * 3.5, x = (R() * W + Math.sin(t + i) * 22) % W, y = (t * sp + R() * H) % H;
      ctx.fillStyle = `rgba(255,255,255,${0.35 + R() * 0.6})`; ctx.beginPath(); ctx.arc(x, y, s, 0, TAU); ctx.fill();
    }
  }, { cat: "Weather & Sky" });

  bg("rain", "Rain storm", (ctx, t, W, H, c) => {
    lin(ctx, W, H, "#0d1117", "#1f2937"); const R = rng(19); ctx.strokeStyle = "rgba(170,190,220,0.4)"; ctx.lineWidth = 1;
    for (let i = 0; i < 200; i++) { const sp = (500 + R() * 400) * c.sp, x = (R() * W * 1.2 + t * 80) % (W * 1.2) - W * 0.1, y = (t * sp + R() * H) % H; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 4, y + 16); ctx.stroke(); }
    if (hash(Math.floor(t * 0.5) + 3) > 0.8 && (t * 0.5) % 1 < 0.06) { ctx.fillStyle = "rgba(220,230,255,0.35)"; ctx.fillRect(0, 0, W, H); }
  }, { cat: "Weather & Sky" });

  bg("storm", "Lightning storm", (ctx, t, W, H, c) => {
    lin(ctx, W, H, "#0b0f1a", "#1c2436");
    const f = Math.floor(t * 1.3 * c.sp), on = hash(f + 9) > 0.55 && (t * 1.3 * c.sp) % 1 < 0.12;
    if (on) { ctx.fillStyle = "rgba(200,220,255,0.18)"; ctx.fillRect(0, 0, W, H); const R = rng(f); ctx.save(); ctx.globalCompositeOperation = "lighter"; const x = R() * W; bolt(ctx, x, 0, x + (R() - 0.5) * W * 0.3, H * (0.4 + R() * 0.4), R, 14, W * 0.05, "#cfe3ff", 3, 0.9); ctx.restore(); }
  }, { cat: "Weather & Sky" });

  bg("embers", "Rising embers", (ctx, t, W, H, c) => {
    lin(ctx, W, H, "#120402", "#2a0a02"); ctx.save(); ctx.globalCompositeOperation = "lighter"; const R = rng(13);
    for (let i = 0; i < 110; i++) { const sp = (20 + R() * 60) * c.sp, x = R() * W + Math.sin(t * 2 + i) * 15, y = H - ((t * sp + R() * H) % (H + 40)); glowDot(ctx, x, y, 2 + R() * 6, R() > 0.5 ? "#ff7b00" : "#ffd166", 0.8); }
    ctx.restore();
  }, { cat: "Weather & Sky" });

  // ---------- SPACE & SCI-FI ----------
  bg("starfield", "Starfield warp", (ctx, t, W, H, c) => { ctx.fillStyle = c.b1; ctx.fillRect(0, 0, W, H); const R = rng(7), cx = W / 2, cy = H / 2; for (let i = 0; i < 260; i++) { const an = R() * TAU, z = ((R() + t * 0.15 * c.sp) % 1), r = Math.pow(z, 2.2) * Math.max(W, H) * 0.8, s = 0.5 + z * 2.5; ctx.fillStyle = `rgba(255,255,255,${z})`; ctx.fillRect(cx + Math.cos(an) * r, cy + Math.sin(an) * r, s, s); } }, { cat: "Space & Sci-Fi" });
  bg("stars-drift", "Drifting stars", (ctx, t, W, H, c) => { lin(ctx, W, H, c.b1, c.b2); const R = rng(3); for (let i = 0; i < 180; i++) { const x = (R() * W + t * (5 + R() * 25) * c.sp) % W, y = R() * H, s = R() * 2 + 0.4; ctx.fillStyle = `rgba(255,255,255,${0.3 + 0.7 * Math.abs(Math.sin(t * (1 + R() * 2) + i))})`; ctx.fillRect(x, y, s, s); } }, { cat: "Space & Sci-Fi" });
  bg("nebula", "Nebula", (ctx, t, W, H, c) => { ctx.fillStyle = "#05030f"; ctx.fillRect(0, 0, W, H); ctx.save(); ctx.globalCompositeOperation = "lighter"; for (let i = 0; i < 6; i++) { const R = rng(i + 11), x = W * (R() + Math.sin(t * 0.07 * c.sp + i) * 0.1), y = H * (R() + Math.cos(t * 0.05 * c.sp + i) * 0.1); glowDot(ctx, x, y, Math.max(W, H) * (0.3 + R() * 0.3), [c.b1, c.b2, "#ff4fd8", "#3a86ff"][i % 4], 0.35); } ctx.restore(); stars(ctx, W, H, 120, 5, t, c.sp); }, { cat: "Space & Sci-Fi" });
  bg("planet", "Deep space planet", (ctx, t, W, H, c) => { ctx.fillStyle = "#02030a"; ctx.fillRect(0, 0, W, H); stars(ctx, W, H, 150, 23, t, c.sp); const px = W * 0.82, py = H * 0.82, pr = Math.min(W, H) * 0.45, g = ctx.createRadialGradient(px - pr * 0.4, py - pr * 0.4, pr * 0.1, px, py, pr); g.addColorStop(0, c.b1); g.addColorStop(1, "#05050f"); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px, py, pr, 0, TAU); ctx.fill(); ctx.save(); ctx.translate(px, py); ctx.rotate(-0.4); ctx.strokeStyle = rgba(c.b2, 0.5); ctx.lineWidth = 6; ctx.beginPath(); ctx.ellipse(0, 0, pr * 1.5, pr * 0.3, 0, PI * 1.05 + Math.sin(t * 0.1) * 0.02, PI * 1.95); ctx.stroke(); ctx.restore(); }, { cat: "Space & Sci-Fi" });
  bg("galaxy", "Spiral galaxy", (ctx, t, W, H, c) => { ctx.fillStyle = "#02010a"; ctx.fillRect(0, 0, W, H); ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(t * 0.05 * c.sp); ctx.globalCompositeOperation = "lighter"; const R = rng(29); for (let i = 0; i < 700; i++) { const arm = i % 3, d = R(), an = d * 7 + (arm * TAU) / 3 + (R() - 0.5) * 0.6, r = d * Math.min(W, H) * 0.6; ctx.fillStyle = rgba(d < 0.2 ? "#fff3c4" : arm ? c.b1 : c.b2, 0.6 * (1 - d * 0.6)); ctx.fillRect(Math.cos(an) * r, Math.sin(an) * r * 0.55, 1.6, 1.6); } glowDot(ctx, 0, 0, Math.min(W, H) * 0.12, "#fff3c4", 0.6); ctx.restore(); }, { cat: "Space & Sci-Fi" });
  bg("city", "Night city skyline", (ctx, t, W, H, c) => { lin(ctx, W, H, "#0b0820", "#2b1a4a"); const R = rng(37); for (let l = 0; l < 2; l++) { let x = -((t * (6 + l * 10) * c.sp) % 200); while (x < W) { const w = 30 + R() * 70, h = H * (0.15 + R() * (0.3 + l * 0.15)); ctx.fillStyle = l ? "#0c0a1c" : "#1a1535"; ctx.fillRect(x, H - h, w, h); if (l) for (let wy = H - h + 8; wy < H - 6; wy += 12) for (let wx = x + 5; wx < x + w - 5; wx += 9) if (hash(Math.floor(wx * 7 + wy)) > 0.6) { ctx.fillStyle = "rgba(255,214,120,0.7)"; ctx.fillRect(wx, wy, 4, 5); } x += w + 4; } } }, { cat: "Space & Sci-Fi" });
  bg("synthwave", "Synthwave grid", (ctx, t, W, H, c) => { lin(ctx, W, H, "#12002b", "#3a0a5c"); const hy = H * 0.55, sun = ctx.createLinearGradient(0, hy - H * 0.3, 0, hy); sun.addColorStop(0, "#ffd319"); sun.addColorStop(1, "#ff2975"); ctx.fillStyle = sun; ctx.beginPath(); ctx.arc(W / 2, hy, Math.min(W, H) * 0.22, PI, TAU); ctx.fill(); ctx.fillStyle = "#12002b"; for (let i = 0; i < 6; i++) ctx.fillRect(0, hy - i * H * 0.03 - 4, W, 2 + i * 1.2); ctx.fillStyle = "#1a0033"; ctx.fillRect(0, hy, W, H - hy); ctx.strokeStyle = c.b1 || "#ff2bd6"; ctx.lineWidth = 1.5; for (let i = -20; i <= 20; i++) { ctx.beginPath(); ctx.moveTo(W / 2 + i * W * 0.02, hy); ctx.lineTo(W / 2 + i * W * 0.25, H); ctx.stroke(); } for (let j = 0; j < 14; j++) { const z = ((j + t * 1.5 * c.sp) % 14) / 14, y = hy + Math.pow(z, 2) * (H - hy); ctx.globalAlpha = z; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); } ctx.globalAlpha = 1; }, { cat: "Space & Sci-Fi" });
  bg("circuit", "Circuit board", (ctx, t, W, H, c) => { ctx.fillStyle = "#03120c"; ctx.fillRect(0, 0, W, H); const R = rng(31), g = Math.max(20, W / 30); ctx.lineWidth = 2; for (let i = 0; i < 60; i++) { let x = Math.floor(R() * W / g) * g, y = Math.floor(R() * H / g) * g; ctx.strokeStyle = rgba(c.b1 || "#00ff9c", 0.18); ctx.beginPath(); ctx.moveTo(x, y); const pts = [[x, y]]; for (let j = 0; j < 6; j++) { R() > 0.5 ? (x += g * (R() > 0.5 ? 1 : -1)) : (y += g * (R() > 0.5 ? 1 : -1)); ctx.lineTo(x, y); pts.push([x, y]); } ctx.stroke(); const q = (t * 0.6 * c.sp + i * 0.13) % 1, s = Math.floor(q * (pts.length - 1)), f = (q * (pts.length - 1)) % 1, p0 = pts[s], p1 = pts[s + 1] || p0; glowDot(ctx, lerp(p0[0], p1[0], f), lerp(p0[1], p1[1], f), 8, c.b1 || "#00ff9c", 0.9); } }, { cat: "Space & Sci-Fi" });

  // ---------- ABSTRACT & MOTION ----------
  bg("solid", "Solid colour", (ctx, t, W, H, c) => { ctx.fillStyle = c.b1; ctx.fillRect(0, 0, W, H); }, { cat: "Abstract & Motion" });
  bg("gradient", "Gradient", (ctx, t, W, H, c) => lin(ctx, W, H, c.b1, c.b2), { cat: "Abstract & Motion" });
  bg("gradient-shift", "Shifting gradient", (ctx, t, W, H, c) => lin(ctx, W, H, c.b1, c.b2, PI / 2 + Math.sin(t * 0.3 * c.sp) * 1.2), { cat: "Abstract & Motion" });
  bg("bokeh", "Bokeh lights", (ctx, t, W, H, c) => { lin(ctx, W, H, c.b1, c.b2); ctx.save(); ctx.globalCompositeOperation = "lighter"; const R = rng(9); for (let i = 0; i < 40; i++) { const x = (R() * W + Math.sin(t * 0.2 * c.sp + i) * 40), y = (R() * H - t * (8 + R() * 20) * c.sp) % H, yy = y < 0 ? y + H : y; glowDot(ctx, x, yy, 20 + R() * 70, ["#ffd166", "#ff8fa3", "#a0c4ff", "#caffbf"][i % 4], 0.25); } ctx.restore(); }, { cat: "Abstract & Motion" });
  bg("matrix", "Chess-glyph matrix rain", (ctx, t, W, H, c) => { ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H); const cs = Math.max(14, W / 50), cols = Math.ceil(W / cs), gl = "♔♕♖♗♘♙♚♛♜♝♞♟abcdefgh12345678+#x"; ctx.font = `${cs}px monospace`; for (let i = 0; i < cols; i++) { const sp = 3 + hash(i + 1) * 6, head = ((t * sp * c.sp + hash(i + 7) * 40) % (H / cs + 20)); for (let j = 0; j < 18; j++) { const y = (head - j) * cs; if (y < 0 || y > H) continue; ctx.fillStyle = j === 0 ? "#e8ffe8" : rgba(c.b1 || "#00ff66", 1 - j / 18); ctx.fillText(gl[Math.floor(hash(i * 131 + Math.floor(head - j)) * gl.length)], i * cs, y); } } }, { cat: "Abstract & Motion" });
  bg("floating-pieces", "Floating chess pieces", (ctx, t, W, H, c) => { lin(ctx, W, H, c.b1, c.b2); const gl = ["♚", "♛", "♜", "♝", "♞", "♟"], R = rng(21); for (let i = 0; i < 26; i++) { const s = 20 + R() * 80, x = (R() * W + Math.sin(t * 0.3 + i) * 30), y = ((R() * (H + 200) - t * (10 + R() * 30) * c.sp) % (H + 200) + H + 200) % (H + 200) - 100; ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t * 0.5 + i) * 0.5); ctx.font = `${s}px serif`; ctx.fillStyle = `rgba(255,255,255,${0.05 + R() * 0.12})`; ctx.textAlign = "center"; ctx.fillText(gl[i % 6], 0, 0); ctx.restore(); } }, { cat: "Abstract & Motion" });
  bg("lava", "Lava lamp blobs", (ctx, t, W, H, c) => { lin(ctx, W, H, "#1a0505", "#2b0b0b"); ctx.save(); ctx.globalCompositeOperation = "lighter"; for (let i = 0; i < 7; i++) { const x = W * (0.5 + 0.4 * Math.sin(t * 0.21 * c.sp * (1 + i * 0.13) + i)), y = H * (0.5 + 0.42 * Math.cos(t * 0.17 * c.sp * (1 + i * 0.11) + i * 2)); glowDot(ctx, x, y, Math.min(W, H) * (0.25 + 0.1 * Math.sin(t + i)), i % 2 ? c.b1 : c.b2, 0.55); } ctx.restore(); }, { cat: "Abstract & Motion" });
  bg("hexgrid", "Hex grid pulse", (ctx, t, W, H, c) => { ctx.fillStyle = "#050a14"; ctx.fillRect(0, 0, W, H); const r = Math.max(18, W / 32), h = r * Math.sqrt(3); for (let y = -1; y < H / h + 1; y++) for (let x = -1; x < W / (r * 1.5) + 1; x++) { const cx = x * r * 1.5, cy = y * h + (x % 2 ? h / 2 : 0), d = Math.hypot(cx - W / 2, cy - H / 2), q = 0.5 + 0.5 * Math.sin(d * 0.012 - t * 2 * c.sp); ctx.strokeStyle = rgba(c.b1 || "#00e5ff", 0.08 + q * 0.35); ctx.lineWidth = 1.2; ctx.beginPath(); for (let k = 0; k < 6; k++) { const an = (k / 6) * TAU; ctx.lineTo(cx + Math.cos(an) * r * 0.92, cy + Math.sin(an) * r * 0.92); } ctx.closePath(); ctx.stroke(); } }, { cat: "Abstract & Motion" });
  bg("plasma", "Plasma waves", (ctx, t, W, H, c) => { const n = 24, cw = W / n, ch = H / n; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const v = Math.sin(i * 0.4 + t * c.sp) + Math.sin(j * 0.3 - t * 0.7 * c.sp) + Math.sin((i + j) * 0.25 + t * 0.5 * c.sp); ctx.fillStyle = mix(c.b1, c.b2, (v + 3) / 6); ctx.fillRect(i * cw, j * ch, cw + 1, ch + 1); } }, { cat: "Abstract & Motion" });
  bg("sunburst", "Sunburst rays", (ctx, t, W, H, c) => { ctx.fillStyle = c.b2; ctx.fillRect(0, 0, W, H); ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(t * 0.15 * c.sp); ctx.fillStyle = c.b1; const R = Math.max(W, H); for (let i = 0; i < 18; i++) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, R, (i / 18) * TAU, ((i + 0.5) / 18) * TAU); ctx.closePath(); ctx.fill(); } ctx.restore(); }, { cat: "Abstract & Motion" });
  bg("tunnel", "Checker tunnel", (ctx, t, W, H, c) => { ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H); const cx = W / 2, cy = H / 2; for (let r = 24; r > 0; r--) { const z = ((r - (t * 3 * c.sp) % 1) / 24), rad2 = Math.pow(z, 2) * Math.max(W, H) * 1.1; for (let s = 0; s < 16; s++) { ctx.fillStyle = (s + r + Math.floor(t * 3 * c.sp)) % 2 ? c.b1 : c.b2; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, Math.max(0, rad2), (s / 16) * TAU + t * 0.2, ((s + 1) / 16) * TAU + t * 0.2); ctx.closePath(); ctx.fill(); } } ctx.fillStyle = "rgba(0,0,0,0.35)"; ctx.fillRect(0, 0, W, H); }, { cat: "Abstract & Motion" });
  bg("vortex", "Vortex spiral", (ctx, t, W, H, c) => { ctx.fillStyle = "#03020a"; ctx.fillRect(0, 0, W, H); ctx.save(); ctx.translate(W / 2, H / 2); ctx.globalCompositeOperation = "lighter"; for (let i = 0; i < 300; i++) { const z = ((i / 300 + t * 0.05 * c.sp) % 1), an = z * 30 + i * 0.6 - t * c.sp, r = z * Math.max(W, H) * 0.7; glowDot(ctx, Math.cos(an) * r, Math.sin(an) * r, 3 + z * 8, i % 2 ? c.b1 : c.b2, z * 0.6); } ctx.restore(); }, { cat: "Abstract & Motion" });
  bg("noise", "Glitch noise", (ctx, t, W, H, c) => { ctx.fillStyle = c.b1; ctx.fillRect(0, 0, W, H); const R = rng(Math.floor(t * 12)); for (let i = 0; i < 30; i++) { ctx.fillStyle = `rgba(255,255,255,${R() * 0.06})`; ctx.fillRect(0, R() * H, W, R() * H * 0.05); } for (let i = 0; i < 3; i++) { ctx.fillStyle = [`rgba(255,0,90,0.08)`, `rgba(0,255,230,0.08)`, `rgba(255,255,255,0.05)`][i]; ctx.fillRect(R() * W * 0.1, R() * H, W, R() * H * 0.12); } }, { cat: "Abstract & Motion" });
  bg("topo", "Topographic lines", (ctx, t, W, H, c) => { ctx.fillStyle = c.b2; ctx.fillRect(0, 0, W, H); ctx.strokeStyle = rgba(c.b1, 0.35); ctx.lineWidth = 1.3; for (let k = 0; k < 18; k++) { ctx.beginPath(); for (let a = 0; a <= TAU + 0.01; a += 0.1) { const r = (k + 1) * Math.max(W, H) * 0.035 * (1 + 0.15 * Math.sin(a * 3 + t * 0.4 * c.sp + k * 0.3) + 0.08 * Math.sin(a * 5 - t * 0.3)); const x = W * 0.45 + Math.cos(a) * r, y = H * 0.5 + Math.sin(a) * r * 0.8; a ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); } }, { cat: "Abstract & Motion" });
  bg("confetti-drift", "Slow confetti", (ctx, t, W, H, c) => { lin(ctx, W, H, c.b1, c.b2); const R = rng(41), cols = ["#ff5d8f", "#ffd166", "#06d6a0", "#4cc9f0", "#9b5de5"]; for (let i = 0; i < 70; i++) { const sp = (20 + R() * 30) * c.sp, x = (R() * W + Math.sin(t + i) * 30), y = (t * sp + R() * H) % H, w = 6 + R() * 8; ctx.save(); ctx.translate(x, y); ctx.rotate(t * 2 + i); ctx.scale(Math.cos(t * 3 + i), 1); ctx.fillStyle = cols[i % 5]; ctx.globalAlpha = 0.7; ctx.fillRect(-w / 2, -w / 4, w, w / 2); ctx.restore(); } }, { cat: "Abstract & Motion" });
  bg("honeycomb", "Honeycomb gold", (ctx, t, W, H, c) => { lin(ctx, W, H, "#1a1206", "#3a2a0a"); const r = Math.max(22, W / 26), h = r * Math.sqrt(3); for (let y = -1; y < H / h + 1; y++) for (let x = -1; x < W / (r * 1.5) + 1; x++) { const cx = x * r * 1.5, cy = y * h + (x % 2 ? h / 2 : 0), q = 0.5 + 0.5 * Math.sin(x * 0.7 + y * 0.5 + t * 1.2 * c.sp); ctx.fillStyle = `rgba(255,190,40,${0.03 + q * 0.12})`; ctx.beginPath(); for (let k = 0; k < 6; k++) { const an = (k / 6) * TAU; ctx.lineTo(cx + Math.cos(an) * r * 0.9, cy + Math.sin(an) * r * 0.9); } ctx.closePath(); ctx.fill(); } }, { cat: "Abstract & Motion" });
  bg("spotlight-stage", "Stage spotlights", (ctx, t, W, H, c) => { ctx.fillStyle = "#06060a"; ctx.fillRect(0, 0, W, H); ctx.save(); ctx.globalCompositeOperation = "lighter"; for (let i = 0; i < 3; i++) { const sx = W * (0.2 + i * 0.3), an = Math.sin(t * 0.6 * c.sp + i * 2) * 0.35 + PI / 2; const g = ctx.createRadialGradient(sx, -20, 0, sx, -20, H * 1.2); g.addColorStop(0, rgba([c.b1, "#ffffff", c.b2][i], 0.35)); g.addColorStop(1, "rgba(0,0,0,0)"); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(sx, -20); ctx.lineTo(sx + Math.cos(an - 0.18) * H * 1.4, Math.sin(an - 0.18) * H * 1.4); ctx.lineTo(sx + Math.cos(an + 0.18) * H * 1.4, Math.sin(an + 0.18) * H * 1.4); ctx.closePath(); ctx.fill(); } ctx.restore(); }, { cat: "Abstract & Motion" });
  bg("waves-lines", "Flowing lines", (ctx, t, W, H, c) => { ctx.fillStyle = c.b2; ctx.fillRect(0, 0, W, H); for (let i = 0; i < 40; i++) { ctx.strokeStyle = rgba(mix(c.b1, "#ffffff", i / 60), 0.25); ctx.lineWidth = 1.5; ctx.beginPath(); for (let x = 0; x <= W; x += 12) { const y = H * 0.2 + i * H * 0.016 + Math.sin(x * 0.004 + t * 0.6 * c.sp + i * 0.15) * H * 0.12; x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); } }, { cat: "Abstract & Motion" });
  bg("checker-scroll", "Scrolling checker", (ctx, t, W, H, c) => { const s = Math.max(40, W / 14), o = (t * 30 * c.sp) % (s * 2); for (let y = -2; y < H / s + 2; y++) for (let x = -2; x < W / s + 2; x++) { ctx.fillStyle = (x + y) % 2 ? c.b1 : c.b2; ctx.fillRect(x * s + o, y * s + o, s, s); } ctx.fillStyle = "rgba(0,0,0,0.45)"; ctx.fillRect(0, 0, W, H); }, { cat: "Abstract & Motion" });

  bg("silk-ribbons", "Flowing Silk Ribbons", (ctx, t, W, H, c) => {
    const b1 = c.b1 || "#ff4d6d", b2 = c.b2 || "#4cc9f0";
    sky(ctx, W, H, [[0, "#090714"], [1, "#14102b"]]); ctx.save(); ctx.globalCompositeOperation = "lighter";
    for (let r = 0; r < 6; r++) {
      const col = mix(b1, b2, r / 5), yBase = H * (0.25 + r * 0.1); ctx.beginPath();
      for (let x = 0; x <= W; x += 18) { const y = yBase + Math.sin(x * 0.004 + t * (0.5 + r * 0.08) * c.sp + r) * H * 0.12; x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.lineTo(W, yBase + H * 0.22); ctx.lineTo(0, yBase + H * 0.22); ctx.closePath();
      const g = ctx.createLinearGradient(0, yBase - H * 0.12, 0, yBase + H * 0.22); g.addColorStop(0, rgba(col, 0.22)); g.addColorStop(1, rgba(col, 0)); ctx.fillStyle = g; ctx.fill();
    }
    ctx.restore();
  }, { cat: "Abstract & Motion", b1: "#ff4d6d", b2: "#4cc9f0" });

  bg("stained-glass", "Kaleidoscope Prisms", (ctx, t, W, H, c) => {
    const b1 = c.b1 || "#f72585", b2 = c.b2 || "#4361ee";
    sky(ctx, W, H, [[0, "#0b0918"], [1, "#17142e"]]); ctx.save(); ctx.globalCompositeOperation = "lighter"; const R = rng(401);
    for (let i = 0; i < 36; i++) {
      const cx = (R() * W + Math.sin(t * 0.25 * c.sp + i) * 60), cy = (R() * H + Math.cos(t * 0.2 * c.sp + i) * 50), sz = Math.min(W, H) * (0.08 + R() * 0.14);
      ctx.fillStyle = rgba(mix(b1, b2, R()), 0.12 + R() * 0.1); ctx.strokeStyle = rgba(mix(b1, "#ffffff", 0.4), 0.16); ctx.lineWidth = 1;
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(t * (R() - 0.5) * 0.6 * c.sp + R() * TAU);
      poly(ctx, [[0, -sz], [sz * 0.86, sz * 0.6], [-sz * 0.86, sz * 0.6]]); ctx.fill(); ctx.stroke(); ctx.restore();
    }
    ctx.restore();
  }, { cat: "Abstract & Motion", b1: "#f72585", b2: "#4361ee" });

  bg("ink-wash", "Sumi-e Ink Wash", (ctx, t, W, H, c) => {
    const b1 = c.b1 || "#1f2937", b2 = c.b2 || "#d4a373";
    sky(ctx, W, H, [[0, mix(b2, "#e8dfd1", 0.5)], [1, mix(b2, "#c8baa4", 0.5)]]); const R = rng(402);
    for (let i = 0; i < 14; i++) {
      const x = W * (0.1 + R() * 0.8) + Math.sin(t * 0.18 * c.sp + i) * 35, y = H * (0.1 + R() * 0.8) + Math.cos(t * 0.15 * c.sp + i) * 30;
      rad(ctx, x, y, Math.min(W, H) * (0.18 + R() * 0.28), [[0, rgba(b1, 0.26)], [0.65, rgba(b1, 0.1)], [1, rgba(b1, 0)]]);
    }
  }, { cat: "Abstract & Motion", b1: "#1f2937", b2: "#d4a373" });

  bg("golden-particles", "Luxury Gold Dust", (ctx, t, W, H, c) => {
    const b1 = c.b1 || "#0d0a07", b2 = c.b2 || "#ffd166";
    sky(ctx, W, H, [[0, b1], [0.5, mix(b1, "#22190c", 0.6)], [1, b1]]);
    beams(ctx, W * 0.5, -H * 0.1, Math.max(W, H) * 1.4, 5, 1.0, 2.15, b2, 0.1, t, c.sp);
    ctx.save(); ctx.globalCompositeOperation = "lighter"; const R = rng(403);
    for (let i = 0; i < 85; i++) {
      const sp = (12 + R() * 28) * c.sp, x = (R() * W + Math.sin(t * 0.5 * c.sp + i) * 30) % W, y = (R() * H - t * sp + H * 10) % H, r = 2 + R() * 11, tw = 0.4 + 0.6 * Math.abs(Math.sin(t * (1.2 + R()) + i));
      glowDot(ctx, x, y, r, b2, 0.55 * tw);
      if (i % 7 === 0) { star(ctx, x, y, r * 0.9, 4, 0.2); ctx.fillStyle = rgba("#fff8dc", 0.55 * tw); ctx.fill(); }
    }
    ctx.restore();
  }, { cat: "Abstract & Motion", b1: "#0d0a07", b2: "#ffd166" });

  F.addBackgrounds(BG);
})(typeof globalThis !== "undefined" ? globalThis : this);
