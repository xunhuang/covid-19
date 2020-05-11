import { logger } from "./AppModule"

const Cookies = require("js-cookie");
const superagent = require("superagent");

const firebaseConfig = require('./firebaseConfig.json');

const cookieId = "covidLocation"

const defaultValue = {
  location: {
    country: "United States of America",
    state: "CA",
    county: "Santa Clara",
  },
  coordinates: {
    longitude: -73.968723,
    latitude: 40.775191,
  },
}

// Gets user's country, and if in US and availble, their county/state
export async function fetchPrecisePoliticalLocation() {
  const location = await fetchLocationUsingMethods([
    () => askForExactLocation(),
    () => fetchApproxIPLocationGoogle(firebaseConfig.apiKey),
  ]);
  Cookies.set(cookieId, location, {
    expires: 1000,
  });
  return location;
}

// Uses IP address to get country, and if availble, approximate country/state
export async function fetchApproximatePoliticalLocation() {
  return await fetchLocationUsingMethods([
    () => getLocationFromCookie(),
    () => fetchApproxIPLocationIPDataCo(firebaseConfig.ipdataco_key),
    () => fetchApproxIPLocationIPDataCo(firebaseConfig.ipdataco_key2),
    () => fetchApproxIPLocationIPDataCo(firebaseConfig.ipdataco_key3),
    () => fetchApproxIPLocationIPGEOLOCATION(),
  ]);
}

async function fetchLocationUsingMethods(methods) {
  const safeMethods = methods.concat([
    () => coordinateFindingError(),
  ]);

  let coords;
  for (const method of safeMethods) {
    try {
      console.log(method)
      coords = await method();
      break;
    } catch (err) {
      continue;
    }
  }
  return await getPoliticalLocationFromCoordinates(coords);
}

async function getPoliticalLocationFromCoordinates(coordinates) {
  const coordinateTranslationMethods = [
    () => getCensusLocationFromCoordinates(coordinates),
    () => getGlobalLocationFromCoordinates(coordinates, firebaseConfig.apiKey),
    () => locationFindingError(),
  ];
  let location;
  for (const method of coordinateTranslationMethods) {
    location = await method();
    if (location) {
      break;
    }
  }
  return location;
}

async function getCensusLocationFromCoordinates(coordinates) {
  return await superagent
    .get("https://geo.fcc.gov/api/census/area")
    .query({
      lat: coordinates.latitude,
      lon: coordinates.longitude,
      format: "json",
    }).then(res => {
      const c = res.body.results[0].county_name;
      const s = res.body.results[0].state_code;
      const stateName = res.body.results[0].state_name;
      logger.logEvent("CensusCountyLookupSuccess", {
        location: coordinates,
        country: 'United States of America',
        county: c,
        state: s,
        stateName: stateName,
      });
      return {
        country: 'United States of America',
        county: c,
        state: s,
        stateName: stateName,
      };
    })
    .catch(err => {
      logger.logEvent("CensusCountyLookupFailed", coordinates);
      return null;
    });
}

async function getGlobalLocationFromCoordinates(coordinates, apiKey) {
  const googleMapsEndpoint = `https://maps.googleapis.com/maps/api/geocode/json`
      + `?latlng=${coordinates.latitude},${coordinates.longitude}`
      + `&result_type=country`
      + `&key=${apiKey}`;
  return await superagent
    .get(googleMapsEndpoint)
    .then(res => {
      const results = res.body.results
      if (!results || results.length < 1) {
        return null;
      }
      const address_components = results[0].address_components;
      if (!address_components || address_components.length < 1) {
        return null;
      }
      const countryName = address_components[0].long_name;
      return defaultValue.location
    })
    .catch(err => {
      logger.logEvent("GoogleMapsPoliticalLocationLookupFailed", coordinates);
      return null;
    });
}

function locationFindingError() {
  logger.logEvent("LocationFromCoordNotFoundAfterAPI");
  return defaultValue.location;
}

function askForExactLocation() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      position => resolve({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      }),
      error => reject(error)
    );
  });
}

function getLocationFromCookie() {
  const cookie = Cookies.getJSON(cookieId);
  if (cookie && cookie.country) {
    logger.logEvent("LocationFoundInCookie", cookie);
    return cookie;
  } else {
    throw "No cookie or invalid one";
  }
}

async function fetchApproxIPLocationGoogle(key) {
  return await superagent
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
  return await superagent
    .get(url)
    .then(res => {
      if (!res.body.longitude) {
        throw new Error('Bad result');
      }
      console.log("ipgeolocation")
      console.log(res.body);
      return {
        longitude: res.body.longitude,
        latitude: res.body.latitude,
      };
    });
}

async function fetchApproxIPLocationIPDataCo(apikey) {
  const url = `https://api.ipdata.co/?api-key=${apikey}`;
  return await superagent
    .get(url)
    .then(res => {
      if (!res.body || !res.body.longitude) {
        throw new Error('Bad result');
      }
      console.log("ipgdata")
      console.log(res.body);
      return {
        longitude: res.body.longitude,
        latitude: res.body.latitude,
      };
    });
}

function coordinateFindingError() {
  logger.logEvent("LocationNoFoundAfterAPI");
  return defaultValue.coordinates;
}
