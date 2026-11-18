// PnoyChess Studio · Viral: one scoring engine for "what to make next" — how hot a chess story is right now, and how
// likely it is to travel. Pure code (no Node or browser APIs): the page loads it as viral.mjs, and the weekly trend
// radar writes its score with each topic. No AI, no paid API, and no promise of views: every score carries its parts.
// The words it weighs are the channel's own (db/channel/health.json's best videos, the FIDE top-50 list the week's
// games carry), never a guess about what "the algorithm" likes.

export const DAY = 864e5;

// The five things a topic is judged on, and how much each is worth. They add up to 100.
export const PARTS = [
  { id: "heat", weight: 25, label: "Hot right now", say: "how fresh the story is" },
  { id: "demand", weight: 25, label: "People search it", say: "a name, a fight or a record people type into search" },
  { id: "hook", weight: 25, label: "A story with a hook", say: "the title is a story, not a tournament report" },
  { id: "fit", weight: 15, label: "PnoyChess fit", say: "the Filipino angle and the channel's own subjects" },
  { id: "proven", weight: 10, label: "Like our best videos", say: "the words our most-watched videos already have" },
];

// ---------- who people search for: the players named in a topic ----------
// [what to look for, how it is written when it becomes a title]. Longest first, so "Wesley So" wins over "So".
export const PLAYERS = [
  ["wesley so", "Wesley So"], ["magnus carlsen", "Magnus Carlsen"], ["carlsen", "Magnus Carlsen"], ["kasparov", "Garry Kasparov"],
  ["fischer", "Bobby Fischer"], ["mikhail tal", "Mikhail Tal"], ["tal", "Mikhail Tal"], ["morphy", "Paul Morphy"],
  ["gukesh", "Gukesh Dommaraju"], ["anand", "Viswanathan Anand"], ["nakamura", "Hikaru Nakamura"], ["capablanca", "José Raúl Capablanca"],
  ["alekhine", "Alexander Alekhine"], ["karpov", "Anatoly Karpov"], ["torre", "Eugenio Torre"], ["judit polgar", "Judit Polgar"],
  ["polgar", "Judit Polgar"], ["firouzja", "Alireza Firouzja"], ["sindarov", "Javokhir Sindarov"], ["abdusattorov", "Nodirbek Abdusattorov"],
  ["praggnanandhaa", "R. Praggnanandhaa"], ["pragg", "R. Praggnanandhaa"], ["ding liren", "Ding Liren"], ["ding", "Ding Liren"],
  ["nezhmetdinov", "Rashid Nezhmetdinov"], ["menchik", "Vera Menchik"], ["rubinstein", "Akiba Rubinstein"], ["bronstein", "David Bronstein"],
  ["keres", "Paul Keres"], ["petrosian", "Tigran Petrosian"], ["euwe", "Max Euwe"], ["botvinnik", "Mikhail Botvinnik"],
  ["kramnik", "Vladimir Kramnik"], ["topalov", "Veselin Topalov"], ["caruana", "Fabiano Caruana"], ["aronian", "Levon Aronian"],
  ["hou yifan", "Hou Yifan"], ["mutesi", "Phiona Mutesi"], ["sultan khan", "Mir Sultan Khan"], ["korchnoi", "Viktor Korchnoi"],
  ["giri", "Anish Giri"], ["so, wesley", "Wesley So"], ["niemann", "Hans Niemann"], ["vaishali", "Vaishali Rameshbabu"],
];

// What makes a chess story travel: a fight, a stake, a record, a famous moment. Each group counts once.
const DEMAND = [
  [14, "a fight or a scandal", /\b(cheat\w*|scandal|lawsuit|banned|forfeit\w*|defect\w*|spy|spies|hypno\w*|poison\w*|conspiracy|hoax|death|died|killed|war|prison|refus\w*|quit|walked away|resign\w* from)\b/i],
  [12, "a record or a first", /\b(youngest|oldest|record|first|fastest|greatest|longest|unbeaten|invincible|perfect|100%|highest|million|dollars)\b/i],
  [10, "a result people click", /\b(beats?|beat|crush\w*|destroy\w*|wins?|won|loses?|lost|upset\w*|defeat\w*|dethron\w*|stuns?|shock\w*)\b/i],
  [8, "a chess moment people know", /\b(sacrific\w*|queen|mate|checkmate|gambit|trap|fork|pin|blunder\w*|endgame|opening|immortal|opera)\b/i],
];

