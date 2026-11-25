// PnoyChess Studio · Methods tab (Mark, 25 Nov 2026: "a dedicated page in our page docu for different methods in
// chess and our method and what is superior"). The thinking methods of chess (Chuzhakin, Kotov, Heisman, Nunn,
// Blumenfeld, Silman, Steinitz, Aagaard, the Woodpecker method) compared with what Mark's own games and puzzles show,
// and the method that came out of it. Every number here was measured on this PC on 24-25 Nov 2026:
//   - 4,900 positions from the puzzle books (Woodpecker, Fischer, 1001 Checkmates, Khenkin) against 1,420 quiet
//     positions from master games (both players 2300+, nothing captured or checked in the next 8 half-moves);
//   - 690,568 master games (the commented master file, 60 weeks of The Week in Chess, PGN Mentor's player files) for
//     the habits; 2300+ games for Chuzhakin's "fewer hazards" claim.
// The numbers are written here, not computed, because the puzzles and games stay on the PC. Static page: no GitHub
// calls. Loaded the first time the tab opens (index.html is at its size ceiling). Uses the page's el().
(function () {
  "use strict";
  const BOOKS = ["Woodpecker", "Fischer", "1001 Checkmates", "Khenkin"];
  // share of positions with each sign: the four puzzle books, then quiet master positions
  const SIGNS = [
    ["He can give a check", [79, 78, 99, 86], 35, "strong"],
    ["One safe move hits two targets", [17, 26, 38, 21], 4, "strong"],
    ["Three or more warning signs together", [54, 48, 85, 67], 21, "strong"],
    ["Two big pieces on one line", [52, 53, 63, 50], 34, "some"],
    ["A knight move forks two big pieces", [18, 11, 22, 16], 10, "some"],
    ["An unguarded piece", [73, 72, 78, 72], 68, "weak"],
    ["At least one of Chuzhakin's hazardous elements", [99, 97, 100, 97], 99, "none"],
    ["No warning sign at all", [2, 2, 0, 1], 10, "safe"],
  ];
  // the habits: how a side scored when it did this in the first 20 moves, minus when it did not (points out of 100)
  const HABITS = [
    ["Get two bishops against bishop and knight", 4.8, 4.2],
    ["Take more space (more pawns on your 4th rank and beyond)", 2.7, 3.2],
    ["Push the g- or h-pawn up the board", 3.2, 2.9],
    ["Get a centre pawn to the fifth rank", 2.2, 2.9],
    ["Keep both bishops", 2.5, 2.2],
    ["Take a centre pawn with the c- or f-pawn", 1.2, 1.1],
    ["Castle kingside", 0.2, 1.3],
    ["Castle by move 10", -0.6, -0.5],
    ["Trade queens early", -0.8, 0.8],
    ["Fianchetto a bishop", -0.9, 0.6],
    ["Keep both knights", -1.1, -1.0],
  ];
  // the systems: [name, who and when, the idea, verdict, what the data says]
  const SYSTEMS = [
    ["Chuzhakin's System", "Evgeny Chuzhakin, 2014", "List each side's \"hazardous elements\" (loose pieces, overloaded defenders, a boxed-in king, pieces on a line); fewer for you and more for him is better; update only what the last move changed.",
      "Not supported", "bad", "The elements are in 97-100% of puzzle positions, but also in 99% of quiet ones, at the same count (about 3.4 a side), so they do not say when a tactic is there. Having two fewer at move 20 or 30 is worth only 0.5-1.5 points in master games, and two of his elements point the wrong way. His \"update after the last move\" idea is good: it is step 1 of our method."],
    ["Checks, captures, threats", "Dan Heisman and most coaches", "Before every move, look at the forcing moves first, for both sides.",
      "Confirmed", "ok", "An available check is the strongest single sign: 79-99% of tactics against 35% of quiet positions."],
    ["Candidate moves and the tree of analysis", "Alexander Kotov, 1971", "List the candidate moves first, then calculate each line once.",
      "Partly", "warn", "Sound for calculating, but it treats every position the same. The data says calculate hard only when the warning signs are there (2% of tactics had none)."],
    ["Loose pieces drop off", "John Nunn", "Unguarded pieces are where tactics happen.",
      "Weak alone", "warn", "An unguarded piece is in 73% of tactics but also in 68% of quiet positions. It matters only together with a check or a line."],
    ["Blumenfeld's rule", "Benjamin Blumenfeld", "Write the move down, then look at the board once more as a beginner would.",
      "Confirmed", "ok", "Most blunders give the opponent a check or a double hit. Our last step is this rule, aimed at exactly those two."],
    ["The imbalances", "Jeremy Silman", "Compare the minor pieces, pawns, space, material, development, files and king safety; play where you are better.",
      "Partly", "warn", "Two of them clearly win games: two bishops against bishop and knight (+4 to 5 points) and space (+3). Development matters only in some openings (the Italian: +8)."],
    ["Small advantages add up", "Wilhelm Steinitz", "Win by collecting small advantages, not by one big blow.",
      "Confirmed", "ok", "Every habit in master games is worth 3-5 points; none decides a game alone."],
    ["Three questions", "Jacob Aagaard", "Where are the weaknesses? Which is my worst piece? What does he want?",
      "Partly", "warn", "\"What does he want\" is our step 1 and \"worst piece\" our step 5. Weaknesses alone (like Chuzhakin's) do not separate tactics from quiet positions."],
    ["The Woodpecker method", "Axel Smith and Hans Tikkanen", "Solve the same set of puzzles again and again, faster each time.",
      "Training, not thinking", "", "A way to learn patterns, not a way to choose a move. The board on the Repertoire tab uses the same idea (spaced repeats) for openings."],
  ];
  const STEPS = [
    ["1", "What did his last move change?", "Look only at the piece that moved: what it attacks now, what it uncovered behind it, what it stopped guarding."],
    ["2", "Can he check me?", "The strongest warning there is. Find every check he has, also after a capture."],
    ["3", "Can one move of his hit two things?", "The second strongest. Find it by geometry: a knight only forks pieces on the colour of the square it stands on now; a bishop never hits two pieces on different colours; two big pieces on one line are a pin or a skewer waiting to happen. An unguarded piece counts only together with one of these."],
    ["4", "Count the yes answers.", "Two or more: calculate checks, then captures, then threats, for both sides. None: the position is quiet (only 2% of tactics had no sign), go to step 5."],
    ["5", "Quiet: choose by what wins.", "In this order: two bishops against bishop and knight (or trade your knight for his bishop), more space and a centre pawn on the fifth rank, then your worst piece. Keep your bishops; do not hurry to castle."],
    ["6", "Before you let go: the last look.", "Steps 2 and 3 on your own move: after it, can he check you, or hit two things at once?"],
  ];

  const pill = (text, tone) => el("span", { class: "pill" + (tone ? " " + tone : ""), text });
  const table = (head, rows) => el("div", { style: "overflow:auto;" }, el("table", { class: "pubtable" },
    el("thead", {}, el("tr", {}, ...head.map((h) => el("th", { text: h })))), el("tbody", {}, ...rows)));
  const td = (content, style) => el("td", style ? { style } : {}, content);
  const bar = (v, max, label) => el("div", { style: `display:flex; align-items:center; gap:6px;` },
    el("div", { style: `height:10px; width:${Math.round(70 * Math.abs(v) / max)}px; border-radius:3px; background:${v >= 0 ? "var(--gold)" : "#EF4444"}; opacity:.85;` }),
    el("span", { text: label || (v > 0 ? "+" : "") + v.toFixed(1) }));
  const avg = (xs) => Math.round(xs.reduce((a, b) => a + b, 0) / xs.length);

  function methodCard() {
    return el("section", { class: "panel", id: "our-method" },
      el("div", { class: "row", style: "justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap;" },
        el("h2", { text: "The full method: last move, check, double hit" }),
        el("button", { class: "btn", type: "button", text: "Print this card", onclick: () => printOnly("our-method") })),
      el("div", { class: "note", text: "The same idea with more detail, for slower games. The order follows the evidence: the strongest warning sign first." }),
      el("ol", { style: "margin:10px 0 0 0; padding:0; list-style:none; display:grid; gap:10px;" }, ...STEPS.map(([n, t, d]) =>
        el("li", { style: "display:flex; gap:12px; align-items:flex-start;" },
          el("span", { style: "flex:0 0 30px; height:30px; border-radius:50%; background:var(--gold-gradient); color:#fff; font-weight:700; display:flex; align-items:center; justify-content:center;", text: n }),
          el("div", {}, el("div", { style: "font-weight:600;", text: t }), el("div", { class: "note", text: d }))))),
      el("div", { style: "margin-top:14px; padding:12px 14px; border-radius:10px; background:var(--gold-bg); border:1px solid var(--gold-border);" },
        el("div", { style: "font-weight:700;", text: "Blitz version: changed, check, double, last look." }),
        el("div", { class: "note", text: "Four words, about three seconds, on his move and again on yours." })));
  }
  function verdict() {
    return el("section", { class: "panel" },
      el("h2", { text: "Chess thinking methods: what works" }),
      el("div", { style: "font-size:15px; line-height:1.55;" },
        el("p", { text: "Most methods tell you to look for weaknesses: loose pieces, overloaded defenders, a king with no squares. Measured on 4,900 puzzle positions and 1,420 quiet master positions, those weaknesses are almost always there, tactic or not. They cannot tell you when to stop and calculate." }),
        el("p", { text: "What does tell you is a threat that can be made in one move: a check, or one move that hits two things. A check was available in 79-99% of the puzzles but in only 35% of quiet positions; one safe move hitting two targets in 17-38% against 4%. Our method looks for those first, then, when nothing is there, plays the habits that won the most in 690,568 master games." })),
      el("div", { class: "row", style: "gap:6px; flex-wrap:wrap; margin-top:6px;" },
        pill("Strongest sign: a check", "ok"), pill("Next: one move, two targets", "ok"), pill("Weak alone: loose pieces", "warn"), pill("No help: counting weaknesses", "bad")));
  }
  function signsTable() {
    const tone = { strong: "ok", some: "", weak: "warn", none: "bad", safe: "ok" };
    const word = { strong: "Strong sign", some: "Some help", weak: "Weak alone", none: "No help", safe: "Quiet means quiet" };
    return el("section", { class: "panel" },
      el("h2", { text: "The evidence: warning signs in tactics and in quiet positions" }),
      el("div", { class: "note", text: `How often each sign is on the board: "Tactics" is the average of the four puzzle books (${BOOKS.join(", ")}, each shown too), "Quiet" is quiet master positions. A useful sign is common in tactics and rare in quiet positions.` }),
      table(["Sign", "Tactics", ...BOOKS, "Quiet", "Verdict"], SIGNS.map(([name, books, quiet, kind]) => el("tr", {},
        td(name, "font-weight:600; min-width:170px;"), td(avg(books) + "%", "font-weight:700;"), ...books.map((b) => td(b + "%")), td(quiet + "%", "font-weight:700;"), td(pill(word[kind], tone[kind]))))));
  }
  function chuzhakinTest() {
    return el("section", { class: "panel" },
      el("h2", { text: "Chuzhakin's two claims, tested" }),
      table(["His claim", "What the games and puzzles show"], [
        el("tr", {}, td("99% of combinations involve hazardous elements", "font-weight:600;"), td("True, and no help: the side that gets hit has one in 97-100% of puzzle positions, but 99% of quiet master positions have them too, at the same count (about 3.4 a side).")),
        el("tr", {}, td("Fewer hazards for you and more for him is better", "font-weight:600;"), td("Barely: two fewer at move 20 or 30 is worth 0.5-1.5 points in 2300+ games. The side with fewer boxed-in kings scores 52.5% and fewer knight-fork targets 52.1%, but fewer pieces on a line scores 48.4% (connected rooks count as a line) and fewer attacked pieces 47.5% (the side under attack is often the side that is pressing).")),
        el("tr", {}, td("Only update what the last move changed", "font-weight:600;"), td("A good idea, kept as step 1 of our method.")),
      ]),
      el("div", { class: "note", style: "margin-top:6px;", text: "His full rules are in his book, which could not be read here; his elements were rebuilt from his own summary, so his exact count may differ a little." }));
  }
  function systemsTable() {
    return el("section", { class: "panel" },
      el("h2", { text: "Every method, side by side" }),
      table(["Method", "Its idea", "Verdict", "What the data says"], SYSTEMS.map(([name, who, idea, v, tone, data]) => el("tr", {},
        td(el("div", {}, el("div", { style: "font-weight:600;", text: name }), el("div", { class: "note", text: who }))), td(idea), td(pill(v, tone)), td(data)))));
  }
  function habitsTable() {
    const max = Math.max(...HABITS.flatMap(([, w, b]) => [Math.abs(w), Math.abs(b)]));
    return el("section", { class: "panel" },
      el("h2", { text: "When it is quiet: the habits that win" }),
      el("div", { class: "note", text: "How a side scored when it did this in the first 20 moves, minus when it did not, in 690,568 master games (points out of 100). They show what went together with winning, not proof that they cause it." }),
      table(["Habit", "As White", "As Black"], HABITS.map(([name, w, b]) => el("tr", {}, td(name), td(bar(w, max)), td(bar(b, max))))),
      el("div", { class: "note", style: "margin-top:6px;", text: "\"Keep both knights\" is the wrong rule: trade knights, keep bishops. The Repertoire tab shows these rules for each opening separately, where some gaps are bigger (in the Italian Game a lead in development by move 10 is worth +8)." }));
  }
  function limits() {
    return el("section", { class: "panel" },
      el("h2", { text: "Read this before trusting a number" }),
      el("ul", { style: "margin:6px 0 0 18px; padding:0; line-height:1.6;" },
        el("li", { text: "Puzzle books are chosen tactics; quiet positions were taken from 2300+ master games where nothing was captured or checked for the next four moves each." }),
        el("li", { text: "The habits are results, not causes: a side that is already better also takes space and pushes pawns." }),
        el("li", { text: "No method is proven to win more games; this one is ordered by which signs actually separate tactics from quiet positions in your own library." }),
        el("li", {}, "Sources: ", el("a", { href: "https://www.chess.com/blog/Chuzhakin/chuzhakins-system", target: "_blank", rel: "noopener", text: "Chuzhakin's System (his own summary)" }), "; Kotov, Think Like a Grandmaster (1971); Silman, How to Reassess Your Chess; Smith and Tikkanen, The Woodpecker Method.")));
  }
  // ---- the easy version (Mark, 25 Nov 2026: "make an easy much more specific method"): "Check plus 2-2-2".
  // Measured on 4,922 puzzle positions against 1,420 quiet master positions (25 Nov 2026):
  //   the tactic's first move lands within 2 squares of the enemy king: 59%; only 5% of all legal moves do, and 2% of
  //   the moves masters played in quiet positions; the defender's king has 0-1 pawns in front of it: 66% against 42%;
  //   the first move puts a piece where it can be taken (an offer): 65% against 9% of moves played in quiet positions;
  //   a check is there: 79-99% against 35%; one safe move hits two targets: 17-38% against 4%.
  //   Not useful: the king on its back rank (70% in tactics, 87% in quiet positions).
  //   The first move is made by a rook 26%, a knight 25%, the queen 22%, a bishop 17%, a pawn 9%; the queen moves
  //   somewhere in 56% of the solutions. 41% start with a check, 41% with a capture. 36% end in mate.
  const EASY = [
    ["Check", "Can a check be given, by him or by me?", "In 79-99% of tactics a check was there; in quiet positions 35%."],
    ["2 squares", "Look at the squares within two of each king. Which pieces can land there next move?", "59% of tactics start with a move that lands within two squares of the king; only 5% of all possible moves do."],
    ["2 pawns", "Count the pawns in front of each king. Fewer than two means that king is the target.", "66% of tactics hit a king with 0 or 1 pawns in front of it; in quiet positions 42%."],
    ["2 targets", "Can one move hit two things: a knight on the colour of two big pieces, or a rook, bishop or queen on a line with two?", "17-38% of tactics against 4% of quiet positions."],
  ];
  const EASY_EVIDENCE = [
    ["The first move lands within 2 squares of the enemy king", "59%", "5% of all legal moves"],
    ["The first move offers a piece (it can be taken)", "65%", "9% of moves played"],
    ["The king being hit has 0 or 1 pawns in front of it", "66%", "42%"],
    ["A check is there", "79-99%", "35%"],
    ["One safe move hits two targets", "17-38%", "4%"],
    ["The king is on its back rank (not useful)", "70%", "87%"],
  ];
  const WHO = [["Rook", 26], ["Knight", 25], ["Queen", 22], ["Bishop", 17], ["Pawn", 9]];
  // ---- the simplest method (Mark, 25 Nov 2026: "not simple enough, maybe a color method is better?"): a traffic
  // light. Square-colour rules were tested first and do not work (two big pieces on his knight's colour: 48% of
  // tactics, 60% of quiet positions; on his bishop's colour 48% against 63%; king and queen on one colour 36% against
  // 30%). The light, measured on 4,937 puzzle positions against 1,420 quiet master positions: red (a check, or one
  // move that hits two pieces) 87% of tactics, 37% of quiet positions; amber (no red, but a king with 0-1 pawns in
  // front) 7% against 25%; green 6% against 38%.
  const LIGHTS = [
    ["Red", "#EF4444", "A check is possible, or one move can hit two pieces (for him or for you).", "Stop. Look at every check, then every capture, then moves near the king, even ones that give a piece away.", "87%", "37%"],
    ["Amber", "#F59E0B", "No red, but a king has fewer than two pawns in front of it.", "Look at moves that land next to that king before you play.", "7%", "25%"],
    ["Green", "#16A34A", "None of these.", "Play the tested rulebook (below): a safe forcing move, else centralise a knight or bishop, else take space.", "6%", "38%"],
  ];
  const COLOUR_RULES = [
    ["King and queen on the same square colour", "36%", "30%", "Barely different"],
    ["King and queen on the colour of his knight", "17%", "15%", "No help"],
    ["Two big pieces on the colour of his knight", "48%", "60%", "Backwards"],
    ["Two big pieces on the colour of his bishop", "48%", "63%", "Backwards"],
  ];
  function lightCard() {
    return el("section", { class: "panel", id: "light-method" },
      el("div", { class: "row", style: "justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap;" },
        el("h2", { text: "The simplest method: the traffic light" }),
        el("button", { class: "btn", type: "button", text: "Print this card", onclick: () => printOnly("light-method") })),
      el("div", { class: "note", text: "Before every move, give the position a colour. One question decides red, one decides amber." }),
      el("div", { style: "display:grid; gap:10px; margin-top:10px;" }, ...LIGHTS.map(([name, hex, when, what, t, q]) =>
        el("div", { style: `display:flex; gap:14px; align-items:flex-start; padding:12px 14px; border-radius:12px; border:1px solid var(--line); border-left:8px solid ${hex};` },
          el("span", { "aria-hidden": "true", style: `flex:0 0 34px; height:34px; border-radius:50%; background:${hex}; box-shadow:0 0 0 3px rgba(0,0,0,.08);` }),
          el("div", { style: "flex:1;" },
            el("div", { style: "font-size:20px; font-weight:800;", text: name }),
            el("div", { style: "font-weight:600; margin-top:2px;", text: when }),
            el("div", { style: "margin-top:4px;", text: what }),
            el("div", { class: "note", style: "margin-top:4px;", text: `${t} of tactics were ${name.toLowerCase()}; ${q} of quiet master positions.` }))))),
      el("div", { style: "margin-top:12px; padding:12px 14px; border-radius:10px; background:var(--gold-bg); border:1px solid var(--gold-border);" },
        el("div", { style: "font-weight:700;", text: "The two questions: \"Can anyone check, or hit two pieces with one move?\" and \"Has a king fewer than two pawns in front of it?\"" }),
        el("div", { class: "note", text: "Ask them for both sides, and again on the position after your move before you let go." })));
  }
  // ---- the colour plan (Mark, 25 Nov 2026: "I will just look at the opposing side color to know what I need to do
  // ... his pawns occupy light squares ... gain the dark squares"). Measured on 49,649 master games (both 2300+),
  // positions with EQUAL material after move 20 and move 30, each side's score with the feature minus without it:
  //   his pawns mostly on one colour and no bishop of the other colour (a weak colour): +2.8 / +4.7
  //   ... and I have a bishop of that colour or a knight standing on it: +2.7 / +4.6
  //   my single bishop on the other colour from my pawns (good bishop): +2.1 / +5.0
  //   his single bishop on the colour of his pawns (bad bishop for him): +2.1 / +5.0
  //   my bishop on the colour of his pawns, to attack them: -0.2 / +0.6 (no help)
  //   my pawns opposite in colour to his: 0 / 0 (shared by both sides, gives nobody an edge)
  const COLOUR_PLAN = [
    ["1", "Which colour are his pawns on?", "Count them. The OTHER colour is his weak colour: his pawns cannot guard those squares."],
    ["2", "Has he lost the bishop of that weak colour?", "Then those squares are holes. Aim there: a knight on one of them, your bishop of that colour, your queen and rooks coming in on them."],
    ["3", "Keep your bishop of his weak colour; trade his.", "The bishop that lives on his weak colour is your best piece. If he still has his bishop of that colour, offer to trade it."],
    ["4", "Put your own pawns on the other colour from your bishop.", "Then your bishop is free and your pawns guard the squares it cannot."],
  ];
  const COLOUR_PLAN_EVIDENCE = [
    ["His pawns on one colour, his bishop of the other colour gone (a weak colour)", 2.8, 4.7],
    ["...and you own that colour (its bishop, or a knight on it)", 2.7, 4.6],
    ["Your bishop on the other colour from your pawns (a good bishop)", 2.1, 5.0],
    ["His bishop on the colour of his pawns (a bad bishop for him)", 2.1, 5.0],
    ["Your bishop on the colour of his pawns, to attack them", -0.2, 0.6],
    ["Your pawns on the opposite colour to his", 0, 0],
  ];
  // ---- the tested rulebook (Mark, 25 Nov 2026: "play stockfish with stockfish with different set of rules so which
  // technique is better so the rule is conclusive"; "true is true regardless"). Two players that both avoid blunders
  // (Stockfish, 20,000 nodes: any move within 0.8 of a pawn of the best is allowed) and have no positional sense: among
  // the allowed moves one picks by its rule, the other at random. Full games from real master positions after 8 moves,
  // each played with the rule on White and on Black. The yardstick is random against random: 50.9% in 1,800 games.
  // [rule, piece, games, score %, verdict]; verdict "Proven" = clearly above the random yardstick in both rounds.
  const RULE_TESTS = [
    ["Forcing moves first: a safe check, then a safe capture", "All pieces", 1800, 55.5, "Proven"],
    ["Centralise: knights and bishops towards the middle", "Knights, bishops", 1800, 54.7, "Proven"],
    ["Take space: pawns that guard squares in his half", "Pawns", 1800, 53.8, "Proven"],
    ["Push passed pawns", "Pawns", 1800, 52.4, "Not proven"],
    ["Keep the bishop pair", "Bishops", 1800, 52.3, "Not proven"],
    ["Keep pawns in front of your king", "King", 600, 51.3, "No effect"],
    ["Pawns on the opposite colour to his pawns", "Pawns", 600, 50.6, "No effect"],
    ["Pawns on the colour his bishop is not on", "Pawns", 600, 50.5, "No effect"],
    ["Rook on the 7th rank", "Rooks", 1800, 50.4, "No effect"],
    ["Alignment: line up on his king or queen", "Queen, rooks, bishops", 600, 50.3, "No effect"],
    ["Bring pieces near his king", "All pieces", 600, 50.1, "No effect"],
    ["Rook on an open file", "Rooks", 1800, 49.9, "No effect"],
    ["Knight on an outpost no pawn can chase", "Knights", 600, 49.8, "No effect"],
    ["Most moves for you, fewest for him (mobility)", "All pieces", 600, 49.7, "No effect"],
    ["Pawns on the colour your bishop is not on", "Pawns", 600, 49.4, "No effect"],
    ["The colour plan: take his weak colour", "Bishops, knights", 600, 48.6, "No effect"],
    ["King to the centre once the queens are off", "King", 600, 47.4, "No effect"],
  ];
  const RULEBOOK = [
    ["1", "A safe forcing move?", "Look at your checks, then your captures. If one is safe (he cannot just win the piece back with interest), play it."],
    ["2", "Else, centralise a knight or bishop.", "Move the knight or bishop that is furthest from the middle towards it."],
    ["3", "Else, take space with a pawn.", "Push a pawn so it guards squares in his half of the board."],
  ];
  // how close simple rules get to the truth: 1,500 positions from decisive master games (moves 15-40), how often each
  // judge picks the side that went on to win
  const JUDGES = [["A coin", 50], ["Counting material", 56.8], ["All 17 measured signs together", 67.9], ["Stockfish", 83.5]];
  function rulebook() {
    return el("section", { class: "panel", id: "rulebook" },
      el("div", { class: "row", style: "justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap;" },
        el("h2", { text: "The tested rulebook: what to do when the light is green" }),
        el("button", { class: "btn", type: "button", text: "Print this card", onclick: () => printOnly("rulebook") })),
      el("div", { class: "note", text: "Every rule was played, not just counted: 20,400 Stockfish games, the rule against a random chooser of equal strength. Only three rules won clearly. In this order:" }),
      el("div", { style: "display:grid; gap:10px; margin-top:10px;" }, ...RULEBOOK.map(([n, t, d]) =>
        el("div", { style: "display:flex; gap:12px; align-items:flex-start;" },
          el("span", { style: "flex:0 0 30px; height:30px; border-radius:50%; background:#16A34A; color:#fff; font-weight:800; display:flex; align-items:center; justify-content:center;", text: n }),
          el("div", {}, el("div", { style: "font-weight:600;", text: t }), el("div", { class: "note", text: d }))))),
      el("h3", { style: "margin:16px 0 6px;", text: "Every rule, tested in play (50.9% = no better than random)" }),
      table(["Rule", "Piece", "Games", "Score", "Verdict"], RULE_TESTS.map(([r, p, g, s, v]) => el("tr", {}, td(r, "font-weight:600; min-width:200px;"), td(p), td(g.toLocaleString("en-GB")), td(s.toFixed(1) + "%", "font-weight:700;"), td(pill(v, v === "Proven" ? "ok" : v === "Not proven" ? "warn" : "bad"))))),
      el("div", { class: "note", style: "margin-top:6px;", text: "Famous rules that did not win: the rook on the 7th, the open file, alignment, outposts and every square-colour rule. Mobility is the biggest sign of the winner in master games, yet chasing it does not win: the winner has more moves because he is winning, not the other way round." }),
      el("h3", { style: "margin:16px 0 6px;", text: "How far rules can take you" }),
      table(["Judge", "Picks the eventual winner"], JUDGES.map(([j, v]) => el("tr", {}, td(j, "font-weight:600;"), td(bar(v - 50, 35, v + "%"))))),
      el("div", { class: "note", style: "margin-top:6px;", text: "1,500 positions from decisive master games. Rules get you about half the way from guessing to Stockfish; the rest is calculation: what happens after these moves in this position." }));
  }
  function colourPlan() {
    const max = 5;
    return el("section", { class: "panel", id: "colour-plan" },
      el("h2", { text: "Tested and dropped: the colour plan" }),
      el("div", { class: "note", text: "Alone, it looked worth about 5 points in master games. Measured together with mobility and the bishop pair it adds about 1, and played as a rule it scored 48.6% against a random chooser (no effect). Kept here so nobody tests it again." }),
      el("div", { style: "display:grid; gap:10px; margin-top:10px;" }, ...COLOUR_PLAN.map(([n, t, d]) =>
        el("div", { style: "display:flex; gap:12px; align-items:flex-start;" },
          el("span", { style: "flex:0 0 30px; height:30px; border-radius:8px; background:linear-gradient(135deg, #f0d4a4 50%, #a5683a 50%); color:#1c1410; font-weight:800; display:flex; align-items:center; justify-content:center; border:1px solid var(--line);", text: n }),
          el("div", {}, el("div", { style: "font-weight:600;", text: t }), el("div", { class: "note", text: d }))))),
      el("div", { style: "margin-top:12px; padding:12px 14px; border-radius:10px; background:var(--gold-bg); border:1px solid var(--gold-border);" },
        el("div", { style: "font-weight:700;", text: "Example: his pawns stand on light squares (d5, e4, c4) and his light-squared bishop is gone." }),
        el("div", { class: "note", text: "The dark squares are his weak colour. Keep your dark-squared bishop, put a knight on a dark hole such as d6 or f6 (d3 or f3 for Black), bring your queen in on the dark squares, and put your own pawns on light squares so your dark bishop runs free." })),
      el("h3", { style: "margin:16px 0 6px;", text: "The evidence (49,649 master games, equal material)" }),
      table(["Colour idea", "After move 20", "After move 30"], COLOUR_PLAN_EVIDENCE.map(([name, a, b]) => el("tr", {}, td(name, "min-width:220px;"), td(bar(a, max)), td(bar(b, max))))),
      el("div", { class: "note", style: "margin-top:6px;", text: "Two ideas do not help: aiming your bishop at his pawns' colour, and simply putting your pawns opposite his (both sides then have it, so nobody gains). What wins is the colour his pawns leave empty, when his bishop of that colour is gone." }));
  }
  function colourTest() {
    return el("section", { class: "panel" },
      el("h2", { text: "Why not a square-colour rule?" }),
      el("div", { class: "note", text: "Tested on the same positions: where the pieces stand by square colour does not tell tactics from quiet positions; some rules even point the wrong way. A colour rule only works as a traffic light built from the signs that do." }),
      table(["Rule", "In tactics", "In quiet positions", "Verdict"], COLOUR_RULES.map(([r, t, q, v]) => el("tr", {}, td(r, "font-weight:600; min-width:200px;"), td(t), td(q), td(pill(v, v === "Backwards" ? "bad" : "warn"))))));
  }
  function easyCard() {
    return el("section", { class: "panel", id: "easy-method" },
      el("div", { class: "row", style: "justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap;" },
        el("h2", { text: "More detail: Check plus 2-2-2" }),
        el("button", { class: "btn", type: "button", text: "Print this card", onclick: () => printOnly("easy-method") })),
      el("div", { class: "note", text: "Four looks, about five seconds, every move. Do them for his king (to attack) and for yours (to defend)." }),
      el("div", { style: "display:grid; grid-template-columns:repeat(auto-fit, minmax(210px, 1fr)); gap:10px; margin-top:10px;" }, ...EASY.map(([big, what, why]) =>
        el("div", { style: "padding:12px 14px; border-radius:12px; border:1px solid var(--gold-border); background:var(--gold-bg);" },
          el("div", { style: "font-size:24px; font-weight:800; color:var(--gold); line-height:1.1;", text: big }),
          el("div", { style: "font-weight:600; margin-top:6px;", text: what }),
          el("div", { class: "note", style: "margin-top:4px;", text: why })))),
      el("div", { style: "margin-top:14px; display:grid; gap:8px;" },
        el("div", {}, el("b", { text: "Two or more yes: stop. " }), "Look at every check first, then every capture, then every move that lands within two squares of the king, even if it gives a piece away. Most tactics start with a move that can be taken (65%, against 9% of normal moves), so never skip a move just because it hangs something."),
        el("div", {}, el("b", { text: "None: play the rulebook. " }), "A safe forcing move, else centralise a knight or bishop, else take space with a pawn."),
        el("div", {}, el("b", { text: "Before you let go: " }), "the four looks once more, on the position after your move.")),
      el("div", { class: "note", style: "margin-top:10px;", text: "Which piece starts the tactic: " + WHO.map(([p, v]) => `${p} ${v}%`).join(", ") + ". The queen joins in more than half of them (56%): when you look at his pieces, start with the queen, then the rooks and knights." }));
  }
  function easyEvidence() {
    return el("section", { class: "panel" },
      el("h2", { text: "Why 2-2-2: where tactics really come from" }),
      el("div", { class: "note", text: "4,922 positions from the puzzle books against 1,420 quiet master positions." }),
      table(["Sign", "In tactics", "In quiet positions"], EASY_EVIDENCE.map(([s, t, q]) => el("tr", {}, td(s, "font-weight:600; min-width:200px;"), td(t, "font-weight:700;"), td(q)))));
  }
  // printing prints only the card whose button was pressed, on white paper with dark text
  const PRINT = "@media print { body * { visibility: hidden !important; } .print-me, .print-me * { visibility: visible !important; color: #111 !important; } .print-me { position: absolute; left: 0; top: 0; width: 100%; background: #fff !important; box-shadow: none !important; border: 0 !important; } .print-me button { display: none !important; } }";
  function printOnly(id) {
    for (const n of document.querySelectorAll(".print-me")) n.classList.remove("print-me");
    const card = document.getElementById(id); if (card) card.classList.add("print-me");
    window.print();
  }
  function view() {
    return el("div", {}, el("style", { text: PRINT }), verdict(), lightCard(), rulebook(), colourPlan(), colourTest(), easyCard(), easyEvidence(), methodCard(), signsTable(), chuzhakinTest(), systemsTable(), habitsTable(), limits());
  }
  window.MethodsTab = { view, STEPS, SIGNS, HABITS, SYSTEMS, EASY, EASY_EVIDENCE, WHO, LIGHTS, COLOUR_RULES, COLOUR_PLAN, COLOUR_PLAN_EVIDENCE, RULE_TESTS, RULEBOOK, JUDGES };
})();
