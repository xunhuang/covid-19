const moment = require('moment');
const states = require('us-state-codes');
const getDistance = require('geolib').getDistance;
const CountyList = require("./data/county_gps.json");
const fips = require('fips-county-codes');
const AllData = require("./data/AllData.json");

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

function countyModuleInit() {
    makeTable();
}

var TableLookup;

function makeTable() {
    if (!TableLookup) {
        TableLookup = CountyList.reduce((m, c) => {
            let key = table_key(c.State, c.County);
            m[key] = c;
            return m;
        }, {});
    }
}

function table_key(state_short_name, county_name) {
    return state_short_name + ":" + county_name;
}

function lookupCountyInfo(state_short_name, county_name) {
    makeTable();
    let key = table_key(state_short_name, county_name);
    return TableLookup[key];
}

function nearbyCounties(state_short_name, county_name) {
    let centerCounty = lookupCountyInfo(state_short_name, county_name);
    if (!centerCounty) {
        return null;
    }
    let reduced_list = CountyList.filter((item) => {
        return Math.abs(Number(centerCounty.Latitude) - Number(item.Latitude)) < 1.5 &&
            Math.abs(Number(centerCounty.Longitude) - Number(item.Longitude)) < 1.5
    });

    let add_distance = reduced_list.map(c => {
        c.distance =
            c.d = getDistance(
                { latitude: c.Latitude, longitude: c.Longitude },
                { latitude: centerCounty.Latitude, longitude: centerCounty.Longitude }
            );
        return c;
    });

    return add_distance;
}

const USState_Population =
{
    "CA": 39937489,
    "TX": 29472295,
    "FL": 21992985,
    "NY": 19440469,
    "PA": 12820878,
    "IL": 12659682,
    "OH": 11747694,
    "GA": 10736059,
    "NC": 10611862,
    "MI": 10045029,
    "NJ": 8936574,
    "VA": 8626207,
    "WA": 7797095,
    "AZ": 7378494,
    "MA": 6976597,
    "TN": 6897576,
    "IN": 6745354,
    "MO": 6169270,
    "MD": 6083116,
    "WI": 5851754,
    "CO": 5845526,
    "MN": 5700671,
    "SC": 5210095,
    "AL": 4908621,
    "LA": 4645184,
    "KY": 4499692,
    "OR": 4301089,
    "OK": 3954821,
    "CT": 3563077,
    "UT": 3282115,
    "IA": 3179849,
    "NV": 3139658,
    "AR": 3038999,
    "PR": 3032165,
    "MS": 2989260,
    "KS": 2910357,
    "NM": 2096640,
    "NE": 1952570,
    "ID": 1826156,
    "WV": 1778070,
    "HI": 1412687,
    "NH": 1371246,
    "ME": 1345790,
    "MT": 1086759,
    "RI": 1056161,
    "DE": 982895,
    "SD": 903027,
    "ND": 761723,
    "AK": 734002,
    "DC": 720687,
    "VT": 628061,
    "WY": 567025
}

function getAllStatesSummary() {
    let state_sum = Object.keys(USState_Population).map(state => casesForStateSummary(state));
    return state_sum.map(s => {

        return {
            state: s.state,
            full_name: states.getStateNameByStateCode(s.state),
            confirmed: s.confirmed,
            newcases: s.newcases,
            death: s.death,
            newpercent: s.newcases / (s.confirmed - s.newcases),

            // this can also be presummarized.
            Population2010: USState_Population[s.state],
            daysToDouble: s.daysToDouble,
            daysToDoubleDeath: s.daysToDoubleDeath,
            recovered: s.lastRecovered,
        }

    })
}

function convertCountyObjectToSummaryObject(c) {
    let c_info = lookupCountyInfo(c.StateName, c.CountyName);
    let pop = c_info ? c_info.Population2010 : NaN;

    return {
        total: c.LastConfirmed,
        county: c.CountyName,
        County: c.CountyName,
        State: c.StateName,
        state_name: c.StateName,
        State_name: c.StateName,
        StateFIPS: c.StateFIPS,
        CountyFIPS: c.CountyFIPS,
        daysToDouble: c.DaysToDouble,
        daysToDoubleDeath: c.DaysToDoubleDeath,
        Population2010: pop,
    };
}

function getCountySummary1() {
    let result = [];
    for (let s in AllData) {
        if (s.length !== 2) {
            continue;
        }
        let state = AllData[s];
        for (let cfips in state) {
            if (cfips.length === 5) {
                let c = state[cfips];
                if (!c.CountyName) {
                    console.log("no name: " + c.StateFIPS + " " + c.CountyFIPS)
                    console.log(c);
                }
                result.push(convertCountyObjectToSummaryObject(c));
            }
        }
    }
    return result;
}

