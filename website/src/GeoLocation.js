import { logger } from "./AppModule"

const Cookies = require("js-cookie");
const superagent = require("superagent");

const firebaseConfig = require('./firebaseConfig.json');

const defaultValue = {
  locationCookieId: "covidLocation",
  location: {
    countryCode: "US",
    state: "CA",
    county: "Santa Clara",
  },
  coordinates: {
    longitude: -73.968723,
    latitude: 40.775191,
  },
}

export async function fetchLocationFromUserAndSave() {
  const coords = await fetchCoordinatesUsingMethods([
    () => askForExactLocation(),
    () => fetchApproxIPLocationGoogle(firebaseConfig.apiKey),
  ]);
  const location = await getPoliticalLocationFromCoordinates(coords);
  Cookies.set(defaultValue.locationCookieId, location, {
    expires: 1000
  });
  return location;
}

export async function fetchLocationFromCookieThenIP() {
  const cookieLocation = getLocationFromCookie();
  if (cookieLocation) {
    return cookieLocation;
  }
  const coords = await fetchCoordinatesUsingMethods([
    () => fetchApproxIPLocationIPDataCo(firebaseConfig.ipdataco_key),
    () => fetchApproxIPLocationIPDataCo(firebaseConfig.ipdataco_key2),
    () => fetchApproxIPLocationIPDataCo(firebaseConfig.ipdataco_key3),
    () => fetchApproxIPLocationIPGEOLOCATION(),
  ]);
  return await getPoliticalLocationFromCoordinates(coords);
}

async function fetchCoordinatesUsingMethods(methods) {
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
  return coords;
}

function getLocationFromCookie() {
  const cookie = Cookies.getJSON(defaultValue.locationCookieId);
  if (cookie && cookie.county && cookie.state && cookie.countryCode) {
    logger.logEvent("LocationFoundInCookie", cookie);
    return cookie;
  } else {
    return null;
  }
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
      logger.logEvent("CensusCountyLookupSuccess", {
        location: coordinates,
        countryCode: 'US',
        county: c,
        state: s,
      });
      return {
        countryCode: 'US',
        county: c,
        state: s,
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
      const countryCode = address_components[0].short_name;
      console.log(countryCode);
      // Integrate with ROW... how to handle this info?

      // return {
      //   countryCode: countryCode
      // }
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
