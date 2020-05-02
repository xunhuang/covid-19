import { logger } from "./AppModule"

const Cookies = require("js-cookie");
const superagent = require("superagent");

const firebaseConfig = require('./firebaseConfig.json');

async function fetchCounty(myCountry, useGoogleAPI = false) {
    const cookie = Cookies.getJSON("covidLocation");
    if (cookie && !useGoogleAPI) {
        if (cookie.county && cookie.state) {
            console.log("cookie hit");
            logger.logEvent("LocationFoundInCookie", cookie);
            return cookie;
        }
    }
    logger.logEvent("LocationNoCookie");

    let methods;

    if (useGoogleAPI) {
        methods = [
            () => fetchApproxIPLocationGoogle(),
            () => locationFindingError(),
        ];
    } else {
        methods = [
            () => fetchApproxIPLocationIPDataCo(firebaseConfig.ipdataco_key),
            () => fetchApproxIPLocationIPDataCo(firebaseConfig.ipdataco_key2),
            () => fetchApproxIPLocationIPDataCo(firebaseConfig.ipdataco_key3),
            () => fetchApproxIPLocationIPGEOLOCATION(),
            () => locationFindingError()
        ];
    }

    let location;
    for (const method of methods) {
        try {
            location = await method();
            break;
        } catch (err) {
            continue;
        }
    }

    console.log(location);

    const county_info = await superagent
        .get("https://geo.fcc.gov/api/census/area")
        .query({
            lat: location.latitude,
            lon: location.longitude,
            format: "json",
        }).then(res => {
            const c = res.body.results[0].county_name;
            const s = res.body.results[0].state_code;
            console.log(res.body);
            logger.logEvent("CensusCountyLookupSuccess", {
                location: location,
                county: c,
                state: s
            });
            return {
                county: c,
                state: s,
            };
        })
        .catch(err => {
            logger.logEvent("CensusCountyLookupFailed", location);
            console.log("location error.. what the heck!")
            console.log(err);
            return {
                county: "Santa Clara",
                state: "CA",
            };
        });

    Cookies.set("covidLocation", county_info, {
        expires: 1000  // too expensive.
    });

    return county_info;
}


function locationFindingError() {
    logger.logEvent("LocationNoFoundAfterAPI");
    // santa clara
    // longitude: -121.979891,
    // latitude: 37.333183,
    // new york city
    return {
        longitude: -73.968723,
        latitude: 40.775191,
    };
}

function fetchApproxIPLocationGoogle(key) {
    return superagent
        .post(`https://www.googleapis.com/geolocation/v1/geolocate?key=${firebaseConfig.apiKey}`)
        .then(res => ({
            longitude: res.body.location.lng,
            latitude: res.body.location.lat,
        }));
}

// this one is not very good - while at Alameda, it says it's in santa clara, I guess
// with google we are paying for precision.

async function fetchApproxIPLocationIPGEOLOCATION() {
    const url = `https://api.ipgeolocation.io/ipgeo?apiKey=${firebaseConfig.ipgeolocation_key}`;
    return superagent
        .get(url)
        .then(res => {
            if (!res.body.longitude)
                throw new Error('Bad result');
            console.log(res.body);
            return {
                longitude: res.body.longitude,
                latitude: res.body.latitude,
            };
        });
}

function fetchApproxIPLocationIPDataCo(apikey) {

    const url = `https://api.ipdata.co/?api-key=${apikey}`;
    return superagent
        .get(url)
        .then(res => {
            console.log(res.body);
            if (!res.body || !res.body.longitude)
                throw new Error('Bad result');
            return {
                longitude: res.body.longitude,
                latitude: res.body.latitude,
            };
        });
}

export { fetchCounty }
