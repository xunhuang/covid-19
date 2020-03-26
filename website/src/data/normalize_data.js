
const getDistance = require('geolib').getDistance;
const moment = require("moment");
const ConfirmedData = require("./covid_confirmed_usafacts.json");
const DeathData = require("./covid_death_usafacts.json");
const LatestData = require("./latest.json");
const states = require('us-state-codes');

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

function getCombinedDataForKey(k) {
    // console.log("KEY IS:" + k)
    return CombinedDataMap[k];
}

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

function createCountyObject(state_fips, state_name, county_fips, county_name) {
    console.log("" + state_fips + state_name)

    let countyObject = {};
    countyObject.CountyName = county_name;
    countyObject.StateName = state_name;
    countyObject.CountyFIPS = county_fips;
    countyObject.StateFIPS = state_fips;
    countyObject.Confirmed = {};
    countyObject.Death = {};
    countyObject.Recovered = {};
    countyObject.Active = {};

    setCountyNode(state_fips, county_fips, countyObject);

    return countyObject;
}

// create nodes
ConfirmedData.map(b => {
    let countyObject = createCountyObject(
        pad(parseInt(b.stateFIPS)),
        b.State,
        b.countyFIPS,
        b["County Name"],
    )
    let county = getCountyNode(countyObject.StateFIPS, countyObject.CountyFIPS);
    if (!county) {
        setCountyNode(countyObject.StateFIPS, countyObject.CountyFIPS, countyObject);
    }
});

ConfirmedData.map(b => {
    let county_fips = b.countyFIPS;
    let state_fips = pad(parseInt(b.stateFIPS));
    let a = JSON.parse(JSON.stringify(b));
    let county = getCountyNode(state_fips, county_fips);

    delete a["countyFIPS"];
    delete a["County Name"];
    delete a["State"];
    delete a["stateFIPS"];

    let confirmed = county.Confirmed;
    Object.keys(a).map(k => {
        let v = parseInt(a[k]);
        let p = k.split("/");
        let m = pad(parseInt(p[0]));
        let d = pad(parseInt(p[1]));
        let y = p[2];
        confirmed[`${m}/${d}/${y}`] = v;
        return null;
    });
    county.Confirmed = confirmed;
});

DeathData.map(b => {
    let county_fips = b.countyFIPS;
    let state_fips = pad(parseInt(b.stateFIPS));
    let a = JSON.parse(JSON.stringify(b));
    let county = getCountyNode(state_fips, county_fips);
    delete a["countyFIPS"];
    delete a["County Name"];
    delete a["State"];
    delete a["stateFIPS"];

    let death = county.Death;
    Object.keys(a).map(k => {
        let v = parseInt(a[k]);
        let p = k.split("/");
        let m = pad(parseInt(p[0]));
        let d = pad(parseInt(p[1]));
        let y = p[2];
        death[`${m}/${d}/${y}`] = v;
        return null;
    });
    county.Death = death;
});

LatestData.features.map(c => {
    let b = c.attributes;
    let county_fips = b.FIPS;
    let state_fips = STATE_Name_To_FIPS[b.Province_State];
    if (county_fips === null) {
        county_fips = "0";
    }
    console.log(` ${state_fips}, ${county_fips}`);
    let county = getCountyNode(state_fips, county_fips);
    if (!county) {
        console.log(`creating ${b.Province_State}, ${b.Admin2}`);
        county = createCountyObject(
            state_fips,
            states.getStateCodeByStateName(b.Province_State),
            county_fips,
            b.Admin2,
        )
    }

    let datekey = moment(b.Last_Update).format("MM/DD/YYYY");

    county.Confirmed[datekey] = b.Confirmed;
    county.Recovered[datekey] = b.Recovered;
    county.Death[datekey] = b.Deaths;
    county.Active[datekey] = b.Active;
});

console.log(JSON.stringify(AllData, 2, 2));