// The story behind the story: a title that names one of these reads as a film, not as a wire report.
// The third value says what the story may be hung on (18 Nov 2026 audit):
//   "names" - a player's name plus this story states a fact about the chess ("the sacrifice", "the comeback")
//   "pair"  - only the headline itself or two names may carry it. "Hans Niemann: the scandal", "Fischer: the last
//             days" and "Kramnik: the collapse" accuse or bury a man the topic never accused: the name is the subject
//             of the sentence, so it reads as a claim about him.
// `queen` used to map to "the sacrifice", so a headline that merely mentioned a queen ("the Queen's Gambit", "a queen
// endgame") offered "<Player>: the sacrifice". A queen is not a sacrifice; only the word for one is.
const STORY = [
  [/\bsacrific\w*|\bsac\b/i, "the sacrifice", "names"],
  [/\bgambit\b/i, "the gambit", "names"],
  [/\bcheat\w*|scandal|lawsuit|toilet|anal beads/i, "the scandal", "pair"],
  [/\bdefect\w*|fled? the (ussr|soviet)|asylum/i, "the defection", "pair"],
  [/\bhoax|mechanical turk|fraud/i, "the greatest hoax", "pair"],
  [/\bcomeback|returned|rematch/i, "the comeback", "names"],
  [/\bcollapse|broke down|breakdown|depress\w*|madness|mind\b/i, "the collapse", "pair"],
  [/\bunbeaten|invincib\w*|never lost/i, "the unbeaten run", "names"],
  [/\byoungest|teenager|prodigy\b/i, "the youngest champion", "names"],
  [/\bdied|death|killed|murder\w*/i, "the last days", "pair"],
  [/\bfirst\b/i, "the first", "names"],
  [/\bdirty tricks|hypno\w*|mirror glasses/i, "match of dirty tricks", "pair"],
  [/\bstopp?ed\b|no winner|abandon\w*/i, "the match nobody won", "pair"],
];

const HOOK_OPEN = /^(the day|the night|the man|the woman|the game|the match|the boy|the girl|the queen|the king|how |why |what happened|inside |nobody |no one |when )/i;
const HOOK_WORD = /\b(secret|mystery|hidden|never|nobody|no one|last|final|vanished|disappear\w*|hoax|scandal|trap|stopped|almost|nearly|betray\w*)\b/i;
const PH_WORDS = /\b(philippin\w*|filipin\w*|pinoy|manila|baguio|iloilo|cebu|dasmari\w*|plaza|barangay)\b|wesley so|eugenio torre|quizon|frayna|sadorra|barcenilla|villamayor|campomanes|cardoso|paragua/i;

const text = (t) => [t.title, t.angle, t.why].filter(Boolean).join(" · ");
const clamp = (n, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(n)));
// words that say nothing about a story: they are in every title, so they teach the score nothing
const FILLER = new Set("this that with from what when where which their there they have will your about into than then them these those were been being after before over under just like only more most also very both draw draws game games wins won year years title play plays played first last says said".split(" "));
const words = (s) => (String(s || "").toLowerCase().match(/[\p{L}\p{N}]{4,}/gu) || []).filter((w) => !FILLER.has(w));
const has = (t, name) => new RegExp("(^|[^\\p{L}])" + name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "($|[^\\p{L}])", "iu").test(t);

// ---------- what the channel's own best videos are made of ----------
// A word that shows up in the top tenth of the channel's videos far more often than in the rest is worth something:
// views per video are the only honest signal the page has, so this is a straight lift, clamped, and only for words
// seen in three videos or more. Returns null when there is too little to learn from, and every score then stays neutral.
export function affinitiesFromVideos(videos = []) {
  const list = (videos || []).filter((v) => v && v.title && v.views != null);
  if (list.length < 20) return null;
  const sorted = list.map((v) => v.views).sort((a, b) => a - b);
  const cut = sorted[Math.floor(sorted.length * 0.9)] || 0;
  const seen = new Map();
  let tops = 0;
  for (const v of list) {
    const top = v.views >= cut && v.views > 0;
    if (top) tops++;
    for (const w of new Set(words(v.title))) {
      const s = seen.get(w) || { all: 0, top: 0 };
      s.all++; if (top) s.top++; seen.set(w, s);
    }
  }
  if (!tops) return null;
  const share = tops / list.length, out = {};
  for (const [w, s] of seen) {
    if (s.all < 4) continue; // three videos is a coincidence, not a habit
    const want = share * s.all;
    const lift = (s.top - want) / Math.max(1, want);
    // a word seen four times is weaker evidence than one seen forty: the lift is scaled by how much there is to see
    out[w] = Math.max(-1, Math.min(1, lift * Math.min(1, Math.sqrt(s.all / 20))));
  }
  return out;
}

