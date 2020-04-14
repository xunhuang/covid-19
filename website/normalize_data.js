

const moment = require("moment");
const CountyList = require("./public/data/county_gps.json");
const ConfirmedData = require("./src/data/covid_confirmed_usafacts.json");
const DeathData = require("./src/data/covid_death_usafacts.json");
const { linearRegression } = require('simple-statistics');
const ShelterInPlace = require("../data/shelter-in-place/shelter.json");
const USRecovery = require("./src/data/us_recovery.json");
const CountyInfo = require('covidmodule').CountyInfo;

const states = require('us-state-codes');
const fs = require('fs');
function pad(n) { return n < 10 ? '0' + n : n }
let AllData = {};

const MetroInfo = require("./src/data/metrolist.json");
const metrokeys = MetroInfo.reduce((m, a) => {
    m[a.UrlName] = 1;
    return m;
}, {});

let extraMetro = {};
for (let key in metrokeys) {
    let entries = MetroInfo.filter(s => s.UrlName === key);
    let newMetro = {};
    newMetro.Counties = entries.map(s => {
        let countyfips = CountyInfo.getFipsFromStateCountyName(s.State, s.County);
        if (!countyfips) {
            console.log("Can't find metro county for " + s.State + " " + s.County);
        }
        return countyfips
    });
    newMetro.Name = entries[0].Friendly;
    newMetro.StateName = entries[0].State;
    newMetro.StateFIPS = CountyInfo.getFipsFromStateShortName(entries[0].State);
    extraMetro[key] = newMetro;
}

console.log(extraMetro)
process.exit(0);

/**
 * Initialize State Nodes
 */
const AllStateFips = CountyInfo.getAllStateFips();
AllStateFips.map(statefips => AllData[statefips] = {})

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

const TableLookup = (() => {
    return CountyList.reduce((m, c) => {
        let key = fixCountyFip(c.FIPS);
        m[key] = c;
        return m;
    }, {});
})();

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

    if (!state_fips || !state_name) {
        console.log("creating to create null state and fips ---------");
        return null;
    }

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

function process_USAFACTS() {

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
}

function processJHUDataPoint(c, date) {
    let b = c.attributes;
    let county_fips = b.FIPS;
    let state_fips = CountyInfo.getFipsFromStateName(b.Province_State);
    if (county_fips === null && b.Admin2 === "Harris" && b.Province_State === "Texas") {
        county_fips = "48201";
    } else if (county_fips === null) {
        county_fips = "0";
    } else {
        if (county_fips.slice(0, 2) === "90") {
            county_fips = "0"; // until we find a better solution, JHU data change at 4/2
        }
    }
    let county = getCountyNode(state_fips, county_fips);
    if (!county) {
        county = createCountyObject(
            state_fips,
            states.getStateCodeByStateName(b.Province_State),
            county_fips,
            b.Admin2,
        )
        if (!county) {
            console.log("bad JHU data point");
            console.log(b);
            return;
        }
    }

    let datekey = date;
    county.Confirmed[datekey] = b.Confirmed;
    county.Death[datekey] = b.Deaths;
}

function processJHU(dataset, date) {
    let data = dataset.features;
    for (let i = 0; i < data.length; i++) {
        let datapoint = data[i];
        processJHUDataPoint(datapoint, date);
    }
}

const today = moment().format("MM/DD/YYYY");


// back fill holes in the data

function fillarrayholes(v, increaseonly = true) {
    let keys = Object.keys(v).sort((a, b) => moment(a, "MM/DD/YYYY").toDate() - moment(b, "MM/DD/YYYY").toDate());
    let key = keys[0];
    while (key !== today) {
        let lastvalue = v[key];
        let nextkey = moment(key, "MM/DD/YYYY").add(1, "days").format("MM/DD/YYYY");
        let nextvalue = v[nextkey];
        if (nextvalue === null || nextvalue === undefined) {
            v[nextkey] = lastvalue;
        } else {
            if (increaseonly) {
                if (nextvalue < lastvalue) {
                    v[nextkey] = lastvalue;
                }
            } else {
                // console.log("notincreasing  ");
            }
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
            county.Confirmed = fillarrayholes(county.Confirmed, c !== "0");
            county.Death = fillarrayholes(county.Death);
            setCountyNode(s, c, county);
        }
    }
}



