
const getDistance = require('geolib').getDistance;
const CountyList = require("./data/county_gps.json");
const moment = require("moment");

const ConfirmedData = require("./data/covid_confirmed_usafacts.json");
const DeathData = require("./data/covid_death_usafacts.json");
const LatestData = require("./data/latest.json");
const states = require('us-state-codes');
const ConfirmedData2 = JSON.parse(JSON.stringify(ConfirmedData));

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

function getAllStatesSummary(cases) {
    let state_sum = Object.keys(USState_Population).map(state => casesForStateSummary(state));
    return state_sum.map(s => {

        return {
            state: s.state,
            confirmed: s.confirmed,
            newcases: s.newcases,
            newpercent: ((s.newcases / (s.confirmed - s.newcases)) * 100).toFixed(0),
            Population2010: USState_Population[s.state],
        }

    })
}

function getCountySummary1() {
    let map = ConfirmedData2.reduce((m, a) => {
        let key = makeCountyKey(
            a["State"],
            a["County Name"],
        );
        if (a["County Name"] === "Statewide Unallocated") {
            key = makeCountyKey(
                a["State"],
                "Unassigned",
            );
        }
        if (a["State"] === "NY" && a["County Name"] === "New York City") {
            key = makeCountyKey(
                "NY",
                "New York City County"
            );
        }
        let c = getCombinedDataForKey(key);
        let county = a["County Name"].replace(" County", "");
        m.push({
            total: c[todaykey].confirmed,
            county: county,
            County: county,
            state_name: a["State"],
            State_name: a["State"],
        });
        return m;
    }, []);
    return map;
}

