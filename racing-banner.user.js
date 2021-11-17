// ==UserScript==
// @name         BrainRacing: Change Racing Banner
// @namespace    brainslug.torn.racing
// @version      0.2
// @description  Allows you to pick different race class decoration
// @author       Brainslug [2323221]
// @match        https://www.torn.com/loader.php?sid=racing*
// @icon         https://www.google.com/s2/favicons?domain=torn.com
// @updateURL    https://raw.githubusercontent.com/br41nslug/torn-brainscripts/main/racing-banner.user.js
// @grant        none
// ==/UserScript==

const SELECTED_CLASS = 'C';
const CURRENT_CLASS = 'A';

(function() {
    'use strict';
    const maxLoop = 10000;
    let counter = 1;
    let loop = setInterval(function () {
        let $elem = $('.racing-main-wrap.class-'+CURRENT_CLASS);
        if ($elem.length > 0 || counter > maxLoop) {
            $elem.removeClass('class-'+CURRENT_CLASS).addClass('class-'+SELECTED_CLASS);
            return clearInterval(loop);
        }
        counter++;
    }, 100);
})();