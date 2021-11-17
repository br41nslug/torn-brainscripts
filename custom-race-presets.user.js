// ==UserScript==
// @name         BrainRacing: Custom Race Presets
// @namespace    brainslug.torn.racing
// @version      0.2
// @description  Adding quick preset links for dedicated racers.
// @author       Brainslug [2323221]
// @match        https://www.torn.com/loader.php?sid=racing*
// @icon         https://www.google.com/s2/favicons?domain=torn.com
// @updateURL    https://raw.githubusercontent.com/br41nslug/torn-brainscripts/main/custom-race-presets.user.js
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addStyle
// ==/UserScript==

/**
 * This script was (heavily) based on the great work of Cryosis7 [926640]
 * https://greasyfork.org/en/scripts/393632-torn-custom-race-presets
 *
 * Using hard-coded presets is still supported but not needed anymore as in game saving is now possible.
 * Any races hard-coded can't be disabled from the script. All fields in the template are optional.
 */

 const PRESETS = [
    /** TEMPLATE
    {
        name: "name of the race",
        maxDrivers: 6,
        minDrivers: 2,
        trackName: "Speedway",
        numberOfLaps: 100,
        upgradesAllowed: true,
        betAmount: 0,
        waitTime: 1,
        password: "",
    }, */
    {
        name: "Quick Speedway",
        maxDrivers: 6,
        trackName: "Speedway",
        numberOfLaps: 100,
        waitTime: 1,
        password: "",
    },
    {
        name: "1hr Start - Docks",
        maxDrivers: 100,
        trackName: "Docks",
        numberOfLaps: 100,
        waitTime: 60,
        password: "",
    },
];

