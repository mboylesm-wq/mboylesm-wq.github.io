// PnoyChess Studio · Viral: the one page that answers "what should I make next?" — every chess story the trend radar
// can see, ranked by how hot it is right now and how close it is to what already works on this channel, each with the
// video it should become. Loaded the first time the tab is opened (like reel.js, publish.js and trending.js).
// The scoring itself is tools/viral.mjs (published as viral.mjs next to this file) — the same rules the weekly radar
// writes into db/trends, so the page and the CLI can never disagree. YouTube copy is checked by tools/seo.mjs.
// Uses the page's el(), say(), safeUrl(), S, GH() and render().
(function () {
  "use strict";
  let SEO = null, loading = null, failure = "";

  // the two engines, loaded once: the scoring (viral.mjs) and the one SEO engine (seo.mjs, for the title checks)
  const load = () => loading || (loading = Promise.all([
    import(new URL("viral.mjs", document.baseURI).href),
    import(new URL("seo.mjs", document.baseURI).href).catch(() => null),
  ]).then(([v, s]) => { SEO = s; return v; }, (e) => { failure = (e && e.message) || String(e); throw e; }));

  const MIN = 60e3, HOUR = 3600e3, WEEK = 7 * 24 * HOUR;
  const ago = (iso) => {
    const t = Date.parse(iso || "");
    if (!Number.isFinite(t)) return "never";
    const d = Date.now() - t;
    if (d < 2 * MIN) return "just now";
    if (d < HOUR) return Math.round(d / MIN) + " minutes ago";
    if (d < 36 * HOUR) return Math.round(d / HOUR) + " hours ago";
    return Math.round(d / (24 * HOUR)) + " days ago";
  };
  const TONE = {
    hot: "background:var(--gold-gradient);color:#1a1206;border:1px solid transparent",
    strong: "background:var(--gold-bg);color:var(--gold);border:1px solid var(--gold-border)",
    look: "background:transparent;color:var(--dim);border:1px solid var(--line)",
    slow: "background:transparent;color:var(--dim-light);border:1px dashed var(--line)",
  };
  const scorePill = (r) => el("span", {
    class: "pill", style: TONE[r.tone] + ";font:700 13px var(--mono);font-variant-numeric:tabular-nums;white-space:nowrap",
    title: `${r.score} of 100 · ${r.grade}`, "aria-label": `${r.score} of 100, ${r.grade}`, text: String(r.score),
  });

  // the five parts, as a meter whose bars are the weighted numbers Mark can check one by one
  function meter(r) {
    const box = el("div", { style: "display:grid;gap:5px" });
    for (const p of r.parts) box.append(el("div", { style: "display:grid;grid-template-columns:118px minmax(60px,1fr) 30px;gap:8px;align-items:center" },
      el("span", { class: "note", style: "font-size:11.5px", title: p.say, text: p.label }),
      el("span", { class: "bar", style: "height:5px" }, el("i", { style: `width:${p.score}%` + (p.score < 45 ? ";background:var(--dim-light)" : "") })),
      el("span", { class: "mono note", style: "font-size:11.5px;text-align:right", text: String(p.score) })));
    return box;
  }

  // the sources of a topic, only real http(s) addresses
  function sourceLinks(sources) {
    const list = (sources || []).filter((s) => s && safeUrl(s.url) !== "#");
    if (!list.length) return null;
    return el("span", { class: "row", style: "gap:8px" }, ...list.slice(0, 3).map((s) =>
      el("a", { class: "note", style: "font-size:11.5px", href: safeUrl(s.url), target: "_blank", rel: "noopener", text: (s.title || "source") + " ↗" })));
  }

  // what the Write form should open with for this topic: the video the score says it is
  const FORM = { docu: ["story", "documentary"], quick: ["idea", "explainer"], review: ["breakdown", "tactical"] };
  function makeVideo(r) {
    const t = r.topic, [format, style] = FORM[r.format.kind] || FORM.docu;
    const noir = /cheat|scandal|lawsuit|defect|hoax|death|died|murder/i.test(t.title + " " + (t.angle || ""));
    const form = { title: t.title, angle: t.angle || "", sources: t.sources || [], minutes: r.format.minutes, format, visualStyle: noir ? "noir" : style };
    S.prefill = { topic: t.title, ...form };
    S.draftForm = form;
    try { localStorage.setItem("docu.draftForm", JSON.stringify(form)); } catch (e) { /* storage is optional */ }
    S.cur = null; S.view = "write"; render();
    say(`${r.format.label}, ${r.format.minutes} minutes, is set up in the form. Pick your AI, then press Write the script.`);
  }

  // a game goes to New game review with its own PGN and its source, so the PC can analyse it as it is
  function reviewGame(g) {
    S.grPrefill = { pgn: g.pgn || "", source: g.source || "" };
    S.view = "gamereview"; render();
    say(`${personOf(g, "white")} vs ${personOf(g, "black")} is in the review form. Press Analyse on my PC.`);
  }
  const openProject = (p) => { S.cur = p; S.view = "write"; render(); };

  // one title starting point, with the one check YouTube itself applies: 30-70 characters on a phone
  function titleLine(h, loud) {
    let ok = null;
    if (SEO) { try { ok = (SEO.scoreVideo({ title: h.text }, { filipino: false }).checks.find((c) => c.id === "title") || {}).ok; } catch (e) { ok = null; } }
    const len = h.text.length;
    const lenNote = ok == null ? len + " characters" : ok ? len + " characters, a good fit" : len > 70 ? len + " characters, phones cut it after 70" : len + " characters, short for a title";
    return el("div", { style: "display:grid;gap:2px;padding:6px 0;border-top:1px dashed var(--line)" },
      el("div", { style: "display:flex;gap:8px;align-items:baseline;flex-wrap:wrap" },
        el("span", { style: loud ? "font:600 15px/1.35 var(--body);color:var(--fg)" : "font-size:13px;color:var(--fg)", text: h.text }),
        el("button", { class: "btn", type: "button", style: "font-size:11px;padding:2px 8px", text: "Copy", onclick: () => copy(h.text) })),
      el("div", { class: "note", style: "font-size:11px", text: h.pattern + " · " + lenNote }));
  }

  function copy(text) {
    const done = () => say("Copied.");
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, () => say("This browser would not let the page copy it: select the words and copy them."));
    else say("Select the words and copy them.");
  }

  // ---------- the number one, told properly ----------
  function hero(r) {
    const t = r.topic;
    return el("section", { class: "panel", id: "viral-hero", style: "border-color:var(--gold-border);box-shadow:var(--shadow-md)" },
      el("div", { style: "display:grid;grid-template-columns:minmax(92px,112px) minmax(0,1fr);gap:18px;align-items:start" },
        el("div", { style: "display:grid;gap:2px;justify-items:start" },
          el("div", { style: "font:700 46px/1 var(--display);color:var(--gold);font-variant-numeric:tabular-nums", text: String(r.score) }),
          el("div", { class: "note", style: "font-size:11.5px", text: r.grade }),
          el("div", { class: "note", style: "font-size:11px;margin-top:6px", text: "best bet today" })),
        el("div", { style: "display:grid;gap:8px;min-width:0" },
          el("h2", { style: "margin:0;font:700 21px/1.3 var(--display);color:var(--fg-strong)", text: t.title }),
          t.angle ? el("div", { class: "note", style: "max-width:70ch", text: t.angle }) : null,
          el("div", { class: "row", style: "gap:6px" },
            el("span", { class: "pill", style: TONE[r.tone], text: r.format.label }),
            el("span", { class: "pill", text: r.format.minutes + " min" }),
            t.kind === "evergreen" ? el("span", { class: "pill", text: "evergreen" }) : el("span", { class: "pill warn", text: "in the news" })),
          el("div", { class: "note", style: "font-size:12.5px", text: r.format.why }),
          el("div", { style: "margin:6px 0 2px;max-width:430px" }, meter(r)),
          r.hooks.length ? el("div", { style: "display:grid;gap:2px;margin-top:4px;max-width:78ch" }, ...r.hooks.map((h) => titleLine(h, true))) : null,
          el("div", { class: "row", style: "gap:10px;margin-top:6px" },
            el("button", { class: "btn primary", type: "button", id: "viral-make", text: "Make this video", onclick: () => makeVideo(r) }),
            sourceLinks(t.sources)))));
  }

  // ---------- the rest of the list ----------
  function row(r, i) {
    const t = r.topic, made = r.made && S.projects.find((p) => p.id === (r.made.id || ""));
    const why = r.made ? "Already made: " + (r.made.title || r.made.id)
      : r.parts.slice().sort((a, b) => b.weight * b.score - a.weight * a.score).slice(0, 2).map((p) => p.say).join(" · ");
    return el("article", { class: "topic", style: "display:grid;gap:6px" },
      el("div", { class: "row", style: "justify-content:space-between;align-items:flex-start;gap:10px" },
        el("div", { style: "display:grid;gap:3px;min-width:0;flex:1 1 240px" },
          el("div", { class: "row", style: "gap:8px;align-items:baseline;flex-wrap:wrap" },
            el("span", { class: "mono", style: "font-size:12px;color:var(--dim-light);min-width:2ch", text: String(i + 1) }),
            scorePill(r),
            el("span", { style: "font:600 15px/1.3 var(--body);color:var(--fg-strong)", text: t.title })),
          el("div", { class: "note", style: "font-size:12.5px", text: why }),
          el("div", { class: "row", style: "gap:8px;margin-top:2px" },
            el("span", { class: "pill", style: "font-size:11px", text: r.format.label + " · " + r.format.minutes + " min" }),
            t.kind === "evergreen" ? null : el("span", { class: "pill warn", style: "font-size:11px", text: "in the news" }),
            r.made ? el("span", { class: "pill ok", style: "font-size:11px", text: "made" }) : null,
            sourceLinks(t.sources)),
          el("details", { style: "margin-top:2px" },
            el("summary", { class: "note", style: "font-size:11.5px;cursor:pointer", text: "Why " + r.score }),
            el("div", { style: "margin:6px 0 2px;max-width:410px" }, meter(r)),
            ...r.hooks.slice(1).map((h) => titleLine(h, false))),
          t.why ? el("div", { class: "note", style: "font-size:11px", text: t.why }) : null),
        made ? el("button", { class: "btn", type: "button", style: "white-space:nowrap", text: "Open", onclick: () => openProject(made) })
          : r.made ? null
          : el("button", { class: "btn", type: "button", id: "viral-make-" + i, style: "white-space:nowrap", text: "Make this video", onclick: () => makeVideo(r) })));
  }

  // ---------- the games ----------
  // "Martirosyan,Haik M." is how a PGN writes a name; the page writes it the way a person does, and prefers the full
  // name the FIDE list carries when this player is on it (db/trendgames tops)
  function personOf(g, side) {
    const raw = String(side === "white" ? g.white : g.black || ""), sur = raw.split(",")[0].trim().toLowerCase();
    const hit = (g.tops || []).find((t) => String(t.name || "").toLowerCase().split(/\s+/).pop() === sur);
    if (hit) return hit.name;
    const [last, given] = raw.split(",").map((x) => x.trim());
    return given ? `${given} ${last}` : last;
  }
  function gameRow(g, v, i) {
    return el("article", { class: "topic", style: "display:grid;gap:5px" },
      el("div", { class: "row", style: "justify-content:space-between;align-items:flex-start;gap:10px" },
        el("div", { style: "display:grid;gap:3px;min-width:0;flex:1 1 240px" },
          el("div", { class: "row", style: "gap:8px;align-items:baseline;flex-wrap:wrap" },
            scorePill(v),
            el("span", { style: "font:600 15px/1.3 var(--body);color:var(--fg-strong)", text: `${personOf(g, "white")} vs ${personOf(g, "black")}` })),
          el("div", { class: "note", style: "font-size:12.5px", text: [g.result, g.moves ? g.moves + " moves" : "", g.event, g.opening, g.speed].filter(Boolean).join(" · ") }),
          el("div", { class: "note", style: "font-size:12px", text: v.say }),
          v.upset ? el("div", { class: "note", style: "font-size:12px;color:var(--gold)", text: "The upset is the story: tell it from the winner's side." }) : null,
          sourceLinks(g.source ? [{ title: "The game (TWIC)", url: g.source }] : [])),
        el("button", { class: "btn", type: "button", id: "viral-game-" + i, style: "white-space:nowrap", text: "Review this game", onclick: () => reviewGame(g) })));
  }

  // the world list the week's games carry (FIDE top 50, tools/fide-top.mjs): which of these people are playing now
  const topsOf = (games) => {
    const all = (games || []).flatMap((g) => g.tops || []);
    return all.length ? { men: all.filter((t) => t.side !== "women"), women: all.filter((t) => t.side === "women") } : null;
  };

  // ---------- the list ----------
  function paint(body, trends, games, engine) {
    const topics = (trends && trends.topics) || [], gl = (games && games.games) || [];
    const opts = { now: Date.now(), affinities: engine.affinitiesFromVideos((S.health && S.health.videos) || []), top: topsOf(gl), projects: S.projects };
    const filter = S.viralFilter || "all", hideMade = S.viralHideMade !== false;
    let ranked = engine.rankTopics(topics, opts);
    if (filter === "hot") ranked = ranked.filter((r) => r.topic.kind !== "evergreen" && Date.now() - (Date.parse(r.topic.added || "") || 0) < WEEK);
    else if (filter === "ph") ranked = ranked.filter((r) => engine.filipino(r.topic));
    else if (filter === "story") ranked = ranked.filter((r) => r.format.kind === "docu");
    if (hideMade) ranked = ranked.filter((r) => !r.made);

    if (!ranked.length) {
      body.append(el("div", { class: "empty", text: topics.length
        ? "Nothing matches that filter. Pick Everything, or untick Hide what is made."
        : !S.db ? "Sign in with your GitHub key (top of the page) to read the radar's topics and the week's games: both live in the repo."
        : "The radar has not read the chess news yet. It runs every Monday morning; press Refresh the radar to start it now." }));
    } else {
      body.append(hero(ranked[0]));
      if (ranked.length > 1) body.append(el("section", { class: "panel" }, ...ranked.slice(1, 41).map((r, i) => row(r, i + 1))));
    }

    // the games: the same scoring, on the week's FIDE top-50 master games (db/trendgames)
    const scored = gl.map((g) => ({ g, v: engine.gameViral(g, opts) })).sort((a, b) => b.v.score - a.v.score);
    if (scored.length) body.append(el("section", { class: "panel" },
      el("div", { class: "row", style: "justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:8px" },
        el("h3", { style: "margin:0", text: "Games worth reviewing" }),
        el("span", { class: "note", style: "font-size:12px", text: "FIDE top 50 only · The Week in Chess" })),
      el("div", { class: "note", style: "font-size:12px;margin:4px 0 8px" }, "A top player losing is the strongest chess story there is. Your PC analyses the game with Stockfish and writes the review from the moves."),
      ...scored.slice(0, 5).map(({ g, v }, i) => gameRow(g, v, i)),
      scored.length > 5 ? el("details", { style: "margin-top:6px" },
        el("summary", { class: "note", style: "cursor:pointer;font-size:12px", text: (scored.length - 5) + " more games this week" }),
        ...scored.slice(5).map(({ g, v }, i) => gameRow(g, v, i + 5))) : null));
  }

  function howScored() {
    return el("details", { class: "panel", style: "padding:12px 16px" },
      el("summary", { class: "note", style: "cursor:pointer;font-size:13px", text: "How a topic is scored" }),
      el("div", { class: "note", style: "margin-top:8px;max-width:82ch;line-height:1.6" },
        "Five things, weighted: how recent the story is (25), whether people search for it (25), whether the headline is a story rather than a tournament report (25), " +
        "whether it fits this channel — the Filipino angle first (15), and whether its words are the ones our own best videos already use (10). " +
        "It is a ranking aid, not a forecast; no one can promise views. A topic already made drops to the bottom, so it is not suggested twice."),
      el("div", { class: "note", style: "margin-top:6px;font-size:12px" },
        "Sources: the topic radar (tools/trends.mjs: Lichess, Chess.com, ChessBase, FIDE, Wikipedia), the trending games (tools/trend-games.mjs: The Week in Chess, FIDE top 50), " +
        "and the FIDE list those games carry (tools/fide-top.mjs). Titles are checked by the one SEO engine (tools/seo.mjs)."));
  }

  // ---------- the tab ----------
  function view() {
    const box = el("div", { style: "display:grid;gap:14px" });
    const body = el("div", { style: "display:grid;gap:14px" }, el("div", { class: "panel" }, el("div", { class: "note", text: "Ranking the radar's topics…" })));
    const filter = S.viralFilter || "all", hideMade = S.viralHideMade !== false;
    const chip = (k, label) => el("button", {
      class: "btn" + (filter === k ? " primary" : ""), type: "button", "aria-pressed": String(filter === k), text: label,
      onclick: () => { S.viralFilter = k; render(); },
    });

    box.append(el("section", { class: "panel" },
      el("div", { class: "row", style: "justify-content:space-between;align-items:flex-start;gap:12px" },
        el("div", {},
          el("h2", { style: "margin:0 0 4px", text: "What to make next" }),
          el("div", { class: "note", style: "max-width:78ch", text: "Every chess story the trend radar can see, ranked by how hot it is right now and how close it is to what already works on this channel. Each one comes with the video it should become and a title to start from. No AI, no paid API." })),
        el("div", { class: "row", style: "gap:8px" },
          GH() && S.actions && (S.actions.run || S.actions.dispatch) ? el("button", { class: "btn", type: "button", id: "viral-refresh", title: "Read this week's chess feeds again on GitHub (about a minute)", text: "Refresh the radar", onclick: async () => {
            say("Asked GitHub for this week's chess news and games…");
            try { await (S.actions.run || S.actions.dispatch).call(S.actions, "trends.yml", {}); say("The radar is running on GitHub now (about a minute). The list comes back on its own."); }
            catch (e) { say("Could not start it: " + (e.message || e.code)); }
          } }) : null,
          el("button", { class: "btn", type: "button", text: "New game review", onclick: () => { S.view = "gamereview"; render(); } }))),
      el("div", { class: "note", style: "font-size:12px;margin-top:6px" },
        "The radar was read " + ago(S.trends && S.trends.at) + (S.trends && S.trends.at ? " (" + new Date(S.trends.at).toLocaleString() + ")" : "") + ". It runs every Monday morning."),
      el("div", { class: "row", style: "gap:8px;margin-top:10px" },
        chip("all", "Everything"), chip("hot", "Hot this week"), chip("ph", "Filipino angle"), chip("story", "Documentaries"),
        el("label", { class: "note", style: "display:flex;gap:6px;align-items:center;font-size:12.5px;cursor:pointer;white-space:nowrap" },
          el("input", { type: "checkbox", id: "viral-hide-made", checked: hideMade ? true : null, onchange: (e) => { S.viralHideMade = e.target.checked; render(); } }),
          "Hide what is made"))));

    box.append(body, howScored());

    // the channel's own video history makes the last part of the score (db/channel/health.json)
    if (!S.health && S._ensureChannel) S._ensureChannel();
    load().then((engine) => {
      body.textContent = "";
      paint(body, S.trends, S.trendGames, engine);
    }).catch((e) => {
      body.textContent = "";
      body.append(el("div", { class: "empty", text: "The scoring module could not load (" + (failure || e.message) + "). Reload the page." }));
    });
    return box;
  }

  window.ViralBoard = { view };
})();
