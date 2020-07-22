const superagent = require("superagent");

async function fetchPublicCountyData(state_short, county_fips) {
  return superagent
    .get(`/AllData/${state_short}/${county_fips}.json`)
    .then(res => {
      return res.body;
    });
}

async function fetchAllUSData() {
  return superagent
    .get(`/AllData/AllData.json`)
    .then(res => {
      return res.body;
    });
}

async function fetchWorldData() {
  return superagent
    .get(`/AllData/WorldData.json`)
    .then(res => {
      return res.body;
    });
}

export {
  fetchPublicCountyData,
  fetchAllUSData,
  fetchWorldData
}