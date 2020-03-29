curl --data-urlencode query@query.sparql \
'https://query.wikidata.org/sparql?format=json' |\
 jq '[ .results .bindings | .[] | { StartDate: .isoStartDate .value, CountyName: .placeLabel.value, Url: .startSource.value, CountyFIPS: .fips.value} ]'
