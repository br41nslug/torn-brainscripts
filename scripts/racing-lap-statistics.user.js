// ==UserScript==
// @name         BrainRacing: Extra Lap Statistics
// @namespace    brainslug.torn.racing
// @version      0.2
// @description  Removing the useless left sidebar and adding statistics on the right!
// @author       Brainslug [2323221]
// @match        https://www.torn.com/loader.php?sid=racing*
// @icon         https://www.google.com/s2/favicons?domain=torn.com
// @updateURL    https://raw.githubusercontent.com/br41nslug/torn-brainscripts/main/scripts/racing-lap-statistics.user.js
// @grant        GM_addStyle
// @run-at       document-body
// ==/UserScript==

// init
console.info('[BrainRacing]', 'Extra lap statistics');
interceptRaceData(function (data) {
    const raceData = processRaceData(data);
    $("#racingupdatesnew").ready(function () {
        injectSidebar();
        let lastLap = false;
        watchRaceBar(function (name, lap) {
            console.debug('[BrainRacing] updateLeaderboard', name, lap);
            const lapTimes = parseLapData(raceData.results, lap, lastLap);
            updateLeaderboard(name, lap, lapTimes);
            lastLap = lapTimes.reduce((a, c) => {
                a[c[0]] = c[2];
                return a;
            }, {});
        });
    });
});

// styles
GM_addStyle(`
.br-leaderboard-listitem {
    padding: 10px;
    display: flex;
}
.br-leaderboard-listitem .name {
    flex-grow: 1;
    max-width: 72px;
    text-overflow: ellipsis;
    overflow: hidden;
}
.br-leaderboard-listitem .value {
    width: 50px;
}
.br-leaderboard-listitem .value:last-child {
    width: 40px;
}
`);

function parseLapData(results, lap, last) {
    const times = results.reduce((a, c) => {
        if (lap == 0) {
            a.push([ c[0], 0, 0, 0 ]);
        } else {
            a.push([
                c[0],
                c[4][lap-1] - (c[4][lap-2] || 0),
                c[4][lap-1]
            ]);
        }
        return a;
    }, []).sort(function(a, b) {
        return a[2] - b[2];
    });
    return times.map(([p, l, t]) => {
        const rt = times[0][2] - t;
        const lt = last[p] || 0;
        return [
            p,
            formatTimeMsec(l*1000),
            formatTimeSec(rt),
            formatTimeSec(rt - lt)
        ];
    });
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

// process race data
function processRaceData(data) {
    const carsData = data.raceData.cars;
    const carInfo = data.raceData.carInfo;
    const trackIntervals = data.raceData.trackData.intervals.length;
    let results = [], crashes = [];

    for (const playername in carsData) {
        const userId = carInfo[playername].userID;
        const intervals = decode64(carsData[playername]).split(',');
        let raceTime = 0;
        let bestLap = 9999999999;
        let lapTimes = [];

        if (intervals.length / trackIntervals == data.laps) {
            for (let i = 0; i < data.laps; i++) {
                let lapTime = 0;
                for (let j = 0; j < trackIntervals; j++) {
                    lapTime += Number(intervals[i * trackIntervals + j]);
                }
                bestLap = Math.min(bestLap, lapTime);
                raceTime += Number(lapTime);
                lapTimes.push(raceTime);
            }
            results.push([playername, userId, raceTime, bestLap, lapTimes]);
        } else {
            crashes.push([playername, userId, 'crashed']);
        }
    }

    return { results, crashes };
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
<div class="car-selected right">
    <div class="title-black top-round" id="br-leaderboard-title">Current lap 0/100</div>
    <div class="cont-black bottom-round">
        <ul class="properties-wrap" id="br-leaderboard-list"></ul>
        <div class="clear"></div>
    </div>
</div>`));
    }
}

// update sidebar
function updateLeaderboard(name, lap, times) {
    const $title = $("#br-leaderboard-title");
    const $list = $("#br-leaderboard-list");
    if ($title.length > 0 && $list.length > 0) {
        $title.text(`Current lap ${lap}/100`);
        $list.html(`
<li class="br-leaderboard-listitem">
<strong class="name">Player</strong>
<strong class="value">LT</strong>
<strong class="value">RT</strong>
<strong class="value">RL</strong>
</li>`);
        for (const [name, time, diff, ldiff] of times) {
            $list.append(`
<li class="br-leaderboard-listitem">
    <div class="name">${name}</div>
    <div class="value">${time}</div>
    <div class="value">${diff}s</div>
    <div class="value">${ldiff}s</div>
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