function getValueFromLastDate(v, comment) {
    if (!v || Object.keys(v).length === 0) {
        return { num: 0, newnum: 0 }
    }
    if (Object.keys(v).length === 1) {
        let ret = {
            num: Object.values(v)[0],
            newnum: Object.values(v)[0],
        }
        return ret;
    }
    let nv = Object.keys(v).sort((a, b) => moment(b, "MM/DD/YYYY").toDate() - moment(a, "MM/DD/YYYY").toDate());

    let last = v[nv[0]]
    let newnum = v[nv[0]] - v[nv[1]];
    if (newnum < 0) {
        newnum = 0;
    }
    return { num: last, newnum: newnum };
}

function mergeTwoMapValues(m1, m2) {
    for (let i in m2) {
        let a = m1[i];
        a = a ? a : 0;
        a += m2[i];
        m1[i] = a;
    }
}

function summarize_one_county(county) {
    county.LastConfirmed = 0;
    county.LastDeath = 0;

    const CC = getValueFromLastDate(county.Confirmed, county.CountyName + " " + county.StateName);
    const DD = getValueFromLastDate(county.Death);

    county.LastConfirmed = CC.num;
    county.LastConfirmedNew = CC.newnum;
    county.LastDeath = DD.num;
    county.LastDeathNew = DD.newnum;
    county.DaysToDouble = getDoubleDays(county.Confirmed);
    county.DaysToDoubleDeath = getDoubleDays(county.Death);
    return county;
}

function summarize_counties() {
    for (s in AllData) {
        state = AllData[s];
        for (c in state) {
            county = state[c];
            county = summarize_one_county(county);
            setCountyNode(s, c, county);
        }
    }
}

// summarize data for states

function summarize_states() {

    for (s in AllData) {
        state = AllData[s];
        // need to 
        Confirmed = {};
        Death = {};
        for (c in state) {
            county = state[c];
            mergeTwoMapValues(Confirmed, county.Confirmed)
            mergeTwoMapValues(Death, county.Death)

        }
        let Summary = {};
        Summary.Confirmed = Confirmed;
        Summary.Death = Death;

        const CC = getValueFromLastDate(Confirmed, s);
        const DD = getValueFromLastDate(Death);

        Summary.LastConfirmed = CC.num;
        Summary.LastConfirmedNew = CC.newnum;
        Summary.LastDeath = DD.num;
        Summary.LastDeathNew = DD.newnum;
        Summary.DaysToDouble = getDoubleDays(Confirmed);
        Summary.DaysToDoubleDeath = getDoubleDays(Death);

        state.Summary = Summary;
    }
}


function summarize_USA() {
    // summarize data for US
    USConfirmed = {};
    USDeath = {};

    for (s in AllData) {
        state = AllData[s];
        mergeTwoMapValues(USConfirmed, state.Summary.Confirmed)
        mergeTwoMapValues(USDeath, state.Summary.Death)
    }

    let Summary = {};
    Summary.Confirmed = USConfirmed;
    Summary.Death = USDeath;

    const CC = getValueFromLastDate(USConfirmed, "country ");
    const DD = getValueFromLastDate(USDeath);

    Summary.LastConfirmed = CC.num;
    Summary.LastConfirmedNew = CC.newnum;
    Summary.LastDeath = DD.num;
    Summary.LastDeathNew = DD.newnum;
    Summary.generated = moment().format();
    Summary.DaysToDouble = getDoubleDays(USConfirmed);
    Summary.DaysToDoubleDeath = getDoubleDays(USDeath);

    AllData.Summary = Summary;
}

function processsShelterInPlace() {
    ShelterInPlace.map(p => {
        let fips = p.CountyFIPS;

        if (fips.length === 2) {
            // state
            //
            if (CountyInfo.getStateNameFromFips(fips) === p.CountyName) {
            } else {
                console.log(`**************** Mismatch ${p.CountyName} `);
            }
            let state = AllData[fips];
            if (state) {
                state.Summary.StayHomeOrder = {
                    Url: p.Url,
                    StartDate: p.StartDate,
                }
            }

        } else {
            // -- county
            let county = TableLookup[p.CountyFIPS];
            if (county) {
                let state = AllData[fips.slice(0, 2)];
                if (state) {
                    let c = state[fips];
                    if (c) {
                        c.StayHomeOrder = {
                            Url: p.Url,
                            StartDate: p.StartDate,
                        }
                    }
                }
                /*
                if (county.County === p.CountyName) {
                    console.log("------------------- good");
                } else {
                    console.log(`**************** Mismatch ${p.CountyName} ${county.County}`);
                }
                */

            } else {
                console.log("!!!!!!!!!!!!! FIPs not found " + p.CountyFIPS);
            }
        }
    });
}


