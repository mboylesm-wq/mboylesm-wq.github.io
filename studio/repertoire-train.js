// PnoyChess Studio · Repertoire tab, the board (Mark, 24 Nov 2026: "similar to listudy where I can train the lines ...
// what to play if those were the moves of the opponent"). Two ways to use a book's move tree
// (db/repertoiretrees/<id>.json, written by the PC: every reply that was played, each with its answer):
//   Explore: click the opponent's move (in the list or on the board) and the book answers it.
//   Train:   the opponent's moves are played for you and you must find yours. A new move is shown once; after that it
//            comes back tomorrow, then after 3, 7, 16, 35 and 80 days (sooner when you miss it). Progress is kept in
//            this browser and, with Save, in db/repertoireprogress/<id>.json so the phone and the PC share it.
// Loaded when Explore or Train is first pressed. Uses the page's el(), say(), S, loadOnce() and the page's chess.js.
(function () {
  "use strict";
  // ---------- the pure part (tests/repertoire-goal.test.mjs runs it) ----------
  const DAYS = [0, 1, 3, 7, 16, 35, 80]; // a move's box -> days until it is asked again
  const today = (now) => Math.floor((now || Date.now()) / 864e5);
  // every line of a tree, the most common first: { path: [entries], weight, keys: [the name of each of OUR moves] }
  function linesOf(tree) {
    const out = [];
    (function go(list, path, w) {
      if (!list.length) { if (path.some((e) => e.o)) out.push({ path, weight: w }); return; }
      for (const e of list) go(e.k || [], [...path, e], e.o ? w : w * (e.p || 0.001));
    })(tree || [], [], 1);
    for (const l of out) {
      l.keys = l.path.map((e, i) => (e.o ? l.path.slice(0, i + 1).map((x) => x.m).join(" ") : null));
      // how often each move of the line is met: the product of the opponent's choices that lead to it
      let w = 1; l.at = l.path.map((e) => (w = e.o ? w : w * (e.p || 0.001)));
    }
    return out.sort((a, b) => b.weight - a.weight);
  }
  // how often you meet the first move of a line that is new or due (0 = nothing to train in it)
  const dueReach = (l, store, day) => { const i = l.keys.findIndex((k) => k && isDue(store[k], day)); return i < 0 ? 0 : l.at[i]; };
  const isDue = (card, day) => !card || card[1] <= day;
  // what happened to a move just asked: "right" (found at once), "shown" (new, or it had to be shown), "wrong"
  function grade(card, result, day) {
    const box = result === "right" ? Math.min(DAYS.length - 1, (card ? card[0] : 0) + 1) : result === "shown" ? Math.max(1, card ? Math.min(card[0], 1) : 1) : 0;
    return [box, day + DAYS[box]];
  }
  // the next line to train: one whose first new or due move is met often. With a random source it is picked at random,
  // weighted by how often that move is met (so the common moves come first and most, but the order changes); without
  // one, the line whose new or due move is met most. null = nothing is due.
  function nextLine(lines, store, day, rnd) {
    const due = lines.map((l) => ({ l, w: dueReach(l, store, day) })).filter((x) => x.w > 0);
    if (!due.length) return null;
    if (!rnd) return due.reduce((a, b) => (b.w > a.w ? b : a)).l;
    const total = due.reduce((t, x) => t + x.w, 0); let x = rnd() * total;
    for (const d of due) { x -= d.w; if (x <= 0) return d.l; }
    return due[due.length - 1].l;
  }
  // how far a line can be played for you: the moves before the first of ours that is new, due or not yet well known
  // (box 3: found at once three times). Listudy calls this skipping the key moves.
  function knownPrefix(line, store, day) {
    let i = 0;
    for (; i < line.path.length; i++) { const k = line.keys[i]; if (k && (isDue(store[k], day) || store[k][0] < 3)) break; }
    while (i > 0 && !line.path[i - 1].o && line.path[i] && line.path[i].o) i--; // stop BEFORE the reply your move answers
    return i;
  }
  function progress(lines, store, day) {
    const keys = new Set(); for (const l of lines) for (const k of l.keys) if (k) keys.add(k);
    let learned = 0, due = 0, fresh = 0;
    for (const k of keys) { const c = store[k]; if (!c) fresh++; else { if (c[0] >= 1) learned++; if (c[1] <= day) due++; } }
    return { moves: keys.size, learned, due, fresh };
  }
  const bare = (san) => String(san || "").replace(/[+#]/g, "");
  // the book as PGN, with every side line in brackets (ChessBase, Lichess studies, Chessable and others read it)
  function treeToPgn(tree, start, { event = "PnoyChess repertoire", notes = {} } = {}) {
    const startN = start.length;
    const num = (ply, force) => (ply % 2 === 0 ? Math.floor(ply / 2) + 1 + ". " : force ? Math.floor(ply / 2) + 1 + "... " : "");
    const note = (key) => (notes[key] ? " {" + String(notes[key]).replace(/[{}]/g, "") + "}" : "");
    function line(list, ply, force, path) {
      if (!list.length) return "";
      const [main, ...alts] = list, key = [...path, main.m].join(" ");
      let out = num(ply, force) + main.m + note(key);
      for (const a of alts) { const k2 = [...path, a.m].join(" "); out += " (" + num(ply, true) + a.m + note(k2) + (a.k.length ? " " + line(a.k, ply + 1, false, [...path, a.m]) : "") + ")"; }
      const rest = line(main.k, ply + 1, alts.length > 0, [...path, main.m]);
      return out + (rest ? " " + rest : "");
    }
    const prefix = start.map((m, i) => num(i, false) + m).join(" ");
    const body = (prefix ? prefix + " " : "") + line(tree, startN, false, []);
    return `[Event "${event}"]\n[Site "PnoyChess Studio"]\n[Result "*"]\n\n${body} *\n`;
  }
  // PGN in: every line and side line of a study or a course chapter, merged into one tree for `side`. Comments, NAGs,
  // move numbers and results are skipped. -> { tree, start: [], lines, moves } or { error } (needs window.Chess)
  function pgnToTree(text, side) {
    const C = window.Chess;
    if (/\[FEN\s/.test(text) || /\[SetUp\s+"1"\]/.test(text)) return { error: "This PGN starts from a set-up position; only lines from the normal start can be trained here." };
    const games = String(text).split(/(?=\[Event\s)/).map((g) => g.replace(/^\s*\[[^\]]*\]\s*$/gm, " "));
    const lines = [];
    for (const g of games) {
      const body = g.replace(/\{[^}]*\}/g, " ").replace(/;[^\n]*/g, " ").replace(/\$\d+/g, " ").replace(/\(/g, " ( ").replace(/\)/g, " ) ");
      const toks = body.split(/\s+/).map((t) => t.replace(/^\d+\.+/, "").replace(/[!?]+$/, "")).filter((t) => t && !/^(1-0|0-1|1\/2-1\/2|\*)$/.test(t));
      // each line remembers where it began, so the main line (which began first) is merged first and stays the main move
      const stack = []; let cur = []; cur.from = lines.length ? lines[lines.length - 1].from + 1e6 : 0; let pos = cur.from;
      for (const t of toks) {
        pos++;
        if (t === "(") { stack.push(cur); const from = cur.from; cur = cur.slice(0, -1); cur.from = pos; void from; }
        else if (t === ")") { if (cur.length) lines.push(cur); const back = stack.pop() || []; cur = back; }
        else if (/^(O-O(-O)?|0-0(-0)?|[KQRBN]?[a-h]?[1-8]?x?[a-h][1-8](=?[QRBN])?)[+#]?$/.test(t)) { const from = cur.from; cur = [...cur, t.replace(/^0-0-0/, "O-O-O").replace(/^0-0/, "O-O")]; cur.from = from; }
      }
      if (cur.length) lines.push(cur);
    }
    if (!lines.length) return { error: "No moves were found in that PGN." };
    lines.sort((x, y) => x.from - y.from);
    const tree = []; let moves = 0, bad = 0;
    for (const l of lines) {
      const g = new C(); let list = tree;
      for (let i = 0; i < l.length; i++) {
        const mv = g.move(l[i], { sloppy: true }); if (!mv) { bad++; break; }
        const san = bare(mv.san), mine = mv.color === side;
        let e = list.find((x) => x.m === san);
        if (!e) { e = mine ? { m: san, o: 1, k: [] } : { m: san, p: 0, n: 0, k: [] }; list.push(e); if (mine) moves++; }
        if (!mine) e.n++;
        list = e.k;
      }
    }
    // the opponent's replies weighted by how many lines go through them; a position with two answers of ours keeps the
    // first (a repertoire plays one move)
    (function fix(list) { const opp = list.filter((e) => !e.o), tot = opp.reduce((t, e) => t + e.n, 0) || 1; for (const e of opp) e.p = e.n / tot;
      const ours = list.filter((e) => e.o); if (ours.length > 1) list.splice(0, list.length, ...list.filter((e) => !e.o || e === ours[0]));
      for (const e of list) fix(e.k); })(tree);
    return { tree, start: [], lines: lines.length, moves, bad };
  }
  // the main-line moves of one PGN game (Chess.com gives PGN with clock comments)
  function movesFromPgn(text) {
    let body = String(text).replace(/^\s*\[[^\]]*\]\s*$/gm, " ").replace(/\{[^}]*\}/g, " ").replace(/;[^\n]*/g, " ").replace(/\$\d+/g, " ");
    let prev; do { prev = body; body = body.replace(/\([^()]*\)/g, " "); } while (body !== prev);
    return body.split(/\s+/).map((t) => t.replace(/^\d+\.+/, "").replace(/[!?]+$/, "")).filter((t) => /^(O-O(-O)?|0-0(-0)?|[KQRBN]?[a-h]?[1-8]?x?[a-h][1-8](=?[QRBN])?)[+#]?$/.test(t)).map((t) => t.replace(/^0-0-0/, "O-O-O").replace(/^0-0/, "O-O").replace(/[+#]$/, "").replace("=", "="));
  }
  // Your own games against a book: for each game where you had the book's colour and reached its start, follow the
  // book until the game leaves it. -> { checked, notOpening, wrongSide, you: [{ path, book, played: {san: n}, n }],
  // them: [{ path, played: {san: n}, n }], through: n games that stayed in the book to its end }
  // you = you played something else than the book's move; them = the opponent played a reply the book has no answer to.
  function gamesCheck(tree, start, side, games) {
    const out = { checked: 0, notOpening: 0, wrongSide: 0, through: 0 }, you = new Map(), them = new Map();
    for (const g of games) {
      if (g.side !== side) { out.wrongSide++; continue; }
      const mv = g.moves.map(bare);
      if (start.some((m, i) => bare(m) !== mv[i])) { out.notOpening++; continue; }
      out.checked++;
      let list = tree, i = start.length; const path = [];
      for (;; i++) {
        if (!list.length || i >= mv.length) { out.through++; break; }
        const mine = (i % 2 === 0 ? "w" : "b") === side, hit = list.find((e) => bare(e.m) === mv[i]);
        if (mine) {
          const book = list.find((e) => e.o);
          if (!book) { out.through++; break; }
          if (!hit || !hit.o) { const k = path.join(" "); const r = you.get(k) || { path: path.slice(), book: book.m, played: {}, n: 0 }; r.played[mv[i]] = (r.played[mv[i]] || 0) + 1; r.n++; you.set(k, r); break; }
        } else if (!hit) { const k = path.join(" "); const r = them.get(k) || { path: path.slice(), played: {}, n: 0 }; r.played[mv[i]] = (r.played[mv[i]] || 0) + 1; r.n++; them.set(k, r); break; }
        path.push(hit.m); list = hit.k;
      }
    }
    out.you = [...you.values()].sort((a, b) => b.n - a.n);
    out.them = [...them.values()].sort((a, b) => b.n - a.n);
    return out;
  }
  // the replies under a branch that have no answer: the gaps
  const gapsUnder = (list) => list.reduce((t, e) => t + (!e.o && !e.k.length ? 1 : 0) + gapsUnder(e.k), 0);

  // ---------- the board ----------
  // Mark's choice (24 Nov 2026): the Merida pieces (Armando Hernandez Marroquin, GPL-2.0-or-later; assets/pieces/merida,
  // published next to the page as merida-<colour><piece>.svg by tools/build-site.mjs)
  const pieceUrl = (p) => `merida-${p.color}${p.type}.svg`;
  const FILES = "abcdefgh";
  let T = null; // the open session
  const SET_KEY = "pnoy.rep.settings";
  const settings = (() => { try { return Object.assign({ speed: "normal", skip: true }, JSON.parse(localStorage.getItem(SET_KEY) || "{}")); } catch (e) { return { speed: "normal", skip: true }; } })();
  const setSetting = (k, v) => { settings[k] = v; try { localStorage.setItem(SET_KEY, JSON.stringify(settings)); } catch (e) { /* this session only */ } draw(); };
  const DELAY = { fast: 150, normal: 500, slow: 1100 };
  const storeKey = (id) => "pnoy.rep." + id;
  const loadStore = (id) => { try { return JSON.parse(localStorage.getItem(storeKey(id)) || "{}"); } catch (e) { return {}; } };
  const saveStore = () => { try { localStorage.setItem(storeKey(T.id), JSON.stringify({ at: new Date().toISOString(), cards: T.store, notes: T.notes || {} })); } catch (e) { /* a full or private browser: this session only */ } };
  const moveNo = (ply, san, white) => (white ? Math.floor(ply / 2) + 1 + ". " : Math.floor(ply / 2) + 1 + "... ") + san;
  const label = (i) => moveNo(T.start.length + i, T.path[i].m, (T.start.length + i) % 2 === 0);
  const squaresOf = (san) => { const m = T.game.moves({ verbose: true }).find((x) => bare(x.san) === bare(san)); return m ? [m.from, m.to] : []; };

  function reset() {
    T.game = new window.Chess(); for (const m of T.start) T.game.move(m);
    T.path = []; T.node = T.tree; T.sel = null; T.last = []; T.hint = []; T.tries = 0; T.said = "";
  }
  function play(entry) {
    const mv = T.game.move(entry.m); if (!mv) return false;
    T.path.push(entry); T.node = entry.k || []; T.last = [mv.from, mv.to]; T.sel = null; T.hint = []; T.tries = 0;
    return true;
  }
  const ourTurn = () => T.game.turn() === T.side;

  // ---- Explore: the book answers by itself; the opponent's move is yours to choose
  function exploreStep() {
    const mine = T.node.find((e) => e.o);
    if (ourTurn() && mine) {
      play(mine);
      T.msg = `The book plays ${label(T.path.length - 1)}` + (mine.e ? " (the engine's choice: nobody answered this move in the games)." : mine.f ? ` (from only ${mine.n} games).` : mine.n ? ` (${Number(mine.n).toLocaleString("en-US")} games).` : ".");
    } else if (ourTurn()) T.msg = T.path.length ? "The book has no answer to this move: it was played in fewer than 1 game in 200." : "The book has no move here.";
    else if (!T.node.length) T.msg = (T.msg ? T.msg + " " : "") + "The book ends here.";
    draw();
  }
  function exploreChoose(entry) { T.msg = ""; if (play(entry)) exploreStep(); }
  function exploreBack() {
    const keep = T.path.slice(); let n = keep.length;
    while (n > 0 && keep[n - 1].o) n--;      // our answer goes with the reply before it
    n = Math.max(0, n - 1);
    reset(); for (const e of keep.slice(0, n)) play(e);
    T.msg = ""; exploreStep();
  }

  // ---- Train: the opponent's moves are played for you; you must find yours
  function trainStart(any) {
    const day = today();
    T.line = nextLine(T.lines, T.store, day, Math.random) || (any ? T.lines[Math.floor(Math.pow(Math.random(), 2) * T.lines.length)] : null);
    reset(); T.idx = 0; T.done = !T.line; T.missed = 0; T.found = 0;
    if (T.line && settings.skip) { const n = knownPrefix(T.line, T.store, day); for (let i = 0; i < n; i++) play(T.line.path[i]); T.idx = n; T.skipped = Math.ceil(n / 2); } else T.skipped = 0;
    T.msg = T.line ? "" : "Nothing is due today. Come back tomorrow, or practise any line now.";
    if (T.line) trainAdvance(); else draw();
  }
  function trainAdvance() {
    const next = T.line.path[T.idx];
    if (!next) { T.done = true; T.msg = (T.missed ? `Line finished. ${T.missed} move${T.missed === 1 ? "" : "s"} to see again today.` : "Line finished, every move found.") + (T.skipped ? ` (${T.skipped} known move${T.skipped === 1 ? " was" : "s were"} played for you.)` : ""); saveStore(); return draw(); }
    if (!next.o) { // the opponent's move: played for you after a short pause
      draw(); T.wait = setTimeout(() => { if (!T || T.line.path[T.idx] !== next) return; play(next); T.idx++; trainAdvance(); }, T.idx === 0 && !T.path.length ? 250 : DELAY[settings.speed] || 500);
      return;
    }
    const card = T.store[T.line.keys[T.idx]];
    T.fresh = !card; T.tries = 0;
    if (T.fresh) { T.hint = squaresOf(next.m); T.msg = `New move: play ${moveNo(T.start.length + T.idx, next.m, T.side === "w")}.`; }
    else T.msg = "Your move.";
    draw();
  }
  function trainTry(from, to) {
    const next = T.line.path[T.idx], mv = T.game.move({ from, to, promotion: "q" });
    if (!mv) return;
    if (bare(mv.san) === bare(next.m)) {
      T.game.undo();
      const key = T.line.keys[T.idx], result = T.fresh || T.shown ? "shown" : T.tries ? "wrong" : "right";
      if (result !== "right") T.missed += T.fresh ? 0 : 1;
      T.store[key] = grade(T.store[key], result, today()); saveStore();
      T.shown = false; play(next); T.idx++;
      const nt = (T.notes || {})[T.path.map((e) => e.m).join(" ")];
      T.said = (nt ? "Your note: " + nt + "  " : "") + `${result === "right" ? "Right" : "Noted"}: ${moveNo(T.start.length + T.idx - 1, next.m, T.side === "w")}` + (next.e ? ", the engine's choice" : next.n ? ` (${Number(next.n).toLocaleString("en-US")} master games${next.f ? ", few" : ""})` : "") + ".";
      T.msg = ""; trainAdvance();
    } else {
      T.game.undo(); T.tries++; T.sel = null;
      if (T.tries >= 2 || T.fresh) { T.hint = squaresOf(next.m); T.shown = true; T.msg = `The book move is ${moveNo(T.start.length + T.idx, next.m, T.side === "w")}. Play it.`; }
      else T.msg = `${bare(mv.san)} is not the book move. Try once more.`;
      draw();
    }
  }

  function clickSquare(sq) {
    if (T.dragged && T.sel === null) { T.dragged = false; return; }
    T.dragged = false;
    const piece = T.game.get(sq), turn = T.game.turn();
    if (T.sel && T.sel !== sq) {
      const legal = T.game.moves({ square: T.sel, verbose: true }).find((m) => m.to === sq);
      if (legal) {
        if (T.mode === "train") { if (T.line && !T.done && ourTurn()) return trainTry(T.sel, sq); T.sel = null; return draw(); }
        const hit = T.node.find((e) => bare(e.m) === bare(legal.san));
        if (hit && !hit.o) return exploreChoose(hit);
        T.sel = null; T.msg = ourTurn() ? "The book chooses your move here." : `${bare(legal.san)} is not in the book: it was played in fewer than 1 game in 200.`;
        return draw();
      }
    }
    T.sel = piece && piece.color === turn && T.sel !== sq ? sq : null;
    draw();
  }

  function board() {
    const flip = T.side === "b", targets = T.sel ? T.game.moves({ square: T.sel, verbose: true }).map((m) => m.to) : [];
    const cells = [];
    for (let row = 0; row < 8; row++) for (let col = 0; col < 8; col++) {
      const f = flip ? 7 - col : col, r = flip ? row : 7 - row, sq = FILES[f] + (r + 1), p = T.game.get(sq), dark = (f + r) % 2 === 0;
      const mark = T.sel === sq ? "inset 0 0 0 4px #F59E0B" : T.last.includes(sq) ? "inset 0 0 0 999px rgba(245,158,11,.28)" : "none";
      cells.push(el("button", { type: "button", "data-sq": sq, onpointerdown: (ev) => dragStart(ev, sq), "aria-label": sq + (p ? " " + (p.color === "w" ? "white " : "black ") + p.type : ""), onclick: () => clickSquare(sq),
        style: `position:relative; border:0; padding:0; margin:0; aspect-ratio:1; cursor:pointer; background:${dark ? "#a5683a" : "#f0d4a4"}; box-shadow:${mark}; font-size:min(9.4vw,46px); line-height:1; display:flex; align-items:center; justify-content:center; color:${p && p.color === "w" ? "#fffdf6" : "#1c1410"}; text-shadow:${p && p.color === "w" ? "0 0 2px #000, 0 1px 2px #000, 0 0 1px #000" : "0 0 1px rgba(255,255,255,.35)"};` },
        p ? el("img", { src: pieceUrl(p), alt: "", draggable: "false", style: "width:100%; height:100%; display:block; pointer-events:none;" }) : "",
        targets.includes(sq) ? el("span", { style: "position:absolute; width:26%; height:26%; border-radius:50%; background:rgba(6,182,212,.75);" }) : null,
        col === 0 ? el("span", { style: `position:absolute; left:3px; top:2px; font:600 10px system-ui,sans-serif; text-shadow:none; color:${dark ? "#f0d4a4" : "#a5683a"};`, text: String(r + 1) }) : null,
        row === 7 ? el("span", { style: `position:absolute; right:3px; bottom:1px; font:600 10px system-ui,sans-serif; text-shadow:none; color:${dark ? "#f0d4a4" : "#a5683a"};`, text: FILES[f] }) : null));
    }
    const grid = el("div", { style: "display:grid; grid-template-columns:repeat(8,1fr); width:100%; user-select:none; touch-action:none;" }, ...cells);
    return el("div", { style: "position:relative; width:100%; max-width:440px; box-sizing:border-box; flex:1 1 300px; border:6px solid #2e1a0d; border-radius:8px; overflow:hidden;" }, grid, arrows(flip));
  }
  // the hint as an arrow (cyan, the channel's colour for the move to find), drawn over the board
  function arrows(flip) {
    if (T.hint.length !== 2) return null;
    const xy = (sq) => { const f = FILES.indexOf(sq[0]), r = +sq[1] - 1; return [(flip ? 7 - f : f) + 0.5, (flip ? r : 7 - r) + 0.5]; };
    const [a, b] = T.hint.map(xy), NS = "http://www.w3.org/2000/svg", svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 8 8"); svg.setAttribute("style", "position:absolute; inset:0; width:100%; height:100%; pointer-events:none;");
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len, end = [b[0] - ux * 0.32, b[1] - uy * 0.32];
    const line = document.createElementNS(NS, "line");
    for (const [k, v] of Object.entries({ x1: a[0], y1: a[1], x2: end[0], y2: end[1], stroke: "#06B6D4", "stroke-width": 0.17, "stroke-linecap": "round", opacity: 0.88 })) line.setAttribute(k, v);
    const head = document.createElementNS(NS, "polygon"), px = -uy, py = ux;
    head.setAttribute("points", [[b[0] - ux * 0.05, b[1] - uy * 0.05], [end[0] - ux * 0.12 + px * 0.27, end[1] - uy * 0.12 + py * 0.27], [end[0] - ux * 0.12 - px * 0.27, end[1] - uy * 0.12 - py * 0.27]].map((p) => p.join(",")).join(" "));
    head.setAttribute("fill", "#06B6D4"); head.setAttribute("opacity", "0.88");
    svg.append(line, head);
    return svg;
  }
  // drag and drop: press on a piece, let go on a square (a press and release on one square is an ordinary click)
  function dragStart(ev, sq) {
    const p = T.game.get(sq);
    if (!p || p.color !== T.game.turn() || ev.button > 0) return;
    const from = sq;
    const up = (e) => {
      document.removeEventListener("pointerup", up);
      const hit = document.elementFromPoint(e.clientX, e.clientY), to = hit && hit.closest && hit.closest("[data-sq]") ? hit.closest("[data-sq]").getAttribute("data-sq") : null;
      if (to && to !== from && T) { T.sel = from; T.dragged = true; clickSquare(to); }
    };
    document.addEventListener("pointerup", up);
  }
  const movesSoFar = () => { const g = new window.Chess(); for (const m of T.start) g.move(m); for (const e of T.path) g.move(e.m); return g.pgn().replace(/\[[^\]]*\]\s*/g, "") || "(the start)"; };
  const pctText = (p) => (p >= 0.095 ? Math.round(100 * p) + "%" : p >= 0.01 ? (100 * p).toFixed(0) + "%" : "under 1%");

  function gamesSide() {
    const st = T.gamesForm || (T.gamesForm = (() => { try { return Object.assign({ site: "chesscom", user: "", max: 100 }, JSON.parse(localStorage.getItem("pnoy.rep.player") || "{}")); } catch (e) { return { site: "chesscom", user: "", max: 100 }; } })());
    const r = T.gamesResult, words = (p) => p.length ? movesFrom(p) : "the start of the book";
    const user = el("input", { type: "text", value: st.user, placeholder: "your username", "aria-label": "Username", style: "flex:1 1 160px; min-width:0; max-width:100%; box-sizing:border-box;", oninput: (ev) => { st.user = ev.target.value; } });
    return el("div", { style: "flex:1; min-width:240px;" },
      el("div", { class: "note", text: `Your games where you had ${T.side === "w" ? "White" : "Black"} and the book's opening: where you left the book, and where your opponents did. Your browser reads them straight from the site; nothing is saved anywhere.` }),
      el("div", { class: "row", style: "gap:6px; flex-wrap:wrap; align-items:center; margin:8px 0;" },
        ...[["chesscom", "Chess.com"], ["lichess", "Lichess"]].map(([k, n]) => el("button", { class: "btn" + (st.site === k ? " primary" : ""), type: "button", text: n, onclick: () => { st.site = k; draw(); } })), user),
      el("div", { class: "row", style: "gap:6px; flex-wrap:wrap; align-items:center;" }, el("span", { class: "note", text: "Last" }),
        ...[50, 100, 300].map((n) => el("button", { class: "btn" + (st.max === n ? " primary" : ""), type: "button", text: n + " games", onclick: () => { st.max = n; draw(); } })),
        el("button", { class: "btn primary", type: "button", text: T.gamesBusy ? "Reading…" : "Check my games", disabled: T.gamesBusy || !st.user.trim(), onclick: runGamesCheck })),
      T.msg ? el("div", { style: "margin:8px 0; font-weight:600;", text: T.msg }) : null,
      r ? el("div", { style: "margin-top:8px;" },
        el("div", { class: "note", style: "color:inherit; font-weight:600;", text: `${r.read} games read: ${r.checked} in this book with your colour (${r.wrongSide} with the other colour, ${r.notOpening} in other openings). ${r.through} stayed in the book to its end.` }),
        r.you.length ? el("div", { style: "margin-top:10px; font-weight:600;", text: "Where YOU left the book" }) : null,
        ...r.you.slice(0, 15).map((x) => el("div", { class: "row", style: "gap:6px; align-items:center; flex-wrap:wrap; margin:4px 0;" },
          el("span", { text: `${x.n}×  after ${words(x.path)}: the book plays ${x.book}; you played ${Object.entries(x.played).sort((a, b) => b[1] - a[1]).map(([m, n]) => m + (n > 1 ? " (" + n + ")" : "")).join(", ")}` }),
          el("button", { class: "btn", type: "button", text: "Show", onclick: () => exploreAt(x.path) }))),
        r.you.length ? el("button", { class: "btn primary", type: "button", style: "margin-top:6px;", text: "Put these moves into today's training", onclick: trainMistakes }) : el("div", { class: "note", style: "margin-top:8px;", text: "You never left the book in these games." }),
        r.them.length ? el("div", { style: "margin-top:12px; font-weight:600;", text: "Where your OPPONENTS left the book (replies it has no answer to)" }) : null,
        ...r.them.slice(0, 15).map((x) => el("div", { class: "row", style: "gap:6px; align-items:center; flex-wrap:wrap; margin:4px 0;" },
          el("span", { text: `${x.n}×  after ${words(x.path)}: ${Object.entries(x.played).sort((a, b) => b[1] - a[1]).map(([m, n]) => m + (n > 1 ? " (" + n + ")" : "")).join(", ")}` }),
          el("button", { class: "btn", type: "button", text: "Show", onclick: () => exploreAt(x.path) })))) : null);
  }
  // a path of the book as moves with numbers, after the book's start
  const movesFrom = (path) => { const g = new window.Chess(); for (const m of T.start) g.move(m); for (const m of path) g.move(m); return g.pgn().replace(/\[[^\]]*\]\s*/g, ""); };
  function side() {
    if (T.mode === "games") return gamesSide();
    if (T.mode === "explore") {
      const replies = ourTurn() ? [] : T.node.filter((e) => !e.o);
      return el("div", { style: "flex:1; min-width:240px;" },
        el("div", { class: "note", style: "color:inherit; font-weight:600;", text: movesSoFar() }),
        T.msg ? el("div", { class: "note", style: "margin:6px 0;", text: T.msg }) : null,
        replies.length ? el("div", { class: "note", style: "margin:8px 0 4px;", text: "The opponent can play (click one, or make the move on the board):" }) : null,
        el("div", { class: "row", style: "gap:6px; flex-wrap:wrap;" }, ...replies.map((e) => el("button", { class: "btn", type: "button", title: `${Number(e.n || 0).toLocaleString("en-US")} games`, onclick: () => exploreChoose(e),
          text: `${moveNo(T.start.length + T.path.length, e.m, T.game.turn() === "w")}  ${e.e ? "(engine line)" : pctText(e.p || 0)}${!e.k.length ? "  · no answer yet" : gapsUnder(e.k) ? "  · " + gapsUnder(e.k) + " gaps below" : ""}` }))),
        el("div", { class: "note", style: "margin-top:10px;", text: "Your note on this position (kept with your progress, and in the PGN you download):" }),
        el("textarea", { rows: "2", style: "width:100%; box-sizing:border-box;", "aria-label": "Note on this position", oninput: (ev) => { const k = T.path.map((e) => e.m).join(" "); if (ev.target.value.trim()) T.notes[k] = ev.target.value; else delete T.notes[k]; saveStore(); } }, (T.notes || {})[T.path.map((e) => e.m).join(" ")] || ""),
        el("div", { class: "row", style: "gap:6px; flex-wrap:wrap; margin-top:12px;" },
          el("button", { class: "btn", type: "button", text: "Back", disabled: !T.path.some((e) => !e.o), onclick: exploreBack }),
          el("button", { class: "btn", type: "button", text: "Start over", onclick: () => { reset(); T.msg = ""; exploreStep(); } }),
          el("button", { class: "btn", type: "button", text: "Download PGN", title: "The whole book with every side line, for ChessBase, Lichess studies or Chessable", onclick: downloadPgn })),
        el("div", { class: "note", style: "margin-top:8px;", text: `Gaps in the whole book: ${gapsUnder(T.tree)} replies with no answer yet.` }));
    }
    const pr = progress(T.lines, T.store, today());
    return el("div", { style: "flex:1; min-width:240px;" },
      el("div", { class: "note", style: "color:inherit; font-weight:600;", text: `${pr.learned} of ${pr.moves} of your moves learned. Due today: ${pr.due}. New: ${pr.fresh}.` }),
      el("div", { class: "note", style: "margin:6px 0;", text: movesSoFar() }),
      T.said ? el("div", { class: "note", style: "color:#15803d;", text: T.said }) : null,
      T.msg ? el("div", { style: "margin:8px 0; font-weight:600;", text: T.msg }) : null,
      el("div", { class: "row", style: "gap:6px; flex-wrap:wrap; margin-top:10px;" },
        T.done && T.line ? el("button", { class: "btn primary", type: "button", text: "Next line", onclick: () => trainStart(false) }) : null,
        T.done && !T.line ? el("button", { class: "btn primary", type: "button", text: "Practise any line", onclick: () => trainStart(true) }) : null,
        !T.done && T.line && ourTurn() ? el("button", { class: "btn", type: "button", text: "Show me the move", onclick: () => { const n = T.line.path[T.idx]; T.hint = squaresOf(n.m); T.shown = true; T.msg = `The book move is ${moveNo(T.start.length + T.idx, n.m, T.side === "w")}. Play it.`; draw(); } }) : null,
        el("button", { class: "btn", type: "button", text: "Save my progress", title: "Keep your progress on GitHub too, so your phone and your PC share it", onclick: saveRemote })),
      el("div", { class: "row", style: "gap:6px; flex-wrap:wrap; align-items:center; margin-top:12px;" }, el("span", { class: "note", text: "Opponent's speed:" }),
        ...["fast", "normal", "slow"].map((k) => el("button", { class: "btn" + (settings.speed === k ? " primary" : ""), type: "button", text: k[0].toUpperCase() + k.slice(1), onclick: () => setSetting("speed", k) }))),
      el("label", { class: "note", style: "display:flex; gap:6px; align-items:center; margin-top:8px;" },
        el("input", { type: "checkbox", checked: settings.skip, onchange: (ev) => setSetting("skip", ev.target.checked) }), "Play the moves I already know for me"),
      el("div", { class: "note", style: "margin-top:10px;", text: "A new move is shown once. After that it comes back tomorrow, then after 3, 7, 16, 35 and 80 days; a move you miss comes back the same day." }));
  }
  function draw() {
    if (!T || !T.root) return;
    T.root.textContent = "";
    T.root.append(
      el("div", { class: "row", style: "justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap;" },
        el("h2", { text: (T.mode === "train" ? "Train: " : T.mode === "games" ? "My games: " : "Explore: ") + T.title }),
        el("div", { class: "row", style: "gap:6px;" },
          el("button", { class: "btn" + (T.mode === "explore" ? " primary" : ""), type: "button", text: "Explore", onclick: () => setMode("explore") }),
          el("button", { class: "btn" + (T.mode === "train" ? " primary" : ""), type: "button", text: "Train", onclick: () => setMode("train") }),
          el("button", { class: "btn" + (T.mode === "games" ? " primary" : ""), type: "button", text: "My games", onclick: () => setMode("games") }),
          el("button", { class: "btn", type: "button", text: "Close", onclick: close }))),
      T.error ? el("div", { class: "empty", text: T.error }) : T.tree ? el("div", { class: "row", style: "gap:16px; align-items:flex-start; flex-wrap:wrap; margin-top:10px;" }, board(), side())
        : el("div", { class: "note", text: "Loading the moves…" }));
  }
  function setMode(mode) {
    if (!T.tree) return;
    clearTimeout(T.wait); T.mode = mode; T.msg = ""; T.done = false; T.line = null;
    if (mode === "train") trainStart(false); else if (mode === "games") { reset(); draw(); } else { reset(); exploreStep(); }
  }
  function close() { if (T) clearTimeout(T.wait); T = null; S.repTrain = null; render(); }
  function downloadPgn() {
    const pgn = treeToPgn(T.tree, T.start, { event: T.title, notes: T.notes || {} });
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([pgn], { type: "application/x-chess-pgn" }));
    a.download = T.id + ".pgn"; document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }
  // -> [{ moves: [san], side: "w"|"b", url, result }], newest first, at most `max` standard games
  async function fetchGames(site, user, max) {
    const name = String(user || "").trim();
    if (!/^[A-Za-z0-9_-]{2,30}$/.test(name)) throw new Error("that does not look like a username");
    const me = name.toLowerCase(), out = [];
    if (site === "lichess") {
      const r = await fetch(`https://lichess.org/api/games/user/${encodeURIComponent(name)}?max=${max}&moves=true&clocks=false&evals=false&opening=false`, { headers: { Accept: "application/x-ndjson" } });
      if (r.status === 404) throw new Error("Lichess has no player called " + name);
      if (!r.ok) throw new Error("Lichess answered " + r.status);
      for (const line of (await r.text()).split("\n")) {
        if (!line.trim()) continue; let g; try { g = JSON.parse(line); } catch (e) { continue; }
        if (g.variant !== "standard" || !g.moves || g.initialFen) continue;
        const w = ((g.players.white || {}).user || {}).name || "";
        out.push({ moves: g.moves.split(" "), side: w.toLowerCase() === me ? "w" : "b", url: "https://lichess.org/" + g.id, result: g.winner ? (g.winner === "white" ? "1-0" : "0-1") : "1/2-1/2" });
      }
      return out;
    }
    const a = await fetch(`https://api.chess.com/pub/player/${encodeURIComponent(me)}/games/archives`);
    if (a.status === 404) throw new Error("Chess.com has no player called " + name);
    if (!a.ok) throw new Error("Chess.com answered " + a.status);
    const months = ((await a.json()).archives || []).slice().reverse();
    for (const m of months) {
      if (out.length >= max) break;
      const r = await fetch(m); if (!r.ok) continue;
      const games = ((await r.json()).games || []).slice().reverse();
      for (const g of games) {
        if (out.length >= max) break;
        if (g.rules !== "chess" || !g.pgn || /\[SetUp "1"\]/.test(g.pgn)) continue;
        out.push({ moves: movesFromPgn(g.pgn), side: String((g.white || {}).username || "").toLowerCase() === me ? "w" : "b", url: g.url, result: (g.pgn.match(/\[Result "([^"]+)"\]/) || [])[1] || "*" });
      }
    }
    return out;
  }
  // the "My games" view: ask for a username, read the games, show where they leave the book
  async function runGamesCheck() {
    const st = T.gamesForm;
    try { localStorage.setItem("pnoy.rep.player", JSON.stringify({ site: st.site, user: st.user })); } catch (e) { /* this session only */ }
    T.gamesBusy = true; T.gamesResult = null; T.msg = `Reading your last ${st.max} games from ${st.site === "lichess" ? "Lichess" : "Chess.com"}…`; draw();
    try {
      const games = await fetchGames(st.site, st.user, st.max);
      T.gamesResult = gamesCheck(T.tree, T.start, T.side, games); T.gamesResult.read = games.length;
      T.msg = "";
    } catch (e) { T.msg = "Could not read your games: " + (e.message || e); }
    T.gamesBusy = false; draw();
  }
  // put every move you played wrong back into today's training
  function trainMistakes() {
    const day = today(); let n = 0;
    for (const r of T.gamesResult.you) { const key = [...r.path, r.book].join(" "); T.store[key] = [0, day]; n++; }
    saveStore(); T.msg = `${n} move${n === 1 ? "" : "s"} you left the book with ${n === 1 ? "is" : "are"} due in Train today.`; draw();
  }
  // open Explore at a position of the book
  function exploreAt(path) {
    T.mode = "explore"; reset();
    for (const m of path) { const e = T.node.find((x) => x.m === m); if (!e || !play(e)) break; }
    T.msg = ""; exploreStep();
  }
  async function saveRemote() {
    if (!S.db) return say("Sign in to GitHub first (Tools).");
    try { await S.db.doc("repertoireprogress/" + T.id).set({ id: T.id, at: new Date().toISOString(), cards: T.store, notes: T.notes || {} }); say("Progress saved: your other devices pick it up when they open this book."); }
    catch (e) { say("Could not save: " + (e.message || e.code)); }
  }
  // open a book on the board. ask = the request record (id, side, start), title = its name, mode = "explore" | "train"
  async function open(ask, title, mode) {
    if (T) clearTimeout(T.wait);
    const root = el("section", { class: "panel" });
    T = { id: ask.id, title, mode, side: /^w/i.test(ask.side || "") ? "w" : "b", start: [], tree: null, root, store: {}, notes: {}, lines: [], path: [], hint: [], last: [], msg: "" };
    const mine = T; draw();
    try {
      if (!window.Chess) await loadOnce("chess.js");
      const doc = S.db ? await S.db.doc("repertoiretrees/" + ask.id).get() : null;
      if (T !== mine) return;
      if (!doc || !doc.tree) { T.error = "This book has no move tree yet. Press Build again on it: your PC makes one (free)."; return draw(); }
      T.start = doc.start || []; T.tree = doc.tree; T.side = doc.side || T.side; T.lines = linesOf(doc.tree);
      const local = loadStore(ask.id); T.store = local.cards || {}; T.notes = local.notes || {};
      // progress saved from another device wins when it is newer than this browser's
      try { const far = S.db ? await S.db.doc("repertoireprogress/" + ask.id).get() : null; if (far && far.cards && (!local.at || far.at > local.at)) { T.store = far.cards; T.notes = far.notes || T.notes; saveStore(); } } catch (e) { /* none saved yet */ }
      if (T !== mine) return;
      setMode(mode);
    } catch (e) { if (T === mine) { T.error = "Could not open the book: " + (e.message || e.code); draw(); } }
  }
  const view = () => (T ? T.root : null);
  window.RepertoireTrain = { open, view, close, linesOf, grade, nextLine, knownPrefix, progress, isDue, treeToPgn, pgnToTree, gapsUnder, movesFromPgn, gamesCheck, DAYS };
})();
