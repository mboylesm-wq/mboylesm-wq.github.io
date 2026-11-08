// PnoyChess Studio · Schedule & Publisher: one unified board for everything that goes out:
// 6-slot high-retention daily lesson lineup (08:00, 11:30, 14:30, 17:00, 20:00, 22:00) with 1-click Approve/Veto,
// quote/tip/puzzle cards (10:45, 18:45), and documentary shorts across Facebook, Instagram, YouTube and TikTok,
// read from git (chess/publisher/days, state, dryrun, config; db/cards; post/state.json).
// Uses the page's el(), say().
(function () {
  "use strict";
  const PUB = "chess/publisher/";
  const manila = (d = new Date()) => new Date(d.getTime() + 8 * 3600e3).toISOString().slice(0, 10);
  const nowHM = () => new Date(Date.now() + 8 * 3600e3).toISOString().slice(11, 16).replace(":", "");
  const addDays = (D, n) => new Date(Date.parse(D + "T00:00:00Z") + n * 864e5).toISOString().slice(0, 10);

  const SLOT_NAME = {
    "0800": "Breakfast Tactics",
    "1045": "Morning Card",
    "1130": "Lunchtime Trap",
    "1200": "Reel",
    "1430": "Documentary Short",
    "1600": "Afternoon Reel",
    "1700": "Commute Masterclass",
    "1845": "Evening Card",
    "1900": "Prime Reel",
    "2000": "Endgame Lesson",
    "2200": "Bedtime Mate"
  };

  // one row per slot: status per app (same rules as chess/publisher/posted-board.mjs)
  function rows(D, m, st, yt, tt, cfg) {
    const out = [], today = manila(), hm = nowHM();
    for (const slot of Object.keys((m && m.slots) || {}).sort()) {
      const it = m.slots[slot], s = st[slot] || {}, y = yt[slot] || {}, t = tt[slot] || {}, fb = s.fb || {}, ig = s.ig || {};
      const past = D < today || (D === today && slot <= hm), wait = it.status === "vetoed" ? ["vetoed", ""] : past ? ["missed", "bad"] : ["waiting", ""];
      const c = (ok, link) => (ok ? ["posted", "ok", link] : null);
      out.push({
        D, slot, it,
        facebook: c(fb.posted, fb.link) || (fb.scheduledFor ? (past ? ["check", "warn"] : ["scheduled", "warn"]) : fb.videoId ? ["check", "warn"] : wait),
        instagram: c(ig.posted, ig.link) || (ig.containerId ? ["check", "warn"] : fb.posted && !past ? ["waiting", ""] : wait),
        youtube: c(y.videoId, y.videoId && "https://youtube.com/shorts/" + y.videoId) || (cfg.youtube !== "live" ? ["off", ""] : wait),
        tiktok: t.link ? ["posted", "ok", t.link] : t.publishId ? ["sent", "ok"] : cfg.tiktok === "off" || !cfg.tiktok ? ["off", ""] : cfg.tiktok === "dry-run" ? ["paused", ""] : wait
      });
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
    const box = el("section", { class: "panel" }, el("h2", { text: "Schedule" }), el("div", { class: "note", text: "Loading publisher schedule & 6-slot reel lineup…" }));
    let selectedDay = null;

    const load = async () => {
      let files;
      try { files = await window.claude.use("files"); }
      catch (e) { box.lastChild.textContent = "Sign in with your GitHub key to see the publishing board."; return; }

      const cfg = (await files.json(PUB + "config.json")) || {}, today = manila(), tomorrow = addDays(today, 1);
      if (!selectedDay) selectedDay = tomorrow;

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

      let act = null;
      try { act = await window.claude.use("actions"); } catch (e) {}
      const runPubBtn = act ? el("button", {
        class: "btn", type: "button", text: "Run Publisher now", title: "Dispatch publish.yml on GitHub Actions for any due slot",
        onclick: async (ev) => {
          ev.target.disabled = true;
          try { await act.dispatch("publish.yml", {}); say("Started Publish (publish.yml) on GitHub Actions."); }
          catch (e) { ev.target.disabled = false; say("Could not start Publish: " + (e.message || e.code)); }
        }
      }) : null;

      const refreshBtn = el("button", {
        class: "btn", type: "button", text: "Refresh",
        onclick: () => {
          box.textContent = "";
          box.append(el("h2", { text: "Schedule" }), el("div", { class: "note", text: "Refreshing…" }));
          load().catch((e) => box.append(el("div", { class: "empty", text: "Could not read the publisher's files: " + (e.message || e) })));
        }
      });

      // Header row
      box.append(el("div", { class: "row", style: "justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:8px;" },
        el("div", {},
          el("h2", { style: "margin:0 0 4px 0;", text: "Schedule & Multi-Platform Publisher" }),
          el("p", { class: "note", style: "margin:0;", text: "Daily 6-slot lesson lineup, community cards, and documentary shorts across FB, IG, YouTube, TikTok." })
        ),
        el("div", { class: "row", style: "gap:8px;align-items:center;" },
          el("span", { class: "pill " + (live ? "ok" : "warn"), text: live ? "Publisher: LIVE" : "Publisher: DRY-RUN" }),
          runPubBtn,
          refreshBtn
        )
      ));

      // 6-Slot Lesson Lineup Card Section
      const curDayData = days.find((d) => d.D === selectedDay);
      const curSlots = (curDayData && curDayData.m && curDayData.m.slots) || {};
      const curSlotKeys = Object.keys(curSlots).sort();

      const lineupCard = el("section", { class: "panel", style: "margin:16px 0;background:var(--card);border:1px solid var(--border);" },
        el("div", { class: "row", style: "justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:12px;" },
          el("div", { class: "row", style: "gap:8px;align-items:center;" },
            el("span", { style: "font-weight:700;font-size:16px;color:var(--text);", text: "🎬 Daily 6-Slot Lineup" }),
            el("span", { class: "pill", style: "font-size:11px;", text: selectedDay === today ? "Today" : selectedDay === tomorrow ? "Tomorrow" : selectedDay })
          ),
          el("div", { class: "row", style: "gap:6px;" },
            el("button", {
              class: "btn" + (selectedDay === today ? " primary" : ""),
              type: "button",
              style: "font-size:12px;padding:4px 10px;",
              text: "Today (" + today.slice(5) + ")",
              onclick: () => { selectedDay = today; load(); }
            }),
            el("button", {
              class: "btn" + (selectedDay === tomorrow ? " primary" : ""),
              type: "button",
              style: "font-size:12px;padding:4px 10px;",
              text: "Tomorrow (" + tomorrow.slice(5) + ")",
              onclick: () => { selectedDay = tomorrow; load(); }
            })
          )
        )
      );

      if (curSlotKeys.length) {
        const slotsGrid = el("div", { style: "display:grid;grid-template-columns:repeat(auto-fill, minmax(320px, 1fr));gap:12px;" });
        for (const sk of curSlotKeys) {
          const item = curSlots[sk];
          const timeFormatted = item.time || (sk.slice(0, 2) + ":" + sk.slice(2));
          const isApproved = item.status === "approved";
          const isVetoed = item.status === "vetoed";
          const statusTone = isApproved ? "ok" : isVetoed ? "bad" : "warn";
          const statusLabel = isApproved ? "Approved" : isVetoed ? "Vetoed" : "Waiting Review";

          const slotBox = el("div", { class: "proj", style: "margin:0;padding:12px;display:flex;flex-direction:column;gap:8px;" },
            el("div", { class: "row", style: "justify-content:space-between;align-items:center;" },
              el("div", { class: "row", style: "gap:6px;align-items:center;" },
                el("span", { class: "pill", style: "font-weight:700;background:var(--border);color:var(--gold);", text: timeFormatted }),
                el("span", { class: "note", style: "font-size:12px;", text: SLOT_NAME[sk] || "Reel" })
              ),
              el("span", { class: "pill " + statusTone, text: statusLabel })
            ),
            el("div", { style: "font-weight:600;font-size:14px;color:var(--text);line-height:1.3;", text: item.title || "Untitled Lesson" }),
            item.category ? el("div", { class: "note", style: "font-size:12px;", text: item.category }) : null,
            el("div", { class: "row", style: "justify-content:space-between;align-items:center;margin-top:4px;" },
              item.videoUrl ? el("a", { class: "note", href: item.videoUrl, target: "_blank", rel: "noopener", style: "color:var(--gold);font-size:12px;", text: "▶ Watch Video" }) : el("span", { class: "note", text: "Pending render" }),
              files.saveJson ? el("div", { class: "row", style: "gap:6px;" },
                el("button", {
                  class: "btn" + (isApproved ? "" : " primary"),
                  type: "button",
                  style: "font-size:11px;padding:3px 8px;",
                  text: isApproved ? "✓ Approved" : "Approve",
                  onclick: async () => {
                    item.status = "approved";
                    try {
                      await files.saveJson(`chess/publisher/days/${selectedDay}.json`, curDayData.m, `studio: approve slot ${sk} on ${selectedDay}`);
                      say(`Slot ${timeFormatted} approved for ${selectedDay}.`);
                      load();
                    } catch (e) { say("Could not save approval: " + (e.message || e)); }
                  }
                }),
                el("button", {
                  class: "btn",
                  type: "button",
                  style: "font-size:11px;padding:3px 8px;color:var(--rose);",
                  text: isVetoed ? "Vetoed" : "Veto",
                  onclick: async () => {
                    item.status = "vetoed";
                    try {
                      await files.saveJson(`chess/publisher/days/${selectedDay}.json`, curDayData.m, `studio: veto slot ${sk} on ${selectedDay}`);
                      say(`Slot ${timeFormatted} vetoed for ${selectedDay}.`);
                      load();
                    } catch (e) { say("Could not save veto: " + (e.message || e)); }
                  }
                })
              ) : null
            )
          );
          slotsGrid.append(slotBox);
        }
        lineupCard.append(slotsGrid);
      } else {
        lineupCard.append(el("div", { class: "empty", text: "No 6-slot reel lineup found for " + selectedDay }));
      }
      box.append(lineupCard);

      // Multi-Platform Table Section
      box.append(el("h3", { style: "margin:20px 0 8px 0;", text: "Multi-Platform Distribution Matrix" }));
      const tb = el("tbody");
      for (const r of all) {
        const kindLabel = r.it.kind === "docu-short" ? "Documentary Short" : String(r.it.kind || "").startsWith("card-") ? "Card (" + r.it.kind.slice(5) + ")" : SLOT_NAME[r.slot] || "Reel";
        tb.append(el("tr", {},
          el("td", { class: "mono", text: r.D.slice(5) + " " + r.slot.slice(0, 2) + ":" + r.slot.slice(2) }),
          el("td", {}, el("div", { text: r.it.title || "?" }), el("div", { class: "note", text: kindLabel })),
          cell(r.facebook), cell(r.instagram), cell(r.youtube), cell(r.tiktok)
        ));
      }
      box.append(all.length ? el("div", { class: "tablewrap" }, el("table", { class: "pubtable" }, el("thead", {}, el("tr", {}, ...["When", "Content", "Facebook", "Instagram", "YouTube", "TikTok"].map((h) => el("th", { text: h })))), tb))
        : el("div", { class: "empty", text: "Nothing planned in these days." }));

      const log = await files.text(PUB + "dryrun/" + today + ".md").catch(() => null);
      if (!live && log) box.append(el("details", { style: "margin-top:14px;" }, el("summary", { text: "Today's dry-run log (what the publisher would have done)" }), el("pre", { class: "desc", text: log })));

      box.append(el("p", { class: "note", style: "margin-top:14px;" }, "History and every run: ",
        el("a", { href: "https://github.com/mboylesm-wq/pnoychess-docu/actions/workflows/publish.yml", target: "_blank", rel: "noopener", text: "Publish runs on GitHub Actions" }), "."));
    };

    load().catch((e) => { box.append(el("div", { class: "empty", text: "Could not read the publisher's files: " + (e.message || e) })); });
    return box;
  }

  window.PublishBoard = { view, rows, cardRows, shortRows };
})();
