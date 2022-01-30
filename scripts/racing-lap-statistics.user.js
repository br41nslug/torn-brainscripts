// ==UserScript==
// @name         BrainRacing: Extra Lap Statistics
// @namespace    brainslug.torn.racing
// @version      0.4.2
// @description  Removing the useless left sidebar and adding statistics on the right!
// @author       Brainslug [2323221]
// @match        https://www.torn.com/loader.php?sid=racing*
// @icon         https://www.google.com/s2/favicons?domain=torn.com
// @updateURL    https://raw.githubusercontent.com/br41nslug/torn-brainscripts/main/scripts/racing-lap-statistics.user.js
// @require      https://raw.githubusercontent.com/br41nslug/torn-brainscripts/main/lib/chart.min.js
// @grant        GM_addStyle
// @run-at       document-body
// ==/UserScript==

// init
console.info('[BrainRacing]', 'Extra lap statistics');
interceptRaceData(function (data) {
    data = decodeData(data);
    const raceData = processRaceData(data);
    $("#racingupdatesnew").ready(function () {
        injectSidebar();
        injectCharts(data);
        updateLeaderboard('', 0, parseLapData(raceData, 0));
        watchRaceBar(function (name, lap) {
            console.debug('[BrainRacing] updateLeaderboard', name, lap);
            updateLeaderboard(name, lap, parseLapData(raceData, lap));
        });
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
.stats-icon {
    margin: 8px 10px;
    height: 13px;
    width: 16px;
    float: right;
    background: url(/images/v2/personal_stats/stats.png) 0 0 no-repeat;
    filter: drop-shadow(0px 0px 1px #11111194);
}
.b-modal {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: #f2f2f2;
    border-right: 1px solid #ababab;
    border-bottom: 1px solid #ababab;
    border-left: 1px solid #ababab;
    border-radius: 5px;
    color: #333;
    z-index: 99999;
    -webkit-box-shadow: 4px 4px 12px 4px rgba(0,0,0,0.75);
    -moz-box-shadow: 4px 4px 12px 4px rgba(0,0,0,0.75);
    box-shadow: 4px 4px 12px 4px rgba(0,0,0,0.75);
}
.b-modal.hidden {
    display: none;
}
.b-modal .b-header {
    position: relative;
    height: 34px;
    margin: -1px 5px 0;
    background: url(/images/v2/chat/tabs_middle.png) 0 0 repeat-x;
}
.b-modal .b-header .b-inner {
    display: flex;
}
.b-modal .b-header .b-corner {
    position: absolute;
    top: 0;
    height: 34px;
    width: 7px;
    background: url(/images/v2/chat/tabs_ends.png) 0 0 no-repeat;
}
.b-modal .b-header .b-corner.b-left {
    left: -6px;
}
.b-modal .b-header .b-corner.b-right {
    right: -6px;
    background-position: 100% 0;
}
.b-modal .b-header .b-icon {
    margin-left: -6px;
    margin-top: 8px;
    height: 16px;
    width: 34px;
    vertical-align: middle;
    background: url(/images/v2/personal_stats/stats.png) 10px 3px no-repeat;
    filter: drop-shadow(0 0 1px #111111AD);
}
.b-modal .b-header .b-title {
    flex-grow: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    color: #fff;
    line-height: 34px;
    font-weight: bold;
}
.b-modal .b-header .b-export,
.b-modal .b-header .b-clear {
    padding-right: 16px;
    cursor: pointer;
    color: #e3e3e3;
    line-height: 34px;
}
.b-modal .b-header .b-export:hover,
.b-modal .b-header .b-clear:hover {
    text-decoration: underline;
}
.b-modal .b-header .b-close {
    width: 16px;
    background: url(/images/v2/chat/tab_icons.svg) -552px top;
    filter: drop-shadow(0 0 1px #111111AD);
    vertical-align: middle;
    height: 34px;
    cursor: pointer;
}
.b-modal .b-header .b-close:hover {
    background-position: -552px bottom;
}
.b-modal .b-content {
    padding: 16px;
}
`);

// chart
function showChart(data, options) {
    var ctx = document.getElementById('myChart').getContext('2d');
    var conf = {
        type: 'line',
        data: data,
        options: options
    };
    //console.log('chart', conf);
    return new Chart(ctx, conf);
}

// race colors
const race_colors = ["#4c6600","#b20000","#b28500","#005b5b","#003366","#46008c","#660066","#000000","#f28d8d","#e1c919","#a0cf17","#18d9d9","#6fafee","#b072ef","#f080f0","#616161","#400000","#403000","#204000","#003040","#000040","#400040"];

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

// process chart data
function processChartData(data) {
    const carsData = data.raceData.cars;
    const trackIntervals = data.raceData.trackData.intervals.length;
    // calc the positions
    let times = {}; // cumulative player times
    let positions = [];
    for (let s = 0; s < trackIntervals * data.laps; s++) {
        let segment = [];
        for (const playername in carsData) {
            if (!times[playername]) times[playername] = 0;
            if (!carsData[playername][s]) continue;
            times[playername] += carsData[playername][s];
            segment.push([playername, times[playername]]);
        }
        positions.push(segment.sort((a,b) => (a[1]-b[1])).map(x => x[0]));
    }
    // invert the positions to per player
    const playerPosition = positions.reduce((res, pos) => {
        pos.forEach((player, index) => {
            if (!res[player]) res[player] = [];
            res[player].push(index + 1);
        });
        return res;
    }, {});
    // compress the player positions
    const playerPositionCompressed = Object.keys(playerPosition).reduce((result, player) => {
        let pos = [];
        const seglen = playerPosition[player].length;
        for (let s = 0; s < seglen; s++) {
            if (s > 0 && s < seglen - 1) {
                if (playerPosition[player][s] != playerPosition[player][s + 1] ||
                    playerPosition[player][s] != playerPosition[player][s - 1]) {
                    pos.push([
                        s / trackIntervals,
                        playerPosition[player][s]
                    ]);
                }
            } else {
                pos.push([
                    s / trackIntervals,
                    playerPosition[player][s]
                ]);
            }
        }
        result[player] = pos;
        return result;
    }, {});
    // build datasets
    const colors = Object.values(data.raceData.carInfo).reduce(function (acc, cur) {
        acc[cur.playername] = race_colors[cur.color - 1];
        return acc;
    }, {});
    return Object.keys(playerPositionCompressed).map((player) => ({
        label: player,
        data: playerPositionCompressed[player].map(([x, y]) => ({ x, y })),
        borderColor: colors[player],
        stepped: true,
    }));
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

// inject chart link
function injectCharts(data) {
    if ($('.b-modal').length <= 0) {
        // inject modal
        $('body').append(`<div class="b-modal hidden">
            <div class="b-header">
                <div class="b-inner">
                    <div class="b-icon"></div>
                    <div class="b-title">Brainslug's Position Statistics</div>
                    <span class="b-clear">[ clear ]</span><div class="b-close"></div>
                </div>
                <div class="b-corner b-left"></div><div class="b-corner b-right"></div>
            </div>
            <div class="b-content"><canvas id="myChart" width="800" height="600"></canvas></div>
        </div>`);
        // inject button
        $('.track-info-wrap').parent().append('<div class="track-info-wrap" id="brain-charts"><i class="stats-icon"></i></div>');
        // bind events
        let chart = false;
        $('#brain-charts,.b-modal .b-close').on('click', function () {
            if ($('.b-modal').hasClass('hidden')) {
                $('.b-modal').removeClass('hidden');
                if (!chart) {
                    chart = showChart({ labels: new Array(50), datasets: processChartData(data) }, {
                        scales: {
                            y: { reverse: true, ticks: {
                                callback: (value) => (value % Math.floor(value)) !== 0 ? '' : Math.floor(value)
                            } },
                            x: { type: 'linear', ticks: {
                                callback: (value) => (value % Math.floor(value)) !== 0 ? '' :'lap '+value
                            } }
                        }
                    });
                }
            } else {
                $('.b-modal').addClass('hidden');
            }
        });
        $(".b-modal .b-clear").click(function() {
            chart.data.datasets.forEach(function(ds) {
                ds.hidden = !ds.hidden;
            });
            chart.update();
        });
    }
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

// update sidebar
function updateLeaderboard(name, lap, data) {
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
            $list.append(`
<li class="br-leaderboard-listitem${highlight?' highlight':''}">
    <div class="name">${name}</div>
    <div class="value">${diff}${diff == 'crashed' ? '' : 's'}</div>
    <div class="value extra">${time}</div>
    <div class="value extra">${ldiff}${ldiff == 'crashed' ? '' : 's'}</div>
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
			if (page != "loader") return;
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
