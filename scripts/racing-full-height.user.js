// ==UserScript==
// @name         BrainRacing: Full Height Driver Panel
// @namespace    brainslug.torn.racing
// @version      0.2
// @description  Simply shows the full height driver panel nothing more nothing less
// @author       Brainslug [2323221]
// @match        https://www.torn.com/loader.php?sid=racing*
// @icon         https://www.google.com/s2/favicons?domain=torn.com
// @downloadURL  https://raw.githubusercontent.com/br41nslug/torn-brainscripts/main/scripts/racing-full-height.user.js
// @updateURL    https://raw.githubusercontent.com/br41nslug/torn-brainscripts/main/scripts/racing-full-height.user.js
// @grant        GM_addStyle
// ==/UserScript==
GM_addStyle(`
.d .racing-main-wrap .car-selected-wrap #drivers-scrollbar#drivers-scrollbar {
    max-height: fit-content!important;
}
`);