// ==UserScript==
// @name         BrainRacing: Extra Lap Statistics
// @namespace    brainslug.torn.racing
// @version      0.4.6
// @description  Removing the useless left sidebar and adding statistics on the right!
// @author       Brainslug [2323221]
// @match        https://www.torn.com/page.php?sid=racing*
// @icon         https://www.google.com/s2/favicons?domain=torn.com
// @downloadURL  https://raw.githubusercontent.com/br41nslug/torn-brainscripts/main/scripts/racing-lap-statistics.user.js
// @updateURL    https://raw.githubusercontent.com/br41nslug/torn-brainscripts/main/scripts/racing-lap-statistics.user.js
// @grant        GM_addStyle
// @run-at       document-body
// ==/UserScript==

console.info('[BrainRacing]', 'Extra lap statistics');
let lastRace = null;
interceptRaceData(function (data) {
    if (data.raceID == lastRace) return;
    data = decodeData(data);
    const raceData = processRaceData(data);
    $("#racingupdatesnew").ready(function () {
        injectSidebar();
        updateLeaderboard('', 0, parseLapData(raceData, 0));
        watchRaceBar(function (name, lap) {
            console.debug('[BrainRacing] updateLeaderboard', name, lap);
            updateLeaderboard(name, lap, parseLapData(raceData, lap));
        });
        lastRace = data.raceID;
    });
});

// styles
GM_addStyle(`
.car-selected {
    position: relative;
}
.d .racing-main-wrap .car-selected-wrap .car-selected.right {
    width: 353px;
    margin-right: -120px;
}
.d .racing-main-wrap .car-selected-wrap .car-selected.right.small {
    margin-right: 0;
    width: 233px;
}
.car-selected.right #br-leaderboard-title {
    cursor: pointer;
}
.car-selected.right #br-leaderboard-title .expand {
    border-color: transparent transparent transparent #666;
    border-style: solid;
    border-width: 5px 0 5px 5px;
    filter: var(--react-dropdown-toggler-after-filter);
    height: 0;
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-5px) rotate(180deg);
    width: 0;
}
.car-selected.right.small #br-leaderboard-title .expand {
    transform: translateY(-5px);
}
#br-leaderboard-list {
    max-height: 850px;
}
.br-leaderboard-listitem {
    padding: 10px;
    display: flex;
}
.d .racing-main-wrap .car-selected-wrap .properties-wrap > .br-leaderboard-listitem.highlight {
    color: #7ccd62;
}
.br-leaderboard-listitem .name {
    flex-grow: 1;
    text-overflow: ellipsis;
    overflow: hidden;
}
.br-leaderboard-listitem .value {
    width: 70px;
    text-align: center;
}
.car-selected.right.small .br-leaderboard-listitem .value.extra {
    display: none;
}
.br-leaderboard-listitem .value:last-child {
    width: 50px;
}
`);

// get the data for a single lap
function parseLapData(results, lap) {
    if (lap < 1) return results[0].positions.map(playername => ([playername, 0, 0, 0 ]));
    const lapData = results[lap - 1];
    return lapData.positions.map(playername => ([
        playername,
        formatTimeMsec(lapData.times[playername]*1000),
        formatTimeSec(lapData.behind[playername]),
        formatTimeSec(lapData.improvement[playername]),
        playername == lapData.bestLap
    ])).concat(lapData.crashed.map(playername => ([
        playername, '', 'crashed', 'crashed', false
    ])));
}

