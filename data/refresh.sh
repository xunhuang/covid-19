#!/bin/bash
node import_1.3_cases.js > casesrawjs
cat casesrawjs | sed -e $'s/,{/,\\\n{/g'  > a1.js
vim -s vimcommand a1.js
cat new.js | tr -d '\r\n' >newoneline.js
node newoneline.js > ../website/src/data/1.3cases.json
rm -rf casesrawjs new.js
node export.js
