curl --data-urlencode query@query.sparql \
'https://query.wikidata.org/sparql?format=json' |\
 jq '[ .results .bindings | .[] | { EndDate: .isoEndDate.value, EndURL:.endSource.value,StartDate: .isoStartDate .value, CountyName: .placeLabel.value, Url: .startSource.value, CountyFIPS: .fips.value} ]'
