// ==UserScript==
// @name         BrainTools: Custom Menu Links
// @namespace    brainslug.torn.utility
// @version      0.3.1
// @description  Inject custom menu links inspired by torntools
// @author       Brainslug [2323221]
// @match        https://www.torn.com/*
// @icon         https://www.google.com/s2/favicons?domain=torn.com
// @updateURL    https://raw.githubusercontent.com/br41nslug/torn-brainscripts/main/scripts/custom-menu-links.user.js
// @grant        GM_addStyle
// ==/UserScript==

/**
 * This list configures which items will be added to the menu.
 * An item may contain the following settings:
 *  label: This is the text in the link
 *  after/before: Where the link will be inserted (available choices below)
 *  target: The page you are linking to. For torn pages only the "/bazaar.php" part is needed but for external pages you need the full "https://example.com" domain.
 *  icon: For lack of a better solution yet this is plain html to be injected. The icons i used here with the exception of the bazaar were taken from the city map list.
 *  newTab: true/false defaults to false, whether to open a new tab when you click the link
 */
 const customLinks = [
    { label: "Raceway", after: "home", target: "/loader.php?sid=racing", icon: '<i class="cql-raceway"></i>' },
    { label: "Item Market", before: "items", target: "/imarket.php", icon: '<i class="cql-item-market"></i>' },
    { label: "Bazaar", after: "items", target: "/bazaar.php#/manage", icon: '<svg xmlns="http://www.w3.org/2000/svg" width="15" viewBox="0 0 16 17"><defs><style>.cls-1{opacity:0.35;}.cls-2{fill:#fff;}.cls-3{fill:#777;}</style></defs><g id="Слой_2" data-name="Слой 2"><g id="icons"><g class="cls-1"><path class="cls-2" d="M6.63,1,6,4.31v.74A1.34,1.34,0,0,1,3.33,5V4.31L5.33,1Zm-2,0L2.67,4.31v.74A1.33,1.33,0,0,1,1.33,6.33,1.32,1.32,0,0,1,0,5V4.31L3.25,1ZM16,5a1.32,1.32,0,0,1-1.33,1.29A1.37,1.37,0,0,1,13.33,5V4.27L11.41,1h1.34L16,4.31ZM9.33,4.27V5A1.33,1.33,0,0,1,6.67,5V4.27L7.37,1H8.63ZM10.67,1l2,3.33v.74a1.3,1.3,0,0,1-1.33,1.26A1.36,1.36,0,0,1,10,5V4.27L9.37,1ZM.67,7.67V17H7.33V15.67H2V9H14v8h1.33V7.67Zm12,2.66h-4V17h4Z"></path></g><path class="cls-3" d="M6.63,0,6,3.31v.74A1.34,1.34,0,0,1,3.33,4V3.31L5.33,0Zm-2,0L2.67,3.31v.74A1.33,1.33,0,0,1,1.33,5.33,1.32,1.32,0,0,1,0,4V3.31L3.25,0ZM16,4a1.32,1.32,0,0,1-1.33,1.29A1.37,1.37,0,0,1,13.33,4V3.27L11.41,0h1.34L16,3.31ZM9.33,3.27V4A1.33,1.33,0,0,1,6.67,4V3.27L7.37,0H8.63ZM10.67,0l2,3.33v.74a1.3,1.3,0,0,1-1.33,1.26A1.36,1.36,0,0,1,10,4V3.27L9.37,0ZM.67,6.67V16H7.33V14.67H2V8H14v8h1.33V6.67Zm12,2.66h-4V16h4Z"></path></g></g></svg>' },
    { label: "Pharmacy", before: "city", target: "/shops.php?step=pharmacy", icon: '<i class="cql-pharmacy"></i>' },
    { label: "Travel Agency", after: "hall_of_fame", target: "/travelagency.php", icon: '<i class="cql-travel-agency"></i>' },
];
/**
 * Torn Menu Items:
 * - home
 * - items
 * - city
 * - job
 * - gym
 * - properties
 * - education
 * - crimes
 * - missions
 * - newspaper
 * - jail
 * - hospital
 * - casino
 * - forums
 * - hall_of_fame
 * - my_faction
 * - recruit_citizens
 * - competitions
 */

const tag = tagName => (attrs={}) => {
    const elem = document.createElement(tagName);
    if ( !! attrs.text) elem.innerText = attrs.text;
    if ( !! attrs.html) elem.innerHTML = attrs.html;
    if (tagName == 'a') {
        if ( !! attrs.href) elem.href = attrs.href;
        if ( !! attrs.target) elem.target = attrs.target;
    }
    if ( !! attrs.cls) {
        if (Array.isArray(attrs.cls)) attrs.cls.forEach(c => elem.classList.add(c));
        else elem.classList.add(attrs.cls);
    }
    if ( !! attrs.children) attrs.children.forEach(child => elem.append(child));
    return elem;
};

const watchNav = (linkname, timeout=50, retries=50) => new Promise((resolve, reject) => {
    let count = 0;
    const interval = setInterval(() => {
        const $elem = unsafeWindow.document['querySelector']('#nav-'+linkname);
        if ( !! $elem) {
            clearInterval(interval);
            return resolve($elem);
        }
        if (count >= retries) {
            clearInterval(interval);
            console.error(`Max retries(${retries}) reached for "#nav-${linkname}"!`);
            return reject();
        }
        count++;
    }, timeout);
});

const findClass = (cls, elem) => {
    let result = '';
    elem.classList.forEach(className => cls.test(className) && (result = className));
    if (result === '') console.error('[BrainTools]', 'class not found!', cls, elem);
    return result;
};

const injectLink = (link, elem) => elem.parentNode.insertBefore(tag`div`({
    cls: ['brain-link', findClass(/^area-desktop_/, elem)],
    children: [tag`div`({
        cls: findClass(/^area-row_/, elem.children[0]),
        children: [tag`a`({
            cls: findClass(/^desktopLink_/, elem.children[0].children[0]),
            href: link.target,
            target: !! link.newTab ? '_blank' : '_self',
            children: [
                tag`span`({
                    cls: 'icon',
                    html:  link.icon || '',
                }),
                tag`span`({
                    cls: findClass(/^linkName_/, elem.children[0].children[0].children[1]),
                    text: link.label,
                }),
            ]
        })]
    })]
}), !! link.before ? elem : elem.nextSibling);

// inject links
customLinks.forEach(link => {
    if ((! link.before && ! link.after) || ! link.target || ! link.label) 
        return console.error('[BrainTools]', 'Bad link configured', link);
    const selector = !! link.before ? link.before : link.after;
    watchNav(selector).then(element => {
        console.info('[BrainTools]', 'Injecting custom link', link.label, link.target);
        injectLink(link, element);
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