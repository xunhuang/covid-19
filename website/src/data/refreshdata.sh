curl https://covidtracking.com/api/states/daily |jq > state_testing.json 
curl https://covidtracking.com/api/us/daily |jq > us_testing.json
curl "https://services1.arcgis.com/0MSEUqKaxRlEPj5g/arcgis/rest/services/ncov_cases_US/FeatureServer/0/query?f=json&where=(Confirmed%20%3E%200)%20AND%20(1%3D1)&returnGeometry=false&spatialRel=esriSpatialRelIntersects&outFields=*&orderByFields=OBJECTID%20ASC&resultOffset=0&resultRecordCount=50&cacheHint=true&quantizationParameters=%7B%22mode%22%3A%22edit%22%7D" | jq > latest.json