// time format
function formatTimeSec(sec) {
    const _sec = Math.abs(sec);
    if (_sec > 999) return sec.toFixed(0);
    if (_sec > 99) return sec.toFixed(1);
    if (_sec > 9) return sec.toFixed(2);
    return sec.toFixed(3);
}
function formatTimeMsec(msec) {
    const hours = Math.floor((msec % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((msec % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((msec % (1000 * 60)) / 1000);
    const mseconds = Math.floor(msec % 1000);
    if (hours > 0) return pad(hours, 2) + "h" + pad(minutes, 2) + "m";
    if (minutes > 0) return pad(minutes, 2) + "m" + pad(seconds, 2) + "s";
    return pad(seconds, 2) + "." + pad(mseconds, 3) + "s";
}
function pad(num, size) {
    return ('000000000' + num).substr(-size);
}

// decode data
function decodeData(data) {
    const carsData = data.raceData.cars;
    data.raceData.cars = Object.keys(carsData).reduce((result, playername) => {
        result[playername] = decode64(carsData[playername])
            .split(',').map((nr) => Number(nr));
        return result;
    }, {});
    return data;
}

// process race data
function processRaceData(data) {
    const carsData = data.raceData.cars;
    const trackIntervals = data.raceData.trackData.intervals.length;
    let crashed = []; // skip future loops for this player
    let times = {}; // cumulative player times
    let result = [];
    for (let l = 0; l < data.laps; l++) {
        let lapRanking = [];
        let lapTimes = {};
        for (const playername in carsData) {
            if (!times[playername]) times[playername] = 0;
            if (crashed.includes(playername)) continue;
            if (carsData[playername].length < (l * trackIntervals + trackIntervals)) {
                crashed.push(playername);
                continue;
            }
            let lapTime = 0;
            for (let i = 0; i < trackIntervals; i++) {
                lapTime +=  carsData[playername][l * trackIntervals + i]
            }
            lapTime = Number(lapTime.toPrecision(4));
            lapTimes[playername] = lapTime;
            times[playername] += lapTime;
            lapRanking.push([playername, times[playername]]);
        }
        lapRanking = lapRanking.sort((a,b) => (a[1]-b[1]));
        result.push({
            lap: l + 1,
            positions: lapRanking.map(p => p[0]),
            bestLap: Object.keys(lapTimes).map(player => ([player, lapTimes[player]]))
                .sort((a,b) => (a[1]-b[1]))[0][0],
            behind: lapRanking.map(p => ([p[0], lapRanking[0][1] - p[1]])).reduce((a, c) => {
                a[c[0]] = Number(c[1].toPrecision(4));
                return a;
            }, {}),
            improvement: lapRanking
                .map(p => ([p[0], l > 0 ? (lapRanking[0][1] - p[1] - result[l-1].behind[p[0]]) : 0]))
                .reduce((a, c) => {
                    a[c[0]] = Number(c[1].toPrecision(4));
                    return a;
                }, {}),
            crashed: [...crashed],
            times: lapTimes,
        });
    }
    console.info('[bs] result', result);
    return result;
}

// watch DOM
function watchRaceBar(callback, timeout=100) {
    let lap = -1, name = '';
    const loop = setInterval(function () {
        if ($('.leave-link:visible').size() < 1 &&
            $('.pd-lap').size() > 0 && $('.pd-pilotname').size() > 0) {
            const currentLap = Number($('.pd-lap').text().split('/')[0]);
            const currentName = $('.pd-pilotname').text();
            if (lap !== currentLap || name !== currentName) {
                name = currentName;
                lap = currentLap;
                callback(name, lap);
            }
        }
    }, timeout);
    return () => clearInterval(loop);
}

// inject sidebar
function injectSidebar() {
    if ($(".car-selected.left").size() > 0 && $(".drivers-list.right").size() > 0) {
        $(".drivers-list.right").removeClass('right').addClass('left');
        $(".car-selected.left").replaceWith($(`
<div class="car-selected right small">
    <div class="title-black top-round" id="br-leaderboard-title">
        <span>Current lap 0/100</span>
        <div class="expand"></div>
    </div>
    <div class="cont-black bottom-round">
        <ul class="properties-wrap scroll-area scrollbar-black" id="br-leaderboard-list"></ul>
        <div class="clear"></div>
    </div>
</div>`));
        $("#br-leaderboard-title").click(function () {
            $('.car-selected').toggleClass('small');
        });
    }
}

function bold(val, cond) {
    return cond ? `<strong>${val}</strong>` : val;
}
function crashed(val) {
    return val == 'crashed' ? 'crashed' : val + 's';
}

// update sidebar
function updateLeaderboard(_name, lap, data) {
    const $title = $("#br-leaderboard-title span");
    const $list = $("#br-leaderboard-list");
    if ($title.length > 0 && $list.length > 0) {
        console.log('[bs]',lap,data);
        $title.text(`Current lap ${lap}/100`);
        $list.html(`
<li class="br-leaderboard-listitem">
<strong class="name"><br>Player</strong>
<strong class="value">Time Behind</strong>
<strong class="value extra"><br>Lap Time</strong>
<strong class="value extra">Time Improved</strong>
</li>`);
        for (const [name, time, diff, ldiff, highlight] of data) {
            const _selected = name == _name;
            $list.append(`
<li class="br-leaderboard-listitem${highlight?' highlight':''}">
    <div class="name">${bold(name, _selected)}</div>
    <div class="value">${bold(crashed(diff), _selected)}</div>
    <div class="value extra">${bold(time, _selected)}</div>
    <div class="value extra">${bold(crashed(ldiff), _selected)}</div>
</li>`);
        }
    }
}

// ajax interceptor
function interceptRaceData(callback) {
    $(document).ajaxComplete((event, xhr, settings) => {
        if (xhr.readyState > 3 && xhr.status == 200) {
            let url = settings.url;
            if (url.indexOf("torn.com/") < 0) url = "torn.com" + (url.startsWith("/") ? "" : "/") + url;
            const page = url.substring(url.indexOf("torn.com/") + "torn.com/".length, url.indexOf(".php"));
			if (page != "page" || !url.includes('sid=racing')) return;
			try {
				const data = JSON.parse(xhr.responseText);
				if (data.timeData.status >= 3) callback(data);
			} catch (e) {
				console.error(e);
			}
        }
    });
}

// race data decoder
function decode64(input) {
    var output = '';
    var chr1, chr2, chr3 = '';
    var enc1, enc2, enc3, enc4 = '';
    var i = 0;
    var keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    var base64test = /[^A-Za-z0-9\+\/\=]/g;
    if (base64test.exec(input)) {
        console.log('There were invalid base64 characters in the input text.\n' +
                    'Valid base64 characters are A-Z, a-z, 0-9, \'+\', \'/\',and \'=\'\n' +
                    'Expect errors in decoding.');
    }
    input = input.replace(/[^A-Za-z0-9\+\/\=]/g, '');
    do {
        enc1 = keyStr.indexOf(input.charAt(i++));
        enc2 = keyStr.indexOf(input.charAt(i++));
        enc3 = keyStr.indexOf(input.charAt(i++));
        enc4 = keyStr.indexOf(input.charAt(i++));
        chr1 = (enc1 << 2) | (enc2 >> 4);
        chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
        chr3 = ((enc3 & 3) << 6) | enc4;
        output = output + String.fromCharCode(chr1);
        if (enc3 != 64) {
            output = output + String.fromCharCode(chr2);
        }
        if (enc4 != 64) {
            output = output + String.fromCharCode(chr3);
        }
        chr1 = chr2 = chr3 = '';
        enc1 = enc2 = enc3 = enc4 = '';
    } while (i < input.length);
    return unescape(output);
}
