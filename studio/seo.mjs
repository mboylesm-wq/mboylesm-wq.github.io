// PnoyChess Studio: the ONE SEO engine (Mark, 4 Nov 2026). Pure code, no Node or browser APIs, so the same file runs
// in the channel audit (tools/yt-channel.mjs), the publisher (chess/publisher: Shorts titles, descriptions, tags,
// playlists) and the Studio page (published as studio/seo.mjs: the score of a reel's YouTube copy before it goes out).
// It never promises rankings: it checks what YouTube can read (title, first lines, hashtags, tags, chapters, captions,
// playlists, language) and, for chess, whether the names people search (the players, the opening) are where YouTube
// reads them.

export const answerLine = (firstComment) => "Answer: " + String(firstComment).replace(/^\s*Answer:\s*/i, "");

// ---------- the checks: one video ----------
const words = (t) => (String(t).toLowerCase().match(/[\p{L}\p{N}]{4,}/gu) || []);
const STOPW = new Set("this that with from what when where which their there they have will your about into than then them these those were been being after before over under just like only more most also very chess".split(" "));
export const stamps = (d) => (String(d).match(/^\s*\(?(\d{1,2}:)?\d{1,2}:\d{2}\)?\s+\S/gm) || []).length;
export const hashtags = (d) => String(d).match(/(^|\s)#[\p{L}\p{N}_]+/gu) || [];
export const tagChars = (tags) => (tags || []).reduce((n, t) => n + String(t).length + (/\s/.test(t) ? 2 : 0), 0) + Math.max(0, (tags || []).length - 1);

// v: {title, description, tags, seconds, short, caption, hd, playlists, lang, audioLang, loc[], kids}
export function scoreVideo(v, { filipino = true } = {}) {
  const c = [], add = (id, ok, w, label, fix) => c.push({ id, ok: !!ok, w, label, fix: ok ? "" : fix });
  const t = String(v.title || ""), d = String(v.description || ""), hook = d.slice(0, 150), caps = (t.match(/\p{Lu}/gu) || []).length, letters = (t.match(/\p{L}/gu) || []).length;
  const tw = new Set(words(t).filter((w) => !STOPW.has(w)));
  if (v.short) add("title", t.length >= 15 && t.length <= 60, 10, "Short title (15–60 characters)", "Shorts titles are read in a second: 15–60 characters, the hook first.");
  else add("title", t.length >= 30 && t.length <= 70, 10, "Title 30–70 characters", t.length > 70 ? "Phones cut the title after about 70 characters: put the hook first and shorten it." : "A longer title (30–70 characters) with the topic and a reason to click ranks and sells better.");
  add("caps", letters < 8 || caps / letters < 0.6, 3, "Not shouting in capitals", "Use capitals for one word at most; an all-caps title looks like spam.");
  add("hook", hook.replace(/\s+/g, " ").trim().length >= 70 && words(hook).some((w) => tw.has(w)), 10, "The first 2 lines sell the video", "The first 150 characters show in search: say what the video is about with the title's key words.");
  add("desc", d.length >= (v.short ? 60 : 600), v.short ? 4 : 6, v.short ? "A description" : "Description 600+ characters", v.short ? "Add a line or two: what happens, and a link to the full video." : "Add a short summary, the chapters, sources and links (600+ characters) so YouTube understands the topic.");
  if (!v.short && (v.seconds || 0) >= 180) add("chapters", /(^|\n)\s*\(?0?0:00\)?\s/.test(d) && stamps(d) >= 3, 10, "Chapters (0:00 and 3+ timestamps)", "Add chapters: a line per chapter starting with 0:00. They show in search and keep viewers watching.");
  const h = hashtags(d).length;
  add("hashtags", h >= 1 && h <= 5, 4, "1–5 hashtags", h > 15 ? "More than 15 hashtags makes YouTube ignore them all: keep 3." : h > 5 ? "Keep 3 hashtags (the first 3 show above the title)." : "Add 2–3 hashtags at the end, e.g. #chess #PnoyChess #ahedres.");
  add("links", /youtu\.?be|youtube\.com|(^|\s)@\w/i.test(d), v.short ? 3 : 5, "Links to more videos", "Link the full video, a playlist or the next video, so viewers stay on the channel.");
  add("tags", (v.tags || []).length >= 3 && tagChars(v.tags) <= 500, 2, "Tags (3+, under 500 characters)", "Add a few tags, mainly names and spellings people search (tags count only a little now).");
  if (!v.short) add("thumb", v.hd, 5, "HD thumbnail (1280×720)", "Upload a 1280×720 thumbnail.");
  add("captions", v.caption, 7, "Uploaded subtitles", "Upload the subtitles (.srt): auto-captions do not count, uploaded ones help search and viewers on mute.");
  add("playlist", (v.playlists || 0) > 0, v.short ? 3 : 8, "In a playlist", "Put it in a playlist (a series): playlists keep people watching the next video.");
  add("language", !!(v.lang && v.audioLang), 4, "Video language set", "Set the title and audio language (English, or Filipino) so YouTube shows it to the right viewers.");
  if (filipino) add("tagalog", (v.loc || []).some((k) => /^(fil|tl)\b/i.test(k)), 6, "Filipino title and description", "Add a Filipino (Tagalog) title and description: viewers in the Philippines then see it in their language.");
  add("kids", !v.kids, 6, "Not 'made for kids'", "Made for kids turns off comments, notifications and most recommendations: set it to No if it is not for children.");
  for (const x of chessChecks(v)) c.push({ ...x, fix: x.ok ? "" : x.fix });
  const all = c.reduce((n, x) => n + x.w, 0), got = c.reduce((n, x) => n + (x.ok ? x.w : 0), 0);
  return { score: Math.round((100 * got) / all), checks: c };
}


// ---------- chess-aware checks (Part 6): v.chess = {players: [...], opening, event} when the content is known ----------
const surname = (n) => String(n || "").replace(/,.*$/, "").trim().split(/\s+/).pop() || "";
export function chessTerms(c) {
  if (!c) return [];
  const ps = (c.players || []).map(surname).filter((s) => s.length >= 3 && !/^\?+$/.test(s));
  const op = String(c.opening || "").split(/[:,]/)[0].trim();
  return [...new Set([...ps, ...(op.length >= 4 ? [op] : [])])];
}
export function chessChecks(v) {
  const terms = chessTerms(v.chess); if (!terms.length) return [];
  const t = String(v.title || "").toLowerCase(), head = String(v.description || "").slice(0, 200).toLowerCase(), tags = (v.tags || []).map((x) => String(x).toLowerCase());
  const has = (s) => (x) => s.includes(x.toLowerCase());
  const out = [];
  out.push({ id: "chess-names", ok: terms.some(has(t)) || terms.some(has(head)), w: 6, label: "A searched name in the title or first lines (" + terms.join(", ") + ")",
    fix: "Put a player's name or the opening (" + terms.join(", ") + ") in the title or the first line: these are what people type into search." });
  out.push({ id: "chess-tags", ok: terms.every((x) => tags.some((g) => g.includes(x.toLowerCase()))), w: 3, label: "Players and opening in the tags",
    fix: "Add the players' names and the opening as tags (" + terms.join(", ") + ")." });
  return out;
}

// Title = the caption's first line (the hook) + #Shorts; description = the caption (+ puzzle answer below the fold).
// Puzzle reels all open with the same long ask ("Chess puzzle: can you find the best move? The answer is at the end
// of the video."), which made every puzzle Short the same 88-character title. Their YouTube title is now short and
// different per puzzle: side to move + the ask + the opening, all read from the caption and answer (no spoiler).
// The description still starts with the caption's first line, so the never-post-twice check still matches.
const TITLE_MAX = 60; // Shorts titles: the channel audit (pnoychess-docu tools/yt-channel.mjs) wants 15-60 characters
function puzzleTitle(text, answer) {
  const first = text.split("\n")[0];
  if (!/^chess puzzle\b/i.test(first)) return null;
  const mate = first.match(/mate in (\d+)/i), ask = mate ? `find mate in ${mate[1]}` : "find the best move";
  const ans = String(answer || ""), side = /^\s*(?:answer:\s*)?\d+\s*\.\.\./i.test(ans) ? "Black" : /^\s*(?:answer:\s*)?\d+\.\s*[^.]/i.test(ans) ? "White" : "";
  const op = ((text.match(/^Opening:\s*([^\n,]+)/m) || [])[1] || "").trim();
  const tries = [side && op && `${side} to move: ${ask} | ${op}`, op && `Chess puzzle: ${ask} | ${op}`, side && `Chess puzzle: ${side} to move, ${ask}`, `Chess puzzle: ${ask}`];
  return tries.filter(Boolean).find((t) => t.length + 8 <= TITLE_MAX) || `Chess puzzle: ${ask}`;
}
const tagLen = (tags) => tags.reduce((n, t) => n + t.length + (/\s/.test(t) ? 2 : 0), 0) + Math.max(0, tags.length - 1);
export function shortMeta(item) {
  // a documentary Short brings its own (tools/post-shorts.mjs ytMeta: title, description with the full video's link)
  if (item.yt && item.yt.title) return { title: item.yt.title, description: item.yt.description || "", tags: item.yt.tags || [], synthetic: !!item.yt.synthetic };
  const text = String(item.text || "").replace(/[<>]/g, "").trim();
  const first = puzzleTitle(text, item.firstComment) || text.split("\n")[0].trim() || item.title || "Chess reel";
  const title = (first.length > 90 ? first.slice(0, 89) + "…" : first) + (/#shorts/i.test(first) ? "" : " #Shorts");
  const hashtags = (text.match(/#[\p{L}\p{N}_]+/gu) || []).map((h) => h.slice(1)).filter((h) => !/^shorts$/i.test(h));
  // YouTube refuses the whole upload when the tags pass 500 characters (quoted multi-word tags count 2 more)
  const tags = [];
  const opening = ((text.match(/^Opening:\s*([^\n,]+)/m) || [])[1] || "").trim(); // the opening is what people search too
  for (const t of new Set([...hashtags, "chess", "PnoyChess", item.white, item.black, opening].filter(Boolean).map(String))) if (tags.length < 30 && tagLen([...tags, t]) <= 480) tags.push(t);
  // #Shorts is already in the title; adding it to the description too made 6 hashtags (YouTube shows 3, the audit wants 1-5)
  const description = (text + (item.firstComment ? "\n\n\n\n\n\n" + answerLine(item.firstComment) : "") + (/#shorts/i.test(text + title) ? "" : "\n#Shorts")).slice(0, 4900);
  return { title, description, tags };
}

// Playlists (Mark, 4 Nov): every Short goes into a series playlist on upload, so viewers get the next one and the channel
// audit's "In a playlist" check passes. Found by exact title first (also one made by PnoyChess Docu's channel autopilot,
// which looks titles up the same way), made public only when missing. Costs 1 unit to look up, 50 to add (+50 once to make).
export function playlistFor(item, cfg = {}) {
  const pl = { puzzle: "Chess Puzzles: Find the Move", game: "Classic Chess Games in 60 Seconds", ...(cfg.youtubePlaylists || {}) };
  if (item.kind === "docu-short") return { kind: "docu", title: pl.docu || "Chess History in 60 Seconds", description: "Short cuts from the PnoyChess chess documentaries: the stories behind the games and the players. Every Short links to its full documentary." };
  const puzzle = !!item.pod || /^chess puzzle\b/i.test(String(item.text || "").trim());
  return { kind: puzzle ? "puzzle" : "game", title: puzzle ? pl.puzzle : pl.game,
    description: puzzle ? "Find the best move: one chess puzzle at a time, every answer checked by Stockfish. New puzzles from PnoyChess every other day."
      : "Famous chess games told in under a minute, with notes from the masters' own books. A new one from PnoyChess every day." };
}
