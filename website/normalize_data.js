
const moment = require("moment");
const CountyList = require("./src/data/county_gps.json");
const ConfirmedData = require("./src/data/covid_confirmed_usafacts.json");
const DeathData = require("./src/data/covid_death_usafacts.json");
const LatestData03252020 = require("../data/archive/JHU-03-25-2020.json");
const LatestData03262020 = require("../data/archive/JHU-03-26-2020.json");
const LatestData03272020 = require("../data/archive/JHU-03-27-2020.json");
const LatestData03282020 = require("../data/archive/JHU-03-28-2020.json");
const LatestData = require("./src/data/latest.json");
const states = require('us-state-codes');
const fs = require('fs');
// const myFipsCode = require("./src/USCountyInfo.js").myFipsCode

function pad(n) { return n < 10 ? '0' + n : n }

const state_fips_to_name =
{
    "10": "Delaware",
    "11": "District of Columbia",
    "12": "Florida",
    "13": "Georgia",
    "15": "Hawaii",
    "16": "Idaho",
    "17": "Illinois",
    "18": "Indiana",
    "19": "Iowa",
    "20": "Kansas",
    "21": "Kentucky",
    "22": "Louisiana",
    "23": "Maine",
    "24": "Maryland",
    "25": "Massachusetts",
    "26": "Michigan",
    "27": "Minnesota",
    "28": "Mississippi",
    "29": "Missouri",
    "30": "Montana",
    "31": "Nebraska",
    "32": "Nevada",
    "33": "New Hampshire",
    "34": "New Jersey",
    "35": "New Mexico",
    "36": "New York",
    "37": "North Carolina",
    "38": "North Dakota",
    "39": "Ohio",
    "40": "Oklahoma",
    "41": "Oregon",
    "42": "Pennsylvania",
    "44": "Rhode Island",
    "45": "South Carolina",
    "46": "South Dakota",
    "47": "Tennessee",
    "48": "Texas",
    "49": "Utah",
    "50": "Vermont",
    "51": "Virginia",
    "53": "Washington",
    "54": "West Virginia",
    "55": "Wisconsin",
    "56": "Wyoming",
    "01": "Alabama",
    "02": "Alaska",
    "04": "Arizona",
    "05": "Arkansas",
    "06": "California",
    "08": "Colorado",
    "09": "Connecticut",
    "72": "Puerto Rico",
    "66": "Guam",
    "78": "Virgin Islands",
    "60": "American Samoa"
};


function covert() {
    return Object.keys(state_fips_to_name).reduce((m, k) => {
        m[state_fips_to_name[k]] = k
        return m;
    }, {});

}

const STATE_Name_To_FIPS = covert();


let AllData = {};

function getStateNode(state_fips) {
    return AllData[state_fips];
}

function getCountyNode(state_fips, county_fips) {
    let state = getStateNode(state_fips);
    if (!state) {
        AllData[state_fips] = {};
        state = getStateNode(state_fips);
    }
    return state[county_fips];
}

function setCountyNode(state_fips, county_fips, node) {
    let state = getStateNode(state_fips);
    if (!state) {
        AllData[state_fips] = {};
        state = getStateNode(state_fips);
    }

    state[county_fips] = node;
}

let TableLookup = null;
function makeTable() {
    if (!TableLookup) {
        TableLookup = CountyList.reduce((m, c) => {
            let key = fixCountyFip(c.FIPS);
            m[key] = c;
            return m;
        }, {});
    }
}
makeTable();

function fix_county_name(county_name, county_fips) {
    let county = TableLookup[county_fips];
    if (!county) {
        if (county_name !== "Statewide Unallocated") {
            console.log(`${county_name} with ${county_fips} doesn't exist`)
        }
        if (county_name != 'St. Louis County') {
            county_name = county_name.replace(/ County$/g, "");
        }
        return county_name;
    }
    return county.County;
}

function createCountyObject(state_fips, state_name, county_fips, county_name) {

    if (county_name === "Grand Princess Cruise Ship") {
        county_fips = "06000";
    }

    let countyObject = {};
    countyObject.CountyName = fix_county_name(county_name, county_fips);
    countyObject.StateName = state_name;
    countyObject.CountyFIPS = county_fips;
    countyObject.StateFIPS = fixStateFips(state_fips);
    countyObject.Confirmed = {};
    countyObject.Death = {};
    countyObject.Recovered = {};
    countyObject.Active = {};

    /* double check...
    const [s_fips, c_fips] = myFipsCode(countyObject.StateName, countyObject.CountyName);
    if (s_fips !== countyObject.StateFIPS || c_fips !== county_fips) {
        console.log(`bad state county name ${state_name},  ${county_name}`)
        console.log(` ${s_fips},  ${countyObject.StateFIPS}`)
        console.log(s_fips === countyObject.StateFIPS);
        console.log(` ${c_fips},  ${county_fips}`)
        console.log(c_fips === county_fips);
    }
    */

    setCountyNode(state_fips, county_fips, countyObject);

    return countyObject;
}

