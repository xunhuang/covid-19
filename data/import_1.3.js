const firebase = require("firebase");
require("firebase/firestore");
const firebaseConfig = require('../website/src/firebaseConfig.json');
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const superagent = require('superagent');
const cheerio = require('cheerio');

const DataConfirmed = require('../website/src/data/time_series_19-covid-Confirmed.json');
const DataDeath = require('../website/src/data/time_series_19-covid-Deaths.json');
const DataRecovered = require('../website/src/data/time_series_19-covid-Recovered.json');

const states_info = require('./us_states.json');
let states = states_info.features;
let states_by_id = states.reduce(function (m, item) {
    m[item.properties.STATE] = item;
    return m;

}, {});

const state_shortname = [
    { "State": "Alabama", "shortname": "AL" },
    { "State": "Alaska", "shortname": "AK" },
    { "State": "American Samoa", "shortname": "AS" },
    { "State": "Arizona", "shortname": "AZ" },
    { "State": "Arkansas", "shortname": "AR" },
    { "State": "California", "shortname": "CA" },
    { "State": "Colorado", "shortname": "CO" },
    { "State": "Connecticut", "shortname": "CT" },
    { "State": "Delaware", "shortname": "DE" },
    { "State": "District of Columbia", "shortname": "DC" },
    { "State": "Florida", "shortname": "FL" },
    { "State": "Georgia", "shortname": "GA" },
    { "State": "Guam", "shortname": "GU" },
    { "State": "Hawaii", "shortname": "HI" },
    { "State": "Idaho", "shortname": "ID" },
    { "State": "Illinois", "shortname": "IL" },
    { "State": "Indiana", "shortname": "IN" },
    { "State": "Iowa", "shortname": "IA" },
    { "State": "Kansas", "shortname": "KS" },
    { "State": "Kentucky", "shortname": "KY" },
    { "State": "Louisiana", "shortname": "LA" },
    { "State": "Maine", "shortname": "ME" },
    { "State": "Maryland", "shortname": "MD" },
    { "State": "Marshall Islands", "shortname": "MH" },
    { "State": "Massachusetts", "shortname": "MA" },
    { "State": "Michigan", "shortname": "MI" },
    { "State": "Micronesia", "shortname": "FM" },
    { "State": "Minnesota", "shortname": "MN" },
    { "State": "Mississippi", "shortname": "MS" },
    { "State": "Missouri", "shortname": "MO" },
    { "State": "Montana", "shortname": "MT" },
    { "State": "Nebraska", "shortname": "NE" },
    { "State": "Nevada", "shortname": "NV" },
    { "State": "New Hampshire", "shortname": "NH" },
    { "State": "New Jersey", "shortname": "NJ" },
    { "State": "New Mexico", "shortname": "NM" },
    { "State": "New York", "shortname": "NY" },
    { "State": "North Carolina", "shortname": "NC" },
    { "State": "North Dakota", "shortname": "ND" },
    { "State": "Northern Marianas", "shortname": "MP" },
    { "State": "Ohio", "shortname": "OH" },
    { "State": "Oklahoma", "shortname": "OK" },
    { "State": "Oregon", "shortname": "OR" },
    { "State": "Palau", "shortname": "PW" },
    { "State": "Pennsylvania", "shortname": "PA" },
    { "State": "Puerto Rico", "shortname": "PR" },
    { "State": "Rhode Island", "shortname": "RI" },
    { "State": "South Carolina", "shortname": "SC" },
    { "State": "South Dakota", "shortname": "SD" },
    { "State": "Tennessee", "shortname": "TN" },
    { "State": "Texas", "shortname": "TX" },
    { "State": "Utah", "shortname": "UT" },
    { "State": "Vermont", "shortname": "VT" },
    { "State": "Virginia", "shortname": "VA" },
    { "State": "Virgin Islands", "shortname": "VI" },
    { "State": "Washington", "shortname": "WA" },
    { "State": "West Virginia", "shortname": "WV" },
    { "State": "Wisconsin", "shortname": "WI" },
    { "State": "Wyoming", "shortname": "WY" }
];

const state_shortname_map = state_shortname.reduce(function (map, s) {
    map[s.State] = s.shortname;
    return map;

}, {});

const counties_info = require('./us_counties.json');
let counties = counties_info.features;


function snapshotToArray(snapshot) {
    var returnArr = []
    snapshot.forEach(function (childSnapshot) {
        returnArr.push(childSnapshot.data());
    });
    return returnArr;
};


async function saveStateInDB(newState) {
    let docRef = db.collection("US_STATES").doc();
    newState.key = docRef.id;
    console.log(newState);
    await docRef.set(newState).then((doc) => {
        console.log(`done adding new state ${newState.NAME}`);
    }).catch(err => {
        console.log(err);
        return null;
    });
    return newState;
}

