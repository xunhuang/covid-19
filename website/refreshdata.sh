
# pushd ../COVID-19/ ; git checkout master; git pull; popd
# pushd  ../coronavirus-data/ ;  git checkout master; git pull; popd
# pushd  ../vaccine-module/ ;  git checkout master; git pull; popd

temp_file=$(mktemp)
CSVTOJSON=./node_modules/.bin/csvtojson 

d=`date "+%m-%d-%Y"` 

curl -s https://api.covidtracking.com/v1/states/daily.json|jq >$temp_file
filesize=$(wc -c <"$temp_file")
if  [ "$filesize" -ge "100000" ]; then
    echo "Updated state_testing.json ($filesize)"
    mv $temp_file public/data/state_testing.json 
else 
    echo "file size $filesize too small"
fi

curl -s https://api.covidtracking.com/v1/us/daily.json |jq >$temp_file
filesize=$(wc -c <"$temp_file")
if  [ "$filesize" -ge "15000" ]; then
    echo "Updated us_testing.json ($filesize) "
    mv $temp_file public/data/us_testing.json
else 
    echo "file size $filesize too small"
fi

curl -s https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_recovered_global.csv |$CSVTOJSON |jq '.[] | select (."Country/Region" == "US")' >  $temp_file
filesize=$(wc -c <"$temp_file")
if  [ "$filesize" -ge "1000" ]; then
    echo "Updated us_recovery.json ($filesize) "
    mv $temp_file src/data/us_recovery.json
else 
    echo "file size $filesize too small"
fi

curl -s  https://covid19.ca.gov/countystatus.json | jq >  $temp_file
filesize=$(wc -c <"$temp_file")
if  [ "$filesize" -ge "1000" ]; then
    echo "Updated CA_county_status.json ($filesize) "
    mv $temp_file src/data/CA_county_status.json
else 
    echo "file size $filesize too small"
fi

curl -s "https://docs.google.com/spreadsheets/u/0/d/e/2PACX-1vR30F8lYP3jG7YOq8es0PBpJIE5yvRVZffOyaqC0GgMBN6yt0Q-NI8pxS7hd1F9dYXnowSC6zpZmW9D/pub?output=csv&gid=1902046093&headers=false" | tail -n +5 | $CSVTOJSON >$temp_file
filesize=$(wc -c <"$temp_file")
if  [ "$filesize" -ge "10000" ]; then
    echo "Updated BNO-$d.json ($filesize) "
   mv $temp_file ../data/archive/BNO-$d.json
   git add ../data/archive/BNO-$d.json
else 
    echo "file size $filesize too small"
fi

node refreshvaccine.js
git add src/data/bloomberg-$d.json