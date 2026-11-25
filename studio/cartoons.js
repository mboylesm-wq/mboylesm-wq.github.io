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
  // where an episode is posted (Mark, 24 Nov 2026): YouTube by the PC or by hand (d.posted, the PC's never-twice guard),
  // the others by hand with "Posted it myself" (d.postedOn.<platform>)
  const PLATFORMS = [["youtube", "YouTube", /^https:\/\/(www\.|m\.)?(youtube\.com|youtu\.be)\//], ["facebook", "Facebook", /^https:\/\/(www\.|m\.|web\.)?(facebook\.com|fb\.watch)\//],
    ["instagram", "Instagram", /^https:\/\/(www\.)?instagram\.com\//], ["tiktok", "TikTok", /^https:\/\/(www\.|vm\.|vt\.)?tiktok\.com\//]];
  function postedOn(d, r) {
    const yt = (r || {}).youtube || {}, on = d.postedOn || {};
    return Object.fromEntries(PLATFORMS.map(([k]) => [k, k === "youtube" ? (yt.url ? { url: yt.url, at: yt.at } : d.posted && d.posted.url ? d.posted : null) : on[k] && on[k].url ? on[k] : null]));
  }
  const trapName = (t) => String(t || "").replace(/^trap-\w+\s*\((.*)\)$/, "$1").replace(/,\s*assets\/\S+$/, "");
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
    const on = postedOn(d, r);
    if (PLATFORMS.some(([k]) => !on[k])) btns.append(el("button", { class: "btn", type: "button", text: "Posted it myself", title: "Posted it yourself? Add its link so the page shows where it is (a YouTube link also stops your PC posting it twice)",
      onclick: () => {
        const u = (prompt("Paste the link where you posted this episode (YouTube, Facebook, Instagram or TikTok):") || "").trim();
        if (!u) return;
        const p = PLATFORMS.find(([, , re]) => re.test(u));
        if (!p) return say("That is not a YouTube, Facebook, Instagram or TikTok link.");
        const at = new Date().toISOString();
        if (p[0] === "youtube") { if (st === "posting") return say("Your PC is posting it to YouTube right now: wait for it."); put(d, { posted: { url: u, at } }, "Saved: on YouTube."); }
        else put(d, { postedOn: Object.assign({}, d.postedOn || {}, { [p[0]]: { url: u, at } }) }, "Saved: on " + p[1] + ".");
      } }));
    return el("article", { class: "topic" },
      el("div", { class: "row", style: "justify-content:space-between; align-items:flex-start; gap:8px; flex-wrap:wrap;" },
        el("h3", { text: (d.season && d.seasonEp ? `S${d.season} E${d.seasonEp} · ` : `Episode ${d.no || "?"} · `) + d.title }),
        el("span", { class: "pill" + (tone ? " " + tone : ""), text: label })),
      d.trap ? el("div", { class: "note", text: "Trap: " + trapName(d.trap) + (d.repeatOf ? " (told before in episode " + d.repeatOf + ")" : "") }) : null,
      el("div", { class: "note", text: line }),
      el("div", { class: "row", style: "gap:6px; flex-wrap:wrap; align-items:center; margin:6px 0;" }, el("span", { class: "note", text: "Posted on:" }),
        ...PLATFORMS.map(([k, name]) => on[k] ? el("a", { class: "pill ok", href: safeUrl(on[k].url), target: "_blank", rel: "noopener", title: on[k].at ? "Posted " + when(on[k].at) : "", text: name + " ✓" })
          : el("span", { class: "pill", style: "opacity:.55;", text: name + ": not yet" }))),
      r.status === "done" && r.videoUrl ? el("div", { class: "row", style: "gap:12px; align-items:flex-start; flex-wrap:wrap; margin:8px 0;" },
        el("video", { src: safeUrl(r.videoUrl), controls: true, preload: "none", poster: r.coverUrl ? safeUrl(r.coverUrl) : undefined, style: "width:220px; max-width:100%; border-radius:10px; background:#000;" }),
        el("a", { class: "btn", href: safeUrl(r.videoUrl), target: "_blank", rel: "noopener", text: "Download" })) : null,
      el("details", {}, el("summary", { text: "The story (" + (d.beats || []).length + " scenes)" }),
        el("ol", { style: "margin:6px 0 6px 18px; padding:0;" }, ...(d.beats || []).map((b) => el("li", {},
          b.m && b.m.length ? el("span", { class: "pill", style: "margin-right:6px;", text: b.m.join(" ") }) : null,
          [b.cap, b.sub].filter(Boolean).join(" — "))))),
      btns);
  }
  // a heading where a season starts on the page (Mark, 25 Nov 2026: seasons by opening, tools/cartoon-seasons.mjs)
  function withSeasons(page, card) {
    const out = []; let last = null;
    for (const d of page) {
      if (d.season && d.season !== last) out.push(el("h3", { class: "season", style: "margin:18px 0 6px;", text: `Season ${d.season}` + (d.seasonTitle ? ` · ${d.seasonTitle}` : "") }));
      last = d.season || null; out.push(card(d));
    }
    return out;
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
      shown.length ? el("div", {}, ...withSeasons(page, card)) :el("div", { class: "empty", text: all.length ? "No episode here." : "No scripts yet." }),
      pager());
  }
  window.F7Cartoons = { view, state, postedOn, trapName, withSeasons };
})();
