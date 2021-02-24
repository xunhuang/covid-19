const superagent = require("superagent");
const moment = require('moment');

function addfulldate(sourceData, datefield = "Date") {
    let data = sourceData.map(t => {
        t.fulldate = moment(t[datefield], "YYYY-MM-DD").format("MM/DD/YYYY");
        return t;
    })
    return data;
}

export async function fetchVaccineDataStates(twoLetterStateShortname) {
    let stateURL = `https://gowatchit.net/data/vaccine/${twoLetterStateShortname}.json`;
    let rawData = superagent
        .get(stateURL)
        .then(res => {
            return addfulldate(res.body);
        });
    return rawData;
}

export async function fetchVaccineDataUS() {
    let stateURL = `https://gowatchit.net/data/vaccine/USA.json`;
    let rawData = superagent
        .get(stateURL)
        .then(res => {
            return addfulldate(res.body);
        });
    return rawData;
}

export async function fetchVaccineDataCounty(fips) {
    let countyURL = `https://gowatchit.net/data/vaccine/counties/${fips}.json`;
    let rawData = superagent
        .get(countyURL)
        .then(res => {
            return addfulldate(res.body, "date");
        });
    return rawData;
}