// Preset Class
function PresetHandler() {
    const self = this || {};
    const STORE_KEY = "BR_CRP_RACE_PRESETS";
    const TRACKS = {
        "6": "Uptown",       "7": "Withdrawal",  "8": "Underdog",
        "9": "Parkland",     "10": "Docks",      "11": "Commerce",
        "12": "Two Islands", "15": "Industrial", "16": "Vector",
        "17": "Mudpit",      "18": "Hammerhead", "19": "Sewage",
        "20": "Meltdown",    "21": "Speedway",   "23": "Stone Park",
        "24": "Convict"
    };
    let presets = loadPresets().map(normalizePreset);
    let isDeleting = false;
    let $saveButton, $deletLink, $presetContainer;

    // private functions
    function InjectSaveButton() {
        const elem = $(`<span class="btn-wrap brain-button">
            <span class="btn">
                <button class="torn-btn">Save Preset</button>
            </span>
        </span>`);
        $saveButton = elem.find('button');
        $saveButton.on('click', function () {
            const race = getCustomRaceForm();
            presets.push(race);
            const btn = $(`<button class="torn-btn preset-btn">${race.name}</button>`);
            btn.on('click', function () { fillPreset(race); });
            $('.filter-container .bottom-round').append(btn);
            savePresets();
            return false;
        });
        $('.custom-btn-wrap').append(elem);
    }

    function InjectPresetBar() {
        const container = $(`<div class="filter-container m-top10">
            <div class="title-gray top-round">Race Presets - <a href="#">Remove</a></div>
            <div class="cont-gray p10 bottom-round"></div>
        </div>`);
        $deletLink = container.find('a');
        $deletLink.on('click', function () {
            if (isDeleting) {
                $deletLink.text('Remove');
                $presetContainer.removeClass('deleting');
            } else {
                $deletLink.text('Cancel');
                $presetContainer.addClass('deleting');
            }
            isDeleting = !isDeleting;
            return false;
        });
        $presetContainer = container.find('.bottom-round');
        $('#racingAdditionalContainer > .form-custom-wrap').before(container);
    }

    function RenderPresetButtons() {
        $presetContainer.empty();
        presets.forEach(function(p) {
            const btn = $(`<button class="torn-btn preset-btn">${p.name}</button>`);
            btn.on('click', function () { 
                if (isDeleting) {
                    var index = presets.indexOf(p);
                    if (index !== -1) presets.splice(index, 1);
                    $(this).remove();
                    savePresets();
                } else {
                    fillPreset(p); 
                }
            });
            $presetContainer.append(btn);
        })
    }
    
    function fillPreset(race) {
        if ( !! race.name) $('.race-wrap div.input-wrap input').attr('value', race.name);
        if ( !! race.minDrivers) $('.drivers-min-wrap div.input-wrap input').attr('value', race.minDrivers);
        if ( !! race.maxDrivers) $('.drivers-max-wrap div.input-wrap input').attr('value', race.maxDrivers);
        if ( !! race.numberOfLaps) $('.laps-wrap > .input-wrap > input').attr('value', race.numberOfLaps);
        if ( !! race.betAmount) $('.bet-wrap > .input-wrap > input').attr('value', race.betAmount);
        if ( !! race.waitTime) $('.time-wrap > .input-wrap > input').attr('value', race.waitTime);
        if ( !! race.password) $('.password-wrap > .input-wrap > input').attr('value', race.password);
        if ( !! race.trackName) {
            $('#select-racing-track').selectmenu();
            $('#select-racing-track-menu > li:contains(' + race.trackName + ')').mouseup();
        }
        if ( !! race.upgradesAllowed) {
            $('#select-allow-upgrades').selectmenu();
            $('#select-allow-upgrades-menu > li:contains(' + race.upgradesAllowedString + ')').mouseup();
        }
    }
    
    function normalizePreset(item, index=0) {
        if ( !! item.name && item.name.length > 25) item.name = item.name.substring(0, 26);
        if ( ! item.name) item.name = "Preset " + (+index + 1);
        if ( !! item.maxDrivers) item.maxDrivers = (item.maxDrivers > 100) ? 100 : (item.maxDrivers < 2) ? 2 : item.maxDrivers;
        if ( !! item.minDrivers) item.minDrivers = (item.minDrivers < 2) ? 2 : (item.minDrivers >= item.maxDrivers) ? item.maxDrivers - 1 : item.minDrivers;
        if ( !! item.trackName) item.trackName = item.trackName.toLowerCase().split(' ').map(x => x.charAt(0).toUpperCase() + x.substring(1)).join(' ');
        if ( !! item.numberOfLaps) item.numberOfLaps = (item.numberOfLaps > 100) ? 100 : (item.numberOfLaps < 1) ? 1 : item.numberOfLaps;
        if ( !! item.upgradesAllowed) item.upgradesAllowedString = item.upgradesAllowed ? "Allow upgrades" : "Stock cars only";
        if ( !! item.betAmount) item.betAmount = (item.betAmount > 10000000) ? 10000000 : (item.betAmount < 0) ? 0 : item.betAmount;
        if ( !! item.waitTime) item.waitTime = (item.waitTime > 2880) ? 2880 : (item.waitTime < 1) ? 1 : item.waitTime;
        if ( !! item.password && item.password.length > 25) item.password = item.password.substring(0, 26);
        return item;
    }

    function getCustomRaceForm() {
        return $('#createCustomRace').serializeArray().reduce(function(race, cur) {
            switch (cur.name) {
                case 'title': race.name = cur.value; break;
                case 'maxDrivers': race.maxDrivers = parseInt(cur.value); break;
                case 'minDrivers': race.minDrivers = parseInt(cur.value); break;
                case 'trackID': race.trackName = TRACKS[cur.value]; break;
                case 'laps': race.numberOfLaps = parseInt(cur.value); break;
                case 'betAmount': race.betAmount = parseInt(cur.value); break;
                case 'waitTime': race.waitTime = parseInt(cur.value); break;
                case 'password': race.password = cur.value; break;
            }
            return race;
        }, {});
    }
    
    function loadPresets() {
        const savedPresets = JSON.parse(GM_getValue(STORE_KEY, "[]"));
        return [].concat(PRESETS).map(item => { item.static = true; return item; }).concat(savedPresets);
    }
    function savePresets() {
        GM_setValue(STORE_KEY, JSON.stringify(presets.filter(function(preset) {
            return !preset.static;
        })));
    }
    
    // constructor
    InjectSaveButton();
    InjectPresetBar();
    RenderPresetButtons();
    return self;
}

// init
(function() {
    'use strict';
    $('body').ajaxComplete(function(e, xhr, settings) {
        if (settings.url.indexOf("section=createCustomRace") >= 0) {
            new PresetHandler();
        }
    });
    GM_addStyle(`
    .deleting .preset-btn:hover {
        text-decoration: line-through;
    }
    .filter-container .deleting.bottom-round.cont-gray {
        background-color: rgba(255, 63, 0, .16);
    }
    .brain-button {
        float: right;
    }
    .preset-btn {
        margin: 0 10px 10px 0;
    }
    .preset-btn.active {
        background: transparent linear-gradient(180deg,#E5E5E5 0%,#BBBBBB 60%,#999999 100%) 0 0 no-repeat;
        color: #333;
    }
    `);
})();