async function saveCountyInDB(county) {
    let docRef = db.collection("US_COUNTIES").doc();
    county.key = docRef.id;
    console.log(county);
    await docRef.set(county).then((doc) => {
        console.log(`done adding new county ${county.NAME}`);
    }).catch(err => {
        console.log(err);
        return null;
    });
    return county;
}

async function findCountyInDB(state_shortname, countyname) {
    var county = await db.collection("US_COUNTIES")
        .where("STATE_SHORT_NAME", "==", state_shortname)
        .where("NAME", "==", countyname)
        .get().then((querySnapshot) => {
            venues = snapshotToArray(querySnapshot);
            if (venues.length !== 1) {
                return null;
            }
            return venues[0];
        });
    return county;
}

async function countyGeoIDExistURLInDB(geoid) {
    var exist = await db.collection("US_COUNTIES")
        .where("GEO_ID", "==", geoid)
        .get().then((querySnapshot) => {
            venues = snapshotToArray(querySnapshot);
            return venues.length != 0;
        });
    if (exist) {
        return true;
    }
    return exist;
}
async function stateNamExistURLInDB(name) {
    var exist = await db.collection("US_STATES")
        .where("NAME", "==", name)
        .get().then((querySnapshot) => {
            venues = snapshotToArray(querySnapshot);
            return venues.length != 0;
        });
    if (exist) {
        return true;
    }
    return exist;
}

async function doStatesImport() {
    for (let i = 0; i < states.length; i++) {
        let state = states[i];
        let s_info = state.properties;
        s_info["geometry"] = JSON.stringify(state.geometry.coordinates);
        let short_name = state_shortname_map[s_info.NAME];
        s_info["SHORT_NAME"] = short_name;
        if (! await stateNamExistURLInDB(s_info.NAME)) {
            console.log("adding " + s_info.NAME);
            await saveStateInDB(s_info);
        } else {
            console.log("skipping  " + s_info.NAME);
        }
    }
}

async function doCountiesImport() {
    for (let i = 0; i < counties.length; i++) {
        let county = counties[i];
        let info = county.properties;
        info["geometry"] = JSON.stringify(county.geometry.coordinates);

        let state = states_by_id[info.STATE];
        let state_name = state.properties.NAME;
        let short_name = state_shortname_map[state_name];

        info["STATE_NAME"] = state_name;
        info["STATE_SHORT_NAME"] = short_name;

        if (! await countyGeoIDExistURLInDB(info.GEO_ID)) {
            console.log("adding " + info.NAME);
            await saveCountyInDB(info);
        } else {
            console.log("skipping  " + info.NAME);
        }
    }
}

async function updateCountyInfoInDB(key, info) {
    let docRef = db.collection("US_COUNTIES").doc(key);
    info.hasData = true;
    await docRef.update(info).then((doc) => {
        console.log(`done updating ${key}`);
    }).catch(err => {
        console.log(err);
        return null;
    });
}

/*
async function fetchPage(url) {
    console.log("fetching " + url);
    return await
        superagent.get(url)
            .set('user-agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.132 Safari/537.36')
            .redirects(5)
            .then((res) => {
                return res.body.toString();
            }).catch(err => {
                if (err) {
                    console.log(err);
                }
            });
}


async function fetchJSFromPage() {
    let url = "https://coronavirus.1point3acres.com";
    return await
        superagent.get(url)
            .set('user-agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.132 Safari/537.36')
            .redirects(5)
            .then((res) => {
                const $ = cheerio.load(res.text);
                let links = [];
                $("script").map((i, el) => {
                    if (el.attribs.src) {

                        if (el.attribs.src.startsWith("/_next/static/chunks") &&

                            !el.attribs.src.includes("framework") &&
                            !el.attribs.src.includes("common") &&
                            !el.attribs.src.includes("style")


                        ) {
                            let l = url + el.attribs.src;
                            links.push(l);
                        }
                    }
                });
                return links;
            })
            .catch(err => {
                if (err) {
                    console.log(err);
                }
                return [];
            });
}

async function downloadTargetPageFromLinks(links) {
    for (let i = 0; i < links.length; i++) {
        let pagetext = await fetchPage(links[i]);
        if (pagetext) {
            if (pagetext.includes("first confirmed case of US")) {
                return pagetext;
            }
        }
    }
}
*/

var fs = require('fs');
var cases_to_eval = fs.readFileSync('./new.js');

cases = eval(cases_to_eval.toString());
async function doit() {
console.log(JSON.stringify(cases, 0, 2));
    process.exit();
}


doit();
