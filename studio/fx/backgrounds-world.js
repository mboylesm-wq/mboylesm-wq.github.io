// FX Lab extra scenic, Philippine heritage, chess venue & sky backgrounds (25). Uses helpers from F._bg & F._lib.
(function (root) {
  "use strict";
  const F = typeof module === "object" && module.exports && typeof require === "function" ? require("./core.js") : root.PnoyFX;
  const { TAU, PI, lerp, clamp, rng, hash, rgba, mix, poly, glowDot, ring, star } = F._lib;
  const { lin, sky, rad, stars, hills, pine, canopyTree, palm, wave, beams, cloud, shimmer, leafShape } = F._bg;
  const BG = [];
  const bg = (id, name, draw, opts) => BG.push(Object.assign({ id, name, draw }, opts || {}));

  // ---------- 1. TROPICAL & HERITAGE ----------
  bg("manila-bay", "Manila Bay Sunset", (ctx, t, W, H, c) => {
    const b1 = c.b1 || "#a4133c", b2 = c.b2 || "#ff9e00", hy = H * 0.56;
    sky(ctx, W, H, [[0, mix(b1, "#120624", 0.65)], [0.5, b1], [1, b2]], 0, hy);
    rad(ctx, W * 0.5, hy - H * 0.05, Math.min(W, H) * 0.24, [[0, "#fff8d6"], [0.3, rgba(b2, 0.85)], [0.7, rgba(b1, 0.3)], [1, rgba(b1, 0)]]);
    for (let i = 0; i < 4; i++) cloud(ctx, ((i * W * 0.33 + t * 8 * c.sp) % (W * 1.3)) - W * 0.15, hy * (0.28 + (i % 2) * 0.2), Math.min(W, H) * 0.09, mix(b2, "#2a081a", 0.35), 0.35);
    sky(ctx, W, H, [[0, mix(b2, "#1c0916", 0.45)], [0.5, mix(b1, "#120518", 0.6)], [1, "#08030e"]], hy, H);
    shimmer(ctx, W * 0.5, hy + 4, H - 10, W * 0.06, W * 0.28, t, c.sp, "#ffd166", 44);
    for (let b = 0; b < 3; b++) wave(ctx, W, H, hy + H * (0.1 + b * 0.12), H * 0.008, 0.009 + b * 0.002, t * (0.6 + b * 0.2) * c.sp, rgba("#120514", 0.55), rgba(b2, 0.25), 1.5);
    palm(ctx, W * 0.03, H, H * 0.72, 0.2, "#0c0410", t, c.sp, 0.4);
    palm(ctx, W * 0.97, H, H * 0.68, -0.22, "#0c0410", t, c.sp, 1.8);
  }, { cat: "Beach & Ocean", b1: "#a4133c", b2: "#ff9e00" });

  bg("rice-terraces", "Cordillera Rice Terraces", (ctx, t, W, H, c) => {
    const b1 = c.b1 || "#0b3b24", b2 = c.b2 || "#a7f3d0";
    sky(ctx, W, H, [[0, mix(b1, "#04160e", 0.5)], [0.55, mix(b1, b2, 0.28)], [1, b2]], 0, H * 0.45);
    rad(ctx, W * 0.75, H * 0.2, Math.min(W, H) * 0.16, [[0, "#fffbe6"], [0.4, rgba(b2, 0.45)], [1, rgba(b2, 0)]]);
    for (let i = 0; i < 6; i++) {
      const y0 = H * (0.38 + i * 0.1), col = mix(b2, mix(b1, "#02120a", 0.65), i / 5);
      hills(ctx, W, H, y0, H * 0.045, 3.3 + i * 1.9, col, 0);
      ctx.strokeStyle = rgba(b2, 0.22 - i * 0.025); ctx.lineWidth = 2; ctx.beginPath();
      for (let x = 0; x <= W; x += 20) {
        const yy = y0 + Math.sin((x / W) * 6.2 + 3.3 + i * 1.9) * H * 0.02 + Math.sin(x * 0.01 + t * 0.5 * c.sp + i) * 3;
        x ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy);
      }
      ctx.stroke();
    }
    const R = rng(501); ctx.save(); ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < 40; i++) glowDot(ctx, (R() * W + t * 12 * c.sp) % W, H * (0.4 + R() * 0.55), 5 + R() * 8, b2, 0.25 + 0.25 * Math.sin(t * 2 + i));
    ctx.restore();
  }, { cat: "Landscapes & Nature", b1: "#0b3b24", b2: "#a7f3d0" });

  bg("lantern-festival", "Capiz Parol Lanterns", (ctx, t, W, H, c) => {
    const b1 = c.b1 || "#0e1036", b2 = c.b2 || "#ffbe0b";
    sky(ctx, W, H, [[0, mix(b1, "#040514", 0.6)], [0.6, b1], [1, mix(b1, "#2a0e3d", 0.5)]]);
    stars(ctx, W, H * 0.7, 90, 502, t, c.sp);
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    const R = rng(503), cols = [b2, "#ff006e", "#3a86ff", "#06d6a0"];
    for (let i = 0; i < 16; i++) {
      const sp = (14 + R() * 24) * c.sp, x = (R() * W + Math.sin(t * 0.4 + i) * 28) % W, y = H - ((t * sp + R() * H) % (H + 80));
      const col = cols[i % cols.length], sz = 10 + R() * 14, pulse = 0.6 + 0.4 * Math.sin(t * 2.4 + i);
      glowDot(ctx, x, y, sz * 2.5, col, 0.35 * pulse);
      star(ctx, x, y, sz, 5, 0.45); ctx.fillStyle = rgba(col, 0.85 * pulse); ctx.fill();
      ring(ctx, x, y, sz * 1.15, 1.3, "#ffffff", 0.35 * pulse);
    }
    ctx.restore();
  }, { cat: "Venues & Textures", b1: "#0e1036", b2: "#ffbe0b" });

  bg("taal-sunrise", "Taal Volcano Dawn", (ctx, t, W, H, c) => {
    const b1 = c.b1 || "#2b1947", b2 = c.b2 || "#fca311", ly = H * 0.62;
    sky(ctx, W, H, [[0, mix(b1, "#0c0718", 0.5)], [0.6, b1], [1, b2]], 0, ly);
    rad(ctx, W * 0.5, ly - H * 0.08, Math.min(W, H) * 0.25, [[0, "#fff9db"], [0.35, rgba(b2, 0.7)], [1, rgba(b2, 0)]]);
    beams(ctx, W * 0.5, ly - H * 0.08, Math.max(W, H) * 0.9, 6, -PI * 0.85, -PI * 0.15, b2, 0.12, t, c.sp);
    hills(ctx, W, ly + 10, ly - H * 0.05, H * 0.08, 5.2, mix(b1, "#12091c", 0.65), 0.3);
    poly(ctx, [[W * 0.34, ly], [W * 0.45, ly - H * 0.13], [W * 0.55, ly - H * 0.13], [W * 0.66, ly]]);
    ctx.fillStyle = "#10081a"; ctx.fill();
    sky(ctx, W, H, [[0, mix(b1, b2, 0.35)], [0.5, mix(b1, "#090612", 0.6)], [1, "#05030a"]], ly, H);
    shimmer(ctx, W * 0.5, ly + 6, H - 8, W * 0.08, W * 0.34, t, c.sp, "#ffd166", 36);
  }, { cat: "Landscapes & Nature", b1: "#2b1947", b2: "#fca311" });

  bg("rainforest-canopy", "Tropical Rainforest", (ctx, t, W, H, c) => {
    const b1 = c.b1 || "#062016", b2 = c.b2 || "#38b000";
    sky(ctx, W, H, [[0, mix(b1, b2, 0.35)], [0.5, b1], [1, "#020b07"]]);
    beams(ctx, W * 0.3, -H * 0.05, Math.max(W, H) * 1.3, 6, 0.6, 1.4, b2, 0.15, t, c.sp);
    const R = rng(505);
    for (let i = 0; i < 12; i++) {
      const x = R() * W, sway = Math.sin(t * 0.9 * c.sp + i) * 18;
      ctx.strokeStyle = rgba(mix(b1, "#020a06", 0.6), 0.75); ctx.lineWidth = 2 + R() * 2;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.quadraticCurveTo(x + sway, H * 0.45, x + sway * 1.3, H * (0.55 + R() * 0.35)); ctx.stroke();
    }
    for (let i = 0; i < 24; i++) {
      const side = i % 2 ? R() * 0.25 : 0.75 + R() * 0.25;
      canopyTree(ctx, side * W, H, H * (0.5 + R() * 0.35), H * 0.32, mix(b1, "#010704", 0.78), Math.sin(t * 0.7 * c.sp + i) * 0.02);
    }
  }, { cat: "Forest & Woodland", b1: "#062016", b2: "#38b000" });

  // ---------- 2. CHESS & STRATEGY ----------
  bg("grandmaster-arena", "Championship Arena", (ctx, t, W, H, c) => {
    const b1 = c.b1 || "#080d1e", b2 = c.b2 || "#f59e0b";
    sky(ctx, W, H, [[0, "#03050c"], [0.6, b1], [1, mix(b1, b2, 0.2)]]);
    for (let r = 0; r < 5; r++) hills(ctx, W, H, H * (0.68 + r * 0.07), H * 0.02, 10 + r, mix(b1, "#000000", 0.3 + r * 0.12), 0);
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    [0.15, 0.38, 0.62, 0.85].forEach((kx, i) => {
      const an = PI / 2 + Math.sin(t * 0.45 * c.sp + i * 1.4) * 0.32;
      const g = ctx.createRadialGradient(W * kx, -20, 0, W * kx, -20, H * 1.15);
      g.addColorStop(0, rgba(i % 2 ? b2 : "#60a5fa", 0.28)); g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(W * kx, -20);
      ctx.lineTo(W * kx + Math.cos(an - 0.14) * H * 1.3, Math.sin(an - 0.14) * H * 1.3);
      ctx.lineTo(W * kx + Math.cos(an + 0.14) * H * 1.3, Math.sin(an + 0.14) * H * 1.3);
      ctx.closePath(); ctx.fill();
    });
    rad(ctx, W * 0.5, H * 0.86, W * 0.45, [[0, rgba(b2, 0.25)], [1, rgba(b2, 0)]]);
    ctx.restore();
  }, { cat: "Venues & Textures", b1: "#080d1e", b2: "#f59e0b" });

  bg("ivory-gold-court", "Royal Gold Chessboard", (ctx, t, W, H, c) => {
    const b1 = c.b1 || "#120d08", b2 = c.b2 || "#e5b842", hy = H * 0.48;
    sky(ctx, W, H, [[0, "#050304"], [0.6, b1], [1, mix(b1, b2, 0.25)]], 0, hy);
    rad(ctx, W * 0.5, hy, W * 0.42, [[0, rgba(b2, 0.35)], [1, rgba(b2, 0)]]);
    sky(ctx, W, H, [[0, mix(b1, b2, 0.18)], [1, "#070503"]], hy, H);
    const cols = 10, rows = 8;
    for (let r = 0; r < rows; r++) {
      const z0 = Math.pow(((r + (t * 0.45 * c.sp) % 1) / rows), 1.8), z1 = Math.pow(((r + 1 + (t * 0.45 * c.sp) % 1) / rows), 1.8);
      const y0 = lerp(hy, H, z0), y1 = lerp(hy, H, z1);
      for (let x = -cols; x < cols; x++) {
        if ((x + r) % 2) continue;
        const x00 = W * 0.5 + x * W * 0.04 * (1 + z0 * 6), x01 = W * 0.5 + (x + 1) * W * 0.04 * (1 + z0 * 6);
        const x10 = W * 0.5 + x * W * 0.04 * (1 + z1 * 6), x11 = W * 0.5 + (x + 1) * W * 0.04 * (1 + z1 * 6);
        ctx.fillStyle = rgba(b2, 0.16 * z1); poly(ctx, [[x00, y0], [x01, y0], [x11, y1], [x10, y1]]); ctx.fill();
      }
    }
  }, { cat: "Venues & Textures", b1: "#120d08", b2: "#e5b842" });

  bg("knight-constellation", "Chess Constellation", (ctx, t, W, H, c) => {
    const b1 = c.b1 || "#050b1f", b2 = c.b2 || "#38bdf8";
    sky(ctx, W, H, [[0, "#020512"], [0.6, b1], [1, mix(b1, "#1e1b4b", 0.5)]]);
    stars(ctx, W, H, 110, 508, t, c.sp);
    const pts = [[0.2, 0.72], [0.22, 0.52], [0.28, 0.34], [0.42, 0.24], [0.58, 0.28], [0.52, 0.42], [0.64, 0.56], [0.78, 0.72]];
    ctx.strokeStyle = rgba(b2, 0.35); ctx.lineWidth = 1.6; ctx.beginPath();
    pts.forEach(([px, py], i) => { const x = px * W + Math.sin(t * 0.4 * c.sp + i) * 6, y = py * H + Math.cos(t * 0.35 * c.sp + i) * 6; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
    ctx.stroke();
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    pts.forEach(([px, py], i) => {
      const x = px * W + Math.sin(t * 0.4 * c.sp + i) * 6, y = py * H + Math.cos(t * 0.35 * c.sp + i) * 6;
      glowDot(ctx, x, y, 16, b2, 0.55 + 0.3 * Math.sin(t * 2 + i)); glowDot(ctx, x, y, 3.5, "#ffffff", 0.9);
    });
    ctx.restore();
  }, { cat: "Space & Sci-Fi", b1: "#050b1f", b2: "#38bdf8" });

  bg("blueprint-tactics", "Grandmaster Blueprint", (ctx, t, W, H, c) => {
    const b1 = c.b1 || "#0b2447", b2 = c.b2 || "#5eead4";
    lin(ctx, W, H, mix(b1, "#041024", 0.5), b1);
    const step = Math.max(24, Math.min(W, H) / 18), ox = (t * 10 * c.sp) % step;
    ctx.strokeStyle = rgba(b2, 0.12); ctx.lineWidth = 1;
    for (let x = -step + ox; x < W + step; x += step) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = -step + ox; y < H + step; y += step) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    ctx.save(); ctx.translate(W * 0.5, H * 0.5); ctx.rotate(t * 0.08 * c.sp);
    [0.24, 0.38, 0.52].forEach((f, i) => ring(ctx, 0, 0, Math.min(W, H) * f, i === 1 ? 2 : 1.2, b2, 0.25));
    ctx.restore();
  }, { cat: "Abstract & Motion", b1: "#0b2447", b2: "#5eead4" });

  bg("clockwork-gears", "Tournament Clockwork", (ctx, t, W, H, c) => {
    const b1 = c.b1 || "#16110c", b2 = c.b2 || "#d4a373";
    lin(ctx, W, H, "#0a0705", b1);
    const gears = [[0.18, 0.24, 0.18, 12, 0.3], [0.82, 0.78, 0.22, 16, -0.22], [0.85, 0.2, 0.13, 10, 0.4], [0.14, 0.82, 0.14, 11, -0.35]];
    gears.forEach(([gx, gy, gr, teeth, dir]) => {
      const cx = gx * W, cy = gy * H, r = Math.min(W, H) * gr;
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(t * dir * c.sp);
      ctx.strokeStyle = rgba(b2, 0.24); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, r * 0.55, 0, TAU); ctx.stroke();
      for (let i = 0; i < teeth; i++) {
        const an = (i / teeth) * TAU;
        ctx.fillStyle = rgba(b2, 0.22); ctx.save(); ctx.rotate(an); ctx.fillRect(r - 4, -5, 12, 10); ctx.restore();
      }
      ctx.restore();
    });
  }, { cat: "Venues & Textures", b1: "#16110c", b2: "#d4a373" });

  bg("hourglass-sands", "Blitz Sandstorm", (ctx, t, W, H, c) => {
    const b1 = c.b1 || "#1c1208", b2 = c.b2 || "#fbbf24";
    lin(ctx, W, H, "#0c0703", b1);
    rad(ctx, W * 0.5, H * 0.5, Math.min(W, H) * 0.42, [[0, rgba(b2, 0.22)], [1, rgba(b2, 0)]]);
    ctx.save(); ctx.globalCompositeOperation = "lighter"; const R = rng(512);
    for (let i = 0; i < 130; i++) {
      const z = (R() + t * (0.2 + R() * 0.25) * c.sp) % 1, funnel = 0.08 + Math.abs(z - 0.5) * 1.4;
      const x = W * 0.5 + (R() - 0.5) * W * funnel * 0.65 + Math.sin(t * 2 + i) * 14, y = z * H;
      glowDot(ctx, x, y, 2 + R() * 4.5, b2, 0.55 * (1 - Math.abs(z - 0.5)));
    }
    ctx.restore();
  }, { cat: "Abstract & Motion", b1: "#1c1208", b2: "#fbbf24" });

  // ---------- 3. SEASONS & SKY ----------
  bg("crimson-sunset", "Crimson Mountain Dusk", (ctx, t, W, H, c) => {
    const b1 = c.b1 || "#590d22", b2 = c.b2 || "#ff758f";
    sky(ctx, W, H, [[0, "#19071a"], [0.5, b1], [1, b2]]);
    rad(ctx, W * 0.5, H * 0.62, Math.min(W, H) * 0.28, [[0, "#fff0f3"], [0.35, rgba(b2, 0.6)], [1, rgba(b2, 0)]]);
    for (let L = 0; L < 4; L++) hills(ctx, W, H, H * (0.64 + L * 0.08), H * 0.06, 20 + L * 3.5, mix(b1, "#0c030a", 0.35 + L * 0.18), 0.35);
    const R = rng(521); ctx.strokeStyle = "#18040e"; ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      const bx = (R() * W + t * (28 + R() * 20) * c.sp) % W, by = H * (0.22 + R() * 0.25) + Math.sin(t * 3 + i) * 6, fl = Math.sin(t * 7 * c.sp + i) * 4;
      ctx.beginPath(); ctx.moveTo(bx - 8, by + fl); ctx.quadraticCurveTo(bx - 3, by - 4, bx, by); ctx.quadraticCurveTo(bx + 3, by - 4, bx + 8, by + fl); ctx.stroke();
    }
  }, { cat: "Weather & Sky", b1: "#590d22", b2: "#ff758f" });

  bg("meteor-shower", "Perseid Meteor Shower", (ctx, t, W, H, c) => {
    const b1 = c.b1 || "#04081c", b2 = c.b2 || "#67e8f9";
    sky(ctx, W, H, [[0, "#01030a"], [0.7, b1], [1, mix(b1, "#1e1b4b", 0.4)]]);
    stars(ctx, W, H * 0.85, 140, 522, t, c.sp);
    hills(ctx, W, H, H * 0.88, H * 0.05, 12.1, "#02040a", 0.4);
    ctx.save(); ctx.globalCompositeOperation = "lighter"; const R = rng(523);
    for (let i = 0; i < 12; i++) {
      const phase = (t * (0.35 + R() * 0.3) * c.sp + R() * 3) % 1;
      if (phase > 0.45) continue;
      const k = phase / 0.45, sx = R() * W * 1.1, sy = R() * H * 0.4, ex = sx - k * W * 0.28, ey = sy + k * H * 0.28;
      const g = ctx.createLinearGradient(ex, ey, sx, sy); g.addColorStop(0, rgba("#ffffff", 0.95)); g.addColorStop(0.3, rgba(b2, 0.7)); g.addColorStop(1, rgba(b2, 0));
      ctx.strokeStyle = g; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(lerp(ex, sx, 0.35), lerp(ey, sy, 0.35)); ctx.stroke();
    }
    ctx.restore();
  }, { cat: "Weather & Sky", b1: "#04081c", b2: "#67e8f9" });

  bg("milky-way", "Milky Way Core", (ctx, t, W, H, c) => {
    const b1 = c.b1 || "#1d1145", b2 = c.b2 || "#f472b6";
    ctx.fillStyle = "#020208"; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < 18; i++) {
      const k = i / 17, x = lerp(0, W, k) + Math.sin(t * 0.1 * c.sp + i) * 12, y = lerp(H * 0.85, H * 0.15, k) + Math.cos(t * 0.08 * c.sp + i) * 10;
      glowDot(ctx, x, y, Math.min(W, H) * (0.14 + (i % 3) * 0.05), i % 2 ? b1 : b2, 0.24);
    }
    ctx.restore();
    stars(ctx, W, H, 220, 524, t, c.sp);
  }, { cat: "Space & Sci-Fi", b1: "#1d1145", b2: "#f472b6" });

  bg("double-rainbow", "After-Rain Prism Sky", (ctx, t, W, H, c) => {
    const b1 = c.b1 || "#1d4ed8", b2 = c.b2 || "#38bdf8";
    sky(ctx, W, H, [[0, mix(b1, "#0b1942", 0.4)], [0.6, b1], [1, b2]]);
    const hues = ["#ff595e", "#ffca3a", "#8ac926", "#1982c4", "#6a4c93"], cx = W * 0.5, cy = H * 0.96, rr = Math.max(W, H) * 0.62;
    hues.forEach((h, i) => {
      ctx.strokeStyle = rgba(h, 0.14); ctx.lineWidth = 10;
      ctx.beginPath(); ctx.arc(cx, cy, Math.max(10, rr - i * 11), PI * 1.05, PI * 1.95); ctx.stroke();
    });
    for (let i = 0; i < 5; i++) cloud(ctx, ((i * W * 0.28 + t * 9 * c.sp) % (W * 1.3)) - W * 0.15, H * (0.2 + (i % 2) * 0.24), Math.min(W, H) * 0.1, "#ffffff", 0.5);
  }, { cat: "Weather & Sky", b1: "#1d4ed8", b2: "#38bdf8" });

  bg("monsoon-mist", "Monsoon Clouds & Moon", (ctx, t, W, H, c) => {
    const b1 = c.b1 || "#0f172a", b2 = c.b2 || "#94a3b8";
    sky(ctx, W, H, [[0, "#050912"], [0.55, b1], [1, mix(b1, b2, 0.3)]]);
    rad(ctx, W * 0.72, H * 0.24, Math.min(W, H) * 0.2, [[0, "#f8fafc"], [0.35, rgba(b2, 0.4)], [1, rgba(b2, 0)]]);
    for (let i = 0; i < 8; i++) cloud(ctx, ((i * W * 0.22 + t * (12 + i * 2) * c.sp) % (W * 1.4)) - W * 0.2, H * (0.18 + (i % 3) * 0.14), Math.min(W, H) * (0.12 + (i % 2) * 0.05), mix(b1, b2, 0.35), 0.45);
    const R = rng(526); ctx.strokeStyle = rgba(b2, 0.32); ctx.lineWidth = 1;
    for (let i = 0; i < 110; i++) { const x = (R() * W + t * 50) % W, y = (t * (320 + R() * 200) * c.sp + R() * H) % H; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 3, y + 12); ctx.stroke(); }
  }, { cat: "Weather & Sky", b1: "#0f172a", b2: "#94a3b8" });

  bg("spring-meadow", "Golden Meadow Breeze", (ctx, t, W, H, c) => {
    const b1 = c.b1 || "#1a4326", b2 = c.b2 || "#fde047";
    sky(ctx, W, H, [[0, "#0f293a"], [0.55, mix(b1, b2, 0.3)], [1, b2]], 0, H * 0.66);
    hills(ctx, W, H, H * 0.64, H * 0.05, 8.2, mix(b1, b2, 0.25), 0);
    hills(ctx, W, H, H * 0.78, H * 0.05, 11.7, b1, 0);
    ctx.strokeStyle = mix(b1, "#06160b", 0.5); ctx.lineWidth = 2;
    for (let x = 4; x < W; x += 14) {
      const sw = Math.sin(t * 2.1 * c.sp + x * 0.05) * 10, gh = 28 + hash(x) * 34;
      ctx.beginPath(); ctx.moveTo(x, H); ctx.quadraticCurveTo(x + sw * 0.4, H - gh * 0.5, x + sw, H - gh); ctx.stroke();
    }
    const R = rng(527);
    for (let i = 0; i < 36; i++) glowDot(ctx, (R() * W + t * (22 + R() * 18) * c.sp) % W, (R() * H + Math.sin(t * 1.4 + i) * 20) % H, 3 + R() * 4, "#fffbeb", 0.55);
  }, { cat: "Landscapes & Nature", b1: "#1a4326", b2: "#fde047" });

  bg("winter-cabin", "Winter Solstice Frost", (ctx, t, W, H, c) => {
    const b1 = c.b1 || "#0b1e38", b2 = c.b2 || "#bae6fd";
    sky(ctx, W, H, [[0, "#040b18"], [0.6, b1], [1, mix(b1, b2, 0.35)]]);
    stars(ctx, W, H * 0.6, 80, 528, t, c.sp);
    hills(ctx, W, H, H * 0.82, H * 0.04, 15.1, mix(b2, b1, 0.55), 0);
    for (let i = 0; i < 12; i++) pine(ctx, (i / 11) * W, H * 0.9, H * (0.22 + (i % 3) * 0.08), H * 0.14, "#061224", Math.sin(t * 0.6 * c.sp + i) * 0.01);
    const R = rng(529);
    for (let i = 0; i < 85; i++) {
      const sp = (14 + R() * 28) * c.sp, x = (R() * W + Math.sin(t * 1.2 + i) * 18) % W, y = (t * sp + R() * H) % H;
      ctx.fillStyle = rgba("#ffffff", 0.45 + R() * 0.45); ctx.beginPath(); ctx.arc(x, y, 1.5 + R() * 2.5, 0, TAU); ctx.fill();
    }
  }, { cat: "Weather & Sky", b1: "#0b1e38", b2: "#bae6fd" });

  // ---------- 4. VENUES & ARCHITECTURE ----------
  bg("stained-cathedral", "Cathedral Rose Window", (ctx, t, W, H, c) => {
    const b1 = c.b1 || "#160c24", b2 = c.b2 || "#f59e0b", cx = W * 0.5, cy = H * 0.42;
    sky(ctx, W, H, [[0, "#08040f"], [0.6, b1], [1, "#090512"]]);
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(t * 0.06 * c.sp); ctx.globalCompositeOperation = "lighter";
    const cols = [b2, "#ec4899", "#3b82f6", "#10b981"];
    for (let i = 0; i < 12; i++) {
      const an = (i / 12) * TAU, r = Math.min(W, H) * 0.44;
      ctx.fillStyle = rgba(cols[i % cols.length], 0.14);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, r, an, an + TAU / 12); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = rgba("#ffffff", 0.15); ctx.lineWidth = 2; ctx.stroke();
    }
    ring(ctx, 0, 0, Math.min(W, H) * 0.44, 3, b2, 0.35);
    ctx.restore();
  }, { cat: "Venues & Textures", b1: "#160c24", b2: "#f59e0b" });

  bg("jazz-lounge", "Velvet Jazz Lounge", (ctx, t, W, H, c) => {
    const b1 = c.b1 || "#2b0816", b2 = c.b2 || "#f59e0b";
    sky(ctx, W, H, [[0, "#100208"], [0.5, b1], [1, "#0a0205"]]);
    rad(ctx, W * 0.5, H * 0.3, Math.max(W, H) * 0.5, [[0, rgba(b2, 0.24)], [1, rgba(b2, 0)]]);
    ctx.save(); ctx.globalCompositeOperation = "lighter"; const R = rng(531);
    for (let i = 0; i < 28; i++) glowDot(ctx, (R() * W + Math.sin(t * 0.3 * c.sp + i) * 30) % W, (R() * H + Math.cos(t * 0.2 * c.sp + i) * 20) % H, 22 + R() * 55, i % 3 === 0 ? "#fb7185" : b2, 0.16);
    ctx.restore();
  }, { cat: "Venues & Textures", b1: "#2b0816", b2: "#f59e0b" });

  bg("tokyo-neon-alley", "Shinjuku Neon Alley", (ctx, t, W, H, c) => {
    const b1 = c.b1 || "#06b6d4", b2 = c.b2 || "#f43f5e";
    sky(ctx, W, H, [[0, "#050412"], [0.7, "#110926"], [1, "#070414"]]);
    const R = rng(532);
    for (let i = 0; i < 16; i++) {
      const side = i % 2 ? R() * 0.25 : 0.75 + R() * 0.25, x = side * W, y = H * (0.1 + R() * 0.55), col = i % 2 ? b1 : b2, fl = 0.6 + 0.4 * Math.sin(t * 3 * c.sp + i * 2);
      ctx.fillStyle = rgba(col, 0.25 * fl); ctx.fillRect(x - 16, y, 32, 60 + R() * 60);
      glowDot(ctx, x, y + 35, 50, col, 0.22 * fl);
    }
    shimmer(ctx, W * 0.25, H * 0.78, H, W * 0.2, W * 0.3, t, c.sp, b1, 22);
    shimmer(ctx, W * 0.75, H * 0.78, H, W * 0.2, W * 0.3, t, c.sp, b2, 22);
  }, { cat: "Venues & Textures", b1: "#06b6d4", b2: "#f43f5e" });

  bg("ancient-ruins", "Moonlit Temple Columns", (ctx, t, W, H, c) => {
    const b1 = c.b1 || "#0f172a", b2 = c.b2 || "#cbd5e1";
    sky(ctx, W, H, [[0, "#040814"], [0.65, b1], [1, "#070d1c"]]);
    stars(ctx, W, H * 0.6, 85, 533, t, c.sp);
    rad(ctx, W * 0.5, H * 0.24, Math.min(W, H) * 0.22, [[0, "#ffffff"], [0.35, rgba(b2, 0.35)], [1, rgba(b2, 0)]]);
    [0.06, 0.16, 0.84, 0.94].forEach((kx) => {
      const w = Math.max(22, W * 0.045), x = kx * W - w / 2;
      ctx.fillStyle = mix(b1, b2, 0.18); ctx.fillRect(x, H * 0.12, w, H * 0.88);
      ctx.fillRect(x - 6, H * 0.1, w + 12, H * 0.03);
    });
    const R = rng(534); ctx.save(); ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < 32; i++) glowDot(ctx, R() * W, H - ((t * (16 + R() * 20) * c.sp + R() * H) % H), 3 + R() * 4, "#fbbf24", 0.45);
    ctx.restore();
  }, { cat: "Venues & Textures", b1: "#0f172a", b2: "#cbd5e1" });

  bg("wooden-bookshelf", "Vintage Chess Club", (ctx, t, W, H, c) => {
    const b1 = c.b1 || "#23120b", b2 = c.b2 || "#34d399";
    sky(ctx, W, H, [[0, "#120804"], [0.55, b1], [1, "#0c0503"]]);
    ctx.strokeStyle = rgba("#78350f", 0.4); ctx.lineWidth = 2;
    for (let x = W * 0.08; x < W; x += W * 0.16) { ctx.strokeRect(x, H * 0.08, W * 0.12, H * 0.84); }
    rad(ctx, W * 0.16, H * 0.22, Math.min(W, H) * 0.3, [[0, rgba(b2, 0.35)], [1, rgba(b2, 0)]]);
    rad(ctx, W * 0.84, H * 0.22, Math.min(W, H) * 0.3, [[0, rgba(b2, 0.35)], [1, rgba(b2, 0)]]);
    const R = rng(535);
    for (let i = 0; i < 40; i++) glowDot(ctx, (R() * W + Math.sin(t * 0.4 * c.sp + i) * 18) % W, (R() * H + Math.cos(t * 0.3 * c.sp + i) * 14) % H, 2 + R() * 3, "#fde68a", 0.35);
  }, { cat: "Venues & Textures", b1: "#23120b", b2: "#34d399" });

  bg("art-deco-gold", "1920s Art Deco Gold", (ctx, t, W, H, c) => {
    const b1 = c.b1 || "#0c0a09", b2 = c.b2 || "#eab308";
    lin(ctx, W, H, b1, mix(b1, b2, 0.16));
    ctx.strokeStyle = rgba(b2, 0.22 + 0.08 * Math.sin(t * 1.2 * c.sp)); ctx.lineWidth = 1.6;
    const sp = Math.max(48, Math.min(W, H) * 0.1);
    for (let y = 0; y <= H + sp; y += sp) for (let x = 0; x <= W + sp; x += sp) {
      ctx.beginPath(); ctx.arc(x, y, sp * 0.8, PI, TAU); ctx.stroke();
      ctx.beginPath(); ctx.arc(x, y, sp * 0.5, PI, TAU); ctx.stroke();
    }
    rad(ctx, W * 0.5, H * 0.5, Math.min(W, H) * 0.5, [[0, rgba(b2, 0.18)], [1, rgba(b2, 0)]]);
  }, { cat: "Venues & Textures", b1: "#0c0a09", b2: "#eab308" });

  bg("misty-harbor", "Midnight Lighthouse", (ctx, t, W, H, c) => {
    const b1 = c.b1 || "#061523", b2 = c.b2 || "#fde047", hy = H * 0.68;
    sky(ctx, W, H, [[0, "#020810"], [0.65, b1], [1, mix(b1, "#16354d", 0.4)]], 0, hy);
    stars(ctx, W, hy * 0.8, 70, 537, t, c.sp);
    const lx = W * 0.14, ly = hy - H * 0.16, sweep = Math.sin(t * 0.7 * c.sp) * 0.35;
    ctx.fillStyle = "#08121c"; ctx.fillRect(lx - 10, ly, 20, H * 0.18);
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    const g = ctx.createLinearGradient(lx, ly, lx + Math.cos(sweep) * W, ly + Math.sin(sweep) * W);
    g.addColorStop(0, rgba(b2, 0.55)); g.addColorStop(1, rgba(b2, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(lx, ly);
    ctx.lineTo(lx + Math.cos(sweep - 0.08) * W * 1.1, ly + Math.sin(sweep - 0.08) * W * 1.1);
    ctx.lineTo(lx + Math.cos(sweep + 0.08) * W * 1.1, ly + Math.sin(sweep + 0.08) * W * 1.1);
    ctx.closePath(); ctx.fill(); ctx.restore();
    sky(ctx, W, H, [[0, mix(b1, "#0c283d", 0.5)], [1, "#030a12"]], hy, H);
    wave(ctx, W, H, hy + H * 0.06, H * 0.01, 0.01, t * c.sp, "#04101c", rgba(b2, 0.25), 1.6);
  }, { cat: "Beach & Ocean", b1: "#061523", b2: "#fde047" });

  F.addBackgrounds(BG);
})(typeof globalThis !== "undefined" ? globalThis : this);