function getCountyByFips(fips) {
    return AllData[fips.slice(0, 2)][fips];

}
function addMetros() {
    let Metros = {
        ...extraMetro,
        BayArea: {
            Name: "Bay Area",
            StateFIPS: "06",
            StateName: "CA",
            HospitalBeds: 16408,
            Hospitals: 69,
            Counties: [
                "06001",
                "06075",
                "06081",
                "06085",
                "06013",
                "06041",
            ]
        },
        NYC: {
            Name: "New York City",
            StateFIPS: "36",
            StateName: "NY",
            HospitalBeds: 23639,
            Hospitals: 58,
            Counties: [
                "36061",
                "36047",
                "36081",
                "36005",
                "36085",
            ]
        },
    }

    for (m in Metros) {
        let metro = Metros[m];
        Confirmed = {};
        Death = {};

        let Summary = {};

        if (m !== "NYC") {
            let Hospitals = 0;
            let HospitalBeds = 0;

            for (let i = 0; i < metro.Counties.length; i++) {
                let countyfips = metro.Counties[i];
                let county = getCountyByFips(countyfips);
                let county_info = TableLookup[countyfips];
                Hospitals += county_info.Hospitals;
                HospitalBeds += county_info.HospitalBeds;

                if (county) {
                    mergeTwoMapValues(Confirmed, county.Confirmed)
                    mergeTwoMapValues(Death, county.Death)
                }

            }
            Summary.Confirmed = Confirmed;
            Summary.Death = Death;

            const CC = getValueFromLastDate(Confirmed);
            const DD = getValueFromLastDate(Death);

            Summary.LastConfirmed = CC.num;
            Summary.LastConfirmedNew = CC.newnum;
            Summary.LastDeath = DD.num;
            Summary.LastDeathNew = DD.newnum;

            metro.Hospitals = Hospitals;
            metro.HospitalBeds = HospitalBeds;
        }
        metro.Summary = Summary;
    }
    AllData.Metros = Metros;
}

function fixdate(k) {
    let p = k.split("/");
    if (p.length != 3) {
        return null;
    }
    let m = pad(parseInt(p[0]));
    let d = pad(parseInt(p[1]));
    let y = p[2];
    if (y.length === 2) {
        y = "20" + y;
    }
    return `${m}/${d}/${y}`;
}

function addUSRecovery() {

    let Recovered = {};
    for (i in USRecovery) {
        if (i === "Province/State" || i === 'Country/Region' || i === 'Lat' || i === 'Long') {
            continue;
        }
        let k = fixdate(i);
        Recovered[k] = parseInt(USRecovery[i]);
    }

    // AllData.Summary.Recovered = Recovered;
    AllData.Summary.Recovered = fillarrayholes(Recovered);
    const RR = getValueFromLastDate(Recovered, s);
    AllData.Summary.LastRecovered = RR.num;
    AllData.Summary.LastRecoveredNew = RR.newnum;
}

const log2 = (a) => Math.log(a) / Math.log(2);

function getDoubleDays(data, fips) {
    let keys = Object.keys(data).sort((a, b) => moment(a, "MM/DD/YYYY").toDate() - moment(b, "MM/DD/YYYY").toDate());
    if (keys.length < 8) {
        return null;
    }
    const key7days = keys.slice(-8, -1);
    const firstday = moment(key7days[0], "MM/DD/YYYY");

    const prepared_data = key7days.map(k => {
        let delta = moment(k, "MM/DD/YYYY").diff(firstday, "days");
        return [delta, log2(data[k])];
    })
    if (prepared_data[0][1] <= log2(10)) { // number too small tomake predictions
        return null;
    }
    const { m, b } = linearRegression(prepared_data);
    return 1 / m;
}

function processAllJHU() {

    for (let d = moment("03/25/2020", "MM/DD/YYYY"); d.isBefore(moment()); d = d.add(1, "days")) {
        let file = `../data/archive/JHU-${d.format("MM-DD-YYYY")}.json`;
        let contents = fs.readFileSync(file);
        let data = JSON.parse(contents);

        console.log("processing JHU " + d.format("MM/DD/YYYY"));
        processJHU(data, d.format("MM/DD/YYYY"));
    }
}

