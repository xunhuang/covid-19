curl https://static.usafacts.org/public/data/covid-19/covid_confirmed_usafacts.csv |csvtojson |jq  > covid_confirmed_usafacts.json
curl https://static.usafacts.org/public/data/covid-19/covid_death_usafacts.csv |csvtojson |jq  > covid_death_usafacts.json
