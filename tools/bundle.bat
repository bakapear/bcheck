@echo off
cd %~dp0
mkdir min
call terser "../src/bcheck.js" -c module -module -o "min/bcheck.js"
call terser "../src/bounces.json" -p expression -o "min/bounces.js"
call terser "../docs/js/script.js" -c module -module -o "min/script.js"

REM call terser "min/bcheck.js" "min/bounces.js" "min/script.js" -o "min/main.js"