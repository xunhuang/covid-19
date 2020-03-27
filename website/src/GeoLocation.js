const Cookies = require("js-cookie");
const superagent = require("superagent");

const firebaseConfig = require('./firebaseConfig.json');

var ApproxIPLocation;

async function fetchCounty() {
    let cookie = Cookies.getJSON("covidLocation");
    if (cookie) {
        if (cookie.county && cookie.state) {
            console.log("cookie hit");
            return cookie;
        }
    }

    let location = await fetchApproxIPLocationGoolge();

    let county_info = await superagent
        .get("https://geo.fcc.gov/api/census/area")
        .query({
            lat: location.latitude,
            lon: location.longitude,
            format: "json",
        }).then(res => {
            let c = res.body.results[0].county_name;
            let s = res.body.results[0].state_code;
            return {
                county: c,
                state: s,
            }
        })
        .catch(err => {
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

async function fetchApproxIPLocationGoolge() {
    return await superagent
        .post(`https://www.googleapis.com/geolocation/v1/geolocate?key=${firebaseConfig.apiKey}`)
        .then(res => {
            ApproxIPLocation = {
                longitude: res.body.location.lng,
                latitude: res.body.location.lat,
            }
            return ApproxIPLocation;
        })
        .catch(err => {
            // fall back if can't determine GPS, this is santa clara
            ApproxIPLocation = {
                longitude: -121.979891,
                latitude: 37.333183,
            }
            return ApproxIPLocation;
        });
}

export { fetchCounty }