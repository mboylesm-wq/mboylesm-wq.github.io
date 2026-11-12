// PnoyChess Studio · Schedule & Publisher: one unified board for everything that goes out:
// 6-slot high-retention daily lesson lineup (08:00, 11:30, 14:30, 17:00, 20:00, 22:00) with 1-click Approve/Veto,
// quote/tip/puzzle cards (10:45, 18:45), and documentary shorts across Facebook, Instagram, YouTube and TikTok,
// read from git (chess/publisher/days, state, dryrun, config; db/cards; post/state.json).
// Uses the page's el(), say().
(function () {
  "use strict";
  const PUB = "chess/publisher/";
  // every rendered reel is also on its day's Release; the card links there even when the day file has no videoUrl
  const REL = "https://github.com/mboylesm-wq/pnoychess-docu/releases/download/";
  const videoHref = (D, it) => it.videoUrl || (it.video ? REL + "reels-" + D + "/" + it.video : null);
  // the days the board reads: 6 back and 3 ahead, PLUS every day file that exists up to 31 days ahead, so a plan
  // made weeks in advance (10-18 Nov) is shown and can be picked instead of being cut off at today+3
  const dayWindow = (today, listed) => [...new Set([...Array.from({ length: 10 }, (_, i) => addDays(today, 3 - i)), ...listed])].sort();
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
    const box = el("section", { class: "panel" }, el("h2", { text: "Schedule" }), el("div", { class: "note", text: "Loading the schedule & 6-slot reel lineup…" }));
    let selectedDay = null, cache = null;

    // refresh = true re-reads every file (the Refresh button, a save); false re-renders the copy already read, so
    // picking another day costs no GitHub requests
    const load = async (refresh = true) => {
      let files;
      try { files = await window.claude.use("files"); }
      catch (e) { box.lastChild.textContent = "Sign in with your GitHub key to see the publishing board."; return; }
      await loadOnce("sources.js").catch(() => null); // draws each slot's source PGN

      const today = manila(), tomorrow = addDays(today, 1);
      // today, not tomorrow (Mark, 12 Nov 2026): the board must open on the lineup that is posting today,
      // with tomorrow one click away; the Tomorrow button and the day picker still show any planned day
      if (!selectedDay) selectedDay = today;

      if (!cache || refresh) {
        const cfg = (await files.json(PUB + "config.json")) || {};
        // 6 days back and 3 ahead, PLUS every day file that exists up to 31 days ahead: a plan made weeks in
        // advance (10-18 Nov) is in git and must be visible and pickable, not cut off at today+3
        const listed = (await files.list(PUB + "days").catch(() => []))
          .map((f) => (/^(\d{4}-\d\d-\d\d)\.json$/.exec(f) || [])[1])
          .filter((D) => D && D >= addDays(today, -6) && D <= addDays(today, 31));
        const dates = dayWindow(today, listed);
        const read = (f) => files.json(PUB + f).catch(() => null);
        const days = await Promise.all(dates.map(async (D) => ({
          D,
          m: await read(`days/${D}.json`),
          st: ((await read(`state/${D}.json`)) || {}).slots || {},
          yt: ((await read(`state/youtube-${D}.json`)) || {}).slots || {},
          tt: ((await read(`state/tiktok-${D}.json`)) || {}).slots || {},
          cards: await files.json(`db/cards/${D}.json`).catch(() => null)
        })));
        cache = {
          cfg, days, dates,
          shorts: await files.json("post/state.json").catch(() => null),
          log: await files.text(PUB + "dryrun/" + today + ".md").catch(() => null)
        };
      }
      const { cfg, days, dates, shorts, log } = cache;

      let all = days.flatMap((d) => [...rows(d.D, d.m, d.st, d.yt, d.tt, cfg), ...cardRows(d.D, d.cards)]);
      const seen = new Set(all.filter((r) => r.it.kind === "docu-short").map((r) => r.it.key));
      all = all.concat(shortRows(shorts).filter((r) => !seen.has(r.it.key) && dates.includes(r.D)));
      all.sort((a, b) => (b.D + b.slot).localeCompare(a.D + a.slot));
      const live = cfg.mode === "live";

      box.textContent = "";

      let act = null;
      try { act = await window.claude.use("actions"); } catch (e) {}
      const runPubBtn = act ? el("button", {
        class: "btn", type: "button", text: "Post due now", title: "Post every slot that is due and approved right now (Facebook, Instagram, YouTube Shorts, TikTok) on GitHub Actions (publish.yml), without waiting for the timetable",
        onclick: async (ev) => {
          ev.target.disabled = true;
          try { await act.dispatch("publish.yml", {}); say("Started Publish (publish.yml) on GitHub Actions."); }
          catch (e) { ev.target.disabled = false; say("Could not start Publish: " + (e.message || e.code)); }
        }
      }) : null;

      const runReelsBtn = act ? el("button", {
        class: "btn", type: "button", text: "Render reels now", title: "Re-render this day's flagged reels on GitHub Actions (make.yml) with the latest template and sound",
        onclick: async (ev) => {
          ev.target.disabled = true;
          try { await act.dispatch("make.yml", { mode: "live", date: selectedDay }); say("Started Make reels for " + selectedDay + " on GitHub Actions (a few minutes)."); }
          catch (e) { ev.target.disabled = false; say("Could not start Make reels: " + (e.message || e.code)); }
        }
      }) : null;

      const refreshBtn = el("button", {
        class: "btn", type: "button", text: "Refresh", title: "Refresh the publisher schedule, render status, and live social media posting links",
        onclick: () => {
          box.textContent = "";
          box.append(el("h2", { text: "Schedule" }), el("div", { class: "note", text: "Refreshing…" }));
          load().catch((e) => box.append(el("div", { class: "empty", text: "Could not read the publisher's files: " + (e.message || e) })));
        }
      });

      // Header row
      box.append(el("div", { class: "row", style: "justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:8px;" },
        el("div", {},
          el("h2", { style: "margin:0 0 4px 0;", text: "Schedule & Posting" }),
          el("p", { class: "note", style: "margin:0;", text: "Daily 6-slot lesson lineup, community cards, and documentary shorts across FB, IG, YouTube, TikTok." })
        ),
        el("div", { class: "row", style: "gap:8px;align-items:center;" },
          el("span", { class: "pill " + (live ? "ok" : "warn"), text: live ? "Posting: LIVE" : "Posting: DRY-RUN" }),
          runPubBtn,
          runReelsBtn,
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
          el("div", { class: "row", style: "gap:6px;align-items:center;" },
            el("button", {
              class: "btn" + (selectedDay === today ? " primary" : ""),
              type: "button",
              style: "font-size:12px;padding:4px 10px;",
              text: "Today (" + today.slice(5) + ")",
              title: "View today's 6-slot lineup and live publishing status",
              onclick: () => { selectedDay = today; load(false); }
            }),
            el("button", {
              class: "btn" + (selectedDay === tomorrow ? " primary" : ""),
              type: "button",
              style: "font-size:12px;padding:4px 10px;",
              text: "Tomorrow (" + tomorrow.slice(5) + ")",
              title: "View tomorrow's 6-slot lineup to preview, edit, or approve ahead of time",
              onclick: () => { selectedDay = tomorrow; load(false); }
            }),
            // any day that has a plan in chess/publisher/days, including weeks ahead (the replan of 10-18 Nov)
            (() => {
              const sel = el("select", {
                title: "Pick any day that has a plan (approve, veto or re-render it ahead of time)",
                style: "font-size:12px;padding:4px 8px;max-width:200px;",
                onchange: (ev) => { selectedDay = ev.target.value; load(false); }
              }, ...days.filter((d) => d.m || d.D === selectedDay).map((d) => el("option", { value: d.D, selected: d.D === selectedDay, text: d.D + (d.D === today ? " · today" : d.D === tomorrow ? " · tomorrow" : d.D < today ? " · past" : "") })));
              sel.value = selectedDay;
              return sel;
            })(),
            files.saveJson ? el("button", {
              class: "btn",
              type: "button",
              style: "font-size:12px;padding:4px 10px;border-color:var(--amber);color:var(--amber);",
              text: "⟳ Re-render All",
              title: "Queue all slots for re-render with the latest template and audio",
              onclick: async () => {
                let cnt = 0;
                for (const sk of curSlotKeys) { curSlots[sk].reRender = true; cnt++; }
                try {
                  await files.saveJson(`chess/publisher/days/${selectedDay}.json`, curDayData.m, `studio: rerender all slots on ${selectedDay}`);
                  say(`Queued all ${cnt} slots for re-render on ${selectedDay} ⟳.`);
                  load();
                } catch (e) { say("Could not save: " + (e.message || e)); }
              }
            }) : null
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

          // Social media posting state for this slot
          const s = (curDayData.st && curDayData.st[sk]) || {};
          const y = (curDayData.yt && curDayData.yt[sk]) || {};
          const t = (curDayData.tt && curDayData.tt[sk]) || {};
          const fb = s.fb || {};
          const ig = s.ig || {};

          const fbUrl = fb.link || (fb.videoId ? "https://www.facebook.com/reel/" + fb.videoId : null);
          const fbOk = !!(fb.posted || fb.link);
          const fbSched = !!fb.scheduledFor;

          const igUrl = ig.link || null;
          const igOk = !!(ig.posted || ig.mediaId || ig.link);

          const ytUrl = y.link || (y.videoId ? "https://youtube.com/shorts/" + y.videoId : null);
          const ytOk = !!(y.videoId || y.posted);

          const ttUrl = t.link || null;
          const ttOk = !!(t.link || t.publishId || t.status === "scheduled" || t.bufferPostId);

          const isLiveAny = fbOk || igOk || ytOk || ttOk;
          const isPastSlot = selectedDay === today && sk <= nowHM();

          const socialPills = el("div", {
            style: "display:flex;flex-direction:column;gap:5px;padding:8px 10px;background:var(--panel-elevated);border-radius:6px;border:1px solid var(--line);margin:4px 0;"
          },
            el("div", { class: "row", style: "justify-content:space-between;align-items:center;" },
              el("span", { class: "kind", style: "font-size:10px;font-weight:600;", text: "Social Media Distribution" }),
              isLiveAny && fbOk && igOk && ytOk
                ? el("span", { class: "pill ok", style: "font-size:10px;font-weight:700;", text: "LIVE ACROSS PLATFORMS ✓" })
                : isPastSlot && !isLiveAny
                  ? el("span", { class: "pill warn", style: "font-size:10px;", title: "The slot's time has passed. Click 'Post due now' to post it." }, "Due now (needs posting)")
                  : el("span", { class: "note", style: "font-size:10px;", text: "Posts at " + timeFormatted })
            ),
            el("div", { class: "row", style: "gap:5px;flex-wrap:wrap;align-items:center;" },
              fbOk
                ? el("a", { class: "pill ok", href: fbUrl || "#", target: "_blank", rel: "noopener", title: "Live on Facebook Reels! Click to open reel", style: "text-decoration:none;font-size:10px;", text: "Facebook ✓" })
                : fbSched
                  ? el("span", { class: "pill warn", style: "font-size:10px;", title: "Scheduled to be published by Facebook at " + (fb.scheduledFor || timeFormatted), text: "Facebook ⏰" })
                  : el("span", { class: "pill", style: "font-size:10px;opacity:0.6;", title: "Waiting to be published to Facebook at " + timeFormatted, text: "Facebook · waiting" }),
              igOk
                ? el("a", { class: "pill ok", href: igUrl || "#", target: "_blank", rel: "noopener", title: "Live on Instagram Reels! Click to open reel", style: "text-decoration:none;font-size:10px;", text: "Instagram ✓" })
                : ig.containerId
                  ? el("span", { class: "pill warn", style: "font-size:10px;", title: "Instagram container processing", text: "Instagram ⏳" })
                  : el("span", { class: "pill", style: "font-size:10px;opacity:0.6;", title: "Waiting to be published to Instagram at " + timeFormatted, text: "Instagram · waiting" }),
              ytOk
                ? el("a", { class: "pill ok", href: ytUrl || "#", target: "_blank", rel: "noopener", title: "Live on YouTube Shorts! Click to watch", style: "text-decoration:none;font-size:10px;", text: "YouTube Shorts ✓" })
                : el("span", { class: "pill", style: "font-size:10px;opacity:0.6;", title: "Waiting to be published to YouTube Shorts at " + timeFormatted, text: "YouTube · waiting" }),
              ttOk
                ? el("a", { class: "pill ok", href: ttUrl || "#", target: "_blank", rel: "noopener", title: "Live or Queued on TikTok via Buffer! Click to view", style: "text-decoration:none;font-size:10px;", text: "TikTok ✓" })
                : el("span", { class: "pill", style: "font-size:10px;opacity:0.6;", title: "Waiting to be published to TikTok at " + timeFormatted, text: "TikTok · waiting" })
            )
          );

          const slotBox = el("div", { class: "proj", style: "margin:0;padding:12px;display:flex;flex-direction:column;gap:8px;" },
            el("div", { class: "row", style: "justify-content:space-between;align-items:center;" },
              el("div", { class: "row", style: "gap:6px;align-items:center;" },
                el("span", { class: "pill", style: "font-weight:700;background:var(--border);color:var(--gold);", text: timeFormatted }),
                el("span", { class: "note", style: "font-size:12px;", text: SLOT_NAME[sk] || "Reel" })
              ),
              el("div", { class: "row", style: "gap:4px;" },
                item.reRender ? el("span", { class: "pill warn", style: "font-size:11px;", title: "Marked for PC re-render", text: "⟳ Re-render" }) : null,
                el("span", { class: "pill " + statusTone, title: isApproved ? "Approved to be posted automatically at " + timeFormatted : isVetoed ? "Vetoed: will not be posted" : "Waiting for your review", text: statusLabel })
              )
            ),
            el("div", { style: "font-weight:600;font-size:14px;color:var(--text);line-height:1.3;", text: item.title || "Untitled Lesson" }),
            item.category ? el("div", { class: "note", style: "font-size:12px;", text: item.category }) : null,
            socialPills,
            el("div", { class: "row", style: "justify-content:space-between;align-items:center;margin-top:4px;" },
              videoHref(selectedDay, item) ? el("a", { class: "note", href: videoHref(selectedDay, item), target: "_blank", rel: "noopener", style: "color:var(--gold);font-size:12px;", title: "Watch the rendered video file on GitHub", text: "▶ Watch Video" }) : el("span", { class: "note", text: "Pending render" }),
              files.saveJson ? el("div", { class: "row", style: "gap:4px;" },
                el("button", {
                  class: "btn" + (isApproved ? "" : " primary"),
                  type: "button",
                  style: "font-size:11px;padding:3px 8px;",
                  text: isApproved ? "✓ Approved" : "Approve",
                  title: isApproved ? "This slot is approved and will post at " + timeFormatted : "Approve this reel so it posts automatically at " + timeFormatted,
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
                  title: isVetoed ? "This slot is vetoed and will NOT post" : "Veto/block this reel so it will NOT be posted to social media",
                  onclick: async () => {
                    item.status = "vetoed";
                    try {
                      await files.saveJson(`chess/publisher/days/${selectedDay}.json`, curDayData.m, `studio: veto slot ${sk} on ${selectedDay}`);
                      say(`Slot ${timeFormatted} vetoed for ${selectedDay}.`);
                      load();
                    } catch (e) { say("Could not save veto: " + (e.message || e)); }
                  }
                }),
                el("button", {
                  class: "btn" + (item.reRender ? " warn" : ""),
                  type: "button",
                  style: "font-size:11px;padding:3px 8px;" + (item.reRender ? "border-color:var(--amber);color:var(--amber);" : ""),
                  text: item.reRender ? "⟳ Queued" : "⟳ Re-render",
                  title: item.reRender ? "Queued for local PC render (render-pc). Click to cancel." : "Queue this reel to be re-rendered on PC with latest visual & audio fixes",
                  onclick: async () => {
                    item.reRender = !item.reRender;
                    try {
                      await files.saveJson(`chess/publisher/days/${selectedDay}.json`, curDayData.m, `studio: toggle rerender slot ${sk} on ${selectedDay}`);
                      say(`Slot ${timeFormatted} ${item.reRender ? "queued for re-render ⟳" : "removed from re-render queue"}.`);
                      load();
                    } catch (e) { say("Could not save: " + (e.message || e)); }
                  }
                })
              ) : null
            )
          );
          // where this reel's game comes from (the PGN file, its folder, and a direct link to the PGN)
          if (window.SlotSource) slotBox.append(window.SlotSource.box(item, selectedDay, sk, { compact: true }));
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

      if (!live && log) box.append(el("details", { style: "margin-top:14px;" }, el("summary", { text: "Today's dry-run log (what posting would have done)" }), el("pre", { class: "desc", text: log })));

      box.append(el("p", { class: "note", style: "margin-top:14px;" }, "History and every run: ",
        el("a", { href: "https://github.com/mboylesm-wq/pnoychess-docu/actions/workflows/publish.yml", target: "_blank", rel: "noopener", text: "Publish runs on GitHub Actions" }), "."));
    };

    load().catch((e) => { box.append(el("div", { class: "empty", text: "Could not read the publisher's files: " + (e.message || e) })); });
    return box;
  }

  window.PublishBoard = { view, rows, cardRows, shortRows, dayWindow, videoHref };
})();
