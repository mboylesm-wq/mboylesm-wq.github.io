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
    puzzle: ["ok", "Puzzle pack", "Puzzle of the Day pack, from the Lichess puzzle database (CC0)"],
    study: ["ok", "Study PGN", "a PGN collection in C:\\PnoyChess\\study\\games (outside git)"],
    "study-guess": ["warn", "Study PGN (inferred)", "the collection is named in the reel id; the exact game inside it was not matched"],
    reel: ["warn", "Old reel record", "the old Chess Reel Studio's own file for this reel; check its moves against the link"],
    plan: ["warn", "Plan only (FEN + moves)", "a Remotion plan: the position and its moves, no PGN file"],
    none: ["bad", "No PGN", "no source on record: this reel's moves cannot be checked"],
  };

  const pgnOf = (slot) => String((slot && slot.pgn) || "").trim();
  const movesOf = (pgn) => (pgn ? (pgn.replace(/\{[^}]*\}/g, "").match(/\b\d+\.(?!\.)/g) || []).length : 0);
  const hashFor = (date, key) => "#pgn/" + date + "/" + key;

  // the block shown on a card: kind, the file (and folder) it came from, the collection, and the ways to see the PGN
  function box(slot, date, key, opts) {
    const o = opts || {}, k = KIND[(slot && slot.sourceKind) || "none"] || KIND.none;
    const file = (slot && (slot.sourcePgnFile || slot.sourcePgnDir)) || "";
    const pgn = pgnOf(slot), mv = movesOf(pgn);
    const wrap = el("div", { style: "display:flex;flex-direction:column;gap:3px;margin-top:6px;padding-top:6px;border-top:1px dashed var(--border);" },
      el("div", { class: "row", style: "gap:6px;align-items:center;flex-wrap:wrap;" },
        el("span", { class: "note", style: "font-size:10px;text-transform:uppercase;letter-spacing:.06em;", text: "Source PGN" }),
        el("span", { class: "pill " + k[0], style: "font-size:10px;", text: k[1], title: k[2] }),
        mv ? el("span", { class: "note", style: "font-size:10px;", text: mv + " moves" }) : null
      )
    );

    if (file) wrap.append(el("div", { class: "mono", style: "font-size:10px;line-height:1.35;color:var(--text-muted);word-break:break-all;", title: file, text: file }));
    else wrap.append(el("div", { style: "font-size:11px;color:var(--warn);line-height:1.35;", text: "No source PGN on record — the moves of this reel cannot be checked." }));

    const bits = [];
    if (slot && slot.sourceCollection) bits.push(el("span", { text: slot.sourceCollection }));
    if (slot && slot.sourceUrl) bits.push(el("a", { href: slot.sourceUrl, target: "_blank", rel: "noopener", style: "color:var(--gold);", text: "publication ↗" }));
    if (bits.length) wrap.append(el("div", { class: "note", style: "font-size:10px;line-height:1.35;" }, ...bits.flatMap((b, i) => (i ? [" · ", b] : [b]))));
    if (slot && slot.sourceNote) wrap.append(el("div", { class: "note", style: "font-size:10px;font-style:italic;line-height:1.35;", text: slot.sourceNote }));

    const actions = el("div", { class: "row", style: "gap:6px;align-items:center;flex-wrap:wrap;margin-top:2px;" });
    if (pgn) actions.append(el("a", { class: "btn primary", style: "font-size:10px;padding:2px 8px;", href: hashFor(date, key), text: "Open PGN ↗" }));
    if (pgn) actions.append(el("button", {
      class: "btn", type: "button", style: "font-size:10px;padding:2px 8px;", text: "Download .pgn", title: "Save this PGN as a file",
      onclick: () => {
        const name = [date, key, slot.id || "reel"].filter(Boolean).join("-").replace(/[^\w.-]+/g, "-") + ".pgn";
        const a = el("a", { href: URL.createObjectURL(new Blob([pgn + "\n"], { type: "application/x-chess-pgn" })), download: name });
        document.body.append(a); a.click(); a.remove();
      },
    }));
    if (file && /^chess\//.test(file)) actions.append(el("a", {
      class: "note", style: "font-size:10px;", href: "https://github.com/mboylesm-wq/pnoychess-docu/blob/main/" + encodeURI(file), target: "_blank", rel: "noopener", text: "Open the file in GitHub ↗",
    }));
    wrap.append(actions);
    if (o.compact) wrap.style.marginTop = "4px";
    return wrap;
  }

  window.SlotSource = { box, KIND, hashFor, pgnOf, movesOf };
})();
