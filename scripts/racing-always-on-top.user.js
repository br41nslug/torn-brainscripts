// ==UserScript==
// @name         BrainRacing: Always On Top
// @namespace    brainslug.torn.racing
// @version      0.2.2
// @description  Pull you to the top so you don't have to go looking for your position in big races
// @author       Brainslug [2323221]
// @match        https://www.torn.com/page.php?sid=racing*
// @match        https://www.torn.com/loader.php?sid=racing*
// @icon         https://www.google.com/s2/favicons?domain=torn.com
// @downloadURL  https://raw.githubusercontent.com/br41nslug/torn-brainscripts/main/scripts/racing-always-on-top.user.js
// @updateURL    https://raw.githubusercontent.com/br41nslug/torn-brainscripts/main/scripts/racing-always-on-top.user.js
// @grant        GM_addStyle
// ==/UserScript==

const user_id = document.cookie.match('(^|;)\\s*uid\\s*=\\s*([^;]+)')?.pop() || '';

GM_addStyle(`
#leaderBoard {
  padding-top: 32px;
  position: relative;
}
#lbr-${user_id} {
  position: absolute;
  width: 100%;
  top: 0;
}
`);