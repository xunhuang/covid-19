
Setup
-----

npm install 

firebase init   

node setupFirebaseConfig.js

npm start  (to start development, start local server and run browser0


A few tricks to query the data from command line
-----------------------------------------------
install jq


CA Summary
----------
cat src/data/AllData.json | jq ' ."06" .Summary'

CA Confirmed
----------

cat src/data/AllData.json | jq ' ."06" .Summary .Confirmed'

US Summary 
----------

cat src/data/AllData.json |jq ".Summary"


Flattern AllData to CSV file 
----------

sh flatAllData.sh

Flattern CA only data to CSV file 
--------------------------------

sh flatAllData.sh   |grep -e CA -e CountyName