function processBNO(dataset, date) {
    let data = dataset;
    for (let i = 0; i < data.length; i++) {
        let datapoint = data[i];
        let state_name = datapoint["UNITED STATES"];
        let state_fips = CountyInfo.getFipsFromStateName(state_name);
        if (!state_fips) {
            console.log("can't find state fips for " + state_name);
            continue;
        }

        if (AllData[state_fips]) {

            let Recovered = AllData[state_fips].Summary.Recovered;
            if (!Recovered) {
                Recovered = {};
            }
            let recovery_number = parseInt(datapoint.Recovered.replace(/,/g, ""));
            if (recovery_number !== null && !isNaN(recovery_number)) {
                Recovered[date] = recovery_number;
            }
            AllData[state_fips].Summary.Recovered = Recovered;
            const RR = getValueFromLastDate(Recovered, "debug");
            AllData[state_fips].Summary.LastRecovered = RR.num;
            AllData[state_fips].Summary.LastRecoveredNew = RR.newnum;
        } else {
            console.log("FIXME: no state node for " + state_name);
        }
    }
}

function addStateRecovery() {
    for (let d = moment("04/02/2020", "MM/DD/YYYY"); d.isBefore(moment()); d = d.add(1, "days")) {
        let file = `../data/archive/BNO-${d.format("MM-DD-YYYY")}.json`;
        let contents = fs.readFileSync(file);
        let data = JSON.parse(contents);
        console.log("Processing BNO " + d.format("MM/DD/YYYY"));
        processBNO(data, d.format("MM/DD/YYYY"));
    }
}

process_USAFACTS();
processAllJHU();

fillholes();

summarize_counties();
summarize_states();

//
// add territories here because these are states without counties. 
// 

const USTR_Confirmed = require("../data/archive/US-territories-confirmed.json");
const USTR_Death = require("../data/archive/US-territories-death.json");
function addTerrtories() {
    console.log("Add confirm for territories")
    USTR_Confirmed.map(tr => {
        let fips = tr.FIPS;
        let newdata = {}
        for (i in tr) {
            if (i === "Name" || i === "FIPS") {
                // delete boro[i];
            } else {
                if (tr[i] !== "" && tr[i] !== "0") {
                    newdata[i] = parseInt(tr[i]);
                }
            }
        }
        let Summary = {};
        console.log(newdata);
        if (Object.keys(newdata).length > 0) {
            Summary.Confirmed = fillarrayholes(newdata);
            console.log("done filling holes");
            AllData[fips].Summary = Summary;
        }
    });

    console.log("Add death for territories")

    USTR_Death.map(tr => {
        let fips = tr.FIPS;
        let newdata = {}
        for (i in tr) {
            if (i === "Name" || i === "FIPS") {
                // delete boro[i];
            } else {
                if (tr[i] !== "" && tr[i] !== "0") {
                    newdata[i] = parseInt(tr[i]);
                }
            }
        }
        let Summary = AllData[fips].Summary;
        if (Object.keys(newdata).length > 0) {
            Summary.Death = fillarrayholes(newdata);

            const CC = getValueFromLastDate(Summary.Confirmed);
            const DD = getValueFromLastDate(Summary.Death);

            Summary.LastConfirmed = CC.num;
            Summary.LastConfirmedNew = CC.newnum;
            Summary.LastDeath = DD.num;
            Summary.LastDeathNew = DD.newnum;
            Summary.DaysToDouble = getDoubleDays(Confirmed);
            Summary.DaysToDoubleDeath = getDoubleDays(Death);
            AllData[fips].Summary = Summary;
        }
    });
    console.log("done with US territories")
}

addTerrtories();

summarize_USA();
addMetros();

// special_processing
const NYC_STARTER = require("../data/archive/NYC-BOROS-04-03-2020.json")

let NYC_METRO = AllData["36"]["36061"];
AllData["36"]["36061"] = null;

NYC_run1 = JSON.parse(JSON.stringify(NYC_STARTER));
NYC_run1.map(entry => {
    let state_fips = "36";
    let county_fips = entry.FIPS;
    let county_info = getCountyNode(state_fips, county_fips);
    if (!county_info) {
        county_info = createCountyObject(
            state_fips,
            states.getStateCodeByStateName("New York"),
            county_fips,
            entry.Name,
        )
    }

    if (entry.FIPS.length !== 5) {
        return null;
    }
    delete entry["Name"];
    delete entry["FIPS"];

    let Confirmed = {};
    for (i in entry) {
        Confirmed[i] = parseInt(entry[i]);
    }

    county_info.Confirmed = Confirmed;
    county_info.Death = {};

    let county = summarize_one_county(county_info);

    AllData[state_fips][county_fips] = county;
});

