# Brainslug's Userscripts for Torn
A collection of somewhat useful and less useful userscripts i've build or adapted for Torn.

> These scripts have been created and tested using [Chrome](https://www.google.com/chrome/) and [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo). They might work in other browsers/runtimes but i give no guarantees! Altough you're welcome to open an issue if it's not working for you.

# Racing Scripts

## Lap Statistics
This scripts removes the left sidebar show your current car stats (i've always found that information quite useless) and adds a new panel to the right of the racing display filled with statistics for the current lap instead! This sidebar contains a list of all drivers with the selected driver highlighted in bold and the driver with the fastest current lap in green.
> Disclaimer: This script does show the future as you are seeing the **end results** for the **current lap**.

### Features
- Removes left sidebar for an active or finished race (to not interfere with changing cars or leaving the race)
- Adds a statistics sidebar to the right showing `Time behind` (total time behind the leader shown in negative seconds)
- The sidebar can be expanded to also show the `Lap time` and `Time improved` (time improvement relative to the leader)

Install Link: [scripts/racing-lap-statistics.user.js](https://raw.githubusercontent.com/br41nslug/torn-brainscripts/main/scripts/racing-lap-statistics.user.js)\
![Screenshot Speedway collapsed](/images/lap-stats-collapsed.png)
![Screenshot Speedway expanded](/images/lap-stats-expanded.png)

## Race Charts
This script adds a chart showing the positions held by each player over the duration of the match. This can be very useful for getting a quick judgement of whether it was a close match, a very one-sided one, if someone made a late comeback and more. 
> This is most likely not compatible with mobile devices! Also with races including lots of members the charts can get crowded and quite heavy for the browser.

### Features
- Adds a button to trigger the popup at the top right of a race display
- A popup containing an interesting chart (and hopefull more in the future)
- A link to clear the chart on top this will disable all lines on the chart
- Cliking racer names will enable/disable their charts

Install Link: [scripts/racing-charts.user.js](https://raw.githubusercontent.com/br41nslug/torn-brainscripts/main/scripts/racing-charts.user.js)\
![Screenshot 100lap 2member Speedway](/images/racing-chart-2person-100lap.png)\
![Screenshot 100lap 43member Sewage](/images/racing-chart-43person-100lap.png)

## Custom Race Presets
Adds custom preset shortcuts when creating a new race. 
Configuration is possible both in the script itself or within Torn (presets will be persisted in the browser in this case).
This script was (heavily) based on the [Prefill Create Race Form](https://greasyfork.org/en/scripts/393632-torn-custom-race-presets) script made by Cryosis7 [926640].
> Be warned that updates might override any cusomizations you have made inside the script! So be sure to back it up and/or disable updating for a script you have edited.

### Features
- Quickly select custom race presets
- Add/Remove new presests in game
- Add presets in the script

On the race page when creating a new custom race this script will add a bar above the panel filled with the available presets and another one for saving the currently selected custom race options as a preset.

Install Link: [scripts/custom-race-presets.user.js](https://raw.githubusercontent.com/br41nslug/torn-brainscripts/main/scripts/custom-race-presets.user.js)\
![Screenshot Custom Race Presets](/images/custom-race-presets-example.png)

## Full Height Driver Panel
Makes the racing driver panel the full height,

Adds style to make the driver panel full height on desktop (on mobile it already is). This way you can scroll and search the page instead of just the small driver window.

> This script is meant for desktop since on mobile the driver panel is already full height,

### Features
- No scroll bar inside the driver panel

Install Link: [scripts/racing-full-height.user.js](https://raw.githubusercontent.com/br41nslug/torn-brainscripts/main/scripts/racing-full-height.user.js)\
![Screenshot Full Height Driver Panel](/images/full-height-example.png)

## Always On Top
Pulls you to the top of the racers display. Not as the winner just on the top of the list xD
This helps tremendously helpful finding your own position in a running race with lots of members switching places often.

### Features
- Shows you on top of the drivers list

Install Link: [scripts/racing-always-on-top.user.js](https://raw.githubusercontent.com/br41nslug/torn-brainscripts/main/scripts/racing-always-on-top.user.js)\
![Screenshot Always On Top](/images/always-on-top-example.png)

## Change Racing Banner
Allows you to edit your racing banner to any of the classes you prefer. After being class A for a while i realized that i liked some of the lower class banners better so this script adds the option to switch between the different class banners whenever you please.

### Features
- Adds dropdown for selecting the class you'd like
- changes banner to selected class

Install Link: [scripts/racing-change-banner.user.js](https://raw.githubusercontent.com/br41nslug/torn-brainscripts/main/scripts/racing-change-banner.user.js)\
![Screenshot all](/images/change-banner.png)\
![Screenshot Class A](/images/change-banner-A.png)\
![Screenshot Class B](/images/change-banner-B.png)\
![Screenshot Class C](/images/change-banner-C.png)\
![Screenshot Class D](/images/change-banner-D.png)\
![Screenshot Class E](/images/change-banner-E.png)

# Utility Scripts
## Custom Menu Links
Injects custom menu links into the Torn sidebar inspired by the Torn Tools update. 
Currently this script still requires you to configure the links inside the script itself (there is some inline documentation there to help you configure it).
> Be warned that updates might override any cusomizations you have made inside the script! So be sure to back it up and/or disable updating for a script you have edited.

Install Link: [scripts/custom-race-presets.user.js](https://raw.githubusercontent.com/br41nslug/torn-brainscripts/main/scripts/custom-menu-links.user.js)\
![Screenshot Custom Menu Links](/images/custom-menu-links-example.png)