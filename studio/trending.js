// PnoyChess Studio · the "Trending games" block of Create → New game review, loaded the first time that view is
// drawn (like reel.js and publish.js), so the page itself stays small.
// Only games with a player on the FIDE top 50 open list or the FIDE top 50 women's list (tools/fide-top.mjs →
// db/fide/top.json; the games come from The Week in Chess through tools/trend-games.mjs). Mark, 17 Nov 2026:
// "only show games for top 50 players in the world male and female".
// Uses the page's el(), say(), S, GH() and render().
(function () {
  "use strict";
  const SIDE = (s) => (s === "women" ? "women" : "open");

  // one game row: its world rank (or her women's rank), the players and result, its event and why it is here
  function row(g, i, o) {
    const t = (g.tops || []).find((x) => x.side === (g.topSide || "men")) || (g.tops || [])[0] || {};
    const why = (g.tops || []).map((x) => `${x.side === "women" ? "Women" : "World"} #${x.rank} ${x.name}${x.elo ? " (" + x.elo + ")" : ""}`).join(" · ");
    return el("div", { class: "row", style: "justify-content:space-between; gap:8px; border-top:1px solid var(--line, #ddd); padding:6px 0" },
      el("div", {},
        el("div", { class: "row", style: "gap:6px;align-items:center;flex-wrap:wrap" },
          el("span", { class: "pill ok", title: why, text: (t.side === "women" ? "Women #" : "World #") + (t.rank || "?") }),
          el("span", { text: `${g.phi ? "\u{1F1F5}\u{1F1ED} " : ""}${g.white}${g.whiteElo ? " (" + g.whiteElo + ")" : ""} vs ${g.black}${g.blackElo ? " (" + g.blackElo + ")" : ""} · ${g.result} · ${g.moves} moves` })),
        el("div", { class: "note", text: [g.event, g.round ? "round " + g.round : "", g.opening, g.why].filter(Boolean).join(" · ") })),
      el("button", { class: "btn", type: "button", id: "gr-use-" + i, text: "Use this game", onclick: () => {
        o.pgn.value = g.pgn; o.src.value = g.source || ""; o.updatePgnPreview();
        say(`${g.white} vs ${g.black} is in the form: check it, then Analyse on my PC.`);
        o.pgn.scrollIntoView({ block: "center" });
      } }));
  }

  function block(o) {
    const tg = S.trendGames, all = (tg && tg.games) || [], tp = (tg && tg.top) || null, n = (tp && tp.n) || 50;
    const pick = S.grTop || "all", games = all.filter((g) => pick === "all" || (g.tops || []).some((t) => t.side === pick));
    const sideName = (s) => `FIDE top ${n} ${SIDE(s)}`;
    const list = el("div", { id: "gr-trending", class: "stack" });
    let lastSide = "";
    games.slice(0, 15).forEach((g, i) => {
      if (pick === "all" && g.topSide !== lastSide) { lastSide = g.topSide; list.append(el("div", { class: "note", style: "margin-top:8px;font-weight:700;color:var(--gold)", text: sideName(g.topSide) })); }
      list.append(row(g, i, o));
    });
    const from = (tg && tg.source === "lichess") ? "this month's over-the-board Lichess broadcasts" : "The Week in Chess's weekly master games (each game links to its issue)";
    const note = !tp ? "Only games by a FIDE top player belong here, but the ranking list could not be read: these are the week's strongest games. Press Refresh."
      : games.length ? `Only games with a player on the ${sideName("men")} or the ${sideName("women")} list${tp.period ? " (" + tp.period + " FIDE list" : ""}, read ${new Date(tp.at).toLocaleDateString()}${tp.period ? ")" : ""}, from ${from}. Pick one, or paste your own PGN below.`
      : `No game by a FIDE top ${n} player (open or women's) in the last two weeks of master chess. Press Refresh in a few days, or paste your own PGN below.`;
    const tabs = [["all", "Both lists"], ["men", "Top " + n + " open"], ["women", "Top " + n + " women"]];
    return el("div", {},
      el("h3", { style: "margin-bottom:2px", text: "Trending games" }),
      el("div", { class: "note", text: note }),
      el("div", { class: "row", style: "gap:6px;margin:6px 0" }, ...tabs.map(([k, label]) => el("button", {
        class: "btn" + (pick === k ? " primary" : ""), type: "button", id: "gr-top-" + k,
        text: label + (k === "all" ? "" : " (" + all.filter((g) => (g.tops || []).some((t) => t.side === k)).length + ")"),
        onclick: () => { S.grTop = k; render(); } }))),
      list,
      GH() && S.actions ? el("div", { class: "row" }, el("button", { class: "btn", type: "button", id: "gr-refresh", text: "Refresh trending games", onclick: async () => {
        try { await S.actions.dispatch("trends.yml", {}); say("Asked GitHub for this month's top-50 games (about a minute). They appear here by themselves."); }
        catch (e) { say("Could not start it: " + (e.message || e.code)); } } })) : null);
  }

  window.TrendingGames = { block };
})();