function countyDataForMetro(metro) {
    let metro_info = getMetro(metro);
    var m = [];
    metro_info.Counties.map(cfips => {
        let c = AllData[metro_info.StateFIPS][cfips];
        m.push(convertCountyObjectToSummaryObject(c));
        return null;
    });
    return m;
}

function countyDataForState(state_short_name) {
    const [sfips] = myFipsCode(state_short_name, null);
    const state = AllData[sfips];
    var m = []
    for (let cfips in state) {
        if (cfips !== "Summary") {
            let c = state[cfips];
            m.push(convertCountyObjectToSummaryObject(c));
        }
    }
    return m;
}

function hospitalsForState(state_short_name) {
    let state_countylist = CountyList.filter(c => {
        return (c.State === state_short_name);
    });
    let hospitals = 0;
    let beds = 0;
    state_countylist.map(c => {
        if (c.Hospitals) {
            hospitals += c.Hospitals;
        }
        if (c.HospitalBeds) {
            beds += c.HospitalBeds;
        }
        return null;
    })
    return {
        hospitals: hospitals,
        beds: beds,
    }
}



function getCountyDataNew(state_short_name, county_name) {
    const [sfips, cfips] = myFipsCode(state_short_name, county_name);
    let county = AllData[sfips][cfips];
    return county;
}

function sort_by_date(a, b) {
    return moment(a, "MM/DD/YYYY").toDate() - moment(b, "MM/DD/YYYY").toDate();
}

function dataMapToGraphSeriesNew(data) {
    let arr = [];
    let keys = Object.keys(data.Confirmed).sort(sort_by_date);
    for (let i = 0; i < keys.length; i++) {
        let entry = {}
        let key = keys[i];
        entry.confirmed = data.Confirmed[key];
        entry.death = data.Death[key];
        if (data.Recovered) {
            entry.recovery = data.Recovered[key];
        }
        entry.fulldate = key;
        arr.push(entry);
    }
    return arr;
}

function getCountyDataForGrapth(state_short_name, county_name) {
    let data = getCountyDataNew(state_short_name, county_name);
    return dataMapToGraphSeriesNew(data);
}

function getStateDataForGrapth(state_short_name) {
    const [sfips] = myFipsCode(state_short_name);
    let data = AllData[sfips].Summary;
    let result = dataMapToGraphSeriesNew(data);
    return (result);
}

function getMetroDataForGrapth(metro) {
    let data = getMetroSummary(metro);
    let result = dataMapToGraphSeriesNew(data);
    return (result);
}

function getUSDataForGrapth() {
    let data = AllData.Summary;
    let result = dataMapToGraphSeriesNew(data);
    return result;
}


function casesForCountySummary(state_short_name, county_name) {
    let c = getCountyDataNew(state_short_name, county_name);
    if (!c) {
        console.log("why not count data for " + state_short_name + " " + county_name);
        return {
            confirmed: 0,
            newcases: 0,
            death: 0,
            newpercent: 0,
            daysToDouble: null,
            daysToDoubleDeath: null,
        }
    }
    let today = c.LastConfirmed;
    let newcase = c.LastConfirmedNew;
    return {
        confirmed: today,
        newcases: newcase,
        death: c.LastDeath,
        newpercent: (newcase) / (today - newcase),
        stayHomeOrder: c.StayHomeOrder,
        daysToDouble: c.DaysToDouble,
        daysToDoubleDeath: c.DaysToDoubleDeath,
    }
}

function getMetro(m) {
    return AllData.Metros[m];
}

function getMetroSummary(m) {
    const metro = getMetro(m);
    if (!metro) {
        return null;
    }
    return metro.Summary;
}

function casesForStateSummary(state_short_name) {
    const [sfips] = myFipsCode(state_short_name);
    const state = AllData[sfips];

    if (!state) {
        console.log(`${state_short_name} not supported as a state yet  `);
        return {
            state: state_short_name,
            confirmed: 0,
            newcases: 0,
            death: 0,
            newpercent: 0,
            daysToDouble: null,
            daysToDoubleDeath: null,
            lastRecovered: null,
        }
    }
    let confirmed = state.Summary.LastConfirmed;
    let newcases = state.Summary.LastConfirmedNew;
    return {
        state: state_short_name,
        confirmed: confirmed,
        newcases: newcases,
        death: state.Summary.LastDeath,
        deathNew: state.Summary.LastDeathNew,
        newpercent: ((newcases / (confirmed - newcases)) * 100).toFixed(0),
        stayHomeOrder: state.Summary.StayHomeOrder,
        daysToDouble: state.Summary.DaysToDouble,
        daysToDoubleDeath: state.Summary.DaysToDoubleDeath,
        lastRecovered: state.Summary.LastRecovered,
        lastRecoveredNew: state.Summary.LastRecoveredNew,
    }
}

