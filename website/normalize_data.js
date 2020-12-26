const csv = require('csvtojson')
const moment = require("moment");
const states = require('us-state-codes');
const fs = require('fs');
const CountyList = require("./src/data/county_gps_original.json");
const NYC_STARTER = require("../data/archive/NYC-BOROS-04-03-2020.json")
const ConfirmedData = require("./src/data/covid_confirmed_usafacts.json");
const DeathData = require("./src/data/covid_death_usafacts.json");
const { linearRegression } = require('simple-statistics');
const ShelterInPlace = require("../data/shelter-in-place/shelter.json");
const USRecovery = require("./src/data/us_recovery.json");
const CountyInfo = require('covidmodule').CountyInfo;
const Util = require('covidmodule').Util;

const DFHCounty = require("./src/data/DFH-County.json");
const DFHState = require("./src/data/DFH-State.json");
const DFHUSA = require("./src/data/DFH-USA.json");

const TestingStates = require("./public/data/state_testing.json");
const TestingUSA = require("./public/data/us_testing.json");

const CACountyStatus = require("./src/data/CA_county_status.json");

let AllData = {};
function pad(n) { return n < 10 ? '0' + n : n }

/**
 * Initialize State Nodes
 */

const AllStateFips = CountyInfo.getAllStateFips().concat(
  ["88", "99", "97", "96"]
);
for (let statefips of AllStateFips) {
  AllData[statefips] = {
    Summary: {
      StateFIPS: statefips,
      Confirmed: {},
      Death: {},
    },
  };
}

AllData.Summary = {};

// --------------------------------------------------------------
// ---- function area
// --------------------------------------------------------------

function getStateNode(state_fips) {
  // console.log("getStateNote " + state_fips);
  if (!AllData[state_fips]) {
    return { Summary: {} };
  }
  return AllData[state_fips];
}

