// ==UserScript==
// @name         BrainTools: Show HP%
// @namespace    brainslug.torn.tools
// @version      0.1
// @description  Shows the stealth percentage in the header.
// @author       Brainslug [2323221]
// @match        https://www.torn.com/loader.php?sid=attack&user2ID=*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=torn.com
// @downloadURL  https://raw.githubusercontent.com/br41nslug/torn-brainscripts/main/scripts/attack-hp.user.js
// @updateURL    https://raw.githubusercontent.com/br41nslug/torn-brainscripts/main/scripts/attack-hp.user.js
// @grant        none
// ==/UserScript==

function watchPercentages(attacker, defender, title) {
    function updatePercentage() {
        const attPercent = parseFloat(attacker.style.width.replace('%', '')).toFixed(2) + '%';
        const defPercent = parseFloat(defender.style.width.replace('%', '')).toFixed(2) + '%';
        console.info('style changed!', attPercent, defPercent, title);
        title.innerText = `HP ${attPercent} vs ${defPercent}`;
    }
    var observer = new MutationObserver(() => updatePercentage());
    updatePercentage();
    observer.observe(attacker, { attributes : true, attributeFilter : ['style'] });
    observer.observe(defender, { attributes : true, attributeFilter : ['style'] });
}

function addTitleWrapper(title, className) {
    const toggleClass = 'brainslug-title';
    if (title.classList.contains(toggleClass)) {
        title.appendChild(document.createTextNode(" - "));
        const wrapper = document.createElement('span');
        wrapper.classList.add(className);
        title.appendChild(wrapper);
    } else {
        title.classList.add(toggleClass);
        title.innerHTML = `Attacking - <span class="${className}"></span>`;
    }
    return title.getElementsByClassName(className)[0];
}

(function() {
    'use strict';
    const maxLoop = 10000;
    let counter = 1;
    let loop = setInterval(function () {
        const defender = document.querySelector(`div#defender [class^='header_'] [class^='progress_']`);
        const attacker = document.querySelector(`div#attacker [class^='header_'] [class^='progress_']`);
        const title = document.querySelector(`div[class^='titleContainer_'] [class^='title_']`);
        if (defender && attacker && title) {
            const wrapped = addTitleWrapper(title, 'hp');
            watchPercentages(attacker, defender, wrapped);
            return clearInterval(loop);
        }
        if (counter > maxLoop) {
            console.error('bar never found');
            return clearInterval(loop);
        }
        counter++;
    }, 100);
})();
