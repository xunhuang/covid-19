
Setup
-----

npm install

npm install firebase
(has to be under project folder /website)

firebase init
(do not overwrite any existing file, choose 'no' for them)

node setupFirebaseConfig.js

npm start  (to start development, start local server and run browser)


A few tricks to query the data from command line
-----------------------------------------------
install jq
(https://stedolan.github.io/jq/download/)

CA Summary
----------
cat src/data/AllData.json | jq ' ."06" .Summary'

CA Confirmed
----------

cat src/data/AllData.json | jq ' ."06" .Summary .Confirmed'

US Summary 
----------

cat src/data/AllData.json |jq ".Summary"

US Summary 
----------

cat src/data/AllData.json | jq "Summary.Confirmed"

Flattern AllData to CSV file 
----------

sh flatAllData.sh

Flattern CA only data to CSV file 
--------------------------------

sh flatAllData.sh   |grep -e CA -e CountyName