function fixCountyFip(cp) {
    if (cp.length === 4) {
        return "0" + cp;
    }
    return cp;
}

function fixStateFips(cp) {
    if (!isNaN(cp)) {
        cp = cp.toString();
    }
    if (cp.length === 1) {
        return "0" + cp;
    }
    return cp;
}

// create nodes
ConfirmedData.map(b => {
    if (b.stateFIPS.length === 0) {
        return;
    }
    let countyObject = createCountyObject(
        pad(parseInt(b.stateFIPS)),
        b.State,
        fixCountyFip(b.countyFIPS),
        b["County Name"],
    )
    let county = getCountyNode(countyObject.StateFIPS, countyObject.CountyFIPS);
    if (!county) {
        setCountyNode(countyObject.StateFIPS, countyObject.CountyFIPS, countyObject);
    }
});

DeathData.map(b => {
    // check for empty line
    if (b.stateFIPS.length === 0) {
        return;
    }
    let countyObject = createCountyObject(
        pad(parseInt(b.stateFIPS)),
        b.State,
        fixCountyFip(b.countyFIPS),
        b["County Name"],
    )
    let county = getCountyNode(countyObject.StateFIPS, countyObject.CountyFIPS);
    if (!county) {
        setCountyNode(countyObject.StateFIPS, countyObject.CountyFIPS, countyObject);
    }
});

ConfirmedData.map(b => {
    let county_fips = fixCountyFip(b.countyFIPS);
    let state_fips = pad(parseInt(b.stateFIPS));
    let a = JSON.parse(JSON.stringify(b));
    let county = getCountyNode(state_fips, county_fips);

    delete a["countyFIPS"];
    delete a["County Name"];
    delete a["State"];
    delete a["stateFIPS"];
    delete a["field69"];

    let confirmed = county.Confirmed;
    Object.keys(a).map(k => {
        let v = parseInt(a[k]);
        let p = k.split("/");
        if (p.length != 3) {
            return null;
        }
        let m = pad(parseInt(p[0]));
        let d = pad(parseInt(p[1]));
        let y = p[2];
        confirmed[`${m}/${d}/${y}`] = v;
        return null;
    });
    county.Confirmed = confirmed;
});

DeathData.map(b => {
    // check for empty line
    if (b.stateFIPS.length === 0) {
        return;
    }
    let county_fips = fixCountyFip(b.countyFIPS);
    let state_fips = pad(parseInt(b.stateFIPS));
    let a = JSON.parse(JSON.stringify(b));
    let county = getCountyNode(state_fips, county_fips);
    delete a["countyFIPS"];
    delete a["County Name"];
    delete a["State"];
    delete a["stateFIPS"];

    // console.log(county);
    let death = county.Death;
    Object.keys(a).map(k => {
        let v = parseInt(a[k]);
        let p = k.split("/");
        if (p.length != 3) {
            return null;
        }
        let m = pad(parseInt(p[0]));
        let d = pad(parseInt(p[1]));
        let y = p[2];
        death[`${m}/${d}/${y}`] = v;
        return null;
    });
    county.Death = death;
});

function processJHUDataPoint(c, date) {
    let b = c.attributes;
    let county_fips = b.FIPS;
    let state_fips = STATE_Name_To_FIPS[b.Province_State];
    if (county_fips === null) {
        county_fips = "0";
    }
    let county = getCountyNode(state_fips, county_fips);
    if (!county) {
        county = createCountyObject(
            state_fips,
            states.getStateCodeByStateName(b.Province_State),
            county_fips,
            b.Admin2,
        )
    }

    let datekey = date;
    county.Confirmed[datekey] = b.Confirmed;
    county.Recovered[datekey] = b.Recovered;
    county.Death[datekey] = b.Deaths;
    county.Active[datekey] = b.Active;
}

function processJHU(dataset, date) {
    let data = dataset.features;
    for (let i = 0; i < data.length; i++) {
        let datapoint = data[i];
        processJHUDataPoint(datapoint, date);
    }
}

const today = moment().format("MM/DD/YYYY");
processJHU(LatestData03252020, "03/25/2020");
processJHU(LatestData03262020, "03/26/2020");
processJHU(LatestData03272020, "03/27/2020");
processJHU(LatestData03282020, "03/28/2020");
processJHU(LatestData, today);

// back fill holes in the data

function fillarrayholes(v) {
    let keys = Object.keys(v).sort((a, b) => moment(a, "MM/DD/YYYY").toDate() - moment(b, "MM/DD/YYYY").toDate());
    let key = keys[0];
    while (key !== today) {
        let lastvalue = v[key];
        let nextkey = moment(key).add(1, "days").format("MM/DD/YYYY");
        let nextvalue = v[nextkey];
        if (nextvalue === null || nextvalue === undefined) {
            v[nextkey] = lastvalue;
        }
        key = nextkey;
    }
    return v;
}

