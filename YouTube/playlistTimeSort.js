//@ts-check
"use strict";
// ==UserScript==
// @name     Youtube playlist sort
// @version  1
// @grant    none
// @match    https://www.youtube.com/*
// ==/UserScript==

/**
 *
 * @param {string} type
 * @param {{[n:string]:any} | null} props
 * @param  {...(Element | string | number)} children
 * @returns {Element}
 */
function e(type, props = null, ...children) {
  const elem = document.createElement(type);
  if (props)
    Object.entries(props).forEach(([key, val]) => {
      if (key.substring(0, 2) === "on")
        elem.addEventListener(key.substring(2), val);
      else elem.setAttribute(key, val);
    });
  if (children) {
    children.forEach((c) => {
      if (c instanceof Element) {
        elem.appendChild(c);
      } else {
        elem.appendChild(document.createTextNode(c.toString()));
      }
    });
  }
  return elem;
}
(() => {
  /**
   * @type {Element}
   */
  let dropDownElement;
  setInterval(loop, 2000);
  setTimeout(loop);
  console.log("playlist time sort loaded");
  function loop() {
    if (window.location.href.split("/")[3]?.split("?")[0] !== "playlist") {
      return;
    }
    const newDDElem = document.querySelector(
      ".yt-sort-filter-sub-menu-renderer tp-yt-paper-listbox"
    );
    if (newDDElem !== dropDownElement) {
      dropDownElement = newDDElem;
      dropDownElement.appendChild(
        e(
          "a",
          {
            class: "yt-simple-endpoint style-scope yt-dropdown-menu",
            onclick() {
              sortClicked("asc");
            },
          },
          e(
            "tp-yt-paper-item",
            { class: "style-scope yt-dropdown-menu" },
            e(
              "tp-yt-paper-item-body",
              { class: "style-scope yt-dropdown-menu" },
              e(
                "div",
                { class: "item style-scope yt-dropdown-menu" },
                "Length (shortest)"
              )
            )
          )
        )
      );
      dropDownElement.appendChild(
        e(
          "a",
          {
            class: "yt-simple-endpoint style-scope yt-dropdown-menu",
            onclick() {
              sortClicked("desc");
            },
          },
          e(
            "tp-yt-paper-item",
            { class: "style-scope yt-dropdown-menu" },
            e(
              "tp-yt-paper-item-body",
              { class: "style-scope yt-dropdown-menu" },
              e(
                "div",
                { class: "item style-scope yt-dropdown-menu" },
                "Length (longest)"
              )
            )
          )
        )
      );
    }
  }
  /**
   * @param {"asc" | "desc"} way
   */
  function sortClicked(way) {
    //hide pop
    const sortMenuBtn = document
      .querySelector(".yt-sort-filter-sub-menu-renderer #trigger")
      .click();
    //aquire videos
    const videos = [
      ...document.querySelectorAll("ytd-playlist-video-renderer"),
    ].map((elem) => {
      //id (doesn't really work)
      const id = elem.querySelector("#img").src.split("/")[4];
      //duration
      const timeElem = elem.querySelector(
        " ytd-thumbnail-overlay-time-status-renderer #text"
      );
      const duration = timeTextToSeconds(timeElem.textContent);

      return {
        id,
        elem,
        duration,
      };
    });

    //sort
    const playlistContainer = document.querySelector(
      "ytd-playlist-video-list-renderer #contents"
    );
    const loaderAnchor = playlistContainer.querySelector(
      "ytd-continuation-item-renderer"
    );
    const sortedVids = [...videos].sort((a, b) => a.duration - b.duration);
    if (way === "desc") sortedVids.reverse();
    sortedVids.forEach((vid) => playlistContainer.appendChild(vid.elem));
    playlistContainer.appendChild(loaderAnchor);
  }
})();
/**
 * @param {string} str
 * @return {number}
 */
function timeTextToSeconds(str) {
  let isInvalid = false;
  /**
   * @type {number[] & {at(i:number):number}}
   */
  // @ts-ignore
  const splitted = str.split(":").map((t) => {
    const n = parseInt(t);
    if (isNaN(n)) isInvalid = true;
    return n;
  });
  if (isInvalid) return 0;
  const hours = splitted.at(-3) ?? 0;
  const minutes = splitted.at(-2) ?? 0;
  const seconds = splitted.at(-1) ?? 0;
  return hours * 3600 + minutes * 60 + seconds;
}
