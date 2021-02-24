const superagent = require("superagent");
const moment = require('moment');

function addfulldate(sourceData) {
    let data = sourceData.map(t => {
        t.fulldate = moment(t.Date, "YYYY-MM-DD").format("MM/DD/YYYY");
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
