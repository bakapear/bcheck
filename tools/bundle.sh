#!/bin/bash
cd "$(dirname "$0")"

# turn bounces.json into js file and add it to window.BOUNCES
terser "../src/bounces.json" -p expression -o "bounces.js"
printf "%s%s" "window.BOUNCES = " "$(cat bounces.js)" > bounces.js

# turn experimental.json into js file and add it to window.EXPERIMENTAL
# terser "../src/experimental.json" -p expression -o "experimental.js"
# printf "%s%s" "window.EXPERIMENTAL = " "$(cat experimental.js)" > experimental.js

# replace module.exports with window.bcheck
cp "../src/bcheck.js" "bcheck.js"
sed -i "s/module.exports/window.bcheck/" "bcheck.js"

# pack all files together
terser "bounces.js" "bcheck.js" "../src/web/script.js" \
-c module -module -o "../docs/js/main.js"

# take out the trash
rm bounces.js
# rm experimental.js
rm bcheck.js
