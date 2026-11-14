// FX Lab scenic backgrounds: Forest & Woodland, Beach & Ocean, Landscapes & Nature, Venues & Textures, plus Sci-Fi scenes.
// Uses shared canvas helpers on F._bg (backgrounds.js) and registers into core.js.
(function (root) {
  "use strict";
  const F = typeof module === "object" && module.exports && typeof require === "function" ? require("./core.js") : root.PnoyFX;
  const { TAU, PI, lerp, rng, hash, rgba, mix, glowDot, ring } = F._lib;
  const { lin, sky, rad, stars, hills, pine, canopyTree, palm, wave, beams, cloud, shimmer, leafShape } = F._bg;
  const BG = [];
  const bg = (id, name, draw, opts) => BG.push(Object.assign({ id, name, draw }, opts || {}));

  // ---------- 1. FOREST & WOODLAND ----------
  bg("forest-sunbeams", "Sunlit Enchanted Forest", (ctx, t, W, H, c) => {
    const b1 = c.b1 || "#092116", b2 = c.b2 || "#b7f07a";
    sky(ctx, W, H, [[0, mix(b1, b2, 0.35)], [0.55, b1], [1, mix(b1, "#020805", 0.7)]]);
    rad(ctx, W * 0.22, H * 0.12, Math.max(W, H) * 0.55, [[0, rgba(b2, 0.45)], [0.5, rgba(b2, 0.12)], [1, rgba(b2, 0)]]);
    hills(ctx, W, H, H * 0.72, H * 0.08, 2.1, mix(b1, "#04120b", 0.45), 0);
    const R1 = rng(101);
    for (let i = 0; i < 18; i++) {
      const x = (i / 17) * W + (R1() - 0.5) * W * 0.04, h = H * (0.42 + R1() * 0.24);
      pine(ctx, x, H * 0.86, h, h * 0.36, mix(b1, "#04110a", 0.5), Math.sin(t * 0.6 * c.sp + i) * 0.015);
    }
    beams(ctx, W * 0.18, -H * 0.05, Math.max(W, H) * 1.35, 7, 0.45, 1.35, b2, 0.16, t, c.sp);
    const R2 = rng(102);
    for (let i = 0; i < 14; i++) {
      const side = i % 2 ? R2() * 0.24 : 0.76 + R2() * 0.24, x = side * W, h = H * (0.58 + R2() * 0.3);
      if (i % 3 === 0) canopyTree(ctx, x, H, h, h * 0.45, mix(b1, "#020805", 0.8), Math.sin(t * 0.7 * c.sp + i) * 0.015);
      else pine(ctx, x, H, h, h * 0.34, mix(b1, "#020906", 0.82), Math.sin(t * 0.8 * c.sp + i) * 0.02);
    }
    sky(ctx, W, H, [[0, rgba(b2, 0)], [1, rgba(b2, 0.18)]], H * 0.72, H);
    ctx.save(); ctx.globalCompositeOperation = "lighter"; const R3 = rng(103);
    for (let i = 0; i < 65; i++) {
      const x = (R3() * W + Math.sin(t * 0.4 * c.sp + i) * 45 + t * 8 * c.sp) % W, y = (R3() * H - t * (6 + R3() * 14) * c.sp + H * 10) % H;
      glowDot(ctx, x, y, 4 + R3() * 9, b2, 0.2 + 0.45 * (0.5 + 0.5 * Math.sin(t * 2.2 + i * 2)));
    }
    ctx.restore();
  }, { cat: "Forest & Woodland", b1: "#092116", b2: "#b7f07a" });

  bg("forest-mist", "Misty Pine Mountains", (ctx, t, W, H, c) => {
    const b1 = c.b1 || "#112529", b2 = c.b2 || "#9cd3c9";
    sky(ctx, W, H, [[0, mix(b1, "#071014", 0.5)], [0.55, b1], [1, mix(b1, b2, 0.3)]]);
    rad(ctx, W * 0.78, H * 0.2, Math.min(W, H) * 0.16, [[0, rgba("#ffffff", 0.85)], [0.3, rgba(b2, 0.35)], [1, rgba(b2, 0)]]);
    for (let L = 0; L < 3; L++) {
      const by = H * (0.46 + L * 0.14), ridge = mix(b1, b2, 0.35 - L * 0.15);
      hills(ctx, W, H, by, H * 0.06, 4 + L * 3, ridge, 0);
      const R = rng(110 + L), cnt = 22 + L * 6;
      for (let i = 0; i < cnt; i++) {
        const x = (i / (cnt - 1)) * W + (R() - 0.5) * 30, th = H * (0.14 + L * 0.06 + R() * 0.08);
        const py = by + Math.sin((x / W) * 6.2 + 4 + L * 3) * H * 0.03 + H * 0.02;
        pine(ctx, x, py + th * 0.5, th, th * 0.38, mix(ridge, "#030a0c", 0.35 + L * 0.2), Math.sin(t * 0.5 * c.sp + i) * 0.012);
      }
      const mist = ctx.createLinearGradient(0, by - H * 0.04, 0, by + H * 0.15);
      mist.addColorStop(0, rgba(b2, 0)); mist.addColorStop(0.5, rgba(b2, 0.22 - L * 0.04)); mist.addColorStop(1, rgba(b2, 0));
      ctx.fillStyle = mist;
      for (let m = 0; m < 4; m++) {
        const mx = ((m * W * 0.35 + t * (10 + L * 8) * c.sp) % (W * 1.4)) - W * 0.2;
        ctx.beginPath(); ctx.ellipse(mx, by + H * 0.05, W * 0.28, H * 0.07, 0, 0, TAU); ctx.fill();
      }
    }
  }, { cat: "Forest & Woodland", b1: "#112529", b2: "#9cd3c9" });

  bg("bamboo-grove", "Zen Bamboo Grove", (ctx, t, W, H, c) => {
    const b1 = c.b1 || "#0b2419", b2 = c.b2 || "#7ee896";
    sky(ctx, W, H, [[0, mix(b1, b2, 0.28)], [0.5, b1], [1, mix(b1, "#030b07", 0.7)]]);
    rad(ctx, W * 0.5, H * 0.22, Math.max(W, H) * 0.55, [[0, rgba(b2, 0.28)], [1, rgba(b2, 0)]]);
    const R = rng(120);
    for (let layer = 0; layer < 2; layer++) {
      const cnt = layer ? 12 : 16, col = layer ? mix(b1, "#030c07", 0.75) : mix(b1, b2, 0.22);
      for (let i = 0; i < cnt; i++) {
        const edge = layer && R() > 0.35 ? (R() > 0.5 ? R() * 0.25 : 0.75 + R() * 0.25) : R();
        const bx = edge * W, w = (layer ? 10 : 5) + R() * (layer ? 10 : 6), segs = 7;
        const lean = (R() - 0.5) * W * 0.05 + Math.sin(t * 0.7 * c.sp + i) * 14;
        ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = "butt";
        let px = bx, py = H + 10;
        for (let s = 1; s <= segs; s++) {
          const k = s / segs, nx = bx + lean * k * k, ny = H - k * (H * (0.85 + R() * 0.25));
          ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(nx, ny); ctx.stroke();
          ctx.fillStyle = mix(col, b2, 0.25); ctx.fillRect(nx - w * 0.65, ny - 2, w * 1.3, 3);
          if (s >= 2 && R() > 0.35) {
            const dir = R() > 0.5 ? 1 : -1;
            for (let l = 0; l < 3; l++) leafShape(ctx, nx + dir * (10 + l * 8), ny + l * 6, w * 1.1, dir * (0.6 + l * 0.35) + Math.sin(t * 1.3 * c.sp + i + l) * 0.1, col, "bamboo");
          }
          px = nx; py = ny;
        }
      }
    }
    const Rl = rng(121);
    for (let i = 0; i < 24; i++) {
      const x = (Rl() * W + t * (15 + Rl() * 20) * c.sp + Math.sin(t * 1.5 + i) * 28) % W, y = (t * (18 + Rl() * 26) * c.sp + Rl() * H) % H;
      leafShape(ctx, x, y, 5 + Rl() * 6, t * 1.4 + i, rgba(mix(b2, "#d8f3dc", Rl()), 0.55), "bamboo");
    }
  }, { cat: "Forest & Woodland", b1: "#0b2419", b2: "#7ee896" });

  bg("autumn-woods", "Autumn Maple Forest", (ctx, t, W, H, c) => {
    const b1 = c.b1 || "#3a160c", b2 = c.b2 || "#ff9a3c";
    sky(ctx, W, H, [[0, mix(b1, "#1a0804", 0.5)], [0.55, b1], [1, mix(b2, b1, 0.35)]]);
    rad(ctx, W * 0.5, H * 0.5, Math.max(W, H) * 0.45, [[0, rgba(b2, 0.35)], [1, rgba(b2, 0)]]);
    hills(ctx, W, H, H * 0.78, H * 0.06, 7.2, mix(b1, "#1a0804", 0.65), 0);
    const Rt = rng(130);
    for (let i = 0; i < 12; i++) {
      const side = i < 6 ? Rt() * 0.24 : 0.76 + Rt() * 0.24, h = H * (0.55 + Rt() * 0.32);
      canopyTree(ctx, side * W, H, h, h * 0.45, i % 2 ? mix(b1, "#120603", 0.7) : mix(b2, b1, 0.72), Math.sin(t * 0.5 * c.sp + i) * 0.012);
    }
    const R = rng(131), cols = [b2, "#e63946", "#ffb703", "#d62828", "#f77f00"];
    for (let i = 0; i < 55; i++) {
      const sp = (22 + R() * 38) * c.sp, x = (R() * W + Math.sin(t * 1.2 + i) * 45 + t * 14 * c.sp) % W, y = (t * sp + R() * H) % H;
      leafShape(ctx, x, y, 5 + R() * 8, t * (1 + R() * 1.5) + i, rgba(cols[i % cols.length], 0.8), "maple");
    }
  }, { cat: "Forest & Woodland", b1: "#3a160c", b2: "#ff9a3c" });

  bg("cherry-blossom", "Sakura Cherry Grove", (ctx, t, W, H, c) => {
    const b1 = c.b1 || "#1d1130", b2 = c.b2 || "#ff9ec4";
    sky(ctx, W, H, [[0, mix(b1, "#0d0718", 0.5)], [0.6, b1], [1, mix(b1, b2, 0.28)]]);
    stars(ctx, W, H * 0.55, 70, 140, t, c.sp);
    rad(ctx, W * 0.78, H * 0.2, Math.min(W, H) * 0.14, [[0, "#fff5f8"], [0.35, rgba(b2, 0.4)], [1, rgba(b2, 0)]]);
    hills(ctx, W, H, H * 0.82, H * 0.05, 9.1, mix(b1, "#090410", 0.75), 0);
    const branch = (sx, sy, dir) => {
      ctx.strokeStyle = "#160c1f"; ctx.lineWidth = Math.max(5, W * 0.012); ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.quadraticCurveTo(sx + dir * W * 0.14, sy + H * 0.08, sx + dir * W * 0.24, sy + H * 0.18); ctx.stroke();
      const Rb = rng(dir > 0 ? 141 : 142);
      for (let i = 0; i < 26; i++) {
        const px = sx + dir * W * (0.02 + Rb() * 0.23) + Math.sin(t * 0.9 * c.sp + i) * 3, py = sy + H * (0.01 + Rb() * 0.2) + Math.cos(t * 0.8 * c.sp + i) * 2;
        rad(ctx, px, py, 10 + Rb() * 18, [[0, rgba(mix(b2, "#ffffff", 0.4), 0.75)], [1, rgba(b2, 0)]]);
      }
    };
    branch(-10, H * 0.05, 1); branch(W + 10, H * 0.08, -1);
    const R = rng(143);
    for (let i = 0; i < 65; i++) {
      const sp = (20 + R() * 35) * c.sp, x = (R() * W + t * (18 + R() * 20) * c.sp + Math.sin(t * 1.5 + i) * 35) % W, y = (t * sp + R() * H) % H;
      leafShape(ctx, x, y, 4 + R() * 6, t * (1.2 + R() * 2) + i, rgba(mix(b2, "#ffffff", R() * 0.45), 0.85), "petal");
    }
  }, { cat: "Forest & Woodland", b1: "#1d1130", b2: "#ff9ec4" });

  bg("fireflies", "Fireflies Forest (Night)", (ctx, t, W, H, c) => {
    const b1 = c.b1 || "#06140c", b2 = c.b2 || "#d9ff6b";
    sky(ctx, W, H, [[0, mix(b1, "#020704", 0.6)], [0.6, b1], [1, mix(b1, "#123420", 0.5)]]);
    stars(ctx, W, H * 0.45, 60, 46, t, c.sp);
    hills(ctx, W, H, H * 0.76, H * 0.06, 5.5, mix(b1, "#030b06", 0.6), 0);
    const Rt = rng(48);
    for (let i = 0; i < 16; i++) {
      const side = i < 8 ? Rt() * 0.24 : 0.76 + Rt() * 0.24, h = H * (0.42 + Rt() * 0.35);
      pine(ctx, side * W, H, h, h * 0.34, "#030b06", Math.sin(t * 0.6 * c.sp + i) * 0.015);
    }
    ctx.save(); ctx.globalCompositeOperation = "lighter"; const R = rng(47);
    for (let i = 0; i < 75; i++) {
      const x = R() * W + Math.sin(t * (0.3 + R()) * c.sp + i) * 42, y = R() * H + Math.cos(t * (0.2 + R()) * c.sp + i) * 32;
      const pulse = 0.5 + 0.5 * Math.sin(t * (2.5 + R() * 2) + i * 2);
      glowDot(ctx, x, y, 10 + R() * 14, b2, 0.65 * pulse); glowDot(ctx, x, y, 2.5 + R() * 2, "#ffffff", 0.9 * pulse);
    }
    ctx.restore();
  }, { cat: "Forest & Woodland", b1: "#06140c", b2: "#d9ff6b" });

  // ---------- 2. BEACH & OCEAN ----------
  bg("tropical-beach", "Tropical Beach & Palms", (ctx, t, W, H, c) => {
    const b1 = c.b1 || "#0fa3e8", b2 = c.b2 || "#f7d58b", hy = H * 0.44, sandY = H * 0.77;
    sky(ctx, W, H, [[0, mix(b1, "#023e8a", 0.25)], [0.65, mix(b1, "#90e0ef", 0.45)], [1, mix(b2, "#fff3d6", 0.55)]], 0, hy);
    rad(ctx, W * 0.76, hy * 0.42, Math.min(W, H) * 0.2, [[0, "#fffbe6"], [0.22, rgba(b2, 0.75)], [1, rgba(b2, 0)]]);
    for (let i = 0; i < 4; i++) cloud(ctx, ((i * W * 0.32 + t * (6 + i * 2) * c.sp) % (W * 1.3)) - W * 0.15, hy * (0.25 + (i % 2) * 0.22), Math.min(W, H) * (0.09 + i * 0.015), "#ffffff", 0.72);
    sky(ctx, W, H, [[0, mix(b1, "#005f73", 0.35)], [0.55, mix(b1, "#48cae4", 0.5)], [1, mix(b1, "#90f1ef", 0.75)]], hy, sandY + H * 0.06);
    shimmer(ctx, W * 0.76, hy + 4, sandY - 10, W * 0.04, W * 0.18, t, c.sp, "#fff8d6", 28);
    sky(ctx, W, H, [[0, mix(b2, "#c89b54", 0.35)], [0.35, b2], [1, mix(b2, "#e9c46a", 0.4)]], sandY - H * 0.03, H);
    for (let w = 0; w < 4; w++) {
      const surge = Math.sin(t * 1.1 * c.sp - w * 0.9) * H * 0.014, wy = lerp(hy + H * 0.05, sandY, w / 3.2) + surge;
      wave(ctx, W, sandY + H * 0.08, wy, H * 0.01, 0.008 + w * 0.002, t * (0.9 + w * 0.2) * c.sp + w * 1.4, w === 3 ? rgba(mix(b1, "#ade8f4", 0.75), 0.72) : mix(b1, "#48cae4", w * 0.22), "rgba(255,255,255,0.75)", w === 3 ? 3.5 : 2);
    }
    sky(ctx, W, H, [[0, rgba(b2, 0)], [0.25, b2], [1, mix(b2, "#c68b45", 0.35)]], sandY + H * 0.02, H);
    const pc = mix(b1, "#061b14", 0.85);
    palm(ctx, -W * 0.01, H * 0.96, H * 0.76, 0.24, pc, t, c.sp, 0.2);
    palm(ctx, W * 0.06, H * 1.02, H * 0.56, 0.18, pc, t, c.sp, 1.4);
    palm(ctx, W * 1.01, H * 0.98, H * 0.72, -0.22, pc, t, c.sp, 2.3);
  }, { cat: "Beach & Ocean", b1: "#0fa3e8", b2: "#f7d58b" });

  bg("sunset-beach", "Golden Sunset Beach", (ctx, t, W, H, c) => {
    const b1 = c.b1 || "#d6336c", b2 = c.b2 || "#ffaa44", hy = H * 0.48, sandY = H * 0.8;
    sky(ctx, W, H, [[0, mix(b1, "#1e0c38", 0.65)], [0.5, b1], [1, b2]], 0, hy);
    rad(ctx, W * 0.5, hy - H * 0.04, Math.min(W, H) * 0.26, [[0, "#fff9db"], [0.28, rgba(b2, 0.9)], [0.65, rgba(b1, 0.35)], [1, rgba(b1, 0)]]);
    sky(ctx, W, H, [[0, mix(b1, "#1a0b2e", 0.5)], [0.6, mix(b1, "#3b1745", 0.55)], [1, mix(b2, "#3a1c2e", 0.55)]], hy, H);
    shimmer(ctx, W * 0.5, hy + 4, sandY, W * 0.05, W * 0.26, t, c.sp, "#ffd88a", 40);
    for (let w = 0; w < 4; w++) {
      const wy = lerp(hy + H * 0.04, sandY, w / 3.2) + Math.sin(t * c.sp - w) * H * 0.012;
      wave(ctx, W, H, wy, H * 0.009, 0.009 + w * 0.002, t * (0.8 + w * 0.25) * c.sp + w, rgba(mix("#1a0b2e", b1, 0.25 + w * 0.1), 0.72), rgba(b2, 0.45), 2);
    }
    sky(ctx, W, H, [[0, rgba("#1e0e18", 0.85)], [1, "#12080e"]], sandY, H);
    palm(ctx, W * 0.02, H, H * 0.72, 0.22, "#120612", t, c.sp, 0.5); palm(ctx, W * 0.98, H, H * 0.68, -0.2, "#120612", t, c.sp, 1.9);
  }, { cat: "Beach & Ocean", b1: "#d6336c", b2: "#ffaa44" });

  bg("moonlit-cove", "Moonlit Beach Cove", (ctx, t, W, H, c) => {
    const b1 = c.b1 || "#07132b", b2 = c.b2 || "#a8d5ff", hy = H * 0.46, sandY = H * 0.8;
    sky(ctx, W, H, [[0, mix(b1, "#02050d", 0.6)], [0.7, b1], [1, mix(b1, b2, 0.2)]], 0, hy);
    stars(ctx, W, hy, 110, 152, t, c.sp);
    rad(ctx, W * 0.26, hy * 0.42, Math.min(W, H) * 0.17, [[0, "#ffffff"], [0.22, rgba(b2, 0.6)], [1, rgba(b2, 0)]]);
    sky(ctx, W, H, [[0, mix(b1, "#040d1e", 0.5)], [1, mix(b1, b2, 0.18)]], hy, H);
    shimmer(ctx, W * 0.26, hy + 4, sandY, W * 0.04, W * 0.18, t, c.sp, b2, 36);
    for (let w = 0; w < 4; w++) {
      const wy = lerp(hy + H * 0.05, sandY, w / 3.2) + Math.sin(t * 0.9 * c.sp - w) * H * 0.01;
      wave(ctx, W, H, wy, H * 0.008, 0.008 + w * 0.002, t * (0.6 + w * 0.2) * c.sp + w, rgba(mix(b1, "#0b2545", 0.5), 0.7), rgba(b2, 0.38), 1.8);
    }
    hills(ctx, W, H, sandY + H * 0.02, H * 0.03, 15.3, "#060b14", 0);
    palm(ctx, W * 0.96, H, H * 0.72, -0.22, "#04070e", t, c.sp, 0.9);
  }, { cat: "Beach & Ocean", b1: "#07132b", b2: "#a8d5ff" });

  bg("turquoise-lagoon", "Aerial Lagoon & Coral", (ctx, t, W, H, c) => {
    const b1 = c.b1 || "#0096c7", b2 = c.b2 || "#90f1ef";
    sky(ctx, W, H, [[0, mix(b1, "#03045e", 0.35)], [0.45, b1], [1, b2]]);
    ctx.save(); ctx.globalCompositeOperation = "lighter"; const R = rng(161);
    for (let i = 0; i < 34; i++) {
      const cx = (R() * W + Math.sin(t * 0.5 * c.sp + i) * 35) % W, cy = (R() * H + Math.cos(t * 0.4 * c.sp + i * 1.4) * 30) % H;
      ring(ctx, cx, cy, 50 + R() * 90 + Math.sin(t * 1.1 * c.sp + i) * 14, 2.2, "#e0fbfc", 0.14 + 0.08 * Math.sin(t * 1.5 * c.sp + i));
    }
    ctx.restore();
    wave(ctx, W, H, H * 0.85 + Math.sin(t * 1.1 * c.sp) * H * 0.025, H * 0.025, 0.005, t * 0.5 * c.sp, "#f4d58d", "rgba(255,255,255,0.85)", 4.5);
  }, { cat: "Beach & Ocean", b1: "#0096c7", b2: "#90f1ef" });

  bg("underwater-reef", "Underwater Coral Reef", (ctx, t, W, H, c) => {
    const b1 = c.b1 || "#03324d", b2 = c.b2 || "#3ef0b4";
    sky(ctx, W, H, [[0, mix(b1, b2, 0.4)], [0.5, b1], [1, mix(b1, "#01101a", 0.75)]]);
    beams(ctx, W * 0.5, -H * 0.08, Math.max(W, H) * 1.25, 8, 1.0, 2.15, b2, 0.14, t, c.sp);
    hills(ctx, W, H, H * 0.88, H * 0.05, 17.4, "#02131e", 0);
    const Rk = rng(170); ctx.strokeStyle = mix(b1, "#020e17", 0.7); ctx.lineCap = "round";
    for (let i = 0; i < 18; i++) {
      const kx = (i / 17) * W, kh = H * (0.14 + Rk() * 0.22); ctx.lineWidth = 4 + Rk() * 5; ctx.beginPath(); ctx.moveTo(kx, H);
      for (let s = 1; s <= 5; s++) { const f = s / 5; ctx.lineTo(kx + Math.sin(t * 1.4 * c.sp + i + f * 3) * 16 * f, H - f * kh); }
      ctx.stroke();
    }
    const Rb = rng(171);
    for (let i = 0; i < 55; i++) {
      const sp = (28 + Rb() * 55) * c.sp, bx = Rb() * W + Math.sin(t * 2 + i) * 12, by = H - ((t * sp + Rb() * H) % (H + 30)), r = 2 + Rb() * 5;
      ring(ctx, bx, by, r, 1.2, "#cafffb", 0.45);
      ctx.fillStyle = "rgba(255,255,255,0.45)"; ctx.beginPath(); ctx.arc(bx - r * 0.3, by - r * 0.3, r * 0.25, 0, TAU); ctx.fill();
    }
  }, { cat: "Beach & Ocean", b1: "#03324d", b2: "#3ef0b4" });

  bg("ocean", "Deep Ocean Waves", (ctx, t, W, H, c) => {
    const b1 = c.b1 || "#0b3954", b2 = c.b2 || "#48cae4";
    sky(ctx, W, H, [[0, mix(b1, "#030b14", 0.6)], [0.48, mix(b1, b2, 0.25)], [1, "#03101c"]]);
    stars(ctx, W, H * 0.42, 70, 24, t, c.sp);
    rad(ctx, W * 0.5, H * 0.36, Math.min(W, H) * 0.16, [[0, rgba("#ffffff", 0.7)], [0.3, rgba(b2, 0.3)], [1, rgba(b2, 0)]]);
    for (let b = 0; b < 6; b++) {
      wave(ctx, W, H, H * (0.44 + b * 0.095), H * (0.015 + b * 0.002), 0.008 + b * 0.001, t * (0.7 + b * 0.2) * c.sp + b * 1.1,
        rgba(mix(b2, mix(b1, "#020b14", 0.65), b / 5), 0.72), rgba(b2, 0.28 - b * 0.03), 1.6);
    }
  }, { cat: "Beach & Ocean", b1: "#0b3954", b2: "#48cae4" });

  // ---------- 3. LANDSCAPES & NATURE ----------
  bg("alpine-peaks", "Alpine Peaks & Lake", (ctx, t, W, H, c) => {
    const b1 = c.b1 || "#17254a", b2 = c.b2 || "#f09d7c", lakeY = H * 0.68;
    sky(ctx, W, H, [[0, mix(b1, "#0a1026", 0.4)], [0.55, b1], [1, b2]], 0, lakeY);
    stars(ctx, W, lakeY * 0.6, 65, 180, t, c.sp);
    hills(ctx, W, lakeY + 20, lakeY * 0.72, H * 0.12, 3.1, mix(b1, b2, 0.35), 0.75);
    hills(ctx, W, lakeY + 20, lakeY * 0.84, H * 0.1, 7.7, mix(b1, "#0c1328", 0.55), 0.85);
    for (let i = 0; i < 3; i++) cloud(ctx, ((i * W * 0.4 + t * 8 * c.sp) % (W * 1.3)) - W * 0.15, lakeY * (0.45 + i * 0.1), Math.min(W, H) * 0.08, b2, 0.25);
    sky(ctx, W, H, [[0, mix(b1, b2, 0.3)], [0.5, mix(b1, "#091020", 0.5)], [1, "#040812"]], lakeY, H);
    shimmer(ctx, W * 0.5, lakeY + 6, H - 10, W * 0.22, W * 0.45, t, c.sp, b2, 30);
  }, { cat: "Landscapes & Nature", b1: "#17254a", b2: "#f09d7c" });

  bg("waterfall-lagoon", "Jungle Waterfall", (ctx, t, W, H, c) => {
    const b1 = c.b1 || "#0a2a24", b2 = c.b2 || "#7cf7e4", wx = W * 0.43, ww = W * 0.14;
    sky(ctx, W, H, [[0, mix(b1, b2, 0.2)], [0.6, b1], [1, mix(b1, "#03100d", 0.7)]]);
    hills(ctx, W, H, H * 0.42, H * 0.08, 19.2, mix(b1, "#041410", 0.65), 0.4);
    ctx.fillStyle = "#04120f"; ctx.fillRect(0, H * 0.26, W * 0.22, H * 0.74); ctx.fillRect(W * 0.78, H * 0.28, W * 0.22, H * 0.72);
    sky(ctx, W, H, [[0, rgba(b2, 0.45)], [1, rgba("#ffffff", 0.7)]], H * 0.26, H * 0.78);
    ctx.fillStyle = rgba(b1, 0.75); ctx.fillRect(0, H * 0.26, wx, H * 0.52); ctx.fillRect(wx + ww, H * 0.26, W - wx - ww, H * 0.52);
    const R = rng(191);
    for (let i = 0; i < 24; i++) { ctx.fillStyle = "rgba(255,255,255,0.55)"; ctx.fillRect(wx + R() * ww, H * 0.26 + ((t * (160 + R() * 140) * c.sp + R() * H * 0.5) % (H * 0.52)), 2 + R() * 3, 18 + R() * 24); }
    sky(ctx, W, H, [[0, mix(b1, b2, 0.35)], [1, "#020e0c"]], H * 0.76, H);
    for (let i = 0; i < 5; i++) { const q = (t * 0.5 * c.sp + i * 0.2) % 1; ctx.strokeStyle = rgba(b2, (1 - q) * 0.45); ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(W * 0.5, H * 0.83, ww * (0.5 + q * 1.8), H * 0.025 * (0.5 + q * 1.4), 0, 0, TAU); ctx.stroke(); }
    rad(ctx, W * 0.5, H * 0.77, W * 0.18, [[0, rgba("#ffffff", 0.5)], [1, rgba(b2, 0)]]);
  }, { cat: "Landscapes & Nature", b1: "#0a2a24", b2: "#7cf7e4" });

  bg("desert-dunes", "Desert Dunes at Dusk", (ctx, t, W, H, c) => {
    const b1 = c.b1 || "#3f173c", b2 = c.b2 || "#f4a261";
    sky(ctx, W, H, [[0, mix(b1, "#120618", 0.55)], [0.55, b1], [1, b2]], 0, H * 0.65);
    stars(ctx, W, H * 0.45, 70, 201, t, c.sp);
    rad(ctx, W * 0.3, H * 0.48, Math.min(W, H) * 0.22, [[0, "#fff1c1"], [0.3, rgba(b2, 0.55)], [1, rgba(b2, 0)]]);
    for (let d = 0; d < 4; d++) hills(ctx, W, H, H * (0.52 + d * 0.11), H * 0.055, 2.5 + d * 4.2, mix(b2, "#1c0a12", 0.25 + d * 0.2), 0);
    const R = rng(202);
    for (let i = 0; i < 45; i++) { ctx.fillStyle = rgba(b2, 0.25 + R() * 0.3); ctx.fillRect((R() * W + t * (45 + R() * 60) * c.sp) % W, H * (0.55 + R() * 0.42), 8 + R() * 18, 1.3); }
  }, { cat: "Landscapes & Nature", b1: "#3f173c", b2: "#f4a261" });

  bg("northern-fjord", "Arctic Fjord & Aurora", (ctx, t, W, H, c) => {
    const b1 = c.b1 || "#051624", b2 = c.b2 || "#56f0c8", fy = H * 0.66;
    sky(ctx, W, H, [[0, "#020710"], [0.7, b1], [1, mix(b1, b2, 0.2)]], 0, fy);
    stars(ctx, W, fy * 0.85, 110, 210, t, c.sp);
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    for (let b = 0; b < 3; b++) {
      ctx.beginPath();
      for (let x = 0; x <= W; x += W / 36) { const y = H * (0.22 + b * 0.07) + Math.sin(x * 0.006 + t * 0.6 * c.sp + b) * H * 0.06; x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.lineTo(W, fy); ctx.lineTo(0, fy); ctx.closePath();
      const g = ctx.createLinearGradient(0, H * 0.15, 0, fy); g.addColorStop(0, rgba([b2, "#4ea8de", "#9b5de5"][b], 0.36)); g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g; ctx.fill();
    }
    ctx.restore();
    hills(ctx, W, fy + 16, fy * 0.86, H * 0.11, 11.4, "#061018", 0.85);
    sky(ctx, W, H, [[0, mix(b1, b2, 0.22)], [1, "#020810"]], fy, H);
    shimmer(ctx, W * 0.5, fy + 6, H - 10, W * 0.25, W * 0.45, t, c.sp, b2, 26);
  }, { cat: "Landscapes & Nature", b1: "#051624", b2: "#56f0c8" });

  bg("volcano-ember", "Volcanic Caldera", (ctx, t, W, H, c) => {
    const b1 = c.b1 || "#180606", b2 = c.b2 || "#ff5400";
    sky(ctx, W, H, [[0, "#0a0204"], [0.55, b1], [1, mix(b2, "#3a0802", 0.55)]]);
    rad(ctx, W * 0.5, H * 0.72, Math.max(W, H) * 0.45, [[0, rgba(b2, 0.55)], [1, rgba(b2, 0)]]);
    hills(ctx, W, H, H * 0.72, H * 0.09, 6.6, "#120404", 0.6); hills(ctx, W, H, H * 0.84, H * 0.05, 8.8, "#080202", 0.4);
    ctx.save(); ctx.globalCompositeOperation = "lighter"; const R = rng(220);
    for (let i = 0; i < 95; i++) { const sp = (25 + R() * 65) * c.sp; glowDot(ctx, R() * W + Math.sin(t * 2 + i) * 20, H - ((t * sp + R() * H) % (H + 30)), 2.5 + R() * 6, R() > 0.4 ? b2 : "#ffd166", 0.75); }
    ctx.restore();
  }, { cat: "Landscapes & Nature", b1: "#180606", b2: "#ff5400" });

  bg("aurora", "Aurora", (ctx, t, W, H, c) => {
    lin(ctx, W, H, "#020617", "#0b1d3a"); stars(ctx, W, H * 0.7, 90, 16, t, c.sp);
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    for (let b = 0; b < 3; b++) {
      ctx.beginPath();
      for (let x = 0; x <= W; x += W / 40) { const y = H * (0.3 + b * 0.08) + Math.sin(x * 0.006 + t * 0.6 * c.sp + b) * H * 0.06 + Math.sin(x * 0.013 - t * 0.4 * c.sp) * H * 0.03; x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
      const g = ctx.createLinearGradient(0, H * 0.2, 0, H * 0.8); g.addColorStop(0, rgba([c.b1, c.b2, "#7cffcb"][b], 0.35)); g.addColorStop(1, rgba("#000000", 0));
      ctx.fillStyle = g; ctx.fill();
    }
    ctx.restore();
  }, { cat: "Landscapes & Nature" });

  // ---------- 4. VENUES & TEXTURES ----------
  bg("rainy-cafe", "Rainy Chess Café", (ctx, t, W, H, c) => {
    const b1 = c.b1 || "#141824", b2 = c.b2 || "#f5a638";
    sky(ctx, W, H, [[0, mix(b1, "#080b12", 0.5)], [0.6, b1], [1, mix(b1, b2, 0.25)]]);
    ctx.save(); ctx.globalCompositeOperation = "lighter"; const Rb = rng(240);
    for (let i = 0; i < 24; i++) glowDot(ctx, Rb() * W, H * (0.25 + Rb() * 0.65), 25 + Rb() * 55, [b2, "#ff6b6b", "#72efdd", "#ffd166"][i % 4], 0.16 + 0.08 * Math.sin(t * 1.3 * c.sp + i));
    ctx.restore();
    ctx.strokeStyle = "rgba(18,10,6,0.72)"; ctx.lineWidth = Math.max(10, W * 0.015); ctx.strokeRect(W * 0.02, H * 0.03, W * 0.96, H * 0.94);
    ctx.beginPath(); ctx.moveTo(W * 0.5, 0); ctx.lineTo(W * 0.5, H); ctx.stroke();
    const Rr = rng(241); ctx.strokeStyle = "rgba(210,230,255,0.35)"; ctx.lineWidth = 1.4;
    for (let i = 0; i < 120; i++) { const sp = (40 + Rr() * 90) * c.sp, x = Rr() * W + Math.sin(t * 3 + i) * 1.5, y = (t * sp + Rr() * H) % H; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 6 + Rr() * 14); ctx.stroke(); }
  }, { cat: "Venues & Textures", b1: "#141824", b2: "#f5a638" });

  bg("library-study", "Grandmaster Study", (ctx, t, W, H, c) => {
    const b1 = c.b1 || "#1b100a", b2 = c.b2 || "#f2b24c";
    sky(ctx, W, H, [[0, mix(b1, "#090503", 0.6)], [0.5, b1], [1, "#0d0704"]]);
    rad(ctx, W * 0.5, H * 0.45, Math.max(W, H) * 0.52, [[0, rgba(b2, 0.28)], [0.6, rgba(b2, 0.08)], [1, rgba(b2, 0)]]);
    const R = rng(250);
    [0, 1].forEach((side) => {
      const sx = side ? W * 0.78 : 0, sw = W * 0.22; ctx.fillStyle = "#100805"; ctx.fillRect(sx, 0, sw, H);
      for (let r = 0; r < 6; r++) {
        const sy = (r + 1) * (H / 6); ctx.fillStyle = "#24130a"; ctx.fillRect(sx, sy - 6, sw, 6);
        let bx = sx + 6;
        while (bx < sx + sw - 12) { const bw = 6 + R() * 10, bh = H / 6 * (0.45 + R() * 0.38); ctx.fillStyle = mix(b1, b2, 0.08 + R() * 0.14); ctx.fillRect(bx, sy - 6 - bh, bw, bh); bx += bw + 2; }
      }
    });
    ctx.save(); ctx.globalCompositeOperation = "lighter"; const Rd = rng(251);
    for (let i = 0; i < 55; i++) glowDot(ctx, W * (0.2 + Rd() * 0.6) + Math.sin(t * 0.4 * c.sp + i) * 20, (Rd() * H - t * (5 + Rd() * 8) * c.sp + H * 5) % H, 2 + Rd() * 4, b2, 0.35 + 0.3 * Math.sin(t * 1.8 + i));
    ctx.restore();
  }, { cat: "Venues & Textures", b1: "#1b100a", b2: "#f2b24c" });

  bg("candlelit-hall", "Candlelit Tournament Hall", (ctx, t, W, H, c) => {
    const b1 = c.b1 || "#140b10", b2 = c.b2 || "#ffb703";
    sky(ctx, W, H, [[0, "#090407"], [0.5, b1], [1, "#070305"]]);
    ctx.strokeStyle = rgba(b2, 0.09); ctx.lineWidth = 3;
    for (let a = 0; a < 3; a++) { ctx.beginPath(); ctx.arc(W * (0.2 + a * 0.3), H * 0.4, W * 0.12, PI, TAU); ctx.stroke(); }
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    [0.1, 0.2, 0.8, 0.9].forEach((kx, i) => {
      const cx = W * kx, cy = H * (0.42 + (i % 2) * 0.22), fl = 0.85 + 0.15 * Math.sin(t * 7 * c.sp + i * 2.1);
      glowDot(ctx, cx, cy, Math.min(W, H) * 0.18 * fl, b2, 0.34); glowDot(ctx, cx, cy, 8 * fl, "#fff5cc", 0.9);
    });
    ctx.restore();
  }, { cat: "Venues & Textures", b1: "#140b10", b2: "#ffb703" });

  bg("zen-garden", "Zen Sand Garden", (ctx, t, W, H, c) => {
    const b1 = c.b1 || "#1e211f", b2 = c.b2 || "#d6ccb8";
    sky(ctx, W, H, [[0, b1], [1, mix(b1, "#101211", 0.5)]]);
    ctx.strokeStyle = rgba(b2, 0.16); ctx.lineWidth = 1.6;
    const drift = Math.sin(t * 0.3 * c.sp) * 8;
    for (let y = 12; y < H; y += 16) {
      ctx.beginPath();
      for (let x = 0; x <= W; x += 18) {
        const d1 = Math.hypot(x - W * 0.14, y - H * 0.72), d2 = Math.hypot(x - W * 0.86, y - H * 0.28);
        const yy = y + Math.sin(x * 0.012 + t * 0.4 * c.sp) * 4 + Math.exp(-d1 * 0.012) * 18 + Math.exp(-d2 * 0.012) * 18 + drift * 0.2;
        x ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy);
      }
      ctx.stroke();
    }
    [[W * 0.14, H * 0.72, 26], [W * 0.86, H * 0.28, 22]].forEach(([sx, sy, sr]) => {
      ring(ctx, sx, sy, sr * 1.9, 1.5, b2, 0.22); ring(ctx, sx, sy, sr * 2.7, 1.2, b2, 0.15);
      rad(ctx, sx, sy, sr, [[0, mix(b1, "#444845", 0.5)], [1, "#0d0f0e"]]);
    });
    const R = rng(260);
    for (let i = 0; i < 10; i++) leafShape(ctx, (R() * W + t * 14 * c.sp) % W, (t * (10 + R() * 14) * c.sp + R() * H) % H, 5 + R() * 4, t + i, rgba("#e76f51", 0.65), "maple");
  }, { cat: "Venues & Textures", b1: "#1e211f", b2: "#d6ccb8" });

  bg("wood-table", "Wooden table", (ctx, t, W, H, c) => {
    lin(ctx, W, H, "#3b2414", "#5a3b22", 0.2); ctx.strokeStyle = "rgba(0,0,0,0.14)";
    for (let i = 0; i < 70; i++) { ctx.lineWidth = 1 + hash(i) * 2; ctx.beginPath(); const y = (i / 70) * H; for (let x = 0; x <= W; x += 20) ctx.lineTo(x, y + Math.sin(x * 0.01 + i) * 6); ctx.stroke(); }
    rad(ctx, W * (0.5 + Math.sin(t * 0.25 * c.sp) * 0.12), H * 0.45, Math.max(W, H) * 0.55, [[0, "rgba(255,214,150,0.18)"], [1, "rgba(0,0,0,0.35)"]]);
  }, { cat: "Venues & Textures" });

  bg("marble", "Marble", (ctx, t, W, H, c) => {
    lin(ctx, W, H, "#e9e6e1", "#cfcac2"); ctx.strokeStyle = "rgba(90,90,100,0.18)";
    for (let i = 0; i < 26; i++) { ctx.lineWidth = 0.5 + hash(i + 5) * 2.5; ctx.beginPath(); let x = hash(i) * W, y = 0; ctx.moveTo(x, y); while (y < H) { y += 18; x += (hash(Math.floor(y) + i * 99) - 0.5) * 30; ctx.lineTo(x, y); } ctx.stroke(); }
    const sx = ((t * 0.12 * c.sp) % 1.6 - 0.3) * W, g = ctx.createLinearGradient(sx - W * 0.2, 0, sx + W * 0.2, H);
    g.addColorStop(0, "rgba(255,255,255,0)"); g.addColorStop(0.5, "rgba(255,255,255,0.22)"); g.addColorStop(1, "rgba(255,255,255,0)"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }, { cat: "Venues & Textures" });

  // ---------- 5. EXTRA SCI-FI ----------
  bg("eclipse-corona", "Solar Eclipse Corona", (ctx, t, W, H, c) => {
    const b1 = c.b1 || "#ff6b00", b2 = c.b2 || "#ffe082", cx = W * 0.5, cy = H * 0.5, cr = Math.min(W, H) * 0.26;
    ctx.fillStyle = "#030208"; ctx.fillRect(0, 0, W, H); stars(ctx, W, H, 130, 301, t, c.sp);
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    rad(ctx, cx, cy, cr * 2.2, [[0, rgba(b1, 0.5)], [0.45, rgba(b2, 0.3)], [1, rgba(b1, 0)]]);
    for (let i = 0; i < 24; i++) { const an = (i / 24) * TAU + t * 0.06 * c.sp, l = cr * (1.4 + 0.4 * Math.sin(t * 1.4 * c.sp + i * 2)); ctx.strokeStyle = rgba(b2, 0.22); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx + Math.cos(an) * cr, cy + Math.sin(an) * cr); ctx.lineTo(cx + Math.cos(an) * l, cy + Math.sin(an) * l); ctx.stroke(); }
    ctx.restore();
    ctx.fillStyle = "#020105"; ctx.beginPath(); ctx.arc(cx, cy, cr, 0, TAU); ctx.fill();
    ring(ctx, cx, cy, cr + 2, 3, b2, 0.85);
    const da = t * 0.15 * c.sp; glowDot(ctx, cx + Math.cos(da) * cr, cy + Math.sin(da) * cr, cr * 0.35, "#ffffff", 0.75);
  }, { cat: "Space & Sci-Fi", b1: "#ff6b00", b2: "#ffe082" });

  bg("cyber-rain", "Cyberpunk Neon City", (ctx, t, W, H, c) => {
    const b1 = c.b1 || "#00f5d4", b2 = c.b2 || "#ff2a85";
    sky(ctx, W, H, [[0, "#050314"], [0.65, "#15072b"], [1, "#090418"]]);
    const R = rng(310); let x = -((t * 14 * c.sp) % 160);
    while (x < W) {
      const w = 36 + R() * 64, h = H * (0.28 + R() * 0.44), neon = R() > 0.5 ? b1 : b2;
      ctx.fillStyle = "#0b061d"; ctx.fillRect(x, H * 0.8 - h, w, h); ctx.fillStyle = rgba(neon, 0.55); ctx.fillRect(x + 4, H * 0.8 - h + 4, w - 8, 2.5);
      for (let wy = H * 0.8 - h + 16; wy < H * 0.78; wy += 12) for (let wx = x + 6; wx < x + w - 8; wx += 10) if (hash(Math.floor(wx * 5 + wy)) > 0.65) { ctx.fillStyle = rgba(neon, 0.5); ctx.fillRect(wx, wy, 4, 5); }
      x += w + 6;
    }
    sky(ctx, W, H, [[0, "#0a041a"], [1, "#04020c"]], H * 0.8, H);
    shimmer(ctx, W * 0.25, H * 0.81, H, W * 0.18, W * 0.25, t, c.sp, b1, 20); shimmer(ctx, W * 0.75, H * 0.81, H, W * 0.18, W * 0.25, t, c.sp, b2, 20);
    const Rr = rng(311); ctx.strokeStyle = rgba(b1, 0.35); ctx.lineWidth = 1;
    for (let i = 0; i < 120; i++) { const rx = (Rr() * W + t * 60) % W, ry = (t * (450 + Rr() * 300) * c.sp + Rr() * H) % H; ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx - 3, ry + 14); ctx.stroke(); }
  }, { cat: "Space & Sci-Fi", b1: "#00f5d4", b2: "#ff2a85" });

  bg("holo-grid", "3D Hologram Perspective", (ctx, t, W, H, c) => {
    const b1 = c.b1 || "#00e5ff", b2 = c.b2 || "#0a1026", hy = H * 0.5;
    sky(ctx, W, H, [[0, "#02050d"], [0.5, b2], [1, "#02050d"]]);
    ctx.strokeStyle = rgba(b1, 0.35); ctx.lineWidth = 1.2;
    for (let i = -16; i <= 16; i++) { ctx.beginPath(); ctx.moveTo(W / 2 + i * W * 0.015, hy); ctx.lineTo(W / 2 + i * W * 0.22, H); ctx.stroke(); ctx.beginPath(); ctx.moveTo(W / 2 + i * W * 0.015, hy); ctx.lineTo(W / 2 + i * W * 0.22, 0); ctx.stroke(); }
    for (let j = 0; j < 12; j++) { const z = ((j + t * 1.4 * c.sp) % 12) / 12, d = Math.pow(z, 2.2) * (H * 0.5); ctx.strokeStyle = rgba(b1, z * 0.6); ctx.beginPath(); ctx.moveTo(0, hy + d); ctx.lineTo(W, hy + d); ctx.moveTo(0, hy - d); ctx.lineTo(W, hy - d); ctx.stroke(); }
    rad(ctx, W / 2, hy, W * 0.35, [[0, rgba(b1, 0.3)], [1, rgba(b1, 0)]]);
  }, { cat: "Space & Sci-Fi", b1: "#00e5ff", b2: "#0a1026" });

  bg("warp-tunnel", "Hyperspace Streaks", (ctx, t, W, H, c) => {
    const b1 = c.b1 || "#4cc9f0", b2 = c.b2 || "#7209b7", cx = W / 2, cy = H / 2;
    ctx.fillStyle = "#03020a"; ctx.fillRect(0, 0, W, H); rad(ctx, cx, cy, Math.max(W, H) * 0.45, [[0, rgba(b2, 0.35)], [1, "rgba(0,0,0,0)"]]);
    ctx.save(); ctx.globalCompositeOperation = "lighter"; const R = rng(320), maxR = Math.hypot(cx, cy);
    for (let i = 0; i < 150; i++) {
      const an = R() * TAU, z = (R() + t * 0.45 * c.sp) % 1, r0 = Math.pow(z, 2) * maxR, r1 = Math.pow(Math.min(1, z + 0.09), 2) * maxR;
      ctx.strokeStyle = rgba(i % 2 ? b1 : "#ffffff", z * 0.85); ctx.lineWidth = 0.8 + z * 2.4;
      ctx.beginPath(); ctx.moveTo(cx + Math.cos(an) * r0, cy + Math.sin(an) * r0); ctx.lineTo(cx + Math.cos(an) * r1, cy + Math.sin(an) * r1); ctx.stroke();
    }
    ctx.restore();
  }, { cat: "Space & Sci-Fi", b1: "#4cc9f0", b2: "#7209b7" });

  F.addBackgrounds(BG);
})(typeof globalThis !== "undefined" ? globalThis : this);
