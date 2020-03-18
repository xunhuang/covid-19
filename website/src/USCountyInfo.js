
const getDistance = require('geolib').getDistance;
const CountyList = require("./data/county_gps.json");
const moment = require("moment");

function countyModuleInit(casesdata) {
    makeTable();
    CasesData = casesdata;
}

var TableLookup;
var CasesData;

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
    const today = moment().format("M/D");
    let g_group = cases.reduce((result, c) => {
        let current = result[c.state_name];
        if (!current) {
            current = {
                confirmed: 0,
                newcases: 0,
            }
        }
        current.confirmed += c.people_count;
        if (c.confirmed_date === today) {
            current.newcases += c.people_count;
        }
        result[c.state_name] = current;
        return result;
    }, {});

    let r = Object.keys(g_group).reduce((result, key) => {
        let item = g_group[key];
        result.push({
            state: key,
            confirmed: item.confirmed,
            newcases: item.newcases,
            newpercent: ((item.newcases / (item.confirmed - item.newcases)) * 100).toFixed(0),
            Population2010: USState_Population[key],
        })
        return result;
    }, []);
    return r;
}

function getCountySummary(cases) {
    let g = cases.reduce((result, c) => {
        if (!c.county || c.county === "undefined" || c.countuy === "Unassigned" || c.county === "Unknown") {
            c.county = "Unknown";
        }

        let key = c.state_name + "," + c.county;

        let group = result[key];
        if (group) {
            group.push(c);
        } else {
            group = [c];
        }
        result[key] = group;
        return result;
    }, {});

    let g_group = Object.keys(g).reduce((result, key) => {
        let county = g[key];
        let total = county.reduce((sum, c) => {
            sum += c.people_count;
            return sum;
        }, 0);
        let c = lookupCountyInfo(county[0].state_name, county[0].county);
        let pop = c ? c.Population2010 : NaN;
        result.push({
            total: total,
            county: county[0].county,
            County: county[0].county,
            state_name: county[0].state_name,
            State: county[0].state_name,
            Population2010: pop,
        });
        return result;
    }, []);

    return g_group;
}

function casesForCounty(state_short_name, county_name) {
    return CasesData.filter(c => {
        return (c.state_name === state_short_name && c.county === county_name);
    });
}

function casesForState(state_short_name) {
    return CasesData.filter(c => {
        return (c.state_name === state_short_name);
    });
}

function countyDataForState(state_short_name) {
    let state_case = CasesData.filter(c => {
        return (c.state_name === state_short_name);
    });
    return getCountySummary(state_case).sort((a, b) => b.total - a.total);
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

function casesForCountySummary(state_short_name, county_name) {
    return casesSummary(casesForCounty(state_short_name, county_name));
}

function casesForStateSummary(state_short_name) {
    return casesSummary(casesForState(state_short_name));
}

function casesForUS(state_short_name) {
    return CasesData;
}

function casesSummary(mycases) {
    const newcases = mycases.reduce((m, c) => {
        let a = m[c.confirmed_date];
        if (!a) a = 0;
        a += c.people_count;
        m[c.confirmed_date] = a;
        return m;
    }, {});
    let total = Object.values(newcases).reduce((a, b) => a + b, 0);
    const today = moment().format("M/D");
    var newcasenum = newcases[today];
    if (!newcasenum) {
        newcasenum = 0;
    }
    return {
        confirmed: total,
        newcases: newcasenum,
        newpercent: ((newcasenum / (total - newcasenum)) * 100).toFixed(0),
    }
}

export {
    countyModuleInit,
    lookupCountyInfo,
    nearbyCounties,
    casesForCounty,
    casesForState,
    casesForUS,
    casesSummary,
    casesForCountySummary,
    casesForStateSummary,
    hospitalsForState,
    countyDataForState,
    getCountySummary,
    getAllStatesSummary,
}