// ==UserScript==
// @name         BrainRacing: Race Charts
// @namespace    brainslug.torn.racing
// @version      0.8
// @description  Adds a racing chart popup currently only supporting position changes.
// @author       Brainslug [2323221]
// @match        https://www.torn.com/loader.php?sid=racing*
// @icon         https://www.google.com/s2/favicons?domain=torn.com
// @updateURL    https://raw.githubusercontent.com/br41nslug/torn-brainscripts/main/racing-charts.user.js
// @require      https://raw.githubusercontent.com/br41nslug/torn-brainscripts/main/lib/chart.min.js
// @grant        GM_addStyle
// ==/UserScript==

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
				if (data.timeData.status >= 3) {
					callback(data);
				}
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

// compress race positions
function compressPositions(data) {
    let _data = [data[0]], last = data[0], i;
    for (i = 1; i < data.length; i++) {
        if (last.y !== data[i].y) {
            last = data[i];
            _data.push(data[i]);
        }
    }
    _data.push(data[data.length - 1]);
    return _data;
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

// init script
interceptRaceData(function (data) {
    console.info('[BrainRacing]', 'Injecting chart link');
    // inject modal
    if ($('.b-modal').length <= 0) {
        $('body').append(`<div class="b-modal hidden">
        <div class="b-header">
            <div class="b-inner">
            <div class="b-icon"></div>
            <div class="b-title">
                Brainslug's Racing Statistics
            </div>
            <span class="b-clear">[ clear ]</span>
            <span class="b-export">[ Export as CSV ]</span>
            <div class="b-close"></div>
            </div>
            <div class="b-corner b-left"></div>
            <div class="b-corner b-right"></div>
        </div>
        <div class="b-content">
            <canvas id="myChart" width="800" height="600"></canvas>
        </div>
        </div>`);
        // inject button
        $('.track-info-wrap').parent().append('<div class="track-info-wrap" id="brain-charts"><i class="stats-icon"></i></div>');
    }
    const carsData = data.raceData.cars;
    const carInfo = data.raceData.carInfo;
    const trackIntervals = data.raceData.trackData.intervals.length;
    let times = {}, names = {}, total = 0;
    for (const playername in carsData) {
        const userId = carInfo[playername].userID;
        names[userId] = playername;
        const _times = decode64(carsData[playername]).split(',')
        .map(function (x) {return parseFloat(x); });
        times[userId] = [];
        for (let i = 0, t = 0; i < _times.length; i++) {
            times[userId].push(t + _times[i]);
            t += _times[i];
        }
        if (total === 0) {
            total = times[userId].length;
        }
    }
    const userIds = Object.keys(times);
    // calculate positions
    let positions = {};
    for (let i = 0; i < total; i++) {
        const _pos = userIds.reduce(function (a, player) {
            a.push([player, times[player][i]]);
            return a;
        }, []).sort(function (a, b) {
            return a[1] - b[1];
        })/*.map(function (x) {
            return x[0];
        })*/;
        for (let j = 0; j < _pos.length; j++) {
            if (!positions[_pos[j][0]]) positions[_pos[j][0]] = [];
            positions[_pos[j][0]].push({ position: j + 1, time: _pos[j][1] });
        }
    }
    // mutate datasets
    let csv = ["player id,player name,lap,section,position,time"];
    const colors = Object.values(carInfo).reduce(function (acc, cur) {
        acc[cur.userID] = race_colors[cur.color - 1];
        return acc;
    }, {});
    const intervals = data.raceData.trackData.intervals;
    const datasets = userIds.map(function (id) {
        let _data = [], c = 0.0;
        for (let i = 0; i < total; i++) {
            _data.push({ x: c, y: positions[id][i].position });
            csv.push(`${id},${names[id]},${Math.ceil(c)},${i},${positions[id][i].position},${positions[id][i].time}`);
            c += intervals[i % intervals.length];
        }
        return {
            label: names[id],
            data: compressPositions(_data),
            borderColor: colors[id],
            stepped: true,
        };
    });
    // draw chart
    let chart = false;
    // bind
    $('#brain-charts,.b-modal .b-close').on('click', function () {
        if ($('.b-modal').hasClass('hidden')) {
            $('.b-modal').removeClass('hidden');
            if (!chart) {
                chart = showChart({
                labels: new Array(50),
                datasets: datasets
            }, {
                scales: {
                    y: {
                        reverse: true,
                        ticks: {
                            callback: function(value, index, values) {
                                return (value % Math.floor(value)) !== 0 ? '' : Math.floor(value);
                            }
                        }
                    },
                    x: {
                        type: 'linear',
                        ticks: {
                            callback: function(value, index, values) {
                                const t = value / 100;
                                return (t % Math.floor(t)) !== 0 ? '' :'lap '+t;
                            }
                        }
                    }
                }
            });
            }
        } else {
            $('.b-modal').addClass('hidden');
        }
    });
    $('.b-modal .b-export').on('click', function () {
        saveAsFile(`race_results_${data.raceID}.csv`, csv.join("\r\n"));
    });
    $(".b-modal .b-clear").click(function() {
	    chart.data.datasets.forEach(function(ds) {
            ds.hidden = !ds.hidden;
        });
        chart.update();
    });
});

// - styles -
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