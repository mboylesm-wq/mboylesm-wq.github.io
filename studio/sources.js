// PnoyChess Studio · where each daily reel's game comes from.
// Every slot of chess/publisher/days/<D>.json carries its source PGN: the file it was taken from (chess/tools/reel-sources.js
// writes them: the CLASSICS archive, the puzzle pack, a study PGN collection, a Remotion plan, or the old reel studio's record)
// plus the PGN itself. This module draws that block on the Schedule and Review cards and builds the direct link to the PGN
// viewer (#pgn/<date>/<key>) in the same page.
// Uses the page's el(). Loaded on first use with loadOnce("sources.js").
(function () {
  "use strict";

  const KIND = {
    archive: ["ok", "Classics archive", "the 1,014-game archive every reel is rendered from"],
    mega: ["ok", "Your local database", "the same game in Commented Chess Games 2026.pgn on your PC (line given)"],
    puzzle: ["ok", "Puzzle pack", "Puzzle of the Day pack, from the Lichess puzzle database (CC0)"],
    study: ["ok", "Study PGN", "a PGN collection in C:\\PnoyChess\\study\\games (outside git)"],
    "study-guess": ["warn", "Study PGN (inferred)", "the collection is named in the reel id; the exact game inside it was not matched"],
    "pd-library": ["ok", "Public-domain library", "a game from the public-domain library in assets/chess (before 1931)"],
    "master-archive": ["ok", "Master archive", "a position from a master collection in C:\\PnoyChess\\study\\games (outside git; the position and its moves only)"],
    textbook: ["ok", "Textbook position", "a position built from the textbook rule, every move of the line checked by Stockfish"],
    reel: ["warn", "Old reel record", "the old Chess Reel Studio's own file for this reel; check its moves against the link"],
    plan: ["warn", "Plan only (FEN + moves)", "a Remotion plan: the position and its moves, no PGN file"],
    none: ["bad", "No PGN", "no source on record: this reel's moves cannot be checked"],
  };

  const pgnOf = (slot) => String((slot && slot.pgn) || "").trim();
  const movesOf = (pgn) => (pgn ? (pgn.replace(/\{[^}]*\}/g, "").match(/\b\d+\.(?!\.)/g) || []).length : 0);
  const hashFor = (date, key) => "#pgn/" + date + "/" + key;
  // the paths in the day files are repo-relative, except the study collections, which live in C:\PnoyChess (outside git)
  const localPath = (p) => (!p ? "" : /^[A-Za-z]:[\\/]/.test(p) ? p : (/^study[\\/]/i.test(p) ? "C:\\PnoyChess\\" : "C:\\PnoyChess\\docu\\") + String(p).replace(/\//g, "\\"));

  // the block shown on a card: kind, the file (and folder) it came from, the collection, and the ways to see the PGN
  function box(slot, date, key, opts) {
    const o = opts || {};
    // 14:30 is the documentary Short, not a chess reel: it has no game, so it has no PGN (and nothing is wrong)
    if (slot && slot.kind === "docu-short") {
      const film = slot.film && /^https?:\/\//.test(slot.film) ? slot.film : null;
      return el("div", { style: "display:flex;flex-direction:column;gap:3px;margin-top:6px;padding-top:6px;border-top:1px dashed var(--border);" },
        el("div", { class: "row", style: "gap:6px;align-items:center;flex-wrap:wrap;" },
          el("span", { class: "note", style: "font-size:10px;text-transform:uppercase;letter-spacing:.06em;", text: "Source" }),
          el("span", { class: "pill", style: "font-size:10px;", text: "Documentary Short" })
        ),
        el("div", { class: "note", style: "font-size:10px;line-height:1.35;", text: "No PGN: this slot is a Short cut from the full documentary, not a chess reel" + (slot.project ? " (" + slot.project + ")" : "") + "." }),
        film ? el("a", { class: "note", style: "font-size:10px;color:var(--gold);", href: film, target: "_blank", rel: "noopener", text: "The documentary on YouTube ↗" }) : null
      );
    }
    const k = KIND[(slot && slot.sourceKind) || "none"] || KIND.none;
    const file = (slot && (slot.sourcePgnFile || slot.sourcePgnDir)) || "";
    const pgn = pgnOf(slot), mv = movesOf(pgn);
    const wrap = el("div", { style: "display:flex;flex-direction:column;gap:3px;margin-top:6px;padding-top:6px;border-top:1px dashed var(--border);" },
      el("div", { class: "row", style: "gap:6px;align-items:center;flex-wrap:wrap;" },
        el("span", { class: "note", style: "font-size:10px;text-transform:uppercase;letter-spacing:.06em;", text: "Source PGN" }),
        el("span", { class: "pill " + k[0], style: "font-size:10px;", text: k[1], title: k[2] }),
        mv ? el("span", { class: "note", style: "font-size:10px;", text: mv + " moves" }) : null
      )
    );

    if (file) wrap.append(el("div", { class: "mono", style: "font-size:10px;line-height:1.35;color:var(--text-muted);word-break:break-all;", title: "comes from: " + localPath(file), text: "From " + file + (slot && slot.sourcePgnLine ? " · line " + slot.sourcePgnLine : "") }));
    else wrap.append(el("div", { style: "font-size:11px;color:var(--warn);line-height:1.35;", text: "No source PGN on record — the moves of this reel cannot be checked." }));

    const bits = [];
    if (slot && slot.sourceCollection) bits.push(el("span", { text: slot.sourceCollection }));
    if (slot && slot.sourceUrl) bits.push(el("a", { href: slot.sourceUrl, target: "_blank", rel: "noopener", style: "color:var(--gold);", text: "publication ↗" }));
    if (bits.length) wrap.append(el("div", { class: "note", style: "font-size:10px;line-height:1.35;" }, ...bits.flatMap((b, i) => (i ? [" · ", b] : [b]))));
    if (slot && slot.sourceNote) wrap.append(el("div", { class: "note", style: "font-size:10px;font-style:italic;line-height:1.35;", text: slot.sourceNote }));

    // the reel's own .pgn file, on Mark's drive: this is the file he can open in ChessBase, Fritz or chess.com
    const pf = slot && slot.pgnFile;
    if (pf) wrap.append(el("div", { class: "mono", style: "font-size:10px;line-height:1.35;color:var(--text);word-break:break-all;", title: pf, text: "PGN " + localPath(pf) }));
    const actions = el("div", { class: "row", style: "gap:6px;align-items:center;flex-wrap:wrap;margin-top:2px;" });
    if (pgn) actions.append(el("a", { class: "btn primary", style: "font-size:10px;padding:2px 8px;", href: hashFor(date, key), text: "Open PGN ↗", title: "Open the interactive chessboard to view and replay this game's moves" }));
    if (pgn) actions.append(el("button", {
      class: "btn", type: "button", style: "font-size:10px;padding:2px 8px;", text: "Download .pgn", title: "Save this PGN as a file",
      onclick: () => {
        const name = [date, key, slot.id || "reel"].filter(Boolean).join("-").replace(/[^\w.-]+/g, "-") + ".pgn";
        const a = el("a", { href: URL.createObjectURL(new Blob([pgn + "\n"], { type: "application/x-chess-pgn" })), download: name });
        document.body.append(a); a.click(); a.remove();
      },
    }));
    if (pf) actions.append(el("a", {
      class: "note", style: "font-size:10px;", href: "https://github.com/mboylesm-wq/pnoychess-docu/blob/main/" + encodeURI(slot.pgnGitFile || pf), target: "_blank", rel: "noopener", text: "the .pgn in git ↗", title: "View this verified PGN file in the GitHub repository",
    }));
    else if (file && /^chess\//.test(file)) actions.append(el("a", {
      class: "note", style: "font-size:10px;", href: "https://github.com/mboylesm-wq/pnoychess-docu/blob/main/" + encodeURI(file), target: "_blank", rel: "noopener", text: "Open the file in GitHub ↗",
    }));
    wrap.append(actions);
    if (o.compact) wrap.style.marginTop = "4px";
    return wrap;
  }

  window.SlotSource = { box, KIND, hashFor, pgnOf, movesOf, localPath };
})();
