// FX Lab extra Cosmic, Sci-Fi & Abstract Motion backgrounds (25). Uses helpers from F._bg & F._lib.
(function (root) {
  "use strict";
  const F = typeof module === "object" && module.exports && typeof require === "function" ? require("./core.js") : root.PnoyFX;
  const { TAU, PI, lerp, clamp, rng, hash, rgba, mix, poly, glowDot, ring, bolt } = F._lib;
  const { lin, sky, rad, stars, wave } = F._bg;
  const BG = [];
  const bg = (id, name, draw, opts) => BG.push(Object.assign({ id, name, draw }, opts || {}));

  // ---------- 1. SPACE & SCI-FI ----------
  bg("black-hole", "Accretion Black Hole", (ctx, t, W, H, c) => {
    const b1 = c.b1 || "#ff6d00", b2 = c.b2 || "#38bdf8", cx = W * 0.5, cy = H * 0.5, er = Math.min(W, H) * 0.16;
    ctx.fillStyle = "#020106"; ctx.fillRect(0, 0, W, H); stars(ctx, W, H, 120, 601, t, c.sp);
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    rad(ctx, cx, cy, er * 3.1, [[0, rgba(b1, 0.45)], [0.4, rgba(b2, 0.2)], [1, "rgba(0,0,0,0)"]]);
    for (let i = 0; i < 6; i++) {
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(-0.28 + Math.sin(t * 0.2 * c.sp + i) * 0.03);
      ctx.strokeStyle = rgba(i % 2 ? b1 : b2, 0.45 - i * 0.05); ctx.lineWidth = 4 - i * 0.4;
      ctx.beginPath(); ctx.ellipse(0, 0, er * (1.7 + i * 0.28), er * (0.42 + i * 0.06), 0, 0, TAU); ctx.stroke(); ctx.restore();
    }
    ctx.restore();
    ctx.fillStyle = "#000000"; ctx.beginPath(); ctx.arc(cx, cy, er, 0, TAU); ctx.fill();
    ring(ctx, cx, cy, er + 2, 2.5, "#ffd166", 0.8);
  }, { cat: "Space & Sci-Fi", b1: "#ff6d00", b2: "#38bdf8" });

  bg("wormhole-rings", "Quantum Wormhole", (ctx, t, W, H, c) => {
    const b1 = c.b1 || "#06b6d4", b2 = c.b2 || "#a855f7", cx = W * 0.5, cy = H * 0.5, maxR = Math.hypot(cx, cy);
    ctx.fillStyle = "#03020c"; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < 18; i++) {
      const z = ((i / 18 + t * 0.22 * c.sp) % 1), rr = Math.max(4, Math.pow(z, 2) * maxR);
      ring(ctx, cx + Math.sin(t * c.sp + i) * 10, cy + Math.cos(t * 0.8 * c.sp + i) * 8, rr, 1.5 + z * 3, mix(b1, b2, (i % 6) / 5), (1 - z) * 0.75);
    }
    ctx.restore();
  }, { cat: "Space & Sci-Fi", b1: "#06b6d4", b2: "#a855f7" });

  bg("solar-flare", "Solar Flare Horizon", (ctx, t, W, H, c) => {
    const b1 = c.b1 || "#ef4444", b2 = c.b2 || "#fde047";
    sky(ctx, W, H, [[0, "#050104"], [0.65, mix(b1, "#180402", 0.7)], [1, b1]]);
    stars(ctx, W, H * 0.65, 95, 603, t, c.sp);
    rad(ctx, W * 0.5, H * 1.15, Math.min(W, H) * 0.7, [[0, "#ffffff"], [0.35, b2], [0.7, b1], [1, rgba(b1, 0)]]);
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < 5; i++) {
      const sx = W * (0.15 + i * 0.17), ph = Math.sin(t * 1.1 * c.sp + i) * 20;
      ctx.strokeStyle = rgba(b2, 0.35); ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(sx, H * 0.96, W * 0.08 + ph, PI, TAU); ctx.stroke();
    }
    ctx.restore();
  }, { cat: "Space & Sci-Fi", b1: "#ef4444", b2: "#fde047" });

  bg("cyber-matrix-grid", "Tron Laser Grid", (ctx, t, W, H, c) => {
    const b1 = c.b1 || "#00f5d4", b2 = c.b2 || "#7209b7", hy = H * 0.52;
    sky(ctx, W, H, [[0, "#02010a"], [0.5, mix(b2, "#070316", 0.5)], [1, "#02010a"]]);
    ctx.strokeStyle = rgba(b1, 0.32); ctx.lineWidth = 1.3;
    for (let i = -18; i <= 18; i++) {
      ctx.beginPath(); ctx.moveTo(W * 0.5 + i * W * 0.015, hy); ctx.lineTo(W * 0.5 + i * W * 0.22, H); ctx.stroke();
    }
    for (let j = 0; j < 14; j++) {
      const z = ((j + t * 1.8 * c.sp) % 14) / 14, y = hy + Math.pow(z, 2.2) * (H - hy);
      ctx.strokeStyle = rgba(j % 3 === 0 ? b2 : b1, z * 0.7);
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    rad(ctx, W * 0.5, hy, W * 0.4, [[0, rgba(b1, 0.32)], [1, rgba(b1, 0)]]);
  }, { cat: "Space & Sci-Fi", b1: "#00f5d4", b2: "#7209b7" });

  bg("hud-radar", "Tactical Sonar Radar", (ctx, t, W, H, c) => {
    const b1 = c.b1 || "#041612", b2 = c.b2 || "#10b981", cx = W * 0.5, cy = H * 0.5, Rmax = Math.min(W, H) * 0.46;
    lin(ctx, W, H, "#010907", b1);
    for (let k = 1; k <= 5; k++) ring(ctx, cx, cy, (k / 5) * Rmax, 1.3, b2, 0.25);
    ctx.strokeStyle = rgba(b2, 0.18); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx - Rmax, cy); ctx.lineTo(cx + Rmax, cy); ctx.moveTo(cx, cy - Rmax); ctx.lineTo(cx, cy + Rmax); ctx.stroke();
    const ang = t * 1.2 * c.sp;
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    const g = ctx.createLinearGradient(cx, cy, cx + Math.cos(ang) * Rmax, cy + Math.sin(ang) * Rmax);
    g.addColorStop(0, rgba(b2, 0.45)); g.addColorStop(1, rgba(b2, 0.05));
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, Rmax, ang - 0.55, ang); ctx.closePath(); ctx.fill();
    const R = rng(605);
    for (let i = 0; i < 8; i++) glowDot(ctx, cx + (R() - 0.5) * Rmax * 1.4, cy + (R() - 0.5) * Rmax * 1.4, 8, b2, 0.3 + 0.5 * Math.abs(Math.sin(t * 2 + i)));
    ctx.restore();
  }, { cat: "Space & Sci-Fi", b1: "#041612", b2: "#10b981" });

  bg("binary-orbit", "Binary Star Orbit", (ctx, t, W, H, c) => {
    const b1 = c.b1 || "#38bdf8", b2 = c.b2 || "#fb923c", cx = W * 0.5, cy = H * 0.5, r = Math.min(W, H) * 0.26;
    ctx.fillStyle = "#03040c"; ctx.fillRect(0, 0, W, H); stars(ctx, W, H, 140, 606, t, c.sp);
    ring(ctx, cx, cy, r, 1.4, "#94a3b8", 0.2);
    const a = t * 0.7 * c.sp;
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    glowDot(ctx, cx + Math.cos(a) * r, cy + Math.sin(a) * r, r * 0.42, b1, 0.85);
    glowDot(ctx, cx - Math.cos(a) * r, cy - Math.sin(a) * r, r * 0.36, b2, 0.85);
    ctx.restore();
  }, { cat: "Space & Sci-Fi", b1: "#38bdf8", b2: "#fb923c" });

  bg("saturn-rings", "Ringed Giant Horizon", (ctx, t, W, H, c) => {
    const b1 = c.b1 || "#1e1b4b", b2 = c.b2 || "#f59e0b";
    sky(ctx, W, H, [[0, "#020208"], [0.7, b1], [1, "#05030e"]]);
    stars(ctx, W, H, 160, 607, t, c.sp);
    const px = W * 0.5, py = H * 1.15, pr = Math.max(W, H) * 0.52;
    ctx.save(); ctx.translate(px, py); ctx.rotate(-0.18 + Math.sin(t * 0.15 * c.sp) * 0.02);
    for (let i = 0; i < 4; i++) {
      ctx.strokeStyle = rgba(b2, 0.35 - i * 0.06); ctx.lineWidth = 8 - i;
      ctx.beginPath(); ctx.ellipse(0, 0, pr * (1.45 + i * 0.1), pr * (0.28 + i * 0.03), 0, PI, TAU); ctx.stroke();
    }
    ctx.restore();
    rad(ctx, px, py, pr, [[0, mix(b1, b2, 0.45)], [0.75, b1], [1, "#03020a"]]);
  }, { cat: "Space & Sci-Fi", b1: "#1e1b4b", b2: "#f59e0b" });

  bg("orbital-station", "Low Earth Orbit", (ctx, t, W, H, c) => {
    const b1 = c.b1 || "#0284c7", b2 = c.b2 || "#38bdf8";
    ctx.fillStyle = "#01030a"; ctx.fillRect(0, 0, W, H); stars(ctx, W, H * 0.78, 170, 608, t, c.sp);
    const cx = W * 0.5, cy = H * 1.65, R = Math.max(W, H) * 1.05;
    rad(ctx, cx, cy, R + 34, [[0.85, "#06182e"], [0.95, b1], [0.985, b2], [1, rgba(b2, 0)]]);
    ctx.fillStyle = "#040d1a"; ctx.beginPath(); ctx.arc(cx, cy, R - 4, 0, TAU); ctx.fill();
    const Rc = rng(609); ctx.fillStyle = rgba("#fde047", 0.55);
    for (let i = 0; i < 55; i++) ctx.fillRect((Rc() * W - t * 10 * c.sp + W * 10) % W, H * (0.72 + Rc() * 0.25), 2.5, 2.5);
  }, { cat: "Space & Sci-Fi", b1: "#0284c7", b2: "#38bdf8" });

  bg("ion-storm", "Ion Nebula Lightning", (ctx, t, W, H, c) => {
    const b1 = c.b1 || "#06b6d4", b2 = c.b2 || "#9333ea";
    ctx.fillStyle = "#03020a"; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < 5; i++) glowDot(ctx, W * (0.2 + i * 0.16), H * (0.35 + 0.25 * Math.sin(t * 0.5 * c.sp + i)), Math.min(W, H) * 0.34, i % 2 ? b1 : b2, 0.25);
    const f = Math.floor(t * 2.2 * c.sp), R = rng(f + 610);
    if (hash(f) > 0.45) bolt(ctx, R() * W, 0, R() * W, H, R, 12, W * 0.08, "#e0f2fe", 2.5, 0.75);
    ctx.restore();
  }, { cat: "Space & Sci-Fi", b1: "#06b6d4", b2: "#9333ea" });

  bg("data-stream", "Fiber Optic Stream", (ctx, t, W, H, c) => {
    const b1 = c.b1 || "#06b6d4", b2 = c.b2 || "#3b82f6";
    lin(ctx, W, H, "#020614", "#08122b");
    ctx.save(); ctx.globalCompositeOperation = "lighter"; const R = rng(611);
    for (let i = 0; i < 65; i++) {
      const y = (i / 65) * H, len = 40 + R() * 140, sp = (120 + R() * 260) * c.sp, x = (t * sp + R() * W) % (W + len) - len;
      const g = ctx.createLinearGradient(x, y, x + len, y);
      g.addColorStop(0, rgba(b2, 0)); g.addColorStop(0.8, rgba(i % 2 ? b1 : b2, 0.65)); g.addColorStop(1, "#ffffff");
      ctx.strokeStyle = g; ctx.lineWidth = 1.5 + R() * 1.8; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + len, y); ctx.stroke();
    }
    ctx.restore();
  }, { cat: "Space & Sci-Fi", b1: "#06b6d4", b2: "#3b82f6" });

  // ---------- 2. ABSTRACT & OPTICAL ----------
  bg("liquid-chrome", "Liquid Metal Ripples", (ctx, t, W, H, c) => {
    const b1 = c.b1 || "#1e293b", b2 = c.b2 || "#e2e8f0";
    lin(ctx, W, H, "#090d16", b1);
    for (let i = 0; i < 16; i++) {
      const yBase = (i / 15) * H, col = mix(b1, b2, 0.5 + 0.5 * Math.sin(i * 0.6 + t * c.sp));
      ctx.strokeStyle = rgba(col, 0.35); ctx.lineWidth = Math.max(2, H / 28); ctx.beginPath();
      for (let x = 0; x <= W; x += 18) {
        const y = yBase + Math.sin(x * 0.008 + t * 1.1 * c.sp + i * 0.4) * 26 + Math.cos(x * 0.015 - t * 0.8 * c.sp) * 12;
        x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke();
    }
  }, { cat: "Abstract & Motion", b1: "#1e293b", b2: "#e2e8f0" });

  bg("prism-refraction", "Crystal Prism Shards", (ctx, t, W, H, c) => {
    const b1 = c.b1 || "#11092b", b2 = c.b2 || "#22d3ee";
    lin(ctx, W, H, "#050312", b1);
    ctx.save(); ctx.globalCompositeOperation = "lighter"; const R = rng(613);
    for (let i = 0; i < 28; i++) {
      const x = R() * W, y = (R() * H + t * (12 + R() * 18) * c.sp) % H, sz = 18 + R() * 38;
      ctx.save(); ctx.translate(x, y); ctx.rotate(t * (R() - 0.5) * c.sp + i);
      ctx.fillStyle = rgba(i % 2 ? b2 : "#f472b6", 0.14); ctx.strokeStyle = rgba("#ffffff", 0.25); ctx.lineWidth = 1.2;
      poly(ctx, [[0, -sz], [sz * 0.7, sz * 0.4], [-sz * 0.6, sz * 0.8]]); ctx.fill(); ctx.stroke(); ctx.restore();
    }
    ctx.restore();
  }, { cat: "Abstract & Motion", b1: "#11092b", b2: "#22d3ee" });

  bg("audio-spectrum", "Equalizer Pulse Bars", (ctx, t, W, H, c) => {
    const b1 = c.b1 || "#090d1e", b2 = c.b2 || "#22d3ee", n = 32, bw = W / n;
    lin(ctx, W, H, "#040610", b1);
    for (let i = 0; i < n; i++) {
      const h = (0.15 + 0.55 * Math.abs(Math.sin(i * 0.42 + t * 2.2 * c.sp) * Math.cos(i * 0.19 - t * 1.4 * c.sp))) * H;
      const g = ctx.createLinearGradient(0, H - h, 0, H); g.addColorStop(0, b2); g.addColorStop(1, rgba(b1, 0.2));
      ctx.fillStyle = g; ctx.fillRect(i * bw + 2, H - h, Math.max(2, bw - 4), h);
    }
  }, { cat: "Abstract & Motion", b1: "#090d1e", b2: "#22d3ee" });

  bg("caustics-water", "Sunlit Pool Caustics", (ctx, t, W, H, c) => {
    const b1 = c.b1 || "#0369a1", b2 = c.b2 || "#67e8f9";
    lin(ctx, W, H, mix(b1, "#021e33", 0.5), b1);
    ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.strokeStyle = rgba(b2, 0.24); ctx.lineWidth = 2.2;
    for (let k = 0; k < 10; k++) {
      ctx.beginPath();
      for (let x = 0; x <= W; x += 18) {
        const y = (k + 0.5) * (H / 10) + Math.sin(x * 0.012 + t * 1.4 * c.sp + k) * 28 + Math.cos(x * 0.02 - t * c.sp - k) * 14;
        x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke();
    }
    ctx.restore();
  }, { cat: "Beach & Ocean", b1: "#0369a1", b2: "#67e8f9" });

  bg("sacred-mandala", "Rotating Sacred Mandala", (ctx, t, W, H, c) => {
    const b1 = c.b1 || "#0f0c24", b2 = c.b2 || "#fbbf24", cx = W * 0.5, cy = H * 0.5, mr = Math.min(W, H) * 0.44;
    lin(ctx, W, H, "#05040f", b1);
    for (let r = 1; r <= 4; r++) {
      const rr = (r / 4) * mr, petals = 6 + r * 4;
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(t * (r % 2 ? 0.14 : -0.1) * c.sp);
      ctx.strokeStyle = rgba(b2, 0.22); ctx.lineWidth = 1.5;
      for (let i = 0; i < petals; i++) {
        const an = (i / petals) * TAU;
        ctx.beginPath(); ctx.arc(Math.cos(an) * rr * 0.72, Math.sin(an) * rr * 0.72, rr * 0.28, 0, TAU); ctx.stroke();
      }
      ctx.restore();
    }
  }, { cat: "Abstract & Motion", b1: "#0f0c24", b2: "#fbbf24" });

  bg("ink-drops", "Ink-in-Water Blooms", (ctx, t, W, H, c) => {
    const b1 = c.b1 || "#ec4899", b2 = c.b2 || "#6366f1";
    ctx.fillStyle = "#080912"; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < 8; i++) {
      const ph = (t * 0.18 * c.sp + i * 0.125) % 1, cx = W * (0.15 + ((i * 37) % 70) / 100), cy = H * (0.2 + ((i * 53) % 60) / 100);
      glowDot(ctx, cx, cy, Math.min(W, H) * (0.08 + ph * 0.36), i % 2 ? b1 : b2, (1 - ph) * 0.42);
    }
    ctx.restore();
  }, { cat: "Abstract & Motion", b1: "#ec4899", b2: "#6366f1" });

  bg("paper-origami", "Origami Low-Poly Mesh", (ctx, t, W, H, c) => {
    const b1 = c.b1 || "#1e1b4b", b2 = c.b2 || "#38bdf8", cols = 8, rows = 6, cw = W / cols, ch = H / rows;
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const x0 = x * cw, y0 = y * ch, k1 = 0.2 + 0.6 * (0.5 + 0.5 * Math.sin(x * 0.9 + y * 0.7 + t * 0.8 * c.sp));
      const k2 = 0.2 + 0.6 * (0.5 + 0.5 * Math.cos(x * 0.7 - y * 0.8 + t * 0.6 * c.sp));
      ctx.fillStyle = mix(b1, b2, k1); poly(ctx, [[x0, y0], [x0 + cw, y0], [x0, y0 + ch]]); ctx.fill();
      ctx.fillStyle = mix(b1, b2, k2); poly(ctx, [[x0 + cw, y0], [x0 + cw, y0 + ch], [x0, y0 + ch]]); ctx.fill();
    }
    ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.fillRect(0, 0, W, H);
  }, { cat: "Abstract & Motion", b1: "#1e1b4b", b2: "#38bdf8" });

  bg("fireworks-night", "Festival Fireworks Sky", (ctx, t, W, H, c) => {
    const b1 = c.b1 || "#f43f5e", b2 = c.b2 || "#facc15";
    sky(ctx, W, H, [[0, "#02030c"], [0.8, "#0b1026"], [1, "#121836"]]);
    stars(ctx, W, H * 0.75, 90, 619, t, c.sp);
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    for (let b = 0; b < 4; b++) {
      const cycle = (t * 0.55 * c.sp + b * 0.27) % 1, bx = W * (0.18 + ((b * 37) % 65) / 100), by = H * (0.2 + ((b * 23) % 35) / 100);
      const col = b % 2 ? b1 : b2, r = Math.min(W, H) * 0.22 * cycle;
      for (let i = 0; i < 20; i++) {
        const an = (i / 20) * TAU;
        glowDot(ctx, bx + Math.cos(an) * r, by + Math.sin(an) * r + cycle * cycle * 24, 5, col, (1 - cycle) * 0.85);
      }
    }
    ctx.restore();
  }, { cat: "Weather & Sky", b1: "#f43f5e", b2: "#facc15" });

  bg("dna-helix", "Luminous Double Helix", (ctx, t, W, H, c) => {
    const b1 = c.b1 || "#06b6d4", b2 = c.b2 || "#ec4899";
    lin(ctx, W, H, "#040614", "#0c122e");
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < 28; i++) {
      const y = (i / 27) * H, ph = i * 0.36 + t * 1.5 * c.sp, x1 = W * 0.5 + Math.sin(ph) * W * 0.28, x2 = W * 0.5 - Math.sin(ph) * W * 0.28;
      ctx.strokeStyle = rgba("#cbd5e1", 0.16); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke();
      glowDot(ctx, x1, y, 7, b1, 0.75); glowDot(ctx, x2, y, 7, b2, 0.75);
    }
    ctx.restore();
  }, { cat: "Abstract & Motion", b1: "#06b6d4", b2: "#ec4899" });

  bg("laser-beams", "Concert Laser Beams", (ctx, t, W, H, c) => {
    const b1 = c.b1 || "#22d3ee", b2 = c.b2 || "#d946ef";
    ctx.fillStyle = "#04020a"; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < 10; i++) {
      const ox = (i % 2 ? 0.15 : 0.85) * W, tx = W * (0.5 + Math.sin(t * (0.9 + i * 0.15) * c.sp + i) * 0.55);
      ctx.strokeStyle = rgba(i % 2 ? b1 : b2, 0.35); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(ox, H); ctx.lineTo(tx, 0); ctx.stroke();
    }
    ctx.restore();
  }, { cat: "Abstract & Motion", b1: "#22d3ee", b2: "#d946ef" });

  bg("velvet-curtain", "Royal Velvet Theater", (ctx, t, W, H, c) => {
    const b1 = c.b1 || "#450a0a", b2 = c.b2 || "#b91c1c";
    lin(ctx, W, H, "#140202", b1);
    const folds = 18, fw = W / folds;
    for (let i = 0; i < folds; i++) {
      const sh = 0.5 + 0.5 * Math.sin(i * 0.8 + t * 1.1 * c.sp);
      const g = ctx.createLinearGradient(i * fw, 0, (i + 1) * fw, 0);
      g.addColorStop(0, mix("#0e0101", b1, 0.4)); g.addColorStop(0.5, mix(b1, b2, sh)); g.addColorStop(1, "#0e0101");
      ctx.fillStyle = g; ctx.fillRect(i * fw, 0, fw + 1, H);
    }
    rad(ctx, W * 0.5, H * 0.3, Math.max(W, H) * 0.5, [[0, "rgba(255,214,150,0.14)"], [1, "rgba(0,0,0,0.5)"]]);
  }, { cat: "Venues & Textures", b1: "#450a0a", b2: "#b91c1c" });

  bg("moire-waves", "Hypnotic Moire Rings", (ctx, t, W, H, c) => {
    const b1 = c.b1 || "#080f24", b2 = c.b2 || "#38bdf8";
    ctx.fillStyle = b1; ctx.fillRect(0, 0, W, H);
    const c1x = W * 0.5 + Math.cos(t * 0.7 * c.sp) * W * 0.14, c1y = H * 0.5 + Math.sin(t * 0.5 * c.sp) * H * 0.14;
    const c2x = W * 0.5 - Math.cos(t * 0.6 * c.sp) * W * 0.14, c2y = H * 0.5 - Math.sin(t * 0.8 * c.sp) * H * 0.14;
    for (let r = 18; r < Math.max(W, H); r += 20) {
      ring(ctx, c1x, c1y, r, 1.3, b2, 0.2); ring(ctx, c2x, c2y, r, 1.3, "#ffffff", 0.12);
    }
  }, { cat: "Abstract & Motion", b1: "#080f24", b2: "#38bdf8" });

  bg("neon-hex-tunnel", "Neon Hex Tunnel", (ctx, t, W, H, c) => {
    const b1 = c.b1 || "#00f5d4", b2 = c.b2 || "#ff2a85", cx = W * 0.5, cy = H * 0.5, maxR = Math.hypot(cx, cy);
    ctx.fillStyle = "#04020a"; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < 14; i++) {
      const z = ((i / 14 + t * 0.25 * c.sp) % 1), r = Math.max(6, Math.pow(z, 1.9) * maxR);
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(t * 0.15 * c.sp + i * 0.12);
      ctx.strokeStyle = rgba(i % 2 ? b1 : b2, (1 - z) * 0.75); ctx.lineWidth = 1.5 + z * 2.5;
      ctx.beginPath(); for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU; k ? ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
      ctx.closePath(); ctx.stroke(); ctx.restore();
    }
    ctx.restore();
  }, { cat: "Space & Sci-Fi", b1: "#00f5d4", b2: "#ff2a85" });

  bg("ember-phoenix", "Golden Flame Aura", (ctx, t, W, H, c) => {
    const b1 = c.b1 || "#dc2626", b2 = c.b2 || "#facc15";
    sky(ctx, W, H, [[0, "#0b0202"], [0.6, "#1f0604"], [1, "#3b0a04"]]);
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < 9; i++) {
      const x = (i / 8) * W + Math.sin(t * 1.4 * c.sp + i) * 35, y = H - ((t * (45 + i * 6) * c.sp + i * 80) % (H * 0.9));
      glowDot(ctx, x, y, Math.min(W, H) * 0.22, i % 2 ? b1 : b2, 0.24);
    }
    wave(ctx, W, H, H * 0.86, H * 0.04, 0.015, t * 2.4 * c.sp, rgba(b1, 0.45), rgba(b2, 0.5), 2);
    ctx.restore();
  }, { cat: "Abstract & Motion", b1: "#dc2626", b2: "#facc15" });

  bg("kaleido-bloom", "Kaleidoscope Bloom", (ctx, t, W, H, c) => {
    const b1 = c.b1 || "#6366f1", b2 = c.b2 || "#f472b6", cx = W * 0.5, cy = H * 0.5, mr = Math.min(W, H) * 0.45;
    lin(ctx, W, H, "#070514", "#120c2b");
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(t * 0.12 * c.sp); ctx.globalCompositeOperation = "lighter";
    for (let k = 0; k < 8; k++) {
      ctx.save(); ctx.rotate((k / 8) * TAU);
      const pulse = 0.7 + 0.3 * Math.sin(t * 1.6 * c.sp + k);
      ctx.fillStyle = rgba(k % 2 ? b1 : b2, 0.2);
      ctx.beginPath(); ctx.ellipse(mr * 0.48 * pulse, 0, mr * 0.42, mr * 0.12, 0, 0, TAU); ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }, { cat: "Abstract & Motion", b1: "#6366f1", b2: "#f472b6" });

  F.addBackgrounds(BG);
})(typeof globalThis !== "undefined" ? globalThis : this);