// The Filipino angle: this channel's own story, and the page's filter for it. One rule, so the filter can never keep a
// topic that the score itself did not count as Filipino.
export const filipino = (topic = {}) => PH_WORDS.test(text(typeof topic === "string" ? { title: topic } : topic));

// ---------- one topic ----------
// opts: { now, affinities (affinitiesFromVideos), top (db/fide/top.json), projects (db/projects records) }
export function scoreTopic(input = {}, opts = {}) {
  const topic = typeof input === "string" ? { title: input } : (input || {});
  const now = opts.now != null ? opts.now : Date.now();
  const all = text(topic), title = String(topic.title || "");
  const parts = [];
  const add = (id, score, say) => { const p = PARTS.find((x) => x.id === id); parts.push({ id, label: p.label, weight: p.weight, score: clamp(score), say }); };

  // 1. heat: a story from this week, out today
  const added = Date.parse(topic.added || "") || NaN;
  const age = Number.isFinite(added) ? (now - added) / DAY : 7;
  const timely = topic.kind !== "evergreen";
  let heat, heatSay;
  if (timely) {
    heat = age <= 0.75 ? 100 : age <= 1.5 ? 96 : age <= 2.5 ? 88 : age <= 4 ? 78 : age <= 7 ? 66 : age <= 10 ? 54 : age <= 14 ? 42 : age <= 21 ? 32 : 22;
    heatSay = age <= 1.5 ? "in the news today" : `in the news ${Math.max(1, Math.round(age))} days ago`;
  } else {
    heat = 48; heatSay = "an evergreen story: it never expires, but nothing is pushing it this week";
    if (/^on this day/im.test(String(topic.why || ""))) { heat = 74; heatSay = "on this day: a free hook for today"; }
  }
  add("heat", heat, heatSay);

  // 2. demand: does the title carry something people type into search
  let demand = 30; const demandSay = [];
  const hit = PLAYERS.find(([k]) => has(all, k));
  if (hit) { demand += 16; demandSay.push(hit[1]); }
  // a word in the headline counts double what a word in the feed's own summary counts
  for (const [pts, say, re] of DEMAND) {
    const inTitle = re.test(title);
    if (inTitle || re.test(String(topic.angle || ""))) { demand += inTitle ? pts : pts / 2; demandSay.push(say); }
  }
  // on the world list this week (tools/fide-top.mjs → db/fide/top.json): a live player beats a historic one
  const top = opts.top || null;
  if (hit && top) {
    const sur = hit[1].split(" ").pop().toLowerCase();
    const on = [...(top.men || []), ...(top.women || [])].find((p) => String(p.name || "").toLowerCase().split(/\s+/).includes(sur));
    if (on) { demand += 6; demandSay.push(`world #${on.rank} this month`); }
  }
  add("demand", demand, demandSay.length ? demandSay.join(" · ") : "nothing here that people search for yet");

  // 3. hook: a story, not a report (judged on the headline itself: a film title cannot promise what the feed said).
  // The shapes that work are the channel's own ("The day …", "<Player>: <promise>"); a headline with none of them is
  // a tournament report however fresh it is, and it is capped there.
  let hook = 35, shapes = 0; const hookSay = [];
  if (STORY.some(([re]) => re.test(title))) { hook += 20; shapes++; hookSay.push("it has a story behind it"); }
  if (title.includes(":")) { hook += 20; shapes++; hookSay.push("a name and a promise"); }
  if (HOOK_OPEN.test(title)) { hook += 25; shapes++; hookSay.push("opens a story"); }
  if (HOOK_WORD.test(title)) { hook += 10; shapes++; hookSay.push("a word that makes people look"); }
  if (PLAYERS.some(([k]) => has(title, k))) { hook += 6; hookSay.push("a player's name in the title"); }
  if (/\b(1[89]\d\d|20\d\d)\b/.test(title)) { hook += 8; hookSay.push("a year, so it is a real story"); }
  if (/\d/.test(title.replace(/\b(1[89]\d\d|20\d\d)\b/g, ""))) { hook += 5; hookSay.push("a number"); }
  if (title.length > 80) { hook -= 30; hookSay.push("a long wire headline, not a story"); }
  else if (title.length > 70) { hook -= 12; hookSay.push("long for a phone"); }
  else if (title.length < 15) { hook -= 8; hookSay.push("too short to promise anything"); }
  if (!shapes) { hook = Math.min(hook, 40); hookSay.push("a report, not a story"); }
  add("hook", hook, hookSay.length ? hookSay.join(" · ") : "reads like a tournament report");

  // 4. fit: why this belongs on PnoyChess
  let fit = 50, fitSay = "a chess story from elsewhere";
  if (filipino(topic)) { fit = 100; fitSay = "the Filipino angle, the channel's own story"; }
  else if (hit) { fit = 85; fitSay = `a player the channel already covers (${hit[1]})`; }
  else if (/\b(world championship|olympiad|fide)\b/i.test(all)) { fit = 75; fitSay = "a world title or FIDE story"; }
  else if (topic.kind !== "evergreen") { fit = 65; fitSay = "this week's news: needs a PnoyChess angle in the writing"; }
  add("fit", fit, fitSay);

  // 5. proven: the words the channel's best videos already have
  const aff = opts.affinities || null;
  let proven = 50, provenSay = "no channel history read yet";
  if (aff) {
    const seen = [...new Set(words(title + " " + (topic.angle || "")))].filter((w) => aff[w] != null);
    if (seen.length) {
      const lift = seen.reduce((n, w) => n + aff[w], 0) / seen.length;
      proven = clamp(50 + 50 * lift); provenSay = `our best videos share ${seen.slice(0, 4).join(", ")}`;
    } else provenSay = "none of our best videos' words are here yet";
  }
  add("proven", proven, provenSay);

  const total = Math.round(parts.reduce((n, p) => n + (p.score * p.weight) / 100, 0));
  const made = madeIn(topic, opts.projects);
  const out = { topic, score: made ? Math.min(total, 35) : total, parts, format: formatFor(topic, all, hit), hooks: titleOptions(topic), made };
  Object.assign(out, grade(out.score));
  if (made) out.why = `Already made as "${made.title || made.id}"`;
  return out;
}

