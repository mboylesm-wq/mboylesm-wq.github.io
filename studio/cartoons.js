// PnoyChess Studio · Cartoons tab (Mark, 23 Nov 2026): every f7 cartoon episode, from ready-made script to YouTube
// Short. db/cartoons/<id>.json holds the script and Mark's choices (renderAsk, approvedSha, posted); his PC writes
// db/cartoonrenders/<id>.json (tools/cartoons.mjs: the Blender render, the video link, the YouTube link). Render →
// the PC makes it (render-pc.cmd, or the 20:35 reels task) → Mark watches it here → Approve → the PC posts it to
// YouTube Shorts within 10 minutes (tools/pc-jobs.mjs; public, his f7 exception; two a day at most).
// Loaded the first time the tab opens (index.html is at its size ceiling). Uses the page's el(), say(), safeUrl(),
// S (S.cartoons, S.cartoonRenders) and render().
(function () {
  "use strict";
  const LABEL = {
    script: ["Script ready", ""], queued: ["Waiting for the PC", ""], rendering: ["Rendering", ""], failed: ["Render failed", "bad"],
    review: ["Watch and approve", "warn"], approved: ["Approved", "ok"], posting: ["Posting", "ok"], posted: ["On YouTube", "ok"],
  };
  // where one episode stands, from its script record and the PC's render record
  function state(d, r) {
    r = r || {};
    const yt = r.youtube || {};
    if (yt.url || (d.posted && d.posted.url)) return "posted";
    if (yt.startedAt && !yt.failedAt) return "posting";
    if (d.renderAsk && r.forAsk !== d.renderAsk) return "queued";
    if (r.status === "rendering") return "rendering";
    if (r.status === "failed") return "failed";
    if (r.status === "done") return d.approvedSha && d.approvedSha === r.sha256 ? "approved" : "review";
    return "script";
  }
  const secs = (d) => Math.round((d.beats || []).reduce((s, b) => s + (+b.d || 0), 0));
  const moves = (d) => (d.beats || []).flatMap((b) => b.m || []);
  const when = (iso) => { try { return new Date(iso).toLocaleString("en-PH", { timeZone: "Asia/Manila", weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }); } catch (e) { return ""; } };
  async function put(d, patch, done) {
    if (!S.db) return say("Sign in to GitHub first (Tools).");
    try { await S.db.doc("cartoons/" + d.id).update(patch); Object.assign(d, patch); if (done) say(done); }
    catch (e) { say("Could not save: " + (e.message || e.code)); }
    render();
  }
  function card(d) {
    const r = (S.cartoonRenders || {})[d.id] || {}, st = state(d, r), yt = r.youtube || {}, [label, tone] = LABEL[st];
    const line = {
      script: `About ${secs(d)} seconds, ${moves(d).length} moves. Press Render: your PC makes it in about 35 minutes (free).`,
      queued: "Your PC makes it the next time render-pc.cmd runs, or tonight at 20:35 (about 35 minutes each).",
      rendering: "Your PC is making it now" + (r.startedAt ? " (started " + when(r.startedAt) + ")" : "") + ". About 35 minutes.",
      failed: "Your PC could not make it: " + (r.why || "no reason given") + ". Press Render to try again.",
      review: `Made ${when(r.doneAt)}, ${r.seconds || "?"} seconds. Watch it, then Approve to post it.`,
      approved: "Your PC posts it to YouTube Shorts within 10 minutes (two a day at most, so it may wait for tomorrow).",
      posting: "Your PC is sending it to YouTube now.",
      posted: "Posted" + (yt.at ? " " + when(yt.at) : d.posted && d.posted.at ? " " + when(d.posted.at) : "") + ".",
    }[st];
    const btns = el("div", { class: "row", style: "gap:6px; flex-wrap:wrap;" });
    if (!["queued", "rendering", "posting", "posted"].includes(st)) btns.append(el("button", { class: "btn" + (st === "script" || st === "failed" ? " primary" : ""), type: "button",
      text: r.status === "done" ? "Render again" : "Render",
      onclick: () => put(d, { renderAsk: new Date().toISOString(), approvedSha: null, approvedAt: null }, `Episode ${d.no} is waiting for your PC (free, about 35 minutes once it starts).`) }));
    if (st === "queued") btns.append(el("button", { class: "btn", type: "button", text: "Cancel render", onclick: () => put(d, { renderAsk: null }, "Render cancelled.") }));
    if (st === "review") btns.append(el("button", { class: "btn primary", type: "button", text: "Approve and post",
      onclick: () => { if (confirm(`Post episode ${d.no}, "${d.title}", to YouTube Shorts? It goes public.`)) put(d, { approvedSha: r.sha256, approvedAt: new Date().toISOString() }, "Approved: your PC posts it within 10 minutes."); } }));
    if (st === "approved") btns.append(el("button", { class: "btn", type: "button", text: "Undo approval", onclick: () => put(d, { approvedSha: null, approvedAt: null }, "Not approved any more: nothing will be posted.") }));
    if (st !== "posted" && st !== "posting") btns.append(el("button", { class: "btn", type: "button", text: "Posted it myself", title: "Already on YouTube? Add its link so it is tracked and never posted twice",
      onclick: () => { const u = prompt("The YouTube link of this episode:"); if (u && /^https:\/\/(www\.)?(youtube\.com|youtu\.be)\//.test(u.trim())) put(d, { posted: { url: u.trim(), at: new Date().toISOString() } }, "Saved as posted."); else if (u) say("That is not a YouTube link."); } }));
    const link = yt.url || (d.posted && d.posted.url);
    return el("article", { class: "topic" },
      el("div", { class: "row", style: "justify-content:space-between; align-items:flex-start; gap:8px; flex-wrap:wrap;" },
        el("h3", { text: `Episode ${d.no || "?"} · ${d.title}` }),
        el("span", { class: "pill" + (tone ? " " + tone : ""), text: label })),
      d.trap ? el("div", { class: "note", text: "Trap: " + d.trap }) : null,
      el("div", { class: "note", text: line }),
      link ? el("div", { class: "note" }, "YouTube: ", el("a", { href: safeUrl(link), target: "_blank", rel: "noopener", text: link })) : null,
      r.status === "done" && r.videoUrl ? el("div", { class: "row", style: "gap:12px; align-items:flex-start; flex-wrap:wrap; margin:8px 0;" },
        el("video", { src: safeUrl(r.videoUrl), controls: true, preload: "none", poster: r.coverUrl ? safeUrl(r.coverUrl) : undefined, style: "width:220px; max-width:100%; border-radius:10px; background:#000;" }),
        el("a", { class: "btn", href: safeUrl(r.videoUrl), target: "_blank", rel: "noopener", text: "Download" })) : null,
      el("details", {}, el("summary", { text: "The story (" + (d.beats || []).length + " scenes)" }),
        el("ol", { style: "margin:6px 0 6px 18px; padding:0;" }, ...(d.beats || []).map((b) => el("li", {},
          b.m && b.m.length ? el("span", { class: "pill", style: "margin-right:6px;", text: b.m.join(" ") }) : null,
          [b.cap, b.sub].filter(Boolean).join(" — "))))),
      btns);
  }
  function view() {
    const all = (S.cartoons || []).slice().sort((a, b) => (a.no || 0) - (b.no || 0));
    const count = {}; for (const d of all) { const s = state(d, (S.cartoonRenders || {})[d.id]); count[s] = (count[s] || 0) + 1; }
    const F = { all: () => true, render: (s) => s === "script" || s === "failed", busy: (s) => s === "queued" || s === "rendering", review: (s) => s === "review", posted: (s) => ["approved", "posting", "posted"].includes(s) };
    const f = S.cartoonFilter && F[S.cartoonFilter] ? S.cartoonFilter : "all";
    const chip = (k, text, n) => el("button", { class: "btn" + (f === k ? " primary" : ""), type: "button", text: `${text} (${n})`, onclick: () => { S.cartoonFilter = k; S.cartoonPage = 0; render(); } });
    const n = (...ks) => ks.reduce((s, k) => s + (count[k] || 0), 0);
    const shown = all.filter((d) => F[f](state(d, (S.cartoonRenders || {})[d.id])));
    // twenty episodes a page, so a library of hundreds of scripts stays quick on a phone
    const PAGE = 20, pages = Math.max(1, Math.ceil(shown.length / PAGE)), p = Math.min(Math.max(0, S.cartoonPage || 0), pages - 1);
    const go = (k) => { S.cartoonPage = k; render(); window.scrollTo(0, 0); };
    const pager = () => pages > 1 ? el("div", { class: "row", style: "gap:6px; align-items:center; margin:10px 0;" },
      el("button", { class: "btn", type: "button", text: "Previous", disabled: p === 0, onclick: () => go(p - 1) }),
      el("span", { class: "note", text: `Page ${p + 1} of ${pages} (episodes ${p * PAGE + 1} to ${Math.min(shown.length, (p + 1) * PAGE)} of ${shown.length})` }),
      el("button", { class: "btn", type: "button", text: "Next", disabled: p >= pages - 1, onclick: () => go(p + 1) })) : null;
    const page = shown.slice(p * PAGE, (p + 1) * PAGE);
    return el("section", { class: "panel" },
      el("h2", { text: "f7 cartoons" }),
      el("div", { class: "note", text: "Every episode of the f7 3D cartoon, from ready-made script to YouTube Short. Press Render and your PC makes it in Blender (free, about 35 minutes each, when render-pc.cmd runs or tonight at 20:35). Watch it here, then Approve: your PC posts it to your YouTube Shorts within 10 minutes, public, two a day at most. Nothing is posted until you approve it." }),
      S.db ? null : el("div", { class: "empty", text: "Sign in to GitHub (Tools) to render or approve." }),
      el("div", { class: "row", style: "gap:6px; flex-wrap:wrap; margin:10px 0;" },
        chip("all", "All", all.length), chip("render", "To render", n("script", "failed")), chip("busy", "Being made", n("queued", "rendering")),
        chip("review", "To watch", n("review")), chip("posted", "Approved and posted", n("approved", "posting", "posted"))),
      pager(),
      shown.length ? el("div", {}, ...page.map(card)) : el("div", { class: "empty", text: all.length ? "No episode here." : "No scripts yet." }),
      pager());
  }
  window.F7Cartoons = { view, state };
})();
