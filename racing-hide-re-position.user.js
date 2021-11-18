// ==UserScript==
// @name         BrainRacing: Hide Position Badge
// @namespace    brainslug.torn.racing
// @version      0.2
// @description  Allows you to pick different race class decoration
// @author       Brainslug [2323221]
// @match        https://www.torn.com/loader.php?sid=racing*
// @icon         https://www.google.com/s2/favicons?domain=torn.com
// @updateURL    https://raw.githubusercontent.com/br41nslug/torn-brainscripts/main/racing-hide-re-position.user.js
// @grant        GM_addStyle
// ==/UserScript==

GM_addStyle(`
ul.driver-item li.name .race_position {
  display: none;
}
`);