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
  const goalOf = (k) => (k === "own" ? ["own", "Your own lines", "Lines you brought in from a PGN: train them like any book."] : GOALS.find((g) => g[0] === k) || [k, k, ""]);
  const sideWord = (s) => (/^w/i.test(s || "") ? "White" : "Black");
  const titleOf = (a, b) => a.goal === "own" ? `${a.name || "Your own lines"}: ${sideWord(a.side)}` :
     `${goalOf(a.goal)[1]}: ${sideWord(a.side)}, ${(b && b.opening) || nameOf(a.start) ? ((b && b.opening) || nameOf(a.start)) + " (" + ((b && b.startText) || (a.start || []).join(" ")) + ")" : (b && b.startText) || (a.start || []).join(" ") ? "after " + ((b && b.startText) || (a.start || []).join(" ")) : "from move one"}${a.depth ? ", " + a.depth + " moves deep" : ""}`;
  // ---- the opening menu: every named opening the PC's games reach (assets/chess/repertoire/openings-list.json,
  // published next to the page as repertoire-openings.json): [eco, name, moves, games, side who chose it]
  let OPEN = null, openLoading = null;
  const loadOpenings = () => openLoading || (openLoading = fetch("repertoire-openings.json").then((r) => (r.ok ? r.json() : Promise.reject(new Error("the opening list answered " + r.status))))
    .then((j) => { OPEN = (j.openings || []).map(([eco, name, moves, games, side]) => ({ eco, name, moves: moves.split(" "), games, side })); if (S.view === "repertoire") render(); })
    .catch((e) => { OPEN = []; say("Could not load the opening list: " + e.message); }));
  // the popular openings, one click each (Mark, 24 Nov 2026: "there should be a selection of popular openings")
  const POPULAR = [
    ["As White", ["King's Pawn Game", "Queen's Pawn Game", "English Opening", "Zukertort Opening", "Ruy Lopez", "Italian Game", "Scotch Game", "Queen's Gambit", "Catalan Opening", "London System", "Vienna Game", "King's Gambit"]],
    ["Black against 1.e4", ["Sicilian Defense", "Sicilian Defense: Najdorf Variation", "French Defense", "Caro-Kann Defense", "Pirc Defense", "Modern Defense", "Petrov's Defense", "Philidor Defense", "Scandinavian Defense", "Alekhine Defense", "Four Knights Game"]],
    ["Black against 1.d4", ["King's Indian Defense", "Nimzo-Indian Defense", "Queen's Indian Defense", "Grünfeld Defense", "Slav Defense", "Semi-Slav Defense", "Queen's Gambit Declined", "Queen's Gambit Accepted", "Benoni Defense", "Dutch Defense", "Bogo-Indian Defense"]],
  ];
  const popular = () => {
    if (!OPEN) return [];
    const byName = new Map(OPEN.map((o) => [o.name, o]));
    const groups = POPULAR.map(([g, names]) => [g, names.map((n) => byName.get(n)).filter(Boolean)]);
    // against 1.c4 and 1.Nf3: the most played named answers, whatever they are called
    groups.push(["Black against 1.c4 and 1.Nf3", OPEN.filter((o) => o.side === "b" && ["c4", "Nf3"].includes(o.moves[0]) && o.moves.length <= 4).sort((a, b) => b.games - a.games).slice(0, 8)]);
    return groups.filter(([, list]) => list.length);
  };
  const shortName = (n) => n.replace(/ (Defen[cs]e|Opening|Game)(?=$|:|,)/, "").replace(": ", ", ").replace(" Variation", "");
  const nameOf = (start) => { if (!OPEN || !(start || []).length) return ""; const k = start.join(" "), o = OPEN.find((x) => x.moves.join(" ") === k); return o ? o.name : ""; };
  const label = (o) => `${o.eco} ${o.name} (${o.moves.length ? o.moves.reduce((t, m, i) => t + (i % 2 ? " " : (i ? " " : "") + (i / 2 + 1) + ".") + m, "") : ""})`;
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
  async function ask(side, start, goal, depth) {
    if (!S.db) return say("Sign in to GitHub first (Tools).");
    const bad = start.find((m) => !SAN.test(m));
    if (bad) return say(`"${bad}" does not look like a chess move. Write the moves like this: e4 c5 Nf3`);
    if (start.length > 24) return say("Give at most twelve moves each as the start.");
    depth = +depth || 15;
    if (start.length >= 2 * depth) return say(`Those moves already reach move ${Math.ceil(start.length / 2)}: choose a deeper book.`);
    const id = bookId(side, start, goal), doc = { id, side, start, goal, depth, ask: new Date().toISOString() };
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
      for (const extra of ["repertoiretrees/", "repertoireprogress/"]) { try { await S.db.doc(extra + a.id).delete(); } catch (e) { /* none was saved */ } }
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
  // put a book on the board (studio/repertoire-train.js, loaded the first time): Explore its replies or Train its lines
  function openBoard(a, title, mode) {
    S.repTrain = { id: a.id, mode };
    loadOnce("repertoire-train.js").then(() => { const p = window.RepertoireTrain.open(a, title, mode); render(); window.scrollTo(0, 0); return p; }, (e) => say("Could not load the board: " + e.message));
  }
  // how complete the book is, from the tree the PC built (an older book has none: Build again makes it)
  function coverText(b) {
    const t = b.tree;
    if (!t || !t.ours) return "This book was built before the board existed. Press Build again to get every reply answered, and to train it.";
    return `Every reply played in at least 1 game in 200 has an answer: ${num(t.replies)} replies of the opponent (${num(t.rare)} of them rare), ${num(t.ours)} moves of yours`
      + (t.engine ? `, ${num(t.engine)} of those chosen by the engine because nobody answered that reply in the games` : "")
      + `. At each step that covers ${pct(b.cover)} of what the opponent plays` + (t.unanswered ? `; ${num(t.unanswered)} rare replies still have no answer.` : ".");
  }
  // bring in your own lines from a PGN (a Lichess study, a course chapter, a ChessBase file): parsed here, saved as a
  // request, a book and a tree at once (no PC needed), then trained like any book
  async function importPgn(f) {
    if (!S.db) return say("Sign in to GitHub first (Tools).");
    const name = String(f.impName || "").trim() || "My lines";
    try { if (!window.Chess) await loadOnce("chess.js"); await loadOnce("repertoire-train.js"); } catch (e) { return say("Could not load the board: " + e.message); }
    const side = f.side === "white" ? "w" : "b", r = window.RepertoireTrain.pgnToTree(f.impPgn || "", side);
    if (r.error) return say(r.error);
    const id = "own-" + name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) + "-" + (side === "w" ? "white" : "black"), at = new Date().toISOString();
    let ours = 0, replies = 0; (function c(l) { for (const e of l) { if (e.o) ours++; else replies++; c(e.k); } })(r.tree);
    try {
      await S.db.doc("repertoiretrees/" + id).set({ id, forAsk: at, side, start: [], tree: r.tree });
      await S.db.doc("repertoirebooks/" + id).set({ id, forAsk: at, status: "done", imported: true, builtAt: at, side, start: [], goal: "own", lines: r.lines, tree: { ours, replies } });
      const doc = { id, side: f.side, start: [], goal: "own", name, ask: at };
      await S.db.doc("repertoires/" + id).set(doc);
      S.repAsks = [...(S.repAsks || []).filter((x) => x.id !== id), doc];
      S.repBooks = Object.assign({}, S.repBooks, { [id]: { id, forAsk: at, status: "done", imported: true, builtAt: at, side, start: [], goal: "own", lines: r.lines, tree: { ours, replies } } });
      f.impPgn = ""; f.impName = "";
      say(`Added "${name}": ${r.lines} lines, ${ours} moves of yours to learn${r.bad ? ` (${r.bad} lines had a move that is not legal and stop there)` : ""}. Press Train on it.`);
    } catch (e) { say("Could not save: " + (e.message || e.code)); }
    render();
  }
  // the book in one line: this repertoire against the average game
  function headline(a, b) {
    const me = sideWord(b.side || a.side), e = b.expected || {}, av = b.base || {};
    return `${me} scores ${pct(e.score)} (the average game: ${pct(av.score)}), loses ${pct(e.loss)} (${pct(av.loss)}), reaches an endgame with both bishops ${pct(e.pair)} (${pct(av.pair)}).`;
  }
  function card(a) {
    const b = (S.repBooks || {})[a.id], st = state(a, b), [label, tone] = LABEL[st];
    const old = st === "waiting" && b && b.status === "done"; // asked again: the earlier book stays readable meanwhile
    const ready = b && b.status === "done", onBoard = (mode) => () => openBoard(a, titleOf(a, b), mode);
    const btns = el("div", { class: "row", style: "gap:6px; flex-wrap:wrap; margin-top:8px;" },
      ready ? el("button", { class: "btn primary", type: "button", text: "Train", title: "The opponent's moves are played for you; you find yours", onclick: onBoard("train") }) : null,
      ready ? el("button", { class: "btn", type: "button", text: "Check my games", title: "Your Chess.com or Lichess games in this opening: where you and your opponents left the book", onclick: onBoard("games") }) : null,
      ready ? el("button", { class: "btn", type: "button", text: "Explore the moves", title: "Click any reply of the opponent and see the book's answer", onclick: onBoard("explore") }) : null,
      st !== "waiting" && a.goal !== "own" ? el("button", { class: "btn", type: "button", text: "Build again", title: "Build it again from the games on your PC (free)", onclick: () => ask(a.side, a.start || [], a.goal, a.depth) }) : null,
      el("button", { class: "btn", type: "button", text: "Remove", onclick: () => remove(a) }));
    return el("article", { class: "topic" },
      el("div", { class: "row", style: "justify-content:space-between; align-items:flex-start; gap:8px; flex-wrap:wrap;" },
        el("h3", { text: titleOf(a, b) }), el("span", { class: "pill" + (tone ? " " + tone : ""), text: label })),
      el("div", { class: "note", text: goalOf(a.goal)[2] }),
      st === "waiting" ? el("div", { class: "note", text: `Asked ${when(a.ask)}. Your PC builds it the next time its ten-minute job runs (free, a few minutes). The PC must be on.` }) : null,
      st === "failed" ? el("div", { class: "note", text: "Your PC could not build it: " + (b.why || "no reason given") }) : null,
      b && b.imported ? el("div", { class: "note", style: "color:inherit;", text: `Brought in from a PGN: ${num(b.lines)} lines, ${num(b.tree.ours)} moves of yours to learn, ${num(b.tree.replies)} replies of the opponent.` }) : null,
      (st === "done" || old) && !b.imported ? el("div", { class: "note", style: "color:inherit;", text: headline(a, b) }) : null,
      (st === "done" || old) && !b.imported ? el("div", { class: "note", text: coverText(b) }) : null,
      // one book open at a time, and it stays open when the page redraws itself
      (st === "done" || old) && !b.imported ? el("details", { open: S.repOpen === a.id, style: "margin-top:6px;", ontoggle: (ev) => { if (ev.target.open) S.repOpen = a.id; else if (S.repOpen === a.id) S.repOpen = null; } },
        el("summary", { text: "Open the book: the numbers, the rules of thumb, the lines" }), bookBody(a, b)) : null,
      btns);
  }
  function view() {
    watch();
    const f = S.rep || (S.rep = { side: "black", start: "", goal: "solid", depth: 15, find: "" });
    if (!OPEN) loadOpenings();
    const pick = (key, value) => () => { f[key] = value; render(); };
    const asks = (S.repAsks || []).slice(), books = S.repBooks || {};
    const rank = (a) => (state(a, books[a.id]) === "waiting" ? "9" + a.ask : "0" + ((books[a.id] || {}).builtAt || (books[a.id] || {}).at || ""));
    asks.sort((x, y) => rank(y).localeCompare(rank(x)));
    const input = el("input", { type: "text", value: f.start, placeholder: "for example: e4   or   d4 Nf6", style: "flex:1 1 220px; min-width:0; max-width:100%; box-sizing:border-box;", "aria-label": "First moves", oninput: (ev) => { f.start = ev.target.value; f.opening = ""; } });
    // the opening search: type part of a name or an ECO code, pick from the list; picking fills the moves and the side
    const listId = "rep-openings";
    const choose = (text) => {
      const o = (OPEN || []).find((x) => label(x) === text);
      if (!o) return;
      f.start = o.moves.join(" "); f.opening = o.name; f.find = ""; f.side = o.side === "w" ? "white" : "black"; render();
    };
    const search = el("input", { type: "search", value: f.find || "", list: listId, placeholder: OPEN ? `search ${OPEN.length} openings: Caro-Kann, Najdorf, B12, King's Indian…` : "loading the openings…", style: "flex:1 1 220px; min-width:0; max-width:100%; box-sizing:border-box;", "aria-label": "Opening",
      oninput: (ev) => { f.find = ev.target.value; if ((OPEN || []).some((x) => label(x) === ev.target.value)) choose(ev.target.value); } });
    const q = String(f.find || "").toLowerCase().trim();
    const matches = (OPEN || []).filter((o) => !q || (o.eco + " " + o.name).toLowerCase().includes(q)).sort((a, b) => b.games - a.games); // all of them: the browser narrows the list as you type
    const picks = popular().map(([g, list]) => el("div", { class: "row", style: "gap:6px; flex-wrap:wrap; align-items:center; margin:4px 0;" },
      el("span", { class: "note", style: "min-width:150px;", text: g + ":" }),
      ...list.map((o) => el("button", { class: "btn" + (f.opening === o.name ? " primary" : ""), type: "button", title: `${o.eco} ${o.name}: ${o.moves.join(" ")} (${Number(o.games).toLocaleString("en-US")} games)`, text: shortName(o.name),
        onclick: () => { f.start = o.moves.join(" "); f.opening = o.name; f.find = ""; f.side = o.side === "w" ? "white" : "black"; render(); } }))));
    const datalist = el("datalist", { id: listId }, ...matches.map((o) => el("option", { value: label(o), label: `${Number(o.games).toLocaleString("en-US")} games` })));
    const boardPanel = S.repTrain && window.RepertoireTrain ? window.RepertoireTrain.view() : null;
    return el("div", {},
      boardPanel,
      el("section", { class: "panel" },
        el("h2", { text: "Repertoire builder" }),
        el("div", { class: "note", text: "Choose what you want from the opening. Your PC picks every move from the master games it has read, working backwards from how those games ended, and Stockfish throws out any move it calls plainly worse. Free: no AI, no credits. It takes about 10 minutes and the PC must be on." }),
        S.db ? null : el("div", { class: "empty", text: "Sign in to GitHub (Tools) to build a repertoire." }),
        el("div", { class: "row", style: "gap:6px; flex-wrap:wrap; align-items:center; margin:12px 0 6px;" }, el("span", { class: "note", text: "You play:" }),
          el("button", { class: "btn" + (f.side === "white" ? " primary" : ""), type: "button", text: "White", onclick: pick("side", "white") }),
          el("button", { class: "btn" + (f.side === "black" ? " primary" : ""), type: "button", text: "Black", onclick: pick("side", "black") })),
        picks.length ? el("div", { style: "margin:10px 0 4px;" }, el("div", { class: "note", style: "color:inherit; font-weight:600; margin-bottom:4px;", text: "Popular openings" }), ...picks) : null,
        el("div", { class: "row", style: "gap:6px; flex-wrap:wrap; align-items:center; margin:6px 0;" }, el("span", { class: "note", text: "Or search all of them:" }), search, datalist),
        f.opening ? el("div", { class: "note", style: "color:inherit; font-weight:600;", text: `${f.opening}: ${f.start}. You play ${f.side === "white" ? "White" : "Black"} (change it above if you want the other side of it).` }) : null,
        el("div", { class: "row", style: "gap:6px; flex-wrap:wrap; align-items:center; margin:6px 0;" }, el("span", { class: "note", text: "Or type the first moves (empty = from move one):" }), input),
        el("div", { class: "row", style: "gap:6px; flex-wrap:wrap; align-items:center; margin:6px 0;" }, el("span", { class: "note", text: "How deep:" }),
          ...[10, 12, 15, 18, 20].map((d) => el("button", { class: "btn" + (+f.depth === d ? " primary" : ""), type: "button", text: d + " moves", onclick: pick("depth", d) })),
          el("span", { class: "note", text: "Each line stops earlier where the master games run out." })),
        el("div", { class: "row", style: "gap:6px; flex-wrap:wrap; align-items:center; margin:6px 0;" }, el("span", { class: "note", text: "Your goal:" }),
          ...GOALS.map(([k, name]) => el("button", { class: "btn" + (f.goal === k ? " primary" : ""), type: "button", text: name, onclick: pick("goal", k) }))),
        el("div", { class: "note", text: goalOf(f.goal)[2] }),
        el("div", { class: "row", style: "margin-top:10px;" },
          el("button", { class: "btn primary", type: "button", text: "Build on my PC (free)", onclick: () => ask(f.side, startMoves(f.start), f.goal, f.depth) }))),
      el("section", { class: "panel" },
        el("h2", { text: "Your repertoires" }),
        el("details", { style: "margin:6px 0 10px;" }, el("summary", { text: "Bring in your own lines (PGN): a Lichess study, a course chapter, any file" }),
          el("div", { class: "note", style: "margin:6px 0;", text: "Paste the PGN with all its side lines. You play the side chosen above (" + (f.side === "white" ? "White" : "Black") + "). Every side line becomes a line to train." }),
          el("input", { type: "text", value: f.impName || "", placeholder: "a name, for example: Caro-Kann course, chapter 3", style: "flex:1 1 220px; min-width:0; max-width:100%; box-sizing:border-box; width:100%; margin-bottom:6px;", "aria-label": "Name", oninput: (ev) => { f.impName = ev.target.value; } }),
          el("textarea", { rows: "6", style: "width:100%; box-sizing:border-box; font-family:var(--mono, monospace); font-size:12.5px;", placeholder: "1. e4 c6 2. d4 d5 3. e5 (3. Nc3 dxe4 4. Nxe4 Bf5) 3... Bf5 *", "aria-label": "PGN", oninput: (ev) => { f.impPgn = ev.target.value; } }, f.impPgn || ""),
          el("button", { class: "btn primary", type: "button", style: "margin-top:6px;", text: "Add to my repertoires", onclick: () => importPgn(f) })),
        S.repAsks ? (asks.length ? el("div", {}, ...asks.map(card)) : el("div", { class: "empty", text: "None yet. Build your first one above." }))
          : el("div", { class: "note", text: S.db ? "Loading…" : "Sign in to GitHub (Tools) to see them." })));
  }
  window.RepertoireTab = { view, state, bookId, startMoves, ruleText, titleOf, coverText, GOALS };
})();