AllData.Metros.NYC.Summary = NYC_METRO;

function processNYCBOROS_NEW() {

    for (let d = moment("04/03/2020", "MM/DD/YYYY"); d.isBefore(moment()); d = d.add(1, "days")) {
        let file = `../data/archive/NYC-BOROUGHS-${d.format("MM-DD-YYYY")}.json`;
        console.log("processing NYC " + file);
        let contents = fs.readFileSync(file);
        let data = JSON.parse(contents);
        data.map(line => {
            if (line.BOROUGH_GROUP === "COVID_CASE_COUNT") {
                let dd = d.format("MM/DD/YYYY");
                AllData["36"]["36061"].Confirmed[dd] = parseInt(line.MANHATTAN);
                AllData["36"]["36047"].Confirmed[dd] = parseInt(line.BROOKLYN);
                AllData["36"]["36081"].Confirmed[dd] = parseInt(line.QUEENS);
                AllData["36"]["36005"].Confirmed[dd] = parseInt(line.BRONX);
                AllData["36"]["36085"].Confirmed[dd] = parseInt(line["STATEN ISLAND"]);

                if (!AllData["36"]["36061"].Confirmed[dd]) {
                    AllData["36"]["36061"].Confirmed[dd] = parseInt(line.Manhattan);
                }
                if (!AllData["36"]["36047"].Confirmed[dd]) {
                    AllData["36"]["36047"].Confirmed[dd] = parseInt(line.Brooklyn);
                }

                if (!AllData["36"]["36081"].Confirmed[dd]) {
                    AllData["36"]["36081"].Confirmed[dd] = parseInt(line.Queens);
                }

                if (!AllData["36"]["36005"].Confirmed[dd]) {
                    AllData["36"]["36005"].Confirmed[dd] = parseInt(line["The Bronx"]);
                }
                if (!AllData["36"]["36085"].Confirmed[dd]) {
                    AllData["36"]["36085"].Confirmed[dd] = parseInt(line["Staten Island"]);
                }
            }
        });
    }

    AllData["36"]["36061"].Confirmed = fillarrayholes(AllData["36"]["36061"].Confirmed);
    AllData["36"]["36047"].Confirmed = fillarrayholes(AllData["36"]["36047"].Confirmed);
    AllData["36"]["36081"].Confirmed = fillarrayholes(AllData["36"]["36081"].Confirmed);
    AllData["36"]["36005"].Confirmed = fillarrayholes(AllData["36"]["36005"].Confirmed);
    AllData["36"]["36085"].Confirmed = fillarrayholes(AllData["36"]["36085"].Confirmed);
}

processNYCBOROS_NEW();


console.log("Processing NYC Death");

const NYC_DEATH = require("../data/archive/NYC-Deaths.json");
NYC_DEATH.map(boro => {
    let fips = boro.FIPS;
    let newdata = {}
    for (i in boro) {
        if (i === "Name" || i === "FIPS") {
            // delete boro[i];
        } else {
            if (boro[i] !== "" && boro[i] !== "0") {
                newdata[i] = parseInt(boro[i]);
            }
        }
    }
    AllData["36"][fips].Death = fillarrayholes(newdata);
});

console.log("Processing done NYC Death");

// fillholes();

NYC_STARTER.map(entry => {
    let state_fips = "36";
    let county_fips = entry.FIPS;
    let county_info = getCountyNode(state_fips, county_fips);
    if (county_info) {
        let county = summarize_one_county(county_info);
        AllData[state_fips][county_fips] = county;
    } else {

        console.log("Unknown line in NYC");
        console.log(entry);

    }
});

console.log("Summarizing NYC ");

processsShelterInPlace();
addUSRecovery();
addStateRecovery();

const contentCrushed = JSON.stringify(AllData, null, 0);
fs.writeFileSync("./public/data/AllData.min.json", contentCrushed);
const contentPretty = JSON.stringify(AllData, null, 2);
fs.writeFileSync("./public/data/AllData.json", contentPretty);
fs.writeFileSync("./src/data/AllData.json", contentPretty);