function countyDataForState(state_short_name) {
    let map = ConfirmedData2
        .filter(c => c.State === state_short_name)
        .reduce((m, a) => {
            let county = a["County Name"].replace(" County", "");
            let state = a.State;
            let key = makeCountyKey(
                state,
                a["County Name"] ,
            );
            if (a["State"] === "NY" && county === "New York City") {
                key = makeCountyKey(
                    "NY",
                    "New York City County"
                );
            }
            if (a["County Name"] === "Statewide Unallocated") {
                key = makeCountyKey(
                    a["State"],
                    "Unassigned",
                );
            }
            let c = getCombinedDataForKey(key);
            let c_info = lookupCountyInfo(state, county);
            let pop = c_info ? c_info.Population2010 : NaN;

            m.push({
                total: c[todaykey].confirmed,
                confirmed: c[todaykey].confirmed,
                county: county,
                County: county,
                state_name: state,
                State: state,
                Population2010: pop,
            });
            return m;
        }, []);
    return map;
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

function makeCountyKey(state, county) {
    return "" + state + county;
}

const LatestMap = LatestData.features.reduce((m, o) => {
    let a = o.attributes;
    let key = makeCountyKey(
        states.getStateCodeByStateName(a.Province_State),
        a.Admin2 + " County",
    );
    m[key] = {
        confirmed: a.Confirmed,
        death: a.Deaths,
    };
    return m;
}, {});

function computeConfirmMap() {
    let map = ConfirmedData.reduce((m, a) => {
        let key = makeCountyKey(
            a["State"],
            a["County Name"],
        );
        if (a["State"] === "NY" && a["County Name"] === "New York City") {
            key = makeCountyKey(
                "NY",
                "New York City County"
            );
        }
        if (a["County Name"] === "Statewide Unallocated") {
            console.log("capturing unassigned.... ");
            key = makeCountyKey(
                a["State"],
                "Unassigned",
            );
        }
        delete a["countyFIPS"];
        delete a["County Name"];
        delete a["State"];
        delete a["stateFIPS"];
        let obj = {}
        Object.keys(a).map(k => {
            let v = parseInt(a[k]);
            let p = k.split("/");
            let m = pad(parseInt(p[0]));
            let d = pad(parseInt(p[1]));
            let y = p[2];
            obj[`${m}/${d}/${y}`] = v;
            return null;
        });
        let today = moment().format("MM/DD/YYYY");
        let yesterday = moment().subtract(1, "days").format("MM/DD/YYYY");
        let day_minus_2 = moment().subtract(2, "days").format("MM/DD/YYYY");

        let latestForCounty = LatestMap[key];
        if (key.endsWith("Unassigned")) {
            latestForCounty = LatestMap[key + " County"];
        }
        if (latestForCounty) {

            if (!obj[yesterday]) {
                obj[yesterday] = latestForCounty.confirmed;
            }

            // number should not be decreasing
            if (latestForCounty.confirmed > obj[yesterday]) {
                obj[today] = latestForCounty.confirmed;
            } else {
                obj[today] = obj[yesterday];
            }
        } else {
            if (obj[yesterday]) {
                obj[today] = obj[yesterday];
            } else {
                console.log("THERE IS NO YESTERDAY");
                obj[yesterday] = obj[day_minus_2];
                obj[today] = obj[yesterday];
            }
        }
        m[key] = obj;
        if (key.endsWith("NYUnassigned")) {
            console.log(latestForCounty);
            console.log(obj);
            console.log(LatestMap["NYUnassigned County"]);

        }
        return m;
    }, {});
    return map;
}

const ConfirmedMap = computeConfirmMap();

const DeathMap = DeathData.reduce((m, a) => {
    let key = makeCountyKey(
        a["State"],
        a["County Name"],
    );
    if (a["State"] === "NY" && a["County Name"] === "New York City") {
        key = makeCountyKey(
            "NY",
            "New York City County"
        );
    }

    delete a["countyFIPS"];
    delete a["County Name"];
    delete a["State"];
    delete a["stateFIPS"];

    let obj = {};
    Object.keys(a).map(k => {
        let v = parseInt(a[k]);
        let p = k.split("/");
        let m = pad(parseInt(p[0]));
        let d = pad(parseInt(p[1]));
        let y = p[2];
        obj[`${m}/${d}/${y}`] = v;
        return null;
    });

    let today = moment().format("MM/DD/YYYY");
    let yesterday = moment().subtract(1, "days").format("MM/DD/YYYY");
    let latestForCounty = LatestMap[key];
    if (latestForCounty) {
        // number should not be decreasing
        if (latestForCounty.death > obj[yesterday]) {
            obj[today] = latestForCounty.death;
        } else {
            obj[today] = obj[yesterday];
        }
    } else {
        obj[today] = obj[yesterday];
    }

    m[key] = obj;
    return m;
}, {});

function computeCombinedMap() {
    let countykeys = Object.keys(ConfirmedMap);
    let combined = {};
    countykeys.map(key => {
        let c_confirm = ConfirmedMap[key];
        let c_death = DeathMap[key];
        let date_keys = Object.keys(c_confirm);
        let obj_for_date = {};
        date_keys.map(date => {
            let entry = {
                confirmed: c_confirm[date],
                death: c_death ? c_death[date] : 0,
            }
            obj_for_date[date] = entry;
            return null;
        })
        combined[key] = obj_for_date;

        return null;
    });
    return combined;
}

const CombinedDataMap = computeCombinedMap();

function pad(n) { return n < 10 ? '0' + n : n }

function getCombinedData(state_short_name, county_name) {
    if (state_short_name === "NY" && county_name === "New York") {
        county_name = "New York City"
    }
    let key = makeCountyKey(state_short_name, county_name + " County");
    if (county_name === "Statewide Unallocated") {
        key = makeCountyKey(state_short_name, "Unassigned");
    }

    return CombinedDataMap[key];
}

function getCountyData(state_short_name, county_name) {
    return getCombinedData(state_short_name, county_name);
}

function getCountyDataForGrapth(state_short_name, county_name) {
    /*
    if (state_short_name === "NY" && county_name === "New York") {
        county_name = "New York City";
    }
    if (county_name === "Statewide Unallocated") {
        county_name = makeCountyKey(
            state_short_name,
            "Unassigned",
        );
    }
    let key = makeCountyKey(state_short_name, county_name + " County");
    if (county_name === "Unassigned") {
        key = makeCountyKey(state_short_name, county_name);
    }
    return CombinedDataMap[key];
    */
    console.log("gettinng graph")
    return getCombinedData(state_short_name, county_name);
}

function getCountyDataForGraphWithNearby(state_short_name, county_name) {
    let counties_keys = nearbyCounties(state_short_name, county_name).map(a => makeCountyKey(
        state_short_name,
        a["County"] + " County",
    ));
    return getDataForGrapthForCountyKeys(counties_keys)
}

function getCombinedDataForKey(k) {
    return CombinedDataMap[k];
}

function getStateDataForGrapth(state_short_name) {
    let counties_keys = Object.keys(CombinedDataMap).filter(k => k.startsWith(state_short_name));
    return getDataForGrapthForCountyKeys(counties_keys)
}
        
function getDataForGrapthForCountyKeys(counties_keys) {
    let result = {};

    counties_keys.map(k => {
        // let c_data = CombinedDataMap[k];
        let c_data = getCombinedDataForKey(k);
        if (!c_data) {
            return null;
        }
        Object.keys(c_data).map(date_key => {
            let date_data = c_data[date_key];
            let entry = result[date_key];

            let a = {};
            if (entry) {
                // if I don't do this, somehow it affects upsteam data, werid. 
                // a = entry;
                a.confirmed = entry.confirmed + date_data.confirmed;
                a.death = entry.death + date_data.death;
                a.fulldate = entry.fulldate;
                a.name = entry.name;
                a.newcase = entry.newcase;
                a.state = entry.state;
            } else {
                a = date_data;
            }
            result[date_key] = a;
            return null;
        });
        return null;
    });
    return result;
}

function getUSDataForGrapth() {
    let counties = Object.values(CombinedDataMap);
    let result = {};
    counties.map(c_data => {
        Object.keys(c_data).map(date_key => {
            let date_data = c_data[date_key];
            let entry = result[date_key];
            let a = {};
            if (entry) {
                // entry.confirmed += date_data.confirmed;
                // entry.death += date_data.death;

                a.confirmed = entry.confirmed + date_data.confirmed;
                a.death = entry.death + date_data.death;
                a.fulldate = entry.fulldate;
                a.name = entry.name;
                a.newcase = entry.newcase;
                a.state = entry.state;

            } else {
                a = date_data;
            }
            result[date_key] = a;
            return null;
        });
        return null;
    });
    return result;
}

function arraysum_text(a) {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
        sum += a[i];
    }
    return sum;
}

