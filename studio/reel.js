// PnoyChess Studio · Create → Reel. The reel studio's engine (chess/core/reel-core.js: rules, the 1,014 verified games
// with their masters' notes, captions, fact checker, canvas renderer, soundtrack) inside the one app, with the Docu
// board look. Files served next to the page: chess.js, reel-core.js, mediabunny.min.js, mediabunny-aac-encoder.min.js
// (tools/publish-site.mjs copies them). A reel is saved as a small recipe in db/reels/<id>.json (which game, style,
// edited captions, post text); the game, analysis and captions are rebuilt from the engine when it is opened.
// Uses the page's el(), say() and S.
(function () {
  "use strict";
  const load = (src) => new Promise((ok, no) => { const s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = () => { s.remove(); no(new Error("Could not load " + src)); }; document.head.append(s); });
  let booting = null;
  function boot() {
    if (!booting) booting = (async () => {
      if (!window.Chess) await load("chess.js");
      if (!window.ReelCore) await load("reel-core.js");
      const C = window.ReelCore, pieces = await C.loadPieceImages();
      try { await Promise.all(['700 64px "Bodoni Moda"', '600 30px "IBM Plex Sans"', '500 24px "IBM Plex Mono"'].map((f) => document.fonts.load(f))); } catch (e) {}
      return { C, assets: { pieces } };
    })().catch((e) => { booting = null; throw e; });
    return booting;
  }

  const R = { reel: null, M: null, t: 0, playing: false, q: "", raf: 0, doc: null, eng: null };
  const THEME_NAMES = [["wood", "Wood"], ["lichess", "Lichess brown"], ["blue", "Blue"], ["green", "Tournament green"], ["walnut", "Walnut"], ["marble", "Slate marble"], ["night", "Night"]];
  const CUT_NAMES = { full: "Full game", highlight: "Highlights", puzzle: "Puzzle" };
  const FMT_NAMES = { "9:16": "9:16 Reels, Shorts, TikTok", "1:1": "1:1 square", "16:9": "16:9 YouTube" };
  const brand = "PnoyChess";

  // ---------- the recipe <-> the reel ----------
  function build(eng, rec) {
    const { C } = eng, style = Object.assign({}, C.STYLE_DEFAULTS, { brand }, rec.style || {});
    let r;
    if (rec.classic) { const c = C.CLASSICS.find((x) => x.id === rec.classic); if (!c) throw new Error("Game not in the archive: " + rec.classic); r = C.classicReel(c, style); }
    else r = C.reelFromPGN(rec.pgn || "", { id: rec.id, style });
    r.id = rec.id; r.style = Object.assign({}, r.style, style);
    if (rec.captions) { r.captions = Object.assign({}, r.captions, rec.captions); r.captionOrigin = Object.assign({}, r.captionOrigin, rec.captionOrigin || {}); }
    if (rec.post) { r.post = rec.post; r.postEdited = true; }
    return r;
  }
  const recipeOf = (rec, r) => ({ ...rec, title: (r.meta && r.meta.name) || rec.title || "Chess reel", style: { fmt: r.style.fmt, theme: r.style.theme, cut: r.style.cut, mood: r.style.mood },
    captions: rec.edited ? Object.fromEntries(Object.keys(rec.edited).map((k) => [k, r.captions[k]])) : rec.captions, captionOrigin: rec.edited ? Object.fromEntries(Object.keys(rec.edited).map((k) => [k, "edited"])) : rec.captionOrigin });
  // Each save is a commit on GitHub: changes are collected for 4 s and saved once, and only when something changed.
  let saveT = 0, lastSaved = "";
  function saveRec() { clearTimeout(saveT); saveT = setTimeout(saveNow, 4000); }
  async function saveNow() {
    clearTimeout(saveT);
    if (!R.doc || !R.reel || !S.db) return;
    const d = { ...recipeOf(R.doc, R.reel), kind: "reel" }; delete d.edited; delete d.saved;
    const key = JSON.stringify(d); if (key === lastSaved) return;
    try { await S.db.doc("reels/" + R.doc.id).set({ ...d, updatedAt: new Date().toISOString() }); lastSaved = key; } catch (e) { say("Could not save the reel: " + (e.message || e)); }
  }
  window.addEventListener("pagehide", () => { if (saveT) saveNow(); });

  // ---------- preview ----------
  function prepared() { if (!R.M) R.M = R.eng.C.prepare(R.reel); return R.M; }
  function draw(cv) { const M = prepared(); if (cv.width !== M.L.W || cv.height !== M.L.H) { cv.width = M.L.W; cv.height = M.L.H; } R.eng.C.drawFrame(cv.getContext("2d"), M, R.t, R.eng.assets); }
  function stop() { R.playing = false; cancelAnimationFrame(R.raf); }

  // ---------- MP4 in the browser (the reel studio's fast path: WebCodecs via Mediabunny, H.264 + AAC) ----------
  async function encoder(W, H, fps) {
    if (!window.VideoEncoder || !window.VideoFrame) throw new Error("This browser cannot make videos (use Chrome or Edge on a computer).");
    if (!window.Mediabunny) await load("mediabunny.min.js");
    const mb = window.Mediabunny, videos = [];
    for (const [codec, bpp] of [["avc", 0.083], ["vp9", 0.055]]) { const bitrate = Math.round(W * H * fps * bpp); try { if (await mb.canEncodeVideo(codec, { width: W, height: H, bitrate, frameRate: fps })) videos.push({ codec, bitrate }); } catch (e) {} }
    const aac = async () => { for (const sampleRate of [48000, 44100]) { try { if (await mb.canEncodeAudio("aac", { numberOfChannels: 2, sampleRate, bitrate: 192000 })) return sampleRate; } catch (e) {} } return 0; };
    let sr = await aac();
    if (!sr) { try { await load("mediabunny-aac-encoder.min.js"); window.MediabunnyAacEncoder.registerAacEncoder(); sr = await aac(); } catch (e) {} }
    const v = videos.find((x) => x.codec === "avc") || videos[0];
    if (!v || !sr) throw new Error("This browser cannot write MP4 with sound here (use Chrome or Edge on a computer).");
    return { mb, v, sr };
  }
  async function makeMp4(onP) {
    const { C, assets } = R.eng, M = C.prepare(R.reel), W = M.L.W, H = M.L.H, fps = 30;
    const { mb, v, sr } = await encoder(W, H, fps), snd = C.soundtrackFor(M, { mood: M.st.mood, sampleRate: sr });
    const frames = Math.max(1, Math.round(M.tl.total * fps)), audioLen = Math.min(snd.left.length, Math.round(M.tl.total * sr));
    const output = new mb.Output({ format: new mb.Mp4OutputFormat({ fastStart: "in-memory" }), target: new mb.BufferTarget() });
    const cv = document.createElement("canvas"); cv.width = W; cv.height = H; const cx = cv.getContext("2d", { alpha: false });
    const vsrc = new mb.CanvasSource(cv, { codec: v.codec, bitrate: v.bitrate, keyFrameInterval: 2, latencyMode: "quality" }), asrc = new mb.AudioSampleSource({ codec: "aac", bitrate: 192000 });
    output.addVideoTrack(vsrc, { frameRate: fps }); output.addAudioTrack(asrc);
    let off = 0, done = false;
    const audioUntil = async (end) => { end = Math.min(end, audioLen); while (off < end) { const n = Math.min(sr, end - off), data = new Float32Array(n * 2); data.set(snd.left.subarray(off, off + n), 0); data.set(snd.right.subarray(off, off + n), n);
      const s = new mb.AudioSample({ data, format: "f32-planar", numberOfChannels: 2, sampleRate: sr, timestamp: off / sr }); await asrc.add(s); s.close(); off += n; } };
    try {
      await output.start();
      for (let i = 0; i < frames; i++) {
        if (i % fps === 0) await audioUntil(Math.round((i / fps + 1) * sr));
        C.drawFrame(cx, M, i / fps, assets); await vsrc.add(i / fps, 1 / fps);
        if (i % 15 === 0) { onP(i / frames); await new Promise((r) => setTimeout(r, 0)); }
      }
      await audioUntil(audioLen); vsrc.close(); asrc.close(); await output.finalize(); done = true;
      return new Blob([output.target.buffer], { type: "video/mp4" });
    } finally { if (!done) { try { await output.cancel(); } catch (e) {} } }
  }
  function download(blob, name) { const a = el("a", { href: URL.createObjectURL(blob), download: name }); document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 60000); }
  const fileName = (ext) => `${R.reel.id}-${R.reel.style.cut}-${R.reel.style.fmt.replace(":", "x")}.${ext}`;

  // ---------- the view ----------
  function plyLabel(k) { if (+k === 0) return "Opening line"; const p = R.M && R.M.game.plies[+k - 1]; return p ? Math.ceil(+k / 2) + (+k % 2 ? ". " : "... ") + p.san : "Move " + k; }

  function editor(box) {
    const { C } = R.eng, r = R.reel;
    const cv = el("canvas", { class: "reel-cv", "aria-label": "Reel preview" }), M = prepared();
    cv.style.width = r.style.fmt === "9:16" ? "min(100%, 330px)" : "100%";
    const scrub = el("input", { type: "range", min: "0", max: String(M.tl.total.toFixed(2)), step: "0.05", value: String(R.t), "aria-label": "Time" });
    const time = el("span", { class: "note mono" });
    const show = () => { draw(cv); scrub.value = String(R.t); time.textContent = R.t.toFixed(1) + " / " + M.tl.total.toFixed(1) + " s"; };
    const play = el("button", { class: "btn primary", type: "button", text: "Play" });
    play.onclick = () => {
      if (R.playing) { stop(); play.textContent = "Play"; return; }
      if (R.t >= M.tl.total - 0.05) R.t = 0;
      R.playing = true; play.textContent = "Pause"; let last = performance.now();
      const tick = (now) => { if (!R.playing || !cv.isConnected) return stop(); R.t = Math.min(M.tl.total, R.t + (now - last) / 1000); last = now; show(); if (R.t >= M.tl.total) { stop(); play.textContent = "Play"; return; } R.raf = requestAnimationFrame(tick); };
      R.raf = requestAnimationFrame(tick);
    };
    scrub.oninput = () => { R.t = +scrub.value; show(); };
    const restyle = (k, v) => { stop(); r.style = Object.assign({}, r.style, { [k]: v }); R.M = null; R.t = Math.min(R.t, prepared().tl.total); saveRec(); paint(box); };
    const sel = (label, key, opts) => el("label", {}, label, (() => { const s = el("select", { onchange: (e) => restyle(key, e.target.value) }, ...opts.map(([v, t]) => el("option", { value: v, text: t }))); s.value = r.style[key]; return s; })());

    // captions: every captioned move, editable; the masters' notes and engine facts come from the archive
    const caps = el("div", { class: "reel-caps" });
    Object.keys(r.captions || {}).map(Number).sort((a, b) => a - b).forEach((k) => {
      const ta = el("textarea", { rows: "2", "aria-label": "Caption for " + plyLabel(k) }); ta.value = r.captions[k];
      ta.onchange = () => { r.captions[k] = ta.value.trim(); (r.captionOrigin = r.captionOrigin || {})[k] = "edited"; (R.doc.edited = R.doc.edited || {})[k] = 1; R.M = null; show(); saveRec(); };
      caps.append(el("label", {}, el("span", { class: "mono", text: plyLabel(k) + ((r.captionOrigin || {})[k] ? " · " + r.captionOrigin[k] : "") }), ta));
    });

    // the post text for Facebook, Instagram and TikTok (YouTube's title and description come from it at upload)
    const post = el("textarea", { rows: "6", "aria-label": "Post text" }); post.value = r.post || C.postText(r, r.hook, null);
    post.onchange = () => { r.post = post.value; R.doc.post = post.value; saveRec(); };

    // captions in another language or fresh words, by ANY AI: copy the engine's prompt, paste the reply, every caption fact-checked
    const lang = el("select", {}, el("option", { value: "fil", text: "Filipino" }), el("option", { value: "taglish", text: "Taglish" }), el("option", { value: "en", text: "English, fresh words" }));
    const promptBox = el("textarea", { rows: "4", class: "code", readonly: true, "aria-label": "Prompt" }), reply = el("textarea", { rows: "4", class: "code", placeholder: "Paste the AI's JSON reply here", "aria-label": "AI reply" });
    const items = () => [{ reel: r }];
    const mkPrompt = () => { promptBox.value = C.captionPrompt(items(), { brand, lang: lang.value }); };
    lang.onchange = mkPrompt; mkPrompt();
    const ai = el("details", { class: "reel-ai" }, el("summary", { text: "Rewrite captions with any AI (Gemini, Claude, Copilot, ChatGPT…)" }),
      el("p", { class: "note", text: "Copy the prompt into any AI, paste its reply below. Every caption is checked against the game and the engine before it is used; a caption that gets a fact wrong is dropped." }),
      el("div", { class: "row" }, el("label", {}, "Language", lang), el("button", { class: "btn", type: "button", text: "Copy prompt", onclick: async () => { try { await navigator.clipboard.writeText(promptBox.value); say("Prompt copied."); } catch (e) { promptBox.select(); say("Press Ctrl+C to copy."); } } })),
      promptBox, reply,
      el("button", { class: "btn primary", type: "button", text: "Use the reply", onclick: () => {
        let json; try { json = JSON.parse(reply.value.replace(/^```(?:json)?\s*|\s*```$/g, "")); } catch (e) { return say("That reply is not JSON. Ask the AI to answer with only the JSON."); }
        const map = C.parseCaptionReply(json, items()); if (!map[r.id]) return say("The reply has no captions for this game.");
        const fc = C.factCheckGen(r, map[r.id]);
        if (r.curated) C.applyRewrite(r, fc.gen, { origin: "ai", lang: lang.value }); else C.applyCaptions(r, fc.gen, { origin: "ai", rewriteOwn: true });
        R.doc.edited = Object.fromEntries(Object.keys(r.captions).map((k) => [k, 1])); R.M = null; saveRec(); paint(box);
        say(`Captions updated${fc.dropped ? `; ${fc.dropped} dropped by the fact check (the original stays)` : ""}.`); } }));

    // YouTube copy and its SEO score from the one SEO engine (tools/seo.mjs, published as seo.mjs next to the page)
    const seoBox = el("div", { class: "note" }, "Checking the YouTube copy…");
    import(new URL("seo.mjs", document.baseURI).href).then((SEO) => {
      const m = r.meta || {}, text = post.value || "", item = { text, title: m.name, white: C.displayName(m.white), black: C.displayName(m.black), pod: (r.archive && (r.archive.tags || []).includes("Puzzle of the Day")) };
      const meta = SEO.shortMeta(item), opening = ((text.match(/^Opening:\s*([^\n,]+)/m) || [])[1] || "").trim();
      const sc = SEO.scoreVideo({ ...meta, short: true, caption: false, playlists: 1, lang: "en", audioLang: "en", kids: false, chess: { players: [item.white, item.black].filter(Boolean), opening } }, { filipino: false });
      const bad = sc.checks.filter((c) => !c.ok);
      seoBox.textContent = ""; seoBox.className = "";
      seoBox.append(el("div", { class: "row", style: "gap:8px;align-items:center" }, el("span", { class: "pill " + (sc.score >= 80 ? "ok" : sc.score >= 60 ? "warn" : "bad"), text: "YouTube SEO " + sc.score + "/100" }), el("span", { class: "mono note", text: meta.title })),
        bad.length ? el("ul", { class: "note", style: "margin:6px 0 0;padding-left:18px" }, ...bad.map((c) => el("li", { text: c.fix }))) : el("div", { class: "note", text: "Everything YouTube reads is in place." }));
    }, () => { seoBox.textContent = "The SEO check could not load."; });
    post.addEventListener("change", () => R.reel && paint(box));

    // the new board: the daily reels' Remotion look, Mark's voice and music, rendered on his PC (tools/custom-reels.mjs
    // turns this recipe into a plan by rules). The result is its own record, db/reelrenders/<id>, written only by the PC.
    const rmBox = el("div", { class: "note" });
    const rmBtn = el("button", { class: "btn primary", type: "button", text: "Make with the new board", disabled: !S.db });
    const showRm = R.showRm = () => {
      const a = R.doc && R.doc.renderAsk, x = R.render || {}; rmBox.textContent = "";
      if (!a) return rmBox.append("The same board, voice and music as the daily reels (9:16, your voice). Made on your PC: render-pc.cmd, or the watch task within 10 minutes.");
      if (x.forAsk !== a) return rmBox.append("Waiting for your PC: run render-pc.cmd (the watch task starts it within 10 minutes).");
      if (x.status === "rendering") return rmBox.append("Rendering on your PC…");
      if (x.status === "failed") return rmBox.append(el("span", { class: "pill bad", text: "Not made" }), " " + (x.why || "unknown reason"));
      if (x.status === "done") rmBox.append(el("span", { class: "pill ok", text: "Ready" }), " ", el("a", { href: x.videoUrl, target: "_blank", rel: "noopener", text: `Watch / download the video (${x.seconds} s)` }), " · ", el("a", { href: x.coverUrl, target: "_blank", rel: "noopener", text: "Cover" }));
    };
    rmBtn.onclick = async () => { stop(); R.doc.renderAsk = new Date().toISOString(); R.render = null; await saveNow(); showRm(); say("Sent to your PC: it renders at the next run."); };
    const rmCheck = el("button", { class: "btn", type: "button", text: "Check again", onclick: async () => { await loadRender(); showRm(); } });

    const prog = el("span", { class: "note" });
    const mp4 = el("button", { class: "btn", type: "button", text: "Quick MP4 (old board, in the browser)" });
    mp4.onclick = async () => { stop(); mp4.disabled = true; try { const b = await makeMp4((f) => { prog.textContent = "Making the video… " + Math.round(f * 100) + "%"; }); prog.textContent = "Done: " + (b.size / 1048576).toFixed(1) + " MB"; download(b, fileName("mp4")); } catch (e) { prog.textContent = ""; say(e.message || String(e)); } finally { mp4.disabled = false; } };
    const cover = el("button", { class: "btn", type: "button", text: "Cover image", onclick: () => { const M2 = C.prepare(r), c = el("canvas"); c.width = M2.L.W; c.height = M2.L.H; C.drawCover(c.getContext("2d"), M2, R.eng.assets); c.toBlob((b) => download(b, fileName("png")), "image/png"); } });

    const m = r.meta || {};
    box.append(
      el("div", { class: "row", style: "justify-content:space-between" }, el("div", {}, el("h2", { text: m.name || "Chess reel" }), el("div", { class: "note", text: [C.displayName(m.white) + " vs " + C.displayName(m.black), m.event || m.place, m.year, m.opening].filter(Boolean).join(" · ") })),
        el("button", { class: "btn", type: "button", text: "Pick another game", onclick: async () => { stop(); await saveNow(); R.reel = null; R.doc = null; lastSaved = ""; paint(box); } })),
      el("div", { class: "reel-grid" },
        el("div", { class: "reel-stage" }, cv, el("div", { class: "row" }, play, scrub, time)),
        el("div", { class: "reel-side" },
          el("div", { class: "reel-sets" }, sel("Cut", "cut", C.CUTS.map((c) => [c, CUT_NAMES[c] || c])), sel("Format", "fmt", Object.entries(FMT_NAMES)), sel("Board", "theme", THEME_NAMES), sel("Music", "mood", [["auto", "Auto"], ...Object.keys(C.MOODS).map((x) => [x, x[0].toUpperCase() + x.slice(1)]), ["none", "None"]])),
          el("h3", { text: "New board (Remotion)" }), el("div", { class: "row" }, rmBtn, rmCheck), rmBox,
          el("h3", { text: "Quick preview file" }), el("div", { class: "row" }, mp4, cover, prog),
          el("h3", { text: "Captions" }), caps, ai,
          el("h3", { text: "Post text" }), post, el("h3", { text: "YouTube" }), seoBox)));
    show();
  }

  function picker(box) {
    const { C } = R.eng;
    const q = el("input", { type: "search", placeholder: "Search 1,014 verified games: player, opening, year, tournament", "aria-label": "Search games", value: R.q });
    const list = el("div", { class: "reel-list" });
    const fill = () => {
      R.q = q.value; const ws = q.value.toLowerCase().split(/\s+/).filter(Boolean), hit = (c) => { const x = [c.name, c.year, c.opening && c.opening.name, ...(c.tags || []), c.pgn.slice(0, 400)].join(" ").toLowerCase(); return ws.every((w) => x.includes(w)); };
      const found = C.CLASSICS.filter(hit); list.textContent = "";
      found.slice(0, 24).forEach((c) => list.append(el("button", { class: "proj reel-pick", type: "button", onclick: () => open({ id: "r-" + c.id, classic: c.id, title: c.name, style: {} }, box) },
        el("div", {}, el("div", { class: "t", text: c.name }), el("div", { class: "note", text: [c.year, c.opening && c.opening.name, (c.tags || []).slice(0, 2).join(", ")].filter(Boolean).join(" · ") })))));
      if (found.length > 24) list.append(el("div", { class: "note", text: `${found.length - 24} more: type to narrow down.` }));
      if (!found.length) list.append(el("div", { class: "empty", text: "No game matches." }));
    };
    q.oninput = fill;
    const pgn = el("textarea", { rows: "5", class: "code", placeholder: "[Event \"...\"]\n1. e4 e5 2. Nf3 ...", "aria-label": "PGN" });
    box.append(el("h2", { text: "New reel" }),
      el("p", { class: "note", text: "Every archive game is checked by Stockfish and captioned from the masters' own notes (public domain) or Wikipedia. Your own PGN uses its own comments as captions." }),
      q, list,
      el("details", {}, el("summary", { text: "Use your own PGN" }), pgn, el("button", { class: "btn", type: "button", text: "Use this game", onclick: () => open({ id: "r-own-" + Date.now().toString(36), pgn: pgn.value, style: {} }, box) })));
    fill();
  }

  async function open(rec, box) {
    try { R.reel = build(R.eng, rec); R.doc = { ...rec }; R.M = null; R.t = 0; R.render = null; paint(box); saveRec(); loadRender().then(() => R.showRm && R.showRm()); }
    catch (e) { say(e.message || String(e)); }
  }
  // the PC's answer to "Make with the new board" (db/reelrenders/<id>: status, video link, seconds)
  async function loadRender() { const id = R.doc && R.doc.id; if (!id || !S.db) return; try { const x = await S.db.doc("reelrenders/" + id).get(); if (R.doc && R.doc.id === id) R.render = x || null; } catch (e) { /* not there yet */ } }

  function paint(box) { box.textContent = ""; if (R.reel) editor(box); else picker(box); }

  // the Create tab calls this; rec = a saved reel (db/reels) to open, or null for the game picker
  function view(rec) {
    const box = el("section", { class: "panel reel" }, el("div", { class: "note", text: "Loading the chess engine…" }));
    boot().then((eng) => { R.eng = eng; if (rec && (!R.doc || R.doc.id !== rec.id)) return open(rec, box); paint(box); }, (e) => { box.textContent = ""; box.append(el("div", { class: "empty", text: "The chess engine did not load: " + e.message })); });
    return box;
  }
  // ---------- the one game library (also used by documentary board scenes in Write) ----------
  // search(q) -> [{id, name, year, opening, tags}] over the 1,014 verified games; board(id) -> a Docu board visual with
  // the full game, the players, the event and its source (for the fact gate).
  async function library() {
    const { C } = await boot();
    const text = (c) => [c.name, c.year, c.opening && c.opening.name, ...(c.tags || []), c.pgn.slice(0, 400)].join(" ").toLowerCase();
    return {
      count: C.CLASSICS.length,
      search: (q, n = 20) => { const ws = String(q || "").toLowerCase().split(/\s+/).filter(Boolean); return C.CLASSICS.filter((c) => { const x = text(c); return ws.every((w) => x.includes(w)); }).slice(0, n).map((c) => ({ id: c.id, name: c.name, year: c.year, opening: c.opening && c.opening.name, tags: c.tags || [] })); },
      board: (id) => { const c = C.CLASSICS.find((x) => x.id === id); if (!c) return null; const r = C.classicReel(c, {}), m = r.meta || {};
        return { type: "board", fen: r.startFen || undefined, moves: r.moves.slice(), players: { white: C.displayName(m.white), black: C.displayName(m.black) }, event: [m.event, m.year].filter(Boolean).join(" "), title: c.name, orientation: c.flip ? "black" : "white", eval: false, source: c.source || "" }; },
    };
  }
  window.ReelStudio = { view, stop: () => { stop(); if (saveT) saveNow(); }, build, recipeOf, library };
})();
