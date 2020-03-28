import { logger, firebase } from "./AppModule"

const Cookies = require("js-cookie");
const superagent = require("superagent");

const firebaseConfig = require('./firebaseConfig.json');

async function fetchCounty() {
    let cookie = Cookies.getJSON("covidLocation");
    if (cookie) {
        if (cookie.county && cookie.state) {
            console.log("cookie hit");
            logger.logEvent("LocationFoundInCookie", cookie);
            return cookie;
        }
    }
    logger.logEvent("LocationNoCookie");

    let location = null;

    if (!location) {
        location = await fetchApproxIPLocationIPDataCo(firebaseConfig.ipdataco_key);
    }
    if (!location) {
        location = await fetchApproxIPLocationIPDataCo(firebaseConfig.ipdataco_key2);
    }
    if (!location) {
        location = await fetchApproxIPLocationGoolge();
    }
    if (!location) {
        location = await fetchApproxIPLocationIPGEOLOCATION();
    }

    if (!location) {
        location = {
            // santa clara
            // longitude: -121.979891,
            // latitude: 37.333183,
            // new york city
            longitude: - 73.968723,
            latitude: 40.775191,
        }
        logger.logEvent("LocationNoFoundAfterAPI");
        console.log("default to NYC");
    } else {
        logger.logEvent("LocationFoundInGeoLocate", location);
    }

    console.log(location);

    let county_info = await superagent
        .get("https://geo.fcc.gov/api/census/area")
        .query({
            lat: location.latitude,
            lon: location.longitude,
            format: "json",
        }).then(res => {
            let c = res.body.results[0].county_name;
            let s = res.body.results[0].state_code;
            console.log(res.body);
            logger.logEvent("CensusCountyLookupSuccess", {
                location: location,
                county: c,
                state: s
            });
            return {
                county: c,
                state: s,
            }
        })
        .catch(err => {
            logger.logEvent("CensusCountyLookupFailed", location);
            console.log("location error.. what the heck!")
            console.log(err);
            return {
                county: "Santa Clara",
                state: "CA",
            }
        });

    Cookies.set("covidLocation", county_info, {
        expires: 1000  // too expensive.
    });

    return county_info;
}

// jshint unused: true
async function fetchApproxIPLocationGoolge(key) {
    return await superagent
        .post(`https://www.googleapis.com/geolocation/v1/geolocate?key=${firebaseConfig.apiKey}`)
        .then(res => {
            let location = {
                longitude: res.body.location.lng,
                latitude: res.body.location.lat,
            }
            return location;
        })
        .catch(err => {
            return null;
        });
}

// this one is not very good - while at Alameda, it says it's in santa clara, I guess 
// with google we are paying for precision.

// jshint unused: true
async function fetchApproxIPLocationIPGEOLOCATION() {
    const url = `https://api.ipgeolocation.io/ipgeo?apiKey=${firebaseConfig.ipgeolocation_key}`;
    console.log(url);
    return await superagent
        .get(url)
        .then(res => {
            if (!res.body.longitude)
                return null;
            let location = {
                longitude: res.body.longitude,
                latitude: res.body.latitude,
            }
            console.log(res.body);
            return location;
        })
        .catch(err => {
            return null;
        });
}

async function fetchApproxIPLocationIPDataCo(apikey) {

    const url = `https://api.ipdata.co/?api-key=${apikey}`;
    console.log(url);
    return await superagent
        .get(url)
        .then(res => {
            console.log(res.body);
            if (!res.body || !res.body.longitude)
                return null;
            let location = {
                longitude: res.body.longitude,
                latitude: res.body.latitude,
            }
            return location;
        })
        .catch(err => {
            return null;
        });
}

export { fetchCounty }