// the grade in plain words, and the colour the page uses for it. The cuts are set from what the radar actually
// produces (Nov 2026: most topics 33-66, a trending top-50 game 60-99), so a word never says more than the number.
export function grade(score) {
  if (score >= 78) return { grade: "Put it out now", tone: "hot" };
  if (score >= 62) return { grade: "Strong", tone: "strong" };
  if (score >= 48) return { grade: "Worth a look", tone: "look" };
  return { grade: "Slow", tone: "slow" };
}

// What to make of it: a game review when it is a game, a short explainer while the news is warm, a documentary when
// the story is the point. (The channel cuts its Shorts from a finished video: tools/shorts.mjs.)
function formatFor(topic, all, hit) {
  const title = String(topic.title || "");
  const game = /\bvs\.?\b/i.test(title) || (topic.game && topic.game.white);
  if (game) return { kind: "review", label: "Game review", minutes: 20, why: "Your PC analyses the game with Stockfish, then the review writes itself from the moves" };
  const timely = topic.kind !== "evergreen";
  const story = HOOK_OPEN.test(title) || STORY.some(([re]) => re.test(title));
  if (timely && !story) return { kind: "quick", label: "Quick explainer", minutes: 5, why: "The news is warm for a few days: explain it now, then cut two Shorts from it" };
  return { kind: "docu", label: "Documentary", minutes: timely ? 10 : 12, why: "A story with a beginning and an end: it keeps selling long after the news is gone" };
}

// ---------- title starting points ----------
// Two shapes only, both noun phrases, so the grammar cannot break: "<Player>: the <story>" and
// "<A> vs <B>: <story>". Nothing is invented: without a story in the topic there is no second option, and a story
// marked "pair" (a scandal, a death, a breakdown) is never hung on one player's name: "Hans Niemann: the scandal"
// would say he did something the topic never said. Mark edits them in Write; nothing here is sent anywhere.
export function titleOptions(topic = {}) {
  const title = String(topic.title || "").replace(/\s+/g, " ").trim();
  const hit = STORY.find(([re]) => re.test(title)), story = hit && hit[1], onNames = !!hit && hit[2] === "names";
  const found = PLAYERS.filter(([k]) => has(title, k)).map(([, n]) => n).filter((n, i, a) => a.indexOf(n) === i);
  const out = [{ text: clip(title, 70), pattern: "the headline as it stands" }];
  if (found.length >= 2 && /\bvs\.?\b/i.test(title)) {
    out.push({ text: clip(`${found[0]} vs ${found[1]}: ${story || "the game"}`, 90), pattern: "the two names, then the promise" });
  } else if (found.length && onNames && !title.toLowerCase().startsWith(story)) {
    out.push({ text: clip(`${found[0]}: ${story}`, 90), pattern: "the player, then the story" });
  }
  return out.filter((o, i, a) => o.text && a.findIndex((x) => x.text === o.text) === i).slice(0, 3);
}

