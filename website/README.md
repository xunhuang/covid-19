
pre-setup
---------

go one directory up and run 

git submodule init
git submodule update

To pull in sub modules, then come back to current directory

Setup
-----

npm install 

firebase init   

node setupFirebaseConfig.js


npm run data  (this will produce the AllData.json and AllData.slim.json from raw data files, this should be run after each data update)

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
