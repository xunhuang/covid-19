node import_1.3_cases.js > casesrawjs
vim -s vimcommand casesrawjs
node new.js > ../website/src/data/1.3cases.json
rm -rf casesrawjs new.js
node export.js