function casesForUSSummary() {
    const confirmed = AllData.Summary.LastConfirmed;
    const newcases = AllData.Summary.LastConfirmedNew;
    const deaths = AllData.Summary.LastDeath;
    const deathsNew = AllData.Summary.LastDeathNew;
    const recovered = AllData.Summary.LastRecovered;
    const recoveredNew = AllData.Summary.LastRecoveredNew;
    const generatedTime = (new Date(AllData.Summary.generated)).toString();
    return {
        confirmed: confirmed,
        newcases: newcases,
        deaths: deaths,
        deathsNew: deathsNew,
        recovered: newcases,
        recoveredNew: recoveredNew,
        newpercent: ((newcases / (confirmed - newcases)) * 100).toFixed(0),
        generatedTime: generatedTime,
    }

}

function myFipsCode(state, county) {
    if (!county || county === "Statewide Unallocated" || county === "Unassigned") {
        let statefips = STATE_Name_To_FIPS[states.getStateNameByStateCode(state)];
        return [statefips, "0"];
    }

    if (county === "Grand Princess Cruise Ship") {
        return ["06", "06000"];
    }
    if (county === "New York City") {
        county = "New York";
    }
    if (county === "Dona Ana") {
        return ["35", "35013"];
    }

    let county_info = lookupCountyInfo(state, county);
    if (county_info) {
        let fips = county_info.FIPS;
        if (fips) {
            if (fips.length === 4) {
                fips = "0" + fips;
            }
            if (fips.length === 5) {
                return [fips.slice(0, 2), fips];
            }
        }
    }

    console.log(`checking fips code for ${state} ${county}`);
    let a = fips.get({
        "state": state,
        "county": county,
    });
    console.log(a);

    return [a.fips.slice(0, 2), a.fips]
}

/**
* Returns a flat array containing all counties in AllData (excluding special items like Summary, unallocated)
*/
function getAllProperCountyDataForUS() {
    return getAllProperStateKeys().reduce((acc, statekey) => {
        const all_county_data = getAllProperCountyDataForState(statekey);
        return acc.concat(all_county_data);
    }, []);
}

/**
 * Returns data for all counties in given state found in AllData excluding data for Summary, unallocated, etc.
 * @param {*} statekey
 */
function getAllProperCountyDataForState(statekey) {
    const stateData = AllData[statekey];
    return getAllProperCountyKeysForState(statekey).map((k) => stateData[k])
}

/**
 * Returns keys for all counties in a given state found in AllData excluding data for Summary, unallocated, etc.
 * @param {*} statekey
 */
function getAllProperCountyKeysForState(statekey) {
    const stateData = AllData[statekey];
    return Object.keys(stateData).filter((k) => k !== 'Summary' && k !== 'Metros' && k !== '0');
}

/**
 * Returns the state keys used in AllData excluding "non-state" data (e.g Summary)
 */
function getAllProperStateKeys() {
    return Object.keys(AllData).filter((k) => k !== 'Summary' && k !== 'Metros');
}

/**
 * Returns the metro keys used in AllData
 */
function getAllMetroKeys() {
    return Object.keys(AllData.Metros);
}

function fixCountyFips(fips) {
    if (fips.length === 4) {
        return "0" + fips;
    }
    return fips;
}

/**
 *     ("CA", "Alameda") --> "06001"
 */
function getCountyFipsCode(state, county) {
    let county_info = lookupCountyInfo(state, county);
    if (county_info) {
        return fixCountyFips(county_info.FIPS);
    }
    return null;
}

/**
 * Returns metro name from County and State name
 *    ("CA", "Santa Clara") --> "BayArea"
 *    returns null if not found
 */
function getMetroNameFromCounty(state, county) {
    let county_fips = getCountyFipsCode(state, county);
    if (!county_fips) {
        return null;
    }

    let result;
    getAllMetroKeys().map(key => {
        let metro_info = getMetro(key);
        if (metro_info.Counties.includes(county_fips)) {
            result = key;
        }
        return null;
    });
    return result;
}

export {
    countyModuleInit,
    lookupCountyInfo,
    nearbyCounties,

    getMetroNameFromCounty,
    getMetro,
    getMetroSummary,
    getMetroDataForGrapth,
    countyDataForMetro,

    //
    casesForCountySummary, // check
    casesForStateSummary, // check
    casesForUSSummary, // check
    hospitalsForState, // no related
    countyDataForState, // check
    getAllStatesSummary, // check... but can be more efficient if precomputed
    getCountySummary1, // check
    getCountyDataForGrapth, // check
    getStateDataForGrapth, // check
    getUSDataForGrapth, //Check
    myFipsCode,
    getAllProperStateKeys,
    getAllProperCountyKeysForState,
    getAllProperCountyDataForState,
    getAllProperCountyDataForUS,
}