function fillholes() {

    for (s in AllData) {
        state = AllData[s];
        for (c in state) {
            let county = state[c];
            county.Confirmed = fillarrayholes(county.Confirmed);
            county.Death = fillarrayholes(county.Death);
            setCountyNode(s, c, county);
        }
    }
}

fillholes();

function getValueFromLastDate(v, comment) {
    if (!v || Object.keys(v).length === 0) {
        return { num: 0, newnum: 0 }
    }
    if (Object.keys(v).length === 1) {
        return { num: v[0], newnum: v[0] }
    }
    let nv = Object.keys(v).sort((a, b) => moment(b, "MM/DD/YYYY").toDate() - moment(a, "MM/DD/YYYY").toDate());

    let last = v[nv[0]]
    let newnum = v[nv[0]] - v[nv[1]];
    if (newnum < 0) {
        newnum = 0;
    }
    return { num: last, newnum: newnum };
}

// summarize data for counties
for (s in AllData) {
    state = AllData[s];
    for (c in state) {
        county = state[c];
        county.LastConfirmed = 0;
        county.LastDeath = 0;
        county.LastRecovered = 0;
        county.LastActive = 0;

        const CC = getValueFromLastDate(county.Confirmed, county.CountyName + " " + county.StateName);
        const DD = getValueFromLastDate(county.Death);
        const RR = getValueFromLastDate(county.Recovered);
        const AA = getValueFromLastDate(county.Active);

        county.LastConfirmed = CC.num;
        county.LastConfirmedNew = CC.newnum;
        county.LastDeath = DD.num;
        county.LastDeathNew = DD.newnum;
        county.LastRecovered = RR.num;
        county.LastRecoveredNew = RR.newnum;
        county.LastActive = AA.num;
        county.LastActiveNew = AA.newnum;

        setCountyNode(s, c, county);
    }
}

function mergeTwoMapValues(m1, m2) {
    for (let i in m2) {
        let a = m1[i];
        a = a ? a : 0;
        a += m2[i];
        m1[i] = a;
    }
}

// summarize data for states

for (s in AllData) {
    state = AllData[s];
    // need to 
    Confirmed = {};
    Death = {};
    Recovered = {};
    Active = {};
    for (c in state) {
        county = state[c];
        mergeTwoMapValues(Confirmed, county.Confirmed)
        mergeTwoMapValues(Death, county.Death)
        mergeTwoMapValues(Recovered, county.Recovered)
        mergeTwoMapValues(Active, county.Active)

    }
    let Summary = {};
    Summary.Confirmed = Confirmed;
    Summary.Death = Death;
    Summary.Recovered = Recovered;
    Summary.Active = Active;

    const CC = getValueFromLastDate(Confirmed, s);
    const DD = getValueFromLastDate(Death);
    const RR = getValueFromLastDate(Recovered);
    const AA = getValueFromLastDate(Active);

    Summary.LastConfirmed = CC.num;
    Summary.LastConfirmedNew = CC.newnum;
    Summary.LastDeath = DD.num;
    Summary.LastDeathNew = DD.newnum;
    Summary.LastRecovered = RR.num;
    Summary.LastRecoveredNew = RR.newnum;
    Summary.LastActive = AA.num;
    Summary.LastActiveNew = AA.newnum;

    state.Summary = Summary;
}

// summarize data for US
USConfirmed = {};
USDeath = {};
USRecovered = {};
USActive = {};

for (s in AllData) {
    state = AllData[s];
    mergeTwoMapValues(USConfirmed, state.Summary.Confirmed)
    mergeTwoMapValues(USDeath, state.Summary.Death)
    mergeTwoMapValues(USRecovered, state.Summary.Recovered)
    mergeTwoMapValues(USActive, state.Summary.Active)
}

let Summary = {};
Summary.Confirmed = USConfirmed;
Summary.Death = USDeath;
Summary.Recovered = USRecovered;
Summary.Active = USActive;

const CC = getValueFromLastDate(USConfirmed, "country ");
const DD = getValueFromLastDate(USDeath);
const RR = getValueFromLastDate(USRecovered);
const AA = getValueFromLastDate(USActive);

Summary.LastConfirmed = CC.num;
Summary.LastConfirmedNew = CC.newnum;
Summary.LastDeath = DD.num;
Summary.LastDeathNew = DD.newnum;
Summary.LastRecovered = RR.num;
Summary.LastRecoveredNew = RR.newnum;
Summary.LastActive = AA.num;
Summary.LastActiveNew = AA.newnum;
Summary.generated = moment().format();

AllData.Summary = Summary;
let content = JSON.stringify(AllData, 2, 2);
fs.writeFileSync("./src/data/AllData.json", content);
