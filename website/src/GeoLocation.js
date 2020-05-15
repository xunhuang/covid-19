import { logger } from "./AppModule"
import Countries from "./models/Countries"

const Cookies = require("js-cookie");
const superagent = require("superagent");

const firebaseConfig = require('./firebaseConfig.json');

const cookieId = "covidLocation"

const defaultValue = {
  location: {
    country: Countries.US,
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
  const saved = getLocationFromCookie();
  if (saved) {
    return saved;
  }
  
  const location =  await fetchLocationUsingMethods([
    () => fetchApproxIPLocationIPDataCo(firebaseConfig.ipdataco_key),
    () => fetchApproxIPLocationIPDataCo(firebaseConfig.ipdataco_key2),
    () => fetchApproxIPLocationIPDataCo(firebaseConfig.ipdataco_key3),
    () => fetchApproxIPLocationIPGEOLOCATION(),
    () => fetchApproxIPLocationGoogle(),
  ]);

  Cookies.set(cookieId, location, {
    expires: 1000,
  });
  return location;
}

async function fetchLocationUsingMethods(methods) {
  const safeMethods = methods.concat([
    () => coordinateFindingError(),
  ]);

  let coords;
  for (const method of safeMethods) {
    try {
      coords = await method();
      break;
    } catch (err) {
      continue;
    }
  }
  return await getPoliticalLocationFromCoordinates(coords);
}

async function getPoliticalLocationFromCoordinates(coordinates) {
  for (const method of [
    () => getCensusLocationFromCoordinates(coordinates),
    () => getGlobalLocationFromCoordinates(coordinates, firebaseConfig.apiKey),
    () => locationFindingError(),
  ]) {
    const result = await method();
    if (result) {
      return result;
    }
  }
  return undefined;
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
        country: Countries.US,
        county: c,
        state: s,
        stateName: stateName,
      });
      return {
        country: Countries.US,
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
  // some providers have countries already set.
  if (coordinates.country_name) {
    return {
      country: coordinates.country_name,
    }
  }

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
      console.log(results)
      return {
        country: countryName
      }
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
  if (cookie && (cookie.country || cookie.county) ) {
    logger.logEvent("LocationFoundInCookie", cookie);
    return cookie;
  } else {
    throw new Error("No cookie or invalid one");
  }
}

async function fetchApproxIPLocationGoogle(key) {
  return await superagent
    .post(`https://www.googleapis.com/geolocation/v1/geolocate?key=${firebaseConfig.apiKey}`)
    .then(res => {
      console.log(res);
      return {
        longitude: res.body.location.lng,
        latitude: res.body.location.lat,
      }
    });
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
        country_code: res.body.country_code2,
        country_name: res.body.country_name,
        region: res.body.state_prov,
        region_code: res.body.region_code
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
        country_code: res.body.country_code,
        country_name: res.body.country_name,
        region: res.body.region,
        region_code: res.body.region_code,
      };
    });
}

function coordinateFindingError() {
  logger.logEvent("LocationNoFoundAfterAPI");
  return defaultValue.coordinates;
}
