
temp_file=$(mktemp)

curl -s https://covidtracking.com/api/states/daily |jq >$temp_file
filesize=$(wc -c <"$temp_file")
if  [ "$filesize" -ge "100000" ]; then
    echo "udpated state_testing.json ($filesize)"
    mv $temp_file src/data/state_testing.json 
else 
    echo "file size $filesize too small"
fi

curl -s https://covidtracking.com/api/us/daily |jq >$temp_file
filesize=$(wc -c <"$temp_file")
if  [ "$filesize" -ge "15000" ]; then
    echo "udpated us_testing.json ($filesize) "
    mv $temp_file src/data/us_testing.json
else 
    echo "file size $filesize too small"
fi

curl -s https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_recovered_global.csv |csvtojson |jq '.[] | select (."Country/Region" == "US")' >  $temp_file
filesize=$(wc -c <"$temp_file")
if  [ "$filesize" -ge "1000" ]; then
    echo "udpated us_recovery.json ($filesize) "
    mv $temp_file src/data/us_recovery.json
else 
    echo "file size $filesize too small"
fi

d=`date "+%m-%d-%Y"` 
curl -s  "https://docs.google.com/spreadsheets/u/0/d/e/2PACX-1vR30F8lYP3jG7YOq8es0PBpJIE5yvRVZffOyaqC0GgMBN6yt0Q-NI8pxS7hd1F9dYXnowSC6zpZmW9D/pub?output=csv&gid=1902046093&headers=false" | tail -n +5 | csvtojson >$temp_file
filesize=$(wc -c <"$temp_file")
if  [ "$filesize" -ge "10000" ]; then
    echo "udpated BNO-$d.json ($filesize) "
   mv $temp_file ../data/archive/BNO-$d.json
else 
    echo "file size $filesize too small"
fi



