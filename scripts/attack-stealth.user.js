// ==UserScript==
// @name         BrainTools: Show Stealth
// @namespace    brainslug.torn.tools
// @version      0.3
// @description  Shows the stealth percentage in the header.
// @author       Brainslug [2323221]
// @match        https://www.torn.com/loader.php?sid=attack&user2ID=*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=torn.com
// @downloadURL  https://raw.githubusercontent.com/br41nslug/torn-brainscripts/main/scripts/attack-stealth.user.js
// @updateURL    https://raw.githubusercontent.com/br41nslug/torn-brainscripts/main/scripts/attack-stealth.user.js
// @grant        none
// ==/UserScript==

function watchPercentage(target, title) {
    function updatePercentage() {
        const percent = parseFloat(target.style.height.replace('%', '')).toFixed(2) + '%';
        console.info('style changed!', percent, title);
        title.innerText = `Stealth ${percent}`;
    }
    var observer = new MutationObserver(() => updatePercentage());
    updatePercentage();
    observer.observe(target, { attributes : true, attributeFilter : ['style'] });
}

function addTitleWrapper(title, className) {
    const toggleClass = 'brainslug-title';
    if (title.classList.contains(toggleClass)) {
        title.appendChild(document.createTextNode(" - "));
        const wrapper = document.createElement('span');
        wrapper.classList.add(className);
        title.appendChild(wrapper);
        return wrapper;
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
        const bar = document.querySelector(`div[class^='stealthBarWrap_'] [class^='level_']`);
        const title = document.querySelector(`div[class^='titleContainer_'] [class^='title_']`);
        if (bar && title) {
            const wrapped = addTitleWrapper(title, 'stealth');
            watchPercentage(bar, wrapped);
            return clearInterval(loop);
        }
        if (counter > maxLoop) {
            console.error('bar never found');
            return clearInterval(loop);
        }
        counter++;
    }, 100);
})();
