// PnoyChess Studio · Story reels (tools/story-reels.mjs, 21 Nov 2026): any chess topic as a reel with photos, clips,
// big numbers and the 3D brain. Loaded the first time the Ideas tab shows (like viral.js and visualised.js; it moved
// out of index.html, which is at its size ceiling). The page saves db/storyreels/<id>.json and starts story.yml (the
// AI writes it, the checks run, photos and clips are fetched); Mark reads it and presses Make; his PC renders it
// (db/storyrenders/<id>.json, written only there). Uses the page's el(), say(), safeUrl(), S and render();
// S.stories and S.storyRenders are loaded by the page.
(function () {
  "use strict";
  const storyId = (topic) => (String(topic || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "reel") + "-" + Date.now().toString(36).slice(-5);
  async function askStory(topic, angle, sources, again) {
    if (!S.db || !S.actions) { say("Sign in to GitHub first (Tools)."); return; }
    topic = String(topic || "").trim(); if (!topic) { say("Type a topic first."); return; }
    const id = again ? again.id : storyId(topic);
    const doc = again ? { ...again, status: "writing", note: "", renderAsk: null, askedAt: new Date().toISOString() }
      : { id, topic, angle: String(angle || "").trim(), sources: (sources || []).filter((s) => s && s.url).slice(0, 8).map((s) => ({ title: String(s.title || ""), url: String(s.url) })), status: "writing", askedAt: new Date().toISOString() };
    try {
      await S.db.doc("storyreels/" + id).set(doc);
      await S.actions.dispatch("story.yml", { id });
      say(`GitHub is writing the reel "${topic}" (about 2 minutes, about a cent of AI). It shows under Story reels; your PC can be off.`);
    } catch (e) { say("Could not start the story reel: " + (e.message || e.code)); }
    render();
  }
  function storyCard(x) {
    const r = (S.storyRenders || {})[x.id] || null, reel = x.reel || {}, asked = x.renderAsk && (!r || r.forAsk !== x.renderAsk);
    const mins = x.askedAt ? (Date.now() - Date.parse(x.askedAt)) / 60000 : 0;
    const state = x.status === "writing" || x.status === "fetching" ? (mins > 15 ? "The writing seems to have stopped: press Write again" : "GitHub is writing it and finding photos and clips (about 2 minutes)…")
      : x.status === "failed" ? "Not written: " + (x.note || "the checks failed")
      : r && r.status === "rendering" && !asked ? "Your PC is making it now…"
      : r && r.status === "failed" && !asked ? "Your PC could not make it: " + (r.why || "")
      : asked ? "Waiting for your PC: it makes it when you run render-pc.cmd, or tonight at 20:35"
      : r && r.status === "done" ? `Made: ${r.seconds || "?"} s` : "Written: read it, then press Make";
    const btns = el("div", { class: "row", style: "gap:6px; flex-wrap:wrap;" });
    if (x.status === "ready") btns.append(el("button", { class: "btn primary", type: "button", text: r && r.status === "done" ? "Make again" : "Make it on my PC", onclick: async () => {
      try { await S.db.doc("storyreels/" + x.id).update({ renderAsk: new Date().toISOString() }); say("Asked your PC to make it (free: your voice, the render)."); } catch (e) { say("Could not save: " + (e.message || e.code)); }
    } }));
    if (x.status !== "writing" && x.status !== "fetching" || mins > 15) btns.append(el("button", { class: "btn", type: "button", text: "Write again", title: "The AI writes it again (about a cent)", onclick: () => askStory(x.topic, x.angle, x.sources, x) }));
    btns.append(el("button", { class: "btn", type: "button", text: "Delete", onclick: async () => { if (!confirm("Delete this story reel?")) return; await S.db.doc("storyreels/" + x.id).delete().catch(() => {}); } }));
    return el("article", { class: "topic" },
      el("div", { class: "row", style: "justify-content:space-between; align-items:flex-start; gap:8px; flex-wrap:wrap;" },
        el("h3", { text: reel.title || x.topic }),
        el("span", { class: "pill" + (r && r.status === "done" && !asked ? " ok" : ""), text: x.status === "ready" ? (r && r.status === "done" && !asked ? "Made" : "Written") : x.status === "failed" ? "Failed" : "Writing" })),
      el("div", { class: "note", text: state }),
      r && r.status === "done" && r.videoUrl ? el("div", { class: "row", style: "gap:12px; align-items:flex-start; flex-wrap:wrap;" },
        el("video", { src: safeUrl(r.videoUrl), controls: true, preload: "none", poster: r.coverUrl ? safeUrl(r.coverUrl) : undefined, style: "width:220px; max-width:100%; border-radius:10px; background:#000;" }),
        el("a", { class: "btn", href: safeUrl(r.videoUrl), target: "_blank", rel: "noopener", text: "Download" })) : null,
      (reel.scenes || []).length ? el("ol", { style: "margin:6px 0 6px 18px; padding:0;" }, ...reel.scenes.map((sc, i) => el("li", {},
        el("span", { class: "pill", style: "margin-right:6px;", text: (x.shown && x.shown[i]) || sc.visual.type }), sc.text))) : null,
      reel.caption ? el("div", { class: "note", text: "Post: " + reel.caption }) : null,
      (reel.sources || []).length ? el("div", { class: "note" }, "Sources: ", ...reel.sources.flatMap((s, i) => [i ? " · " : "", el("a", { href: safeUrl(s.url), target: "_blank", rel: "noopener", text: s.title || s.url })])) : null,
      btns);
  }
  function storyBox() {
    const topic = el("input", { type: "text", placeholder: "Any chess topic, e.g. Magnus Carlsen's longest unbeaten run", style: "flex:1; min-width:220px;" });
    const angle = el("input", { type: "text", placeholder: "Angle (optional): what makes it surprising", style: "flex:1; min-width:220px;" });
    return el("section", { class: "panel" },
      el("h2", { text: "Story reels" }),
      el("div", { class: "note", text: "A 30-50 second reel on any chess topic with real photos, stock clips, big numbers and your voice, like \"Blindfold\". The AI writes it on GitHub from real sources (about a cent); you read it here, then your PC makes it for free. Nothing is posted until you choose." }),
      el("div", { class: "row", style: "gap:8px; flex-wrap:wrap; margin:10px 0;" }, topic, angle,
        el("button", { class: "btn primary", type: "button", text: "Write story reel", onclick: () => askStory(topic.value, angle.value, []) })),
      ...(S.stories || []).slice(0, 20).map(storyCard));
  }

  window.StoryReels = { box: storyBox, ask: askStory };
})();
