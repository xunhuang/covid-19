rm -rf 2020*
curl -s "https://ihmecovid19storage.blob.core.windows.net/latest/ihme-covid19.zip" -o ihme-covid19.zip
unzip ihme-covid19.zip
cat `find . |grep .csv` |csvtojson |jq '[.[] | .["location"] = (.location_id |tonumber) |select (.location == 102 or ( .location > 500 and .location <600)) | {location_name, date, allbed_mean, allbed_lower, allbed_upper, deaths_mean, deaths_lower, deaths_upper} ]' > ../../website/public/data/npr_projection.json