const todaykey = moment().format("MM/DD/YYYY");
const yesterdaykey = moment().subtract(1, "days").format("MM/DD/YYYY");

function casesForCountySummary(state_short_name, county_name) {
    let c = getCountyData(state_short_name, county_name);
    if (!c) {
        return {
            confirmed: 0,
            newcases: 0,
            newpercent: 0,
        }
    }
    let today = c[todaykey].confirmed;
    let yesterday = c[yesterdaykey].confirmed;
    return {
        confirmed: today,
        newcases: today - yesterday,
        newpercent: (((today - yesterday) / yesterday) * 100).toFixed(0),
    }
}

function casesForStateSummary(state_short_name) {
    let counties_keys = Object.keys(CombinedDataMap)
        .filter(k => k.startsWith(state_short_name));
    let summaries = counties_keys.map(k => {
        let c = getCombinedDataForKey(k);
        if (!c) {
            return {
                confirmed: 0,
                newcases: 0,
                newpercent: 0,
            }
        }
        let today = c[todaykey].confirmed;
        let yesterday = c[yesterdaykey].confirmed;
        let result = {
            confirmed: today,
            death: c[todaykey].death,
            newcases: today - yesterday,
        }
        return result;
    });

    let confirmed = arraysum_text(summaries.map(s => s.confirmed));
    let newcases = arraysum_text(summaries.map(s => s.newcases));
    return {
        state: state_short_name,
        confirmed: confirmed,
        newcases: newcases,
        newpercent: ((newcases / (confirmed - newcases)) * 100).toFixed(0),
    }
}

function casesForUSSummary() {

    let today = 0;
    let yesterday = 0;
    for (var index in ConfirmedMap) {
        let c = ConfirmedMap[index];
        today += c[todaykey];
        yesterday += c[yesterdaykey];
    }

    return {
        confirmed: today,
        newcases: today - yesterday,
        newpercent: ((today - yesterday / today) * 100).toFixed(0),
    }
}

export {
    countyModuleInit,
    lookupCountyInfo,
    nearbyCounties,
    casesForCountySummary,
    casesForStateSummary,
    casesForUSSummary,
    hospitalsForState,
    countyDataForState,
    getAllStatesSummary,
    /// new
    getCountyDataForGrapth,
    getStateDataForGrapth,
    getUSDataForGrapth,
    getCountySummary1,
    getCountyDataForGraphWithNearby,
}