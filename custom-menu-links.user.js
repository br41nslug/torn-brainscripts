// ==UserScript==
// @name         BrainTools: Custom Menu Links
// @namespace    brainslug.torn.utility
// @version      0.1
// @description  Inject custom menu links inspired by torntools
// @author       Brainslug [2323221]
// @match        https://www.torn.com/*
// @icon         https://www.google.com/s2/favicons?domain=torn.com
// @updateURL    https://raw.githubusercontent.com/br41nslug/torn-brainscripts/main/custom-menu-links.user.js
// @grant        GM_addStyle
// ==/UserScript==

const customLinks = [
    { label: "Raceway", after: "home", target: "/loader.php?sid=racing", icon: '<i class="cql-race-track"></i>' },
    { label: "Item Market", before: "items", target: "/imarket.php", icon: '<i class="cql-item-market"></i>' },
    { label: "Bazaar", after: "items", target: "/bazaar.php#/manage", icon: '<svg xmlns="http://www.w3.org/2000/svg" width="15" viewBox="0 0 16 17"><defs><style>.cls-1{opacity:0.35;}.cls-2{fill:#fff;}.cls-3{fill:#777;}</style></defs><g id="Слой_2" data-name="Слой 2"><g id="icons"><g class="cls-1"><path class="cls-2" d="M6.63,1,6,4.31v.74A1.34,1.34,0,0,1,3.33,5V4.31L5.33,1Zm-2,0L2.67,4.31v.74A1.33,1.33,0,0,1,1.33,6.33,1.32,1.32,0,0,1,0,5V4.31L3.25,1ZM16,5a1.32,1.32,0,0,1-1.33,1.29A1.37,1.37,0,0,1,13.33,5V4.27L11.41,1h1.34L16,4.31ZM9.33,4.27V5A1.33,1.33,0,0,1,6.67,5V4.27L7.37,1H8.63ZM10.67,1l2,3.33v.74a1.3,1.3,0,0,1-1.33,1.26A1.36,1.36,0,0,1,10,5V4.27L9.37,1ZM.67,7.67V17H7.33V15.67H2V9H14v8h1.33V7.67Zm12,2.66h-4V17h4Z"></path></g><path class="cls-3" d="M6.63,0,6,3.31v.74A1.34,1.34,0,0,1,3.33,4V3.31L5.33,0Zm-2,0L2.67,3.31v.74A1.33,1.33,0,0,1,1.33,5.33,1.32,1.32,0,0,1,0,4V3.31L3.25,0ZM16,4a1.32,1.32,0,0,1-1.33,1.29A1.37,1.37,0,0,1,13.33,4V3.27L11.41,0h1.34L16,3.31ZM9.33,3.27V4A1.33,1.33,0,0,1,6.67,4V3.27L7.37,0H8.63ZM10.67,0l2,3.33v.74a1.3,1.3,0,0,1-1.33,1.26A1.36,1.36,0,0,1,10,4V3.27L9.37,0ZM.67,6.67V16H7.33V14.67H2V8H14v8h1.33V6.67Zm12,2.66h-4V16h4Z"></path></g></g></svg>' },
    { label: "Pharmacy", before: "city", target: "/shops.php?step=pharmacy", icon: '<i class="cql-pharmacy"></i>' },
    { label: "Travel Agency", after: "hall_of_fame", target: "/travelagency.php", icon: '<i class="cql-travel-agency"></i>' },
];

const insertBefore = (newNode, referenceNode) => referenceNode.parentNode.insertBefore(newNode, referenceNode);
const insertAfter = (newNode, referenceNode) => referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
const _elem = (tag, attrs={}) => {
    const elem = document.createElement(tag);
    if ( !! attrs.text) elem.innerText = attrs.text;
    if ( !! attrs.html) elem.innerHTML = attrs.html;
    if ( !! attrs.href && tag == 'a') elem.href = attrs.href;
    if ( !! attrs.cls) {
        if (Array.isArray(attrs.cls)) attrs.cls.forEach(c => elem.classList.add(c));
        else elem.classList.add(attrs.cls);
    }
    if ( !! attrs.children) attrs.children.forEach(child => elem.append(child));
    return elem;
};
const _watcher = (query='querySelector') => (selector, timeout=50, retries=50) => new Promise((resolve, reject) => {
    let count = 0;
    const interval = setInterval(() => {
        const $elem = unsafeWindow.document[query](selector);
        if ( !! $elem) {
            clearInterval(interval);
            return resolve($elem);
        }
        if (count >= retries) {
            clearInterval(interval);
            console.warning(`Max retries(${retries}) reached for "${selector}"!`);
            return reject();
        }
        count++;
    }, timeout);
});

const watchDom = _watcher('querySelector'),
      watchDomAll = _watcher('querySelectorAll'),
      watchNav = linkname => _watcher('querySelector')('#nav-'+linkname);

const findClass = (cls, elem) => {
    let result = '';
    elem.classList.forEach(className => cls.test(className) && (result = className));
    if (result === '') console.error('[findClass]','class not found!', cls, elem);
    return result;
};

(function () {
    const injectLink = (link, elem, inject) => inject(_elem('div', {
        cls: ['brain-link', findClass(/^area-desktop_/, elem)],
        children: [_elem('div', {
            cls: findClass(/^area-row_/, elem.children[0]),
            children: [_elem('a', {
                cls: findClass(/^desktopLink_/, elem.children[0].children[0]),
                href: link.target,
                children: [
                    _elem('span', {
                        cls: 'icon',
                        html:  link.icon || '',
                    }),
                    _elem('span', {
                        cls: findClass(/^linkName_/, elem.children[0].children[0].children[1]),
                        text: link.label,
                    }),
                ]
            })]
        })]
    }), elem);
    // inject links
    customLinks.forEach(link => {
        if (!link.before && !link.after) return console.error('bad link', link);
        const position = !! link.before ? 'before' : 'after';
        watchNav(link[position]).then(element => {
            // get damn dynamically generated classes xP
            const className = findClass(/^area-desktop_/, element);
            console.log('[BrainTools]', 'injecting custom link', link);
            injectLink(link, element, (position == 'before') ? insertBefore : insertAfter);
        });
    });
    // inject styles
    GM_addStyle(`
    .brain-link a .icon {
        float: left;
        width: 34px;
        height: 23px;
        display: -webkit-box;
        display: -ms-flexbox;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: row;
        margin-left: 0;
    }
    `);
})();