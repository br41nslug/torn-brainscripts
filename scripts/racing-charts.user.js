// ==UserScript==
// @name         BrainRacing: Race Charts
// @namespace    brainslug.torn.racing
// @version      0.9.0
// @description  Adds a racing chart popup currently only supporting position changes.
// @author       Brainslug [2323221]
// @match        https://www.torn.com/loader.php?sid=racing*
// @icon         https://www.google.com/s2/favicons?domain=torn.com
// @updateURL    https://raw.githubusercontent.com/br41nslug/torn-brainscripts/main/scripts/racing-charts.user.js
// @require      https://raw.githubusercontent.com/br41nslug/torn-brainscripts/main/lib/chart.min.js
// @grant        GM_addStyle
// @run-at       document-body
// ==/UserScript==

// init
console.info('[BrainRacing]', 'Race Charts');
interceptRaceData(function (data) {
    data = decodeData(data);
    $("#racingupdatesnew").ready(function () {
        injectCharts(data);
    });
});

// styles
GM_addStyle(`
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

// process chart data
function processCSVData(data) {
    const carsData = data.raceData.cars;
    const trackIntervals = data.raceData.trackData.intervals.length;
    const playerIds = Object.values(data.raceData.carInfo).reduce((r, { userID, playername }) => {
        r[playername] = parseInt(userID);
        return r;
    }, {});
    // calc the positions
    let times = {}, allTimes = {}; // cumulative player times
    let positions = [];
    for (let s = 0; s < trackIntervals * data.laps; s++) {
        let segment = [];
        for (const playername in carsData) {
            if (!times[playername]) times[playername] = 0;
            if (!allTimes[playername]) allTimes[playername] = [];
            if (!carsData[playername][s]) continue;
            times[playername] += carsData[playername][s];
            segment.push([playername, times[playername]]);
            allTimes[playername].push(times[playername]);
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
    // generate csv file
    let csv = ["player id,player name,lap,section,position,time"];
    Object.keys(playerPosition).forEach((player) => {
        const id = playerIds[player];
        playerPosition[player].forEach((pos, index) => {
            const lap = Math.ceil(index / trackIntervals),
                time = allTimes[player][index];
            csv.push(`${id},"${player}",${lap},${index},${pos},${time}`);
        });
    });
    return csv.join("\r\n");
}

// inject chart link
function injectCharts(data) {
    const datasets = processChartData(data);
    if ($('.b-modal').length <= 0) {
        // inject modal
        $('body').append(`<div class="b-modal hidden">
            <div class="b-header">
                <div class="b-inner">
                    <div class="b-icon"></div>
                    <div class="b-title">Brainslug's Position Statistics</div>
                    <span class="b-clear">[ clear ]</span>
                    <span class="b-export">[ Export as CSV ]</span>
                    <div class="b-close"></div>
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
                    chart = showChart({ labels: new Array(50), datasets: datasets }, {
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
        $('.b-modal .b-export').on('click', function () {
            saveAsFile(`race_results_${data.raceID}.csv`, processCSVData(data));
        });
        $(".b-modal .b-clear").click(function() {
            chart.data.datasets.forEach(function(ds) {
                ds.hidden = !ds.hidden;
            });
            chart.update();
        });
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

// saveAsFile
function saveAsFile(fileName, fileContents) {
	var textFileAsBlob = new Blob([fileContents], {type: 'text/plain'});
	var downloadLink = document.createElement("a");
	downloadLink.download = fileName;
	if (window.webkitURL != null) {
		downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob);
	} else {
		downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
		downloadLink.onclick = function () { document.body.removeChild(event.target); };
		downloadLink.style.display = "none";
		document.body.appendChild(downloadLink);
	}
	downloadLink.click();
}

