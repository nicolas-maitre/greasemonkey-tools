//@ts-check
"use strict";
// ==UserScript==
// @name     Youtube playlist stats
// @version  1
// @grant    none
// @match    https://www.youtube.com/*
// ==/UserScript==

/**
 * @param {number} num
 */
function ps(num) {
  return (num + "").padStart(2, "0");
}
/**
 * @param {number} seconds
 */
function formatSeconds(seconds) {
  const daysRemain = seconds % (3600 * 24);
  const days = (seconds - daysRemain) / (3600 * 24);
  const hoursRemain = daysRemain % 3600;
  const hours = (daysRemain - hoursRemain) / 3600;
  const minutesRemain = hoursRemain % 60;
  const minutes = (hoursRemain - minutesRemain) / 60;

  let text = (minutes ? ps(minutesRemain) : minutesRemain) + "s";
  if (minutes) text = (hours ? ps(minutes) : minutes) + "m" + text;
  if (hours) text = (days ? ps(hours) : hours) + "h" + text;
  if (days) text = days + "d" + text;
  return text;
}

(() => {
  const AUTO_UPDATE_DELAY = 2000;
  const AUTO_SCROLL_INTERVAL = 100;
  const ITEMS_BY_LOAD = 100;
  const SCAN_BTN_TEXT = "scan";

  /**
   * @type {Element}
   */
  let statsSibling;
  /**
   * @type {{
   *    container: HTMLElement;
   *    stats: HTMLElement;
   *    loadAll: HTMLElement;
   * }}
   */
  let elems;
  let autoLoading = false;
  function updateStats() {
    if (window.location.href.split("/")[3]?.split("?")[0] !== "playlist") {
      return;
    }
    const newSibling = document.body.querySelector(
      "ytd-playlist-sidebar-primary-info-renderer > #stats"
    );
    if (newSibling !== statsSibling) {
      statsSibling = newSibling;
      elems = {
        container: document.createElement("div"),
        stats: document.createElement("div"),
        loadAll: document.createElement("button"),
      };

      elems.stats.style.fontSize = "1.4rem";
      elems.stats.style.color = "var(--yt-spec-text-secondary)";
      elems.stats.style.whiteSpace = "pre-line";
      elems.stats.textContent = "... • ...";
      elems.container.appendChild(elems.stats);

      elems.loadAll.style.color = "white";
      elems.loadAll.style.background = "transparent";
      elems.loadAll.style.marginTop = "5px";
      elems.loadAll.style.borderRadius = "10px";
      elems.loadAll.textContent = SCAN_BTN_TEXT;
      elems.loadAll.addEventListener("click", () => {
        autoLoading = !autoLoading;
        if (autoLoading) {
          elems.loadAll.textContent = "0%";
          setTimeout(updateStats);
          //fast scroll
          const code = setInterval(() => {
            // @ts-ignore
            window.scroll({ top: window.scrollMaxY });
            if (!autoLoading) clearInterval(code);
          }, AUTO_SCROLL_INTERVAL);
        } else {
          elems.loadAll.textContent = SCAN_BTN_TEXT;
        }
      });
      elems.container.appendChild(elems.loadAll);

      elems.container.style.marginTop = "1.4rem";
      statsSibling.after(elems.container);
    }
    if (!elems) {
      return;
    }
    const times = [
      ...document.body.querySelectorAll(
        "ytd-playlist-video-list-renderer > #contents > ytd-playlist-video-renderer > #content > #container > ytd-thumbnail > #thumbnail > #overlays > ytd-thumbnail-overlay-time-status-renderer > #text"
      ),
    ].flatMap((elem) => {
      let isInvalid = false;
      /**
       * @type {number[] & {at(i:number):number}}
       */
      // @ts-ignore
      const splitted = elem.textContent.split(":").map((t) => {
        const n = parseInt(t);
        if (isNaN(n)) isInvalid = true;
        return n;
      });
      if (isInvalid) return [];
      const hours = splitted.at(-3) ?? 0;
      const minutes = splitted.at(-2) ?? 0;
      const seconds = splitted.at(-1) ?? 0;
      return [hours * 3600 + minutes * 60 + seconds];
    });
    const videosCount = times.length;
    const total = times.reduce((a, b) => a + b, 0);

    //autoscroll
    if (autoLoading) {
      // @ts-ignore
      window.scroll({ top: window.scrollMaxY });
      const realVideosCount = parseInt(
        statsSibling
          .querySelector("yt-formatted-string > span")
          .textContent.split(",")
          .join("")
      );
      elems.loadAll.textContent =
        Math.round((videosCount / realVideosCount) * 100) + "%";
      if (realVideosCount - videosCount < ITEMS_BY_LOAD) {
        autoLoading = false;
        elems.loadAll.textContent = SCAN_BTN_TEXT;
        setTimeout(() => window.scroll({ top: 0 }),500);
      }
    }

    //display
    elems.stats.textContent =
      `For ${times.length} videos • ${formatSeconds(total)} • ${
        Math.round(total / 360) / 10
      }h\n` +
      `Min ${formatSeconds(Math.min(...times))} • max ${formatSeconds(
        Math.max(...times)
      )} • avg ${formatSeconds(Math.round(total / videosCount))}`;
  }

  setInterval(updateStats, AUTO_UPDATE_DELAY);
  updateStats();
  console.log("playlist stats script loaded");
})();
