// PnoyChess Studio · Publish: one board for everything that goes out (quote/tip/puzzle cards at 10:45 and 18:45,
// reels at 12:00, 17:00, 20:00 and the documentary Short at 14:30) on Facebook, Instagram, YouTube and TikTok,
// read from the one publisher's files in git (chess/publisher/days, state, dryrun, config; db/cards; post/state.json).
// Uses the page's el(), say().
(function () {
  "use strict";
  const PUB = "chess/publisher/";
  const manila = (d = new Date()) => new Date(d.getTime() + 8 * 3600e3).toISOString().slice(0, 10);
  const nowHM = () => new Date(Date.now() + 8 * 3600e3).toISOString().slice(11, 16).replace(":", "");
  const addDays = (D, n) => new Date(Date.parse(D + "T00:00:00Z") + n * 864e5).toISOString().slice(0, 10);
  const SLOT_NAME = { 1045: "Card", 1200: "Reel", 1430: "Documentary Short", 1700: "Reel", 1845: "Card", 2000: "Reel" };

  // one row per slot: status per app (same rules as chess/publisher/posted-board.mjs)
  function rows(D, m, st, yt, tt, cfg) {
    const out = [], today = manila(), hm = nowHM();
    for (const slot of Object.keys((m && m.slots) || {}).sort()) {
      const it = m.slots[slot], s = st[slot] || {}, y = yt[slot] || {}, t = tt[slot] || {}, fb = s.fb || {}, ig = s.ig || {};
      const past = D < today || (D === today && slot <= hm), wait = it.status === "vetoed" ? ["vetoed", ""] : past ? ["missed", "bad"] : ["waiting", ""];
      const c = (ok, link) => (ok ? ["posted", "ok", link] : null);
      out.push({ D, slot, it,
        facebook: c(fb.posted, fb.link) || (fb.scheduledFor ? (past ? ["check", "warn"] : ["scheduled", "warn"]) : fb.videoId ? ["check", "warn"] : wait),
        instagram: c(ig.posted, ig.link) || (ig.containerId ? ["check", "warn"] : fb.posted && !past ? ["waiting", ""] : wait),
        youtube: c(y.videoId, y.videoId && "https://youtube.com/shorts/" + y.videoId) || (cfg.youtube !== "live" ? ["off", ""] : wait),
        tiktok: t.link ? ["posted", "ok", t.link] : t.publishId ? ["sent", "ok"] : cfg.tiktok === "off" || !cfg.tiktok ? ["off", ""] : cfg.tiktok === "dry-run" ? ["paused", ""] : wait });
    }
    return out;
  }
  // quote / tip / puzzle cards from db/cards/<D>.json (10:45 & 18:45 slots on Facebook + Instagram)
  function cardRows(D, doc) {
    const items = (doc && (doc.items || doc.cards)) || [], today = manila(), hm = nowHM();
    return items.map((c) => {
      const slot = c.slot || "1045", p = c.posted || {}, fb = p.fb || {}, ig = p.ig || {};
      const past = D < today || (D === today && slot <= hm);
      const wait = c.status === "rejected" ? ["rejected", ""] : c.status === "waiting" ? ["needs approval", "warn"] : past ? ["missed", "bad"] : ["approved", "warn"];
      const title = c.kind === "quote" ? "\u201c" + String(c.text || "").slice(0, 56) + (String(c.text || "").length > 56 ? "\u2026" : "") + "\u201d" : (c.title || c.text || c.id || "Card");
      return {
        D, slot,
        it: { title, kind: "card-" + (c.kind || "post") },
        facebook: fb.link ? ["posted", "ok", fb.link] : fb.id ? ["posted", "ok"] : wait,
        instagram: ig.link ? ["posted", "ok", ig.link] : ig.id ? ["posted", "ok"] : wait,
        youtube: ["—", ""],
        tiktok: ["—", ""]
      };
    });
  }
  // documentary Shorts sent by the old poster (tools/post-shorts.mjs, until the cutover)
  function shortRows(ps) {
    return Object.entries((ps && ps.shorts) || {}).map(([key, s]) => {
      const c = (p) => (p && p.link ? ["posted", "ok", p.link] : p && (p.videoId || p.containerId || p.startedAt) ? ["check", "warn"] : p && p.lastError ? ["failed", "bad"] : ["—", ""]);
      return { D: s.day || "", slot: "1430", it: { title: s.title || key, kind: "docu-short", key }, facebook: c(s.facebook), instagram: c(s.instagram), youtube: c(s.youtube), tiktok: s.tiktok && s.tiktok.dryRun ? ["paused", ""] : c(s.tiktok) };
    });
  }

  function cell(v) {
    const [text, tone, link] = v || ["—", ""];
    const pill = el("span", { class: "pill" + (tone ? " " + tone : ""), text });
    return el("td", {}, link ? el("a", { href: link, target: "_blank", rel: "noopener" }, pill) : pill);
  }

  function view() {
    const box = el("section", { class: "panel" }, el("h2", { text: "Publish" }), el("div", { class: "note", text: "Loading the publisher's plan…" }));
    const load = async () => {
      let files; try { files = await window.claude.use("files"); } catch (e) { box.lastChild.textContent = "Sign in with your GitHub key to see the publishing board."; return; }
      const cfg = (await files.json(PUB + "config.json")) || {}, today = manila();
      const dates = Array.from({ length: 10 }, (_, i) => addDays(today, 3 - i)); // 3 days ahead, 6 back
      const read = (f) => files.json(PUB + f).catch(() => null);
      const days = await Promise.all(dates.map(async (D) => ({
        D,
        m: await read(`days/${D}.json`),
        st: ((await read(`state/${D}.json`)) || {}).slots || {},
        yt: ((await read(`state/youtube-${D}.json`)) || {}).slots || {},
        tt: ((await read(`state/tiktok-${D}.json`)) || {}).slots || {},
        cards: await files.json(`db/cards/${D}.json`).catch(() => null)
      })));
      let all = days.flatMap((d) => [...rows(d.D, d.m, d.st, d.yt, d.tt, cfg), ...cardRows(d.D, d.cards)]);
      const seen = new Set(all.filter((r) => r.it.kind === "docu-short").map((r) => r.it.key));
      all = all.concat(shortRows(await files.json("post/state.json").catch(() => null)).filter((r) => !seen.has(r.it.key) && dates.includes(r.D)));
      all.sort((a, b) => (b.D + b.slot).localeCompare(a.D + a.slot));
      const live = cfg.mode === "live";
      box.textContent = "";
      let act = null; try { act = await window.claude.use("actions"); } catch (e) {}
      const runPubBtn = act ? el("button", { class: "btn", type: "button", text: "Run Publisher now", title: "Dispatch publish.yml on GitHub Actions for any due slot", onclick: async (ev) => {
        ev.target.disabled = true;
        try { await act.dispatch("publish.yml", {}); say("Started Publish (publish.yml) on GitHub Actions."); }
        catch (e) { ev.target.disabled = false; say("Could not start Publish: " + (e.message || e.code)); }
      } }) : null;
      const refreshBtn = el("button", { class: "btn", type: "button", text: "Refresh", onclick: () => { box.textContent = ""; box.append(el("h2", { text: "Publish" }), el("div", { class: "note", text: "Refreshing…" })); load().catch((e) => box.append(el("div", { class: "empty", text: "Could not read the publisher's files: " + (e.message || e) }))); } });
      box.append(el("div", { class: "row", style: "justify-content:space-between;align-items:center" }, el("h2", { text: "Publish" }),
        el("div", { class: "row", style: "gap:8px;align-items:center" },
          el("span", { class: "pill " + (live ? "ok" : "warn"), text: live ? "One publisher: live" : "One publisher: dry run (the old posters still post)" }),
          runPubBtn,
          refreshBtn)),
        el("p", { class: "note", text: `Every card (10:45, 18:45), reel (${(cfg.slots || []).map((s) => s.slice(0, 2) + ":" + s.slice(2)).join(", ")}) and documentary Short (${String(cfg.docuSlot || "1430").replace(/(\d\d)(\d\d)/, "$1:$2")}) Manila, across every app. The documentary Short posts once its full film is Public on YouTube. Tap a green status to open the post.` }));
      const tb = el("tbody");
      for (const r of all) {
        const kindLabel = r.it.kind === "docu-short" ? "Documentary Short" : String(r.it.kind || "").startsWith("card-") ? "Card (" + r.it.kind.slice(5) + ")" : SLOT_NAME[r.slot] || "Reel";
        tb.append(el("tr", {}, el("td", { class: "mono", text: r.D.slice(5) + " " + r.slot.slice(0, 2) + ":" + r.slot.slice(2) }),
          el("td", {}, el("div", { text: r.it.title || "?" }), el("div", { class: "note", text: kindLabel })),
          cell(r.facebook), cell(r.instagram), cell(r.youtube), cell(r.tiktok)));
      }
      box.append(all.length ? el("div", { class: "tablewrap" }, el("table", { class: "pubtable" }, el("thead", {}, el("tr", {}, ...["When", "Content", "Facebook", "Instagram", "YouTube", "TikTok"].map((h) => el("th", { text: h })))), tb))
        : el("div", { class: "empty", text: "Nothing planned in these days." }));
      const log = await files.text(PUB + "dryrun/" + today + ".md").catch(() => null);
      if (!live && log) box.append(el("details", {}, el("summary", { text: "Today's dry-run log (what the one publisher would have done)" }), el("pre", { class: "desc", text: log })));
      box.append(el("p", { class: "note" }, "History and every run: ",
        el("a", { href: "https://github.com/mboylesm-wq/pnoychess-docu/actions/workflows/publish.yml", target: "_blank", rel: "noopener", text: "Publish runs on GitHub" }), "."));
    };
    load().catch((e) => { box.append(el("div", { class: "empty", text: "Could not read the publisher's files: " + (e.message || e) })); });
    return box;
  }
  window.PublishBoard = { view, rows, cardRows, shortRows };
})();
