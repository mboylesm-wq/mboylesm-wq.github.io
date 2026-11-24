// PnoyChess Studio · Repertoire tab (Mark, 24 Nov 2026: "Add a page tab"): an opening repertoire chosen by what Mark
// wants from the game (hard to beat, both bishops in the endgame, wild ...), with the rules of thumb of its openings.
// The page only ASKS: db/repertoires/<id>.json holds { side, start, goal, ask: time }. His PC answers within about ten
// minutes in db/repertoirebooks/<id>.json (tools/pc-jobs.mjs -> tools/repertoire-goal.mjs answerRequests), from the
// master games already read on the PC: free, no AI. Two folders, so the page and the PC never write the same file.
// Loaded the first time the tab opens (index.html is at its size ceiling). Uses the page's el(), say(), S and render().
(function () {
  "use strict";
  const GOALS = [
    ["solid", "Hard to beat", "Lose as rarely as possible."],
    ["win", "Score the most", "The best result on average (a win is 1, a draw is a half)."],
    ["bishops", "Keep both bishops", "Reach the endgame with both of your bishops still on the board."],
    ["endgame", "Early endgame", "Get the queens off by move 20."],
    ["wild", "Wild", "Win outright as often as possible; a draw counts for nothing."],
    ["simple", "Easy to learn", "The fewest lines to learn that still score well."],
  ];
  const LABEL = { waiting: ["Waiting for your PC", ""], failed: ["Could not build", "bad"], done: ["Ready", "ok"] };
  const SAN = /^(O-O(-O)?|[KQRBN]?[a-h]?[1-8]?x?[a-h][1-8](=[QRBN])?)[+#]?$/;
  // "1. e4 c5" or "e4, c5" -> ["e4", "c5"]
  const startMoves = (text) => String(text || "").split(/[\s,]+/).map((m) => m.replace(/^\d+\.+/, "")).filter(Boolean);
  // one name per side + start + goal, safe as a file name; the PC answers under the same name
  const bookId = (side, start, goal) => `${side === "white" ? "white" : "black"}-${start.length ? start.join("-").replace(/[^A-Za-z0-9-]/g, "") : "move-one"}-${goal}`;
  // where a book stands: asked and not answered for that asking, answered with a failure, or ready
  function state(ask, book) {
    if (!book || book.forAsk !== ask.ask) return "waiting";
    return book.status === "failed" ? "failed" : "done";
  }
  const pct = (x) => Math.round(100 * (x || 0)) + "%";
  const num = (n) => Number(n || 0).toLocaleString("en-US");
  const when = (iso) => { try { return new Date(iso).toLocaleString("en-PH", { timeZone: "Asia/Manila", weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }); } catch (e) { return ""; } };
  const goalOf = (k) => GOALS.find((g) => g[0] === k) || [k, k, ""];
  const sideWord = (s) => (/^w/i.test(s || "") ? "White" : "Black");
  const titleOf = (a, b) => `${goalOf(a.goal)[1]}: ${sideWord(a.side)}, ${(b && b.startText) || (a.start || []).join(" ") ? "after " + ((b && b.startText) || (a.start || []).join(" ")) : "from move one"}`;
  // one rule of thumb as a sentence with both numbers (the same words as tools/repertoire-goal.mjs ruleLine)
  const ruleText = (r) => r.theirs
    ? `${r.good ? "Good news" : "Watch out"}: ${r.text.charAt(0).toLowerCase() + r.text.slice(1)}, you score ${pct(r.withScore)} (${num(r.withN)} games); otherwise ${pct(r.withoutScore)} (${num(r.withoutN)}).`
    : `${r.text}: ${pct(r.good ? r.withScore : r.withoutScore)} when you follow it (${num(r.good ? r.withN : r.withoutN)} games), ${pct(r.good ? r.withoutScore : r.withScore)} when you do not (${num(r.good ? r.withoutN : r.withN)}).`;

  let watching = false;
  function watch() {
    if (watching || !S.db) return;
    watching = true;
    const redraw = () => { if (S.view === "repertoire") render(); };
    S.db.collection("repertoires").onSnapshot((snap) => { S.repAsks = snap.docs.map((d) => ({ id: d.id, ...d.data() })); redraw(); }, () => { S.repAsks = S.repAsks || []; redraw(); });
    S.db.collection("repertoirebooks").onSnapshot((snap) => { S.repBooks = Object.fromEntries(snap.docs.map((d) => [d.id, d.data()])); redraw(); }, () => { S.repBooks = S.repBooks || {}; redraw(); });
  }
  async function ask(side, start, goal) {
    if (!S.db) return say("Sign in to GitHub first (Tools).");
    const bad = start.find((m) => !SAN.test(m));
    if (bad) return say(`"${bad}" does not look like a chess move. Write the moves like this: e4 c5 Nf3`);
    if (start.length > 8) return say("Give at most four moves each as the start.");
    const id = bookId(side, start, goal), doc = { id, side, start, goal, ask: new Date().toISOString() };
    try {
      await S.db.doc("repertoires/" + id).set(doc);
      S.repAsks = [...(S.repAsks || []).filter((a) => a.id !== id), doc];
      say("Asked. Your PC builds it within about 10 minutes (free). The PC must be on.");
    } catch (e) { say("Could not save: " + (e.message || e.code)); }
    render();
  }
  async function remove(a) {
    if (!S.db) return say("Sign in to GitHub first (Tools).");
    if (!confirm(`Remove "${titleOf(a, (S.repBooks || {})[a.id])}"? You can build it again any time.`)) return;
    try {
      await S.db.doc("repertoires/" + a.id).delete();
      if ((S.repBooks || {})[a.id]) await S.db.doc("repertoirebooks/" + a.id).delete();
      S.repAsks = (S.repAsks || []).filter((x) => x.id !== a.id);
      say("Removed.");
    } catch (e) { say("Could not remove: " + (e.message || e.code)); }
    render();
  }

  const cell = (text, style) => el("td", style ? { style, text } : { text });
  const table = (head, rows) => el("div", { style: "overflow:auto;" }, el("table", { class: "pubtable" },
    el("thead", {}, el("tr", {}, ...head.map((h) => el("th", { text: h })))), el("tbody", {}, ...rows)));
  function bookBody(a, b) {
    const me = sideWord(b.side || a.side), e = b.expected || {}, av = b.base || {};
    const row = (name, k) => el("tr", {}, cell(name), cell(pct(e[k]), "font-weight:600;"), cell(pct(av[k])));
    const lists = b.checklists || [];
    return el("div", {},
      el("div", { class: "note", text: `Built ${when(b.builtAt)} from ${num(b.games)} master games; ${num(av.n)} of them start this way. ${num(e.lines)} lines, ${num(e.learn)} moves of your own to learn.` }),
      table(["", "This repertoire", "The average game"], [
        row(me + " scores", "score"), row(me + " wins", "win"), row(me + " loses", "loss"),
        row("An endgame with both your bishops", "pair"), row("Queens off by move 20", "qOff")]),
      el("h4", { style: "margin:14px 0 4px;", text: "Rules of thumb, from the results" }),
      lists.length ? el("div", {}, ...lists.map((c) => el("div", { style: "margin:8px 0;" },
        el("div", { style: "font-weight:600;", text: `${c.text}${c.name ? " (" + c.name + ")" : ""}: ${num(c.games)} games` }),
        el("ul", { style: "margin:4px 0 0 18px; padding:0;" }, ...c.rules.map((r) => el("li", { text: ruleText(r) }))))))
        : el("div", { class: "note", text: "No simple habit stands out clearly enough in these lines." }),
      el("div", { class: "note", text: "These show what went together with good results in the first 20 moves. They do not prove the cause, so a rule never beats what the board in front of you says." }),
      el("details", { style: "margin-top:10px;" }, el("summary", { text: `The lines, most common first (${num((b.lines || []).length)}${b.more ? " of " + num(e.lines) : ""})` }),
        table(["You will meet it", "Line", "Opening", "Score", "Lose", "Both bishops"],
          (b.lines || []).map((l) => el("tr", {}, cell(pct(l.reach)), cell(l.text, "font-family:var(--mono, monospace); font-size:12.5px;"), cell(l.name || "-"), cell(pct(l.score)), cell(pct(l.loss)), cell(pct(l.pair))))),
        b.more ? el("div", { class: "note", text: `${num(b.more)} rarer lines (each met in fewer than 1 game in 100) are left out here.` }) : null),
      el("details", { style: "margin-top:6px;" }, el("summary", { text: "Why these moves" }),
        el("ul", { style: "margin:6px 0 0 18px; padding:0;" }, ...(b.why || []).map((d) => el("li", {},
          el("b", { text: d.text }), ` — ${num(d.games)} games.`,
          d.engine ? ` Engine after it: ${d.engine.pawns >= 0 ? "+" : ""}${Number(d.engine.pawns).toFixed(2)} for ${me} (${d.engine.by}).` : "",
          d.others && d.others.length ? ` Not chosen: ${d.others.map((o) => `${o.san} (${o.out})`).join("; ")}.` : ""))),
        (b.refused || []).length ? el("div", { class: "note", text: "Thrown out by the engine: " + b.refused.map((r) => `${r.text} (${Number(r.pawns).toFixed(2)})`).join("; ") + "." }) : null),
      el("details", { style: "margin-top:6px;" }, el("summary", { text: "Read this before trusting a number" }),
        el("ul", { style: "margin:6px 0 0 18px; padding:0;" },
          el("li", { text: `The numbers come from real games${(b.sources || []).length ? " (" + b.sources.join("; ") + ")" : ""}. Commented games are picked because they are interesting, so decisive games are over-counted.` }),
          el("li", { text: "A line with few games is pulled toward the average game, so it cannot win on a lucky handful." }),
          el("li", { text: "\"An endgame\" means both queens are off, or 6 or fewer pieces are left besides kings and pawns." }),
          el("li", { text: b.engineChecked ? "Every chosen move was checked by an engine; a move it called plainly worse was thrown out and the choice made again." : "No engine check was run on this one." }),
          el("li", { text: "No opening is solved: the perfect endgame tables stop at 7 pieces. This is the best road by what really happened, not a proof." }))));
  }
  // the book in one line: this repertoire against the average game
  function headline(a, b) {
    const me = sideWord(b.side || a.side), e = b.expected || {}, av = b.base || {};
    return `${me} scores ${pct(e.score)} (the average game: ${pct(av.score)}), loses ${pct(e.loss)} (${pct(av.loss)}), reaches an endgame with both bishops ${pct(e.pair)} (${pct(av.pair)}).`;
  }
  function card(a) {
    const b = (S.repBooks || {})[a.id], st = state(a, b), [label, tone] = LABEL[st];
    const old = st === "waiting" && b && b.status === "done"; // asked again: the earlier book stays readable meanwhile
    const btns = el("div", { class: "row", style: "gap:6px; flex-wrap:wrap; margin-top:8px;" },
      st !== "waiting" ? el("button", { class: "btn", type: "button", text: "Build again", title: "Build it again from the games on your PC (free)", onclick: () => ask(a.side, a.start || [], a.goal) }) : null,
      el("button", { class: "btn", type: "button", text: "Remove", onclick: () => remove(a) }));
    return el("article", { class: "topic" },
      el("div", { class: "row", style: "justify-content:space-between; align-items:flex-start; gap:8px; flex-wrap:wrap;" },
        el("h3", { text: titleOf(a, b) }), el("span", { class: "pill" + (tone ? " " + tone : ""), text: label })),
      el("div", { class: "note", text: goalOf(a.goal)[2] }),
      st === "waiting" ? el("div", { class: "note", text: `Asked ${when(a.ask)}. Your PC builds it the next time its ten-minute job runs (free, a few minutes). The PC must be on.` }) : null,
      st === "failed" ? el("div", { class: "note", text: "Your PC could not build it: " + (b.why || "no reason given") }) : null,
      st === "done" || old ? el("div", { class: "note", style: "color:inherit;", text: headline(a, b) }) : null,
      // one book open at a time, and it stays open when the page redraws itself
      st === "done" || old ? el("details", { open: S.repOpen === a.id, style: "margin-top:6px;", ontoggle: (ev) => { if (ev.target.open) S.repOpen = a.id; else if (S.repOpen === a.id) S.repOpen = null; } },
        el("summary", { text: "Open the book: the numbers, the rules of thumb, the lines" }), bookBody(a, b)) : null,
      btns);
  }
  function view() {
    watch();
    const f = S.rep || (S.rep = { side: "black", start: "", goal: "solid" });
    const pick = (key, value) => () => { f[key] = value; render(); };
    const asks = (S.repAsks || []).slice(), books = S.repBooks || {};
    const rank = (a) => (state(a, books[a.id]) === "waiting" ? "9" + a.ask : "0" + ((books[a.id] || {}).builtAt || (books[a.id] || {}).at || ""));
    asks.sort((x, y) => rank(y).localeCompare(rank(x)));
    const input = el("input", { type: "text", value: f.start, placeholder: "for example: e4   or   d4 Nf6", style: "min-width:260px; flex:1;", "aria-label": "First moves", oninput: (ev) => { f.start = ev.target.value; } });
    return el("div", {},
      el("section", { class: "panel" },
        el("h2", { text: "Repertoire builder" }),
        el("div", { class: "note", text: "Choose what you want from the opening. Your PC picks every move from the master games it has read, working backwards from how those games ended, and Stockfish throws out any move it calls plainly worse. Free: no AI, no credits. It takes about 10 minutes and the PC must be on." }),
        S.db ? null : el("div", { class: "empty", text: "Sign in to GitHub (Tools) to build a repertoire." }),
        el("div", { class: "row", style: "gap:6px; flex-wrap:wrap; align-items:center; margin:12px 0 6px;" }, el("span", { class: "note", text: "You play:" }),
          el("button", { class: "btn" + (f.side === "white" ? " primary" : ""), type: "button", text: "White", onclick: pick("side", "white") }),
          el("button", { class: "btn" + (f.side === "black" ? " primary" : ""), type: "button", text: "Black", onclick: pick("side", "black") })),
        el("div", { class: "row", style: "gap:6px; flex-wrap:wrap; align-items:center; margin:6px 0;" }, el("span", { class: "note", text: "After these first moves (leave empty to start from move one):" }), input),
        el("div", { class: "row", style: "gap:6px; flex-wrap:wrap; align-items:center; margin:6px 0;" }, el("span", { class: "note", text: "Your goal:" }),
          ...GOALS.map(([k, name]) => el("button", { class: "btn" + (f.goal === k ? " primary" : ""), type: "button", text: name, onclick: pick("goal", k) }))),
        el("div", { class: "note", text: goalOf(f.goal)[2] }),
        el("div", { class: "row", style: "margin-top:10px;" },
          el("button", { class: "btn primary", type: "button", text: "Build on my PC (free)", onclick: () => ask(f.side, startMoves(f.start), f.goal) }))),
      el("section", { class: "panel" },
        el("h2", { text: "Your repertoires" }),
        S.repAsks ? (asks.length ? el("div", {}, ...asks.map(card)) : el("div", { class: "empty", text: "None yet. Build your first one above." }))
          : el("div", { class: "note", text: S.db ? "Loading…" : "Sign in to GitHub (Tools) to see them." })));
  }
  window.RepertoireTab = { view, state, bookId, startMoves, ruleText, titleOf, GOALS };
})();