function getCountyNode(state_fips, county_fips) {
  let state = getStateNode(state_fips);
  if (!state) {
    throw ("should never happy");
    // state = getStateNode(state_fips);
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
    if (county_name !== "Statewide Unallocated" && county_name !== "Unassigned") {
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
    console.log(`creating to create null state and fips (${state_fips}, ${state_name})`);
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
  // add beds data for county

  let hospinfo = DFHCounty[county_fips];
  if (hospinfo) {
    countyObject.beds = hospinfo.NUM_LICENSED_BEDS;
    countyObject.bedsICU = hospinfo.NUM_ICU_BEDS;
    countyObject.hospitals = hospinfo.NUM_HOSPITALS;
    countyObject.bedsAvail = Math.round(hospinfo.AVG_AVAIL_BEDS);
  }

  let county = TableLookup[county_fips];
  if (county) {
    countyObject.Population = parseInt(county.Population2010.replace(/,/g, ''));
  }

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

function process_USAFACTS() {

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

  const errataFipsMap = {
    "Dukes and Nantucket": "25007",
    "Kansas City": "29999", // maded up county, this is in Missori, not Kansas
    "Michigan Department of Corrections (MDOC)": "26997", // made up
    "Bear River": "49985", // made up
    "Central Utah": "49986", // made up
    "Southeast Utah": "49987", // made up
    "Southwest Utah": "49989", // made up
    "TriCounty": "49984", // made up
    "Weber-Morgan": "49057",
  }


  let b = c.attributes;
  let county_fips = b.FIPS;
  let state_fips = CountyInfo.getFipsFromStateName(b.Province_State);


  if (county_fips === null && b.Admin2 === "Harris" && b.Province_State === "Texas") {
    county_fips = "48201";
  } else if (b.Province_State === "US Military") {
    state_fips = "96";
    county_fips = ("" + b.UID).slice(3, 8);
  } else if (b.UID === 84070013 || b.UID == 84070012) { // prison
    if (AllData["97"].Summary.Confirmed[date]) {
      return;
    }
    AllData["97"].Summary.Confirmed[date] = b.Confirmed;
    AllData["97"].Summary.Death[date] = b.Death;
    return;
  } else if (errataFipsMap[b.Admin2]) {
    county_fips = errataFipsMap[b.Admin2];
    state_fips = county_fips.slice(0, 2);
  } else if (b.Province_State === "Northern Mariana Islands") {
    if (AllData["69"].Summary.Confirmed[date]) {
      return;
    }
    AllData["69"].Summary.Confirmed[date] = b.Confirmed;
    AllData["69"].Summary.Death[date] = b.Death;
    return;
  }
  else if (county_fips === null) {
    county_fips = "0";
  } else if (county_fips.slice(0, 2) === "90") {
    county_fips = "0"; // until we find a better solution, JHU data change at 4/2
  } else if (b.Province_State === "US Military") {
    state_fips = "96";
    county_fips = ("" + b.UID).slice(3, 8)
  }


  let county = getCountyNode(state_fips, county_fips);
  if (!county) {
    let statescode = states.getStateCodeByStateName(b.Province_State);
    if (b.Province_State === "US Military") {
      statescode = "AY";
    }

    county = createCountyObject(
      state_fips,
      statescode,
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
  // if data already exist (perhaps from github), don't override it.
  if (county.Confirmed[datekey]) {
    return;
  }

  county.Confirmed[datekey] = b.Confirmed;
  county.Death[datekey] = b.Deaths;

  if (county_fips === "0") {
    county.Confirmed[datekey] = 0;
    county.Death[datekey] = 0;
  }
}

function processJHU(dataset, date) {
  let data = dataset.features;
  for (let i = 0; i < data.length; i++) {
    let datapoint = data[i];
    processJHUDataPoint(datapoint, date);
  }
}

// back fill holes in the data
function fillarrayholes(v, increaseonly = true) {
  const today = moment().format("MM/DD/YYYY");
  let keys = Object.keys(v).sort((a, b) => moment(a, "MM/DD/YYYY").toDate() - moment(b, "MM/DD/YYYY").toDate());
  if (keys.length === 0) {
    return v;
  }
  let key = keys[0];
  while (key !== today) {
    let lastvalue = v[key];
    let nextkey = moment(key, "MM/DD/YYYY").add(1, "days").format("MM/DD/YYYY");
    let nextvalue = v[nextkey];
    if (nextvalue === null || nextvalue === undefined) {
      v[nextkey] = lastvalue;
    } else {
      /*
      if (increaseonly) {
        if (nextvalue < lastvalue) {
          v[nextkey] = lastvalue;
        }
      } else {
        // console.log("notincreasing  ");
      }
      */
    }
    key = nextkey;
  }
  return v;
}



function fillholes() {
  const deprecated_counties = {
    "49001": true,
    "49003": true,
    "49005": true,
    "49007": true,
    "49009": true,
    "49013": true,
    "49015": true,
    "49017": true,
    "49019": true,
    "49021": true,
    "49023": true,
    "49025": true,
    "49027": true,
    "49029": true,
    "49031": true,
    "49033": true,
    "49039": true,
    "49041": true,
    "49047": true,
    "49053": true,
    "49055": true,
  };
  for (s in AllData) {
    state = AllData[s];
    for (c in state) {
      let county = state[c];
      if (c.length === 5 && c !== "0" && !deprecated_counties[c]) {
        county.Confirmed = fillarrayholes(county.Confirmed, c !== "0");
        county.Death = fillarrayholes(county.Death, c !== "0");
        setCountyNode(s, c, county);
      }
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
    if (isNaN(a)) {
      a = 0;
    }
    if (!isNaN(m2[i])) {
      a += m2[i];
    }
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


  const today = moment();
  const dayminus1 = today.subtract(1, "days").format("MM/DD/YYYY");
  const dayminus15 = today.subtract(15, "days").format("MM/DD/YYYY");
  let n1 = county.Confirmed[dayminus1];
  let n15 = county.Confirmed[dayminus15];
  if (!isNaN(n1) && !isNaN(n15)) {
    county.Last2WeeksConfirmedDelta = n1 - n15;
  } else {
    county.Last2WeeksConfirmedDelta = n1;
  }

  let hospinfo = DFHCounty[county.CountyFIPS];
  if (hospinfo) {
    county.beds = hospinfo.NUM_LICENSED_BEDS;
    county.bedsICU = hospinfo.NUM_ICU_BEDS;
    county.hospitals = hospinfo.NUM_HOSPITALS;
    county.bedsAvail = Math.round(hospinfo.AVG_AVAIL_BEDS);
  }

  return county;
}

function summarize_counties() {
  for (s in AllData) {
    state = AllData[s];
    for (c in state) {
      county = state[c];
      if (c !== "Summary") {
        county = summarize_one_county(county);
        setCountyNode(s, c, county);
      }
    }
  }
}

// summarize data for states

function summarize_states() {

  for (s in AllData) {
    state = AllData[s];
    Confirmed = {};
    Death = {};
    for (c in state) {
      county = state[c];
      mergeTwoMapValues(Confirmed, county.Confirmed)
      mergeTwoMapValues(Death, county.Death)
    }

    if (s !== "undefined") {
      Confirmed = fillarrayholes(Confirmed, true);
      Death = fillarrayholes(Death, true);
    }

    let Summary = state.Summary ? state.Summary : {};
    Summary.StateFIPS = s;
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

    const today = moment();
    const dayminus1 = today.subtract(1, "days").format("MM/DD/YYYY");
    const dayminus15 = today.subtract(15, "days").format("MM/DD/YYYY");
    let n1 = Confirmed[dayminus1];
    let n15 = Confirmed[dayminus15];
    if (!isNaN(n1) && !isNaN(n15)) {
      Summary.Last2WeeksConfirmedDelta = n1 - n15;
    } else {
      Summary.Last2WeeksConfirmedDelta = n1;
    }

    let hospinfo = DFHState[s];
    if (hospinfo) {
      Summary.beds = hospinfo.NUM_LICENSED_BEDS;
      Summary.bedsICU = hospinfo.NUM_ICU_BEDS;
      Summary.hospitals = hospinfo.NUM_HOSPITALS;
      Summary.bedsAvail = Math.round(hospinfo.AVG_AVAIL_BEDS);
    }

    state.Summary = Summary;
  }
}


function summarize_USA() {

  // summarize data for US
  let USConfirmed = {};
  let USDeath = {};

  for (s in AllData) {
    state = AllData[s];
    mergeTwoMapValues(USConfirmed, state.Summary.Confirmed)
    mergeTwoMapValues(USDeath, state.Summary.Death)
  }

  let Summary = AllData.Summary;
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

  let hospinfo = DFHUSA;
  if (hospinfo) {
    Summary.beds = hospinfo.NUM_LICENSED_BEDS;
    Summary.bedsICU = hospinfo.NUM_ICU_BEDS;
    Summary.hospitals = hospinfo.NUM_HOSPITALS;
    Summary.bedsAvail = Math.round(hospinfo.AVG_AVAIL_BEDS);
  }

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
          StartUrl: p.Url,
          StartDate: p.StartDate,
          EndDate: (!p.EndDate || p.EndDate.startsWith("t")) ? null : p.EndDate,
          EndUrl: p.EndURL,
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
              StartUrl: p.Url,
              StartDate: p.StartDate,
              EndDate: (!p.EndDate || p.EndDate.startsWith("t")) ? null : p.EndDate,
              EndUrl: p.EndURL,
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

  let Metros = {
    ...extraMetro,
    BayArea: {
      Name: "Bay Area",
      StateFIPS: "06",
      StateName: "CA",
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

    for (let i = 0; i < metro.Counties.length; i++) {
      let countyfips = metro.Counties[i];
      let county = getCountyByFips(countyfips);
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


    let beds = 0;
    let bedsICU = 0;
    let hospitals = 0;
    let bedsAvail = 0;

    for (let i = 0; i < metro.Counties.length; i++) {
      let countyfips = metro.Counties[i];
      let hospinfo = DFHCounty[countyfips];


      if (hospinfo) {
        beds += hospinfo.NUM_LICENSED_BEDS;
        bedsICU += hospinfo.NUM_ICU_BEDS;
        hospitals += hospinfo.NUM_HOSPITALS;
        bedsAvail += Math.round(hospinfo.AVG_AVAIL_BEDS);
      }

    }

    Summary.beds = beds;
    Summary.bedsICU = bedsICU;
    Summary.hospitals = hospitals;
    Summary.bedsAvail = bedsAvail;


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
    if (fs.existsSync(file)) {
      let contents = fs.readFileSync(file);
      let data = JSON.parse(contents);
      console.log("processing JHU " + d.format("MM/DD/YYYY"));
      processJHU(data, d.format("MM/DD/YYYY"));
    } else {
      console.log(`data file ${file} is missing`)
    }
  }
}

async function processAllJHUGithub() {
  const csvConfirmed = "../COVID-19/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_US.csv"
  const csvDeath = "../COVID-19/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_deaths_US.csv"
  const csv = require('csvtojson')
  const json = await csv().fromFile(csvConfirmed);
  processAllJHUGithubInner(json, "Confirmed");
  const jsonDeath = await csv().fromFile(csvDeath);
  processAllJHUGithubInner(jsonDeath, "Death");
}

async function processAllJHUGithubInner(json, mytype) {

  const errataFipsMap = {
    "Dukes and Nantucket": "25007",
    "Kansas City": "29999",// maded up county, this is in Missori, not Kansas
    "Michigan Department of Corrections (MDOC)": "26997", // made up
    "Federal Correctional Institution (FCI)": "97", // made up
    "Bear River": "49985", // made up
    "Central Utah": "49986", // made up
    "Southeast Utah": "49987", // made up
    "Southwest Utah": "49989", // made up
    "TriCounty": "49984", // made up
    "Weber-Morgan": "49057",
  }

  for (let entry of json) {
    let fips = entry.FIPS;
    if (!fips || fips.length === 0) {
      fips = errataFipsMap[entry.Admin2];
      if (!fips) {
        console.log("Don't know what to do with " + entry.Admin2)
        continue;
      }
    } else {
      fips = fips.split(".")[0];
      if (fips.length === 4) {
        fips = "0" + fips;
      }
    }

    let data = {};
    for (let key in entry) {
      if (!key.includes("/")) {
        continue;
      }
      data[Util.normalize_date(key)] = parseInt(entry[key]);
    }

    if (fips.length === 2) {
      // terortories
      AllData[fips].Summary[mytype] = data;
      continue;
    } else {
      let state_fips;
      let county_fips = fips;

      if (fips.startsWith("70")) {
        state_fips = 47;
      } else if (fips.startsWith("80")) {
        // OUT OF STATE
        state_fips = fips.slice(3, 5);
      } else if (fips.startsWith("90")) {
        // UNAssigned
        county_fips = "0";
        state_fips = fips.slice(3, 5);
        continue;
      } else if (fips.startsWith("99999")) {
        // grand princess, fake state
        AllData["99"].Summary[mytype] = data;
        continue;
      } else if (fips.startsWith("88888")) {
        // diamond princess, fake state
        AllData["88"].Summary[mytype] = data;
        continue;
      } else {
        // normal
        // regular counties
        state_fips = fips.slice(0, 2);
        // continue; // skipping for testing
      }
      let county = getCountyNode(state_fips, county_fips);
      if (!county) {
        county = createCountyObject(
          state_fips,
          states.getStateCodeByStateName(entry.Province_State),
          county_fips,
          entry.Admin2,
        )
        if (!county) {
          console.log("bad JHU data point");
          console.log(entry);
          return;
        }
      }
      county[mytype] = data;
    }
  }
}

function processBNO(dataset, date) {
  let data = dataset;
  for (let i = 0; i < data.length; i++) {
    let datapoint = data[i];
    let state_name = datapoint["UNITED STATES"];
    let state_fips = CountyInfo.getFipsFromStateName(state_name);
    if (!state_fips) {
      // console.log("can't find state fips for " + state_name);
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
    if (!fs.existsSync(file)) {
      continue;
    }
    let contents = fs.readFileSync(file);
    let data = JSON.parse(contents);
    console.log("Processing BNO " + d.format("MM/DD/YYYY"));
    processBNO(data, d.format("MM/DD/YYYY"));
  }
}

function extractTestData(entry) {


  let data = {};
  if (entry) {
    data.totalTests = entry.total;
    data.totalTestResults = entry.totalTestResults;
    data.totalTestPositive = entry.positive;
    data.totalRecovered = entry.recovered;
    data.hospitalized = entry.hospitalized ? entry.hospitalized :
      (entry.hospitalizedCurrently ? entry.hospitalizedCurrently : entry.hospitalizedCumulative);
    data.hospitalizedIncreased = entry.hospitalizedIncrease;
    data.inIcu = entry.inIcuCurrently ? entry.inIcuCurrently : entry.inIcuCumulative;
    data.onVentilator = entry.onVentilatorCurrently ? entry.onVentilatorCurrently : entry.onVentilatorCumulative;
  } else {
    data.totalTests = 0;
    data.totalTestResults = 0;
    data.totalTestPositive = 0;
    data.totalRecovered = 0;
    data.hospitalized = 0;
    data.hospitalizedIncreased = 0;
    data.inIcu = 0;
    data.onVentilator = 0;
  }
  return data;
}

function processTestData() {
  for (let statefips of AllStateFips) {
    let state_short = CountyInfo.getStateAbbreviationFromFips(statefips);
    let entry = TestingStates.filter(s => s.state === state_short).sort((a, b) => b.date - a.date)[0];
    let data = extractTestData(entry);
    AllData[statefips].Summary = {
      ...AllData[statefips].Summary,
      ...data,
    }
  }
  let entry = TestingUSA.sort((a, b) => b.date - a.date)[0];
  let data = extractTestData(entry);
  AllData.Summary = {
    ...AllData.Summary,
    ...data,
  }
}

function exportIntColumnFromDataSeries(data, column) {
  let ret = data.reduce((m, b) => {
    m[b.fulldate] = parseInt(b[column]);
    return m;
  }, {})
  return ret
}

async function addMITProjection() {

  function getDataFor(src, state) {
    let data = src.filter(s => s.Province === state && s.Country === "US");
    data = data.map(a => {
      a.fulldate = moment(a.Day, "YYYY-MM-DD").format("MM/DD/YYYY");
      return a;
    });
    return data;
  }

  const file = "../data/projections/MIT-06-18-2020.csv";
  const json = await csv().fromFile(file);
  for (s in AllData) {
    state = AllData[s];
    let Summary = state.Summary ? state.Summary : {};
    let statename = CountyInfo.getStateNameFromFips(s);

    let data = getDataFor(json, statename);
    if (data.length >= 0) {
      Summary.ProjectionMIT = {
        Confirmed: exportIntColumnFromDataSeries(data, 'Total Detected'),
        // Active: exportIntColumnFromDataSeries(data, 'Active'),
        // HospitaliedCurrently: exportIntColumnFromDataSeries(data, 'Active Hospitalized'),
        // HospitalizationCumulative: exportIntColumnFromDataSeries(data, 'Cumulative Hospitalized'),
        // Deaths: exportIntColumnFromDataSeries(data, 'Total Detected Deaths'),
        // ICUCurrently: exportIntColumnFromDataSeries(data, 'Active Ventilated'),
      };
    }
  }
  const data = getDataFor(json, "None");
  AllData.Summary.ProjectionMIT = {
    Confirmed: exportIntColumnFromDataSeries(data, 'Total Detected'),
  }
}

async function addCountyHospitalization() {
  const list = [
    "./countydata/CA-06/hospitals_by_county.final.json",
  ];

  for (let f of list) {
    let rawdata = fs.readFileSync(f);
    let data = JSON.parse(rawdata);
    for (let point of data) {
      // console.log(point);
      let county = getCountyNode(point.StateFIPS, point.CountyFIPS);
      if (county) {
        let hospitalization = county.hospitalization || [];
        hospitalization.push({
          fulldate: moment(point.date, "YYYY-MM-DD").format("MM/DD/YYYY"),
          hospitalized_covid_patients: point.hospitalized_covid_patients,
          icu_available_beds: point.icu_available_beds,
          icu_covid_patients: point.icu_covid_patients,
        });
        county.hospitalization = hospitalization;
      }
    }
  }
}

function addCACountyStatus() {
  CACountyStatus
  for (let countyLine of CACountyStatus) {
    let countyName = countyLine.county;
    let countyfips = CountyInfo.getFipsFromStateCountyName("CA", countyName);
    let county = getCountyNode("06", countyfips);
    if (county) {
      county.ca_county_status = countyLine["Overall Status"];
      setCountyNode("06", countyfips, county);
    }
  }
}


async function processVaccineData() {

  function fillvaccineholes(v, increaseonly = true) {
    const today = moment().format("MM/DD/YYYY");
    let keys = Object.keys(v).sort((a, b) => moment(a, "MM/DD/YYYY").toDate() - moment(b, "MM/DD/YYYY").toDate());
    if (keys.length === 0) {
      return v;
    }
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
        }
      }
      key = nextkey;
    }
    return v;
  }

  function properNumber(n) {
    if (n === '' || !n) {
      return 0;
    }
    return parseInt(n);
  }

  const vaccineDataCSV = '../vaccine-module/data_tables/vaccine_data/raw_data/vaccine_data_us_state_timeline.csv';
  const json = await csv().fromFile(vaccineDataCSV);

  for (let entry of json) {
    let state_fips = CountyInfo.getFipsFromStateShortName(entry.stabbr);
    let stateNode = getStateNode(state_fips);
    if (stateNode) {
      let Summary = stateNode.Summary;
      let doses_admin_total = Summary["doses_admin_total"] ? Summary["doses_admin_total"] : {};
      doses_admin_total[entry.date] = properNumber(entry.doses_admin_total);

      let doses_alloc_total = Summary["doses_alloc_total"] ? Summary["doses_alloc_total"] : {};
      doses_alloc_total[entry.date] = properNumber(entry.doses_alloc_total);

      let doses_shipped_total = Summary["doses_shipped_total"] ? Summary["doses_shipped_total"] : {};
      doses_shipped_total[entry.date] = properNumber(entry.doses_shipped_total);

      stateNode.Summary.doses_alloc_total = doses_alloc_total;
      stateNode.Summary.doses_admin_total = doses_admin_total;
      stateNode.Summary.doses_shipped_total = doses_shipped_total;

      AllData[state_fips] = stateNode;
    }
  }
  // now fix up vaccine data

  for (s in AllData) {
    state = AllData[s];
    if (state.Summary && state.Summary.doses_admin_total) {
      state.Summary.doses_alloc_total = fillvaccineholes(state.Summary.doses_alloc_total);
      state.Summary.doses_admin_total = fillvaccineholes(state.Summary.doses_admin_total);
      state.Summary.doses_shipped_total = fillvaccineholes(state.Summary.doses_shipped_total);

      state.Summary.doses_alloc_total_Last = getValueFromLastDate(state.Summary.doses_alloc_total).num;
      state.Summary.doses_admin_total_Last = getValueFromLastDate(state.Summary.doses_admin_total).num;
      state.Summary.doses_shippied_total_Last = getValueFromLastDate(state.Summary.doses_shipped_total).num;
      // console.log(state.Summary);
    }
  }
}

async function main() {
  process_USAFACTS(); // this sites tracks county level data before JHU
  await processAllJHUGithub();
  processAllJHU();
  await processVaccineData();
  addCACountyStatus();
  await addCountyHospitalization();
  fillholes();
  summarize_counties();
  summarize_states();
  summarize_USA();
  addMetros();
  processsShelterInPlace();
  addUSRecovery();
  addStateRecovery();
  processTestData();
  // await addMITProjection();
}

main().then(() => {
  const contentPretty = JSON.stringify(AllData, null, 2);
  // console.log(contentPretty);
  fs.writeFileSync("./src/data/AllData.json", contentPretty);
})