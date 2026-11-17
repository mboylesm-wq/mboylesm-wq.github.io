// PnoyChess Studio · Visualised: the "Chess, Visualised" series on one page — what is already posted, what goes up
// next, and all 75 topics of docs/BLUEPRINT-3B1B.md. Loaded the first time the tab is opened (like viral.js,
// publish.js and reel.js). The data is studio/visualised.json, built by tools/visualised.mjs from the blueprint and
// the channel, so this tab opens with no GitHub key at all; the channel's live numbers are laid over it when they
// arrive. Uses the page's el(), say(), safeUrl(), S, GH() and render().
(function () {
  "use strict";
  let data = null, failure = "", loading = null;

  // the series file next to the page (tools/build-site.mjs copies it; tools/publish-site.mjs sends it)
  const load = () => loading || (loading = fetch(new URL("visualised.json", document.baseURI).href, { cache: "no-cache" })
    .then((r) => { if (!r.ok) throw new Error("visualised.json: HTTP " + r.status); return r.json(); })
    .then((j) => (data = j), (e) => { failure = (e && e.message) || String(e); throw e; }));

  const MIN = 60e3, HOUR = 3600e3, DAY = 24 * HOUR;
  const ago = (iso) => {
    const t = Date.parse(iso || "");
    if (!Number.isFinite(t)) return "never";
    const d = Date.now() - t;
    if (d < 2 * MIN) return "just now";
    if (d < HOUR) return Math.round(d / MIN) + " min ago";
    if (d < 2 * DAY) return Math.round(d / HOUR) + " hours ago";
    return Math.round(d / DAY) + " days ago";
  };
  const day = (iso) => { const t = Date.parse(iso || ""); return Number.isFinite(t) ? new Date(t).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : ""; };
  const n = (v) => (v == null ? "" : Number(v).toLocaleString());
  const pct = (v) => (v ? (v < 1.5 ? (v * 100).toFixed(1) : v.toFixed(1)) + "%" : "");

  // a topic's state, in the words Mark would use
  const STATE = {
    posted: ["Posted", "ok", "It is on the channel."],
    private: ["Uploaded, Private", "warn", "On YouTube as Private: publish it when you are happy."],
    uploaded: ["Approved, uploading", "warn", "Approved: GitHub is uploading it as Private."],
    review: ["Rendered, waiting for you", "warn", "Rendered on your PC: watch it on the Review tab, then Approve."],
    building: ["Being made", "warn", "A project for this film is on the Create tab."],
    partial: ["Partly shipped", "", "A section of this idea already shipped inside another film; the film itself is not made."],
    planned: ["Not made yet", "", "Nothing written yet."],
  };
  const pill = (status, short) => {
    const [label, cls, why] = STATE[status] || STATE.planned;
    return el("span", { class: "pill " + cls, title: why, text: short ? label.replace(/,.*/, "") : label });
  };

  // the channel's own numbers, fresher than the file: the file is a snapshot, db/channel/health.json is today
  const live = (id) => id && ((S.health && S.health.videos) || []).find((v) => v.id === id);
  const views = (v) => { const l = live(v.id); return l && l.views != null ? l.views : v.views; };
  const privacy = (v) => { const l = live(v.id); return (l && l.privacy) || v.privacy || "public"; };
  const published = (v) => { const l = live(v.id); return (l && l.publishedAt) || v.publishedAt; };

  // "Make this film" fills the New video form with the film the blueprint describes: the proof format, its title, the
  // question it answers, and its length. The writing AI is whatever Mark has picked there.
  function make(t) {
    const minutes = +String(t.minutes || "10").split("-")[0] || 10;
    const len = [5, 8, 10, 12, 15, 20, 25, 30].includes(minutes) ? minutes : 10;
    const angle = [t.mystery, t.signature ? "The image the film leaves behind: " + t.signature : ""].filter(Boolean).join(" ");
    const form = { topic: t.title, angle, minutes: len, format: "proof", visualStyle: "proof", sources: [] };
    S.prefill = form;
    S.draftForm = form;
    try { localStorage.setItem("docu.draftForm", JSON.stringify(form)); } catch (e) { /* storage is optional: the form falls back to S.prefill */ }
    S.cur = null; S.view = "write"; render();
    say(`${t.id}: a proof film of ${len} minutes is set up in the form. Pick your AI, then press Write the script.`);
  }
  const writeBtn = (t, cls, id) => el("button", {
    class: "btn" + (cls ? " " + cls : ""), type: "button", id: id || null,
    title: "Opens New video with this film's title, question and proof format",
    text: "Make this film", onclick: () => make(t),
  });

  // a film already in production opens its own project, the way the Create list does
  function openProject(id) {
    const p = (S.projects || []).find((x) => x.id === id);
    if (!p) return say("That project is not loaded yet: reload the page, or open it on Create.");
    S.cur = p; S.view = "projects"; render();
  }

  // a film's topic heading: A1 · the blueprint's short name, with the film title as the loud line
  const idLine = (t, extra) => el("div", { class: "row", style: "gap:8px;align-items:baseline;flex-wrap:wrap" },
    el("span", { class: "mono", style: "font-size:12.5px;color:var(--gold);font-weight:600", text: t.id }),
    extra || null);

  // ---------- the top of the page: the series, and the film that goes up next ----------
  function head(d) {
    const st = d.counts, next = d.topics.find((t) => t.id === d.next);
    const stat = (big, small, tone) => el("div", { style: "display:grid;gap:1px;min-width:96px" },
      el("div", { style: `font:700 22px/1.1 var(--display);${tone ? "color:" + tone : "color:var(--fg-strong)"};font-variant-numeric:tabular-nums`, text: big }),
      el("div", { class: "note", style: "font-size:11.5px", text: small }));
    const box = el("section", { class: "panel", id: "vis-head" },
      el("div", { class: "row", style: "justify-content:space-between;align-items:flex-start;gap:12px" },
        el("div", {},
          el("h2", { style: "margin:0 0 6px", text: d.series }),
          el("div", { class: "note", style: "max-width:76ch", text: "One idea per film, proved on the board. The 3Blue1Brown-style series: what is already on the channel, the film that goes up next, and every topic still to make." })),
        el("a", { class: "btn", href: "https://github.com/mboylesm-wq/pnoychess-docu/blob/main/" + d.source, target: "_blank", rel: "noopener", style: "font-size:12px", text: "The blueprint" })),
      el("div", { class: "row", style: "gap:26px;margin-top:2px" },
        stat(String(st.posted), "posted"),
        stat(next ? next.id : "—", "next to post", "var(--gold)"),
        stat(String(st.production), "in production"),
        stat(String(st.partial), "partly shipped"),
        stat(String(st.left), "of " + st.total + " to go")),
      el("div", { class: "note", style: "font-size:11.5px", text: "Reading the channel's playlist \u201c" + d.playlist + "\u201d and the studio's projects. Snapshotted " + ago(d.builtAt) + "." }));
    return box;
  }

  // the next film to post: number, title, the question, the image, and the one button that starts it
  function nextPanel(d) {
    const t = d.topics.find((x) => x.id === d.next);
    if (!t) return el("section", { class: "panel" }, el("div", { class: "empty", text: "Every topic on the slate is posted. Add the next film to the blueprint." }));
    const order = (d.slate.find((s) => s.id === t.id) || {}).order;
    const state = STATE[t.status] || STATE.planned;
    const body = el("div", { style: "display:grid;gap:9px;min-width:0" },
      el("div", { class: "row", style: "gap:10px" },
        el("span", { class: "pill", text: "Next to post" }),
        el("span", { class: "pill", text: order ? "Slate #" + order : "Next in the library" }),
        pill(t.status),
        el("span", { class: "note", style: "font-size:12px", text: state[2] })),
      el("h2", { style: "margin:2px 0 0;font:700 24px/1.25 var(--display)", text: t.title }),
      idLine(t, el("span", { class: "note", style: "font-size:12.5px", text: t.name })),
      el("div", { class: "row", style: "gap:8px" },
        el("span", { class: "pill", title: "The proof this film has to land", text: t.proof || "proof" }),
        el("span", { class: "note", style: "font-size:12px", text: t.score + " of 100 \u00b7 " + t.minutes + " minutes" })),
      t.mystery ? el("div", { class: "note", style: "max-width:76ch;color:var(--fg);line-height:1.55", text: t.mystery }) : null,
      t.signature ? el("div", { class: "note", style: "max-width:76ch" }, el("span", { style: "color:var(--dim-light)", text: "The image it leaves behind: " }), t.signature) : null,
      el("div", { class: "row", style: "gap:10px;margin-top:4px" },
        t.status === "posted" || t.status === "private" || t.status === "uploaded"
          ? el("a", { class: "btn primary", href: t.video ? t.video.url : d.channel, target: "_blank", rel: "noopener", text: "Watch it on YouTube" })
          : writeBtn(t, "primary", "vis-make"),
        t.project ? el("button", { class: "btn", type: "button", style: "font-size:12px", text: "Open the project", onclick: () => openProject(t.project.id) }) : null));
    return el("section", { class: "panel", id: "vis-next", style: "border-color:var(--gold-border);box-shadow:var(--shadow-md)" }, body);
  }

  // ---------- what is already posted ----------
  function postedRow(v, note) {
    const badge = privacy(v) === "public" ? el("span", { class: "pill ok", text: "Posted" }) : el("span", { class: "pill warn", text: "Private" });
    const meta = [day(published(v)), n(views(v)) + " views", v.retention ? "watched " + pct(v.retention) : "", v.seconds ? Math.round(v.seconds / 60) + " min" : ""].filter(Boolean).join(" \u00b7 ");
    return el("article", { class: "topic", style: "display:grid;grid-template-columns:minmax(96px,140px) minmax(0,1fr);gap:14px;align-items:start" },
      el("a", { href: safeUrl(v.url), target: "_blank", rel: "noopener", style: "display:block;border-radius:8px;overflow:hidden;border:1px solid var(--line);line-height:0" },
        el("img", { src: safeUrl(v.thumb), alt: "", loading: "lazy", style: "width:100%;height:auto;display:block" })),
      el("div", { style: "display:grid;gap:4px;min-width:0" },
        el("div", { class: "row", style: "gap:8px;align-items:baseline" },
          el("a", { class: "t", href: safeUrl(v.url), target: "_blank", rel: "noopener", style: "font:600 15px/1.35 var(--body);color:var(--fg-strong);text-decoration:none", text: v.title }),
          badge),
        el("div", { class: "note", style: "font-size:12px", text: meta }),
        note ? el("div", { class: "note", style: "font-size:12px", text: note }) : null));
  }

  function postedPanel(d) {
    const films = d.posted.slice().sort((a, b) => String(published(b)).localeCompare(String(published(a))));
    const others = (d.other || []).filter((v) => privacy(v) === "public" || privacy(v) === "private");
    if (!films.length && !others.length) return null;
    return el("section", { class: "panel", id: "vis-posted" },
      el("div", { class: "row", style: "justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:8px" },
        el("h3", { style: "margin:0", text: "Already posted" }),
        el("span", { class: "note", style: "font-size:12px", text: films.length + (films.length === 1 ? " film of the 75" : " films of the 75") + (others.length ? " \u00b7 " + others.length + " before the library" : "") })),
      ...films.map((v) => postedRow(v, v.topic ? "Topic " + v.topic : "")),
      ...others.map((v) => postedRow(v, "The pilot film, made before the 75-topic library: its proof style became the template for the rest.")));
  }

  // ---------- the posting order ----------
  function ladderRow(s, d) {
    const t = d.topics.find((x) => x.id === s.id) || {};
    const state = t.status || "planned";
    const isNext = s.id === d.next;
    return el("article", {
      class: "topic",
      style: "display:grid;grid-template-columns:34px minmax(0,1fr);gap:12px;align-items:start" + (isNext ? ";background:var(--gold-bg);border-radius:10px" : ""),
    },
      el("div", { style: "font:700 17px/1.2 var(--mono);color:" + (isNext ? "var(--gold)" : "var(--dim-light)") + ";padding-top:1px", text: String(s.order) }),
      el("div", { style: "display:grid;gap:4px;min-width:0" },
        el("div", { class: "row", style: "gap:8px;align-items:baseline;flex-wrap:wrap" },
          el("span", { class: "mono", style: "font-size:12px;color:var(--dim)", text: s.id }),
          el("span", { style: "font:600 14.5px/1.35 var(--body);color:var(--fg-strong)", text: s.name }),
          pill(state, true),
          el("span", { class: "note", style: "font-size:11.5px", text: s.proof })),
        el("div", { class: "note", style: "font-size:12px", text: s.restates ? "" : s.title }),
        s.signature ? el("div", { class: "note", style: "font-size:11.5px", text: s.signature }) : null));
  }

  function ladder(d) {
    return el("section", { class: "panel", id: "vis-slate" },
      el("div", {},
        el("h3", { style: "margin:0 0 4px", text: "The order to post them" }),
        el("div", { class: "note", style: "max-width:76ch", text: "The blueprint's v2 slate: each film proves one idea, in this order. A film moves up as it ships; the next one is marked in gold." })),
      ...d.slate.map((s) => ladderRow(s, d)));
  }

  // ---------- all 75 ----------
  const FILTERS = [["all", "Everything"], ["posted", "Posted"], ["next", "On the slate"], ["left", "Not made"], ["partial", "Partly shipped"]];
  function shown(d) {
    const f = S.visFilter || "all", onSlate = new Set(d.slate.map((s) => s.id));
    return d.topics.filter((t) => f === "all" ? true
      : f === "posted" ? t.status === "posted" || t.status === "private" || t.status === "uploaded"
      : f === "next" ? onSlate.has(t.id)
      : f === "partial" ? t.status === "partial"
      : !["posted", "private", "uploaded"].includes(t.status));
  }

  function topicRow(t, d) {
    const open = t.status === "posted" || t.status === "private" || t.status === "uploaded";
    const detail = el("details", { style: "margin-top:2px" },
      el("summary", { class: "note", style: "font-size:11.5px;cursor:pointer", text: "What it proves" }),
      el("div", { style: "display:grid;gap:6px;margin-top:6px;max-width:80ch" },
        t.mystery ? el("div", { class: "note", style: "font-size:12.5px;color:var(--fg)", text: t.mystery }) : null,
        t.signature ? el("div", { class: "note", style: "font-size:12px" }, el("span", { style: "color:var(--dim-light)", text: "The image: " }), t.signature) : null,
        t.note ? el("div", { class: "note", style: "font-size:11.5px", text: t.note }) : null,
        el("div", { class: "row", style: "gap:8px;margin-top:2px" },
          open ? el("a", { class: "btn", style: "font-size:12px", href: t.video ? safeUrl(t.video.url) : safeUrl(d.channel), target: "_blank", rel: "noopener", text: t.video ? "Watch it" : "The channel" })
            : writeBtn(t, "", "vis-make-" + t.id),
          el("span", { class: "note", style: "font-size:11.5px", text: t.score + " of 100 \u00b7 " + t.minutes + " minutes" }))));
    return el("article", { class: "topic", style: "display:grid;gap:4px" },
      el("div", { class: "row", style: "gap:8px;align-items:baseline;flex-wrap:wrap" },
        el("span", { class: "mono", style: "font-size:12px;color:var(--dim);min-width:3ch", text: t.id }),
        el("span", { style: "font:600 14.5px/1.35 var(--body);color:var(--fg-strong)", text: t.title }),
        t.status === "planned" ? null : pill(t.status, true),
        el("span", { class: "mono note", style: "font-size:11.5px;margin-left:auto", title: "The blueprint's score, out of 100", text: String(t.score) })),
      detail);
  }

  function library(d) {
    const f = S.visFilter || "all", list = shown(d);
    const byCat = d.categories.map((c) => ({ ...c, topics: list.filter((t) => t.category === c.key) })).filter((c) => c.topics.length);
    const chip = (k, label) => el("button", {
      class: "btn" + (f === k ? " primary" : ""), type: "button", "aria-pressed": String(f === k), text: label,
      style: "font-size:12px;padding:5px 12px", onclick: () => { S.visFilter = k; render(); },
    });
    return el("section", { class: "panel", id: "vis-library" },
      el("div", {},
        el("h3", { style: "margin:0 0 4px", text: "All " + d.counts.total + " topics" }),
        el("div", { class: "note", style: "max-width:76ch", text: "The blueprint's whole library, by category. Twelve are on the slate; the rest follow once it is used up, best score first (the number at the right of each row). Each one opens with the question it answers and the image it leaves behind." })),
      el("div", { class: "row", style: "gap:6px" }, ...FILTERS.map(([k, label]) => chip(k, label))),
      list.length ? null : el("div", { class: "empty", text: "Nothing matches that filter. Pick Everything." }),
      ...byCat.map((c) => el("div", { style: "display:grid;gap:2px;margin-top:6px" },
        el("div", { class: "row", style: "gap:8px;align-items:baseline;margin-top:10px;padding-bottom:4px;border-bottom:1px solid var(--line)" },
          el("span", { class: "mono", style: "font-size:12px;color:var(--gold)", text: c.key }),
          el("span", { style: "font:600 13px/1.3 var(--body);color:var(--fg)", text: c.name }),
          el("span", { class: "note", style: "font-size:11.5px;margin-left:auto", text: c.topics.length + " of " + c.count })),
        ...c.topics.map((t) => topicRow(t, d)))));
  }

  function notes(d) {
    return el("details", { class: "panel", style: "padding:14px 18px" },
      el("summary", { class: "note", style: "cursor:pointer;font-size:13px", text: "Where this page's numbers come from" }),
      el("div", { class: "note", style: "margin-top:8px;max-width:84ch;line-height:1.6" },
        "The topics, the scores, the posting order and each film's question are read from ", el("span", { class: "mono", style: "font-size:12px", text: d.source }),
        " (the blueprint). Whether a film is posted is read from the channel's \u201c" + d.playlist + "\u201d playlist and the studio's project records. ",
        "Nothing here is guessed: a film counts as posted when YouTube says so, and the views are the channel's own. Rebuild the snapshot with ", el("span", { class: "mono", style: "font-size:12px", text: "node tools/visualised.mjs" }), "."));
  }

  // ---------- the tab ----------
  function view() {
    const box = el("div", { style: "display:grid;gap:14px" });
    const body = el("div", { style: "display:grid;gap:14px" }, el("section", { class: "panel" }, el("div", { class: "note", text: "Loading the series\u2026" })));
    box.append(body);
    // the channel's history freshens the posted numbers (db/channel/health.json)
    if (!S.health && S._ensureChannel) S._ensureChannel();
    load().then((d) => {
      body.textContent = "";
      body.append(head(d), nextPanel(d));
      const posted = postedPanel(d);
      if (posted) body.append(posted);
      body.append(ladder(d), library(d), notes(d));
    }).catch((e) => {
      body.textContent = "";
      body.append(el("div", { class: "empty", text: "The series file could not be read (" + (failure || e.message) + "). Run node tools/visualised.mjs, then node tools/publish-site.mjs, and reload." }));
    });
    return box;
  }

  window.VisualisedBoard = { view };
})();