const clip = (s, n) => { const t = String(s || "").trim(); if (t.length <= n) return t; const cut = t.slice(0, n - 1); return cut.slice(0, Math.max(cut.lastIndexOf(" "), 10)).replace(/[,;:·–-]$/, "") + "…"; };

// ---------- the games ----------
// A trending game (db/trendgames: The Week in Chess, only FIDE top-50 players) → how far it could travel: the rank of
// the best player in it, a decisive game, and above all an upset, because "number 60 beats the world number 1" is the
// one chess headline a non-chess player clicks. Ranks come from the stored `tops` (tools/fide-top.mjs).
export function gameViral(game = {}, opts = {}) {
  const tops = game.tops || [];
  const best = tops.slice().sort((a, b) => a.rank - b.rank)[0] || null;
  const we = +game.whiteElo || 0, be = +game.blackElo || 0;
  const winner = game.result === "1-0" ? "white" : game.result === "0-1" ? "black" : "";
  const wElo = winner === "white" ? we : be, lElo = winner === "white" ? be : we;
  const upset = winner && wElo && lElo && wElo < lElo - 40 ? { by: winner === "white" ? game.white : game.black, over: winner === "white" ? game.black : game.white, gap: lElo - wElo } : null;
  // a game is worth a video when a famous player is in it, and worth a click when the famous one lost
  let score = 30 + (101 - (best ? best.rank : 60)) * 0.3;
  if (best && best.rank <= 10) score += 5;
  if (winner) score += 7;
  if (game.speed === "classical") score += 3;
  if ((game.moves || 0) >= 25 && (game.moves || 0) <= 90) score += 3;
  if (upset) score += Math.min(22, upset.gap / 9);
  if (game.phi) score += 10;
  // the words in the players' names, the same history the topics use
  const aff = opts.affinities || null;
  if (aff) {
    const seen = [...new Set(words(`${game.white} ${game.black} ${game.event || ""}`))].filter((w) => aff[w] != null);
    if (seen.length) score += 10 * (seen.reduce((n, w) => n + aff[w], 0) / seen.length);
  }
  score = clamp(score);
  const say = [best ? `world #${best.rank} ${best.name}` : "", upset ? `${surname(upset.by)} (${wElo}) beats ${surname(upset.over)} (${lElo})` : winner ? "decisive" : "a draw", game.phi ? "Filipino player" : ""].filter(Boolean).join(" · ");
  return { score, say, upset, ...grade(score) };
}

const surname = (n) => String(n || "").split(",")[0].trim();

// ---------- the list ----------
// Newest fit first: a topic already made is kept (Mark may want to see it) but sorted last.
export function rankTopics(topics = [], opts = {}) {
  return topics.map((t) => scoreTopic(t, opts)).sort((a, b) => (a.made ? 1 : 0) - (b.made ? 1 : 0) || b.score - a.score);
}

// ---------- "have I already made this?" ----------
// The same rule the trend radar uses to archive a topic it sees as a project (tools/trends.mjs imports this): three
// shared story words, or two when one of them is a year.
export const STOP = new Set("the a an of and in on to s who how why what when vs versus chess world championship champion title match game grandmaster story".split(" "));
export const storyWords = (s) => new Set(String(s || "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim().split(" ").filter((w) => w && !STOP.has(w)));
export function sameStory(a, b) { const shared = [...a].filter((w) => b.has(w)); return shared.length >= 3 || (shared.length >= 2 && shared.some((w) => /^\d{4}$/.test(w))); }
export function madeIn(topic = {}, projects = []) {
  const t = storyWords(topic.title); if (t.size < 2) return null;
  const key = String(topic.title || "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  for (const p of projects || []) {
    for (const k of [p.title, p.topic]) {
      const other = String(k || "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
      if (other.length < 8) continue;
      if (other === key || other.includes(key) || key.includes(other) || sameStory(t, storyWords(other))) return p;
    }
  }
  return null;
}
