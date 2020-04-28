
temp_file=$(mktemp)

d=`date "+%m-%d-%Y"` 

fetchNYCDeath () {
   curl -s "https://docs.google.com/spreadsheets/d/e/2PACX-1vTwQ7_6yDDF_pwfl8hNLXX-EX5IYNO_UrgbBDlr7MQXW70kE4kcl-CUNz_6e229lJK9GsgU6yRYuBqt/pub?gid=2045108071&single=true&output=csv" | tail -n +4 |head -6 |csvtojson |jq > $temp_file
   filesize=$(wc -c <"$temp_file")
   if  [ "$filesize" -ge "1000" ]; then
       echo "Updated NYC-Deaths.json ($filesize) "
       mv $temp_file ../data/archive/NYC-Deaths.json
   else 
       echo "file size $filesize too small"
   fi
}

fetchUSTerritoriesConfirmed () {
   curl -s  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRY5QQp-yHO9Lf9gye0211xxGM_oYiIOnrtIy89YJFS_tNm_MSrV5o2pT6w7MD4Jj6S-RTCCGyvn9as/pub?gid=0&single=true&output=csv" |csvtojson  |jq> $temp_file
   filesize=$(wc -c <"$temp_file")
   if  [ "$filesize" -ge "1000" ]; then
       echo "Updated US-territories-confirm.json ($filesize) "
       mv $temp_file ../data/archive/US-territories-confirmed.json
   else 
       echo "file size $filesize too small"
   fi
}

fetchUSTerritoriesDeath () {
   curl -s  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRY5QQp-yHO9Lf9gye0211xxGM_oYiIOnrtIy89YJFS_tNm_MSrV5o2pT6w7MD4Jj6S-RTCCGyvn9as/pub?gid=699244347&single=true&output=csv" |csvtojson  |jq> $temp_file
   filesize=$(wc -c <"$temp_file")
   if  [ "$filesize" -ge "1000" ]; then
       echo "Updated US-territories-death.json ($filesize) "
       mv $temp_file ../data/archive/US-territories-death.json
   else 
       echo "file size $filesize too small"
   fi
}

fetchNYCDeath
fetchUSTerritoriesConfirmed
fetchUSTerritoriesDeath

curl -s  "https://raw.githubusercontent.com/nychealth/coronavirus-data/master/boro.csv" \
   |perl -pe 's/\r//g' \
   | ruby -rcsv -e 'puts CSV.parse(STDIN).transpose.map &:to_csv' \
   | csvtojson  > $temp_file
filesize=$(wc -c <"$temp_file")
if  [ "$filesize" -ge "200" ]; then
    echo "Updated NYC-BOROUGHS-$d.json ($filesize) "
   mv $temp_file ../data/archive/NYC-BOROUGHS-$d.json
   git add ../data/archive/NYC-BOROUGHS-$d.json
else 
    echo "File size $filesize too small"
fi

curl -s  "https://raw.githubusercontent.com/nychealth/coronavirus-data/master/tests-by-zcta.csv" \
   |perl -pe 's/\r//g' \
   | ruby -rcsv -e 'puts CSV.parse(STDIN).transpose.map &:to_csv' \
   | csvtojson  > $temp_file
filesize=$(wc -c <"$temp_file")
if  [ "$filesize" -ge "200" ]; then
    echo "Updated NYC-ZIP-$d.json ($filesize) "
   mv $temp_file ../data/archive/NYC-ZIP-$d.json
   git add ../data/archive/NYC-ZIP-$d.json
else 
    echo "File size $filesize too small"
fi

curl -s https://covidtracking.com/api/states/daily |jq >$temp_file
filesize=$(wc -c <"$temp_file")
if  [ "$filesize" -ge "100000" ]; then
    echo "Updated state_testing.json ($filesize)"
    mv $temp_file public/data/state_testing.json 
else 
    echo "file size $filesize too small"
fi

curl -s https://covidtracking.com/api/us/daily |jq >$temp_file
filesize=$(wc -c <"$temp_file")
if  [ "$filesize" -ge "15000" ]; then
    echo "Updated us_testing.json ($filesize) "
    mv $temp_file public/data/us_testing.json
else 
    echo "file size $filesize too small"
fi

curl -s https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_recovered_global.csv |csvtojson |jq '.[] | select (."Country/Region" == "US")' >  $temp_file
filesize=$(wc -c <"$temp_file")
if  [ "$filesize" -ge "1000" ]; then
    echo "Updated us_recovery.json ($filesize) "
    mv $temp_file src/data/us_recovery.json
else 
    echo "file size $filesize too small"
fi

curl -s  "https://docs.google.com/spreadsheets/u/0/d/e/2PACX-1vR30F8lYP3jG7YOq8es0PBpJIE5yvRVZffOyaqC0GgMBN6yt0Q-NI8pxS7hd1F9dYXnowSC6zpZmW9D/pub?output=csv&gid=1902046093&headers=false" | tail -n +5 | csvtojson >$temp_file
filesize=$(wc -c <"$temp_file")
if  [ "$filesize" -ge "10000" ]; then
    echo "Updated BNO-$d.json ($filesize) "
   mv $temp_file ../data/archive/BNO-$d.json
   git add ../data/archive/BNO-$d.json
else 
    echo "file size $filesize too small"
fi

curl -s "https://docs.google.com/spreadsheets/d/e/2PACX-1vT2INKOqGFCUpyx6MvrglF2ePvK_JqQofqc2frHos6acgNFXjO03JPVYUYZwEWMPLBms9PNfCUZ71Zw/pub?gid=0&single=true&output=csv" | csvtojson >$temp_file
filesize=$(wc -c <"$temp_file")
if  [ "$filesize" -ge "100" ]; then
    echo "Updated News.json ($filesize) "
   mv $temp_file ./src/data/news.json
   git add ./src/data/news.json
else 
    echo "file size $filesize too small"
fi

curl -s "https://docs.google.com/spreadsheets/d/e/2PACX-1vRb7RaaDwoqJhiPXvsFBWmERs-_xD7UdR477JKSr5G0pD8R1DnvfxulT-esUrNB1CMBFTjTGBctpvnw/pub?gid=0&single=true&output=csv" | csvtojson >$temp_file
filesize=$(wc -c <"$temp_file")
if  [ "$filesize" -ge "100" ]; then
    echo "Updated whatsnew.json ($filesize) "
   mv $temp_file ./src/data/whatsnew.json
   git add ./src/data/whatsnew.json
else
    echo "file size $filesize too small"
fi

curl -s "https://docs.google.com/spreadsheets/d/e/2PACX-1vTyCGNMkOWOyoUwIFCCZfNFizxYjikTxTxVSEt0t7sE-D-V0B-B7ZrGyZUuoYpjAl0Xf2geb9i_84be/pub?gid=0&single=true&output=csv" | csvtojson >$temp_file
filesize=$(wc -c <"$temp_file")
if  [ "$filesize" -ge "100" ]; then
    echo "Updated contribors.json ($filesize) "
   mv $temp_file ./src/data/contributors.json
   git add ./src/data/contributors.json
else 
    echo "file size $filesize too small"
fi
