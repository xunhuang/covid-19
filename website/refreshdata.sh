curl https://covidtracking.com/api/states/daily |jq > src/data/state_testing.json 
curl https://covidtracking.com/api/us/daily |jq > src/data/us_testing.json
#curl https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_recovered_global.csv |csvtojson |jq '.[] | select (."Country/Region" == "US")' >  src/data/us_recovery.json
d=`date "+%m-%d-%Y"`; curl "https://docs.google.com/spreadsheets/u/0/d/e/2PACX-1vR30F8lYP3jG7YOq8es0PBpJIE5yvRVZffOyaqC0GgMBN6yt0Q-NI8pxS7hd1F9dYXnowSC6zpZmW9D/pub?output=csv&gid=1902046093&headers=false" | tail -n +5 | csvtojson > ../data/archive/BNO-$d.json
