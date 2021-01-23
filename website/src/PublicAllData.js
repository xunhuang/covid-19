const superagent = require("superagent");

async function fetchPublicCountyData(state_short, county_fips) {
  return superagent
    .get(`/AllData/${state_short}/${county_fips}.json`)
    .then(res => {
      return res.body;
    });
}

var request = require('request'), zlib = require('zlib');

function streamToString(stream) {
  const chunks = []
  return new Promise((resolve, reject) => {
    stream.on('data', chunk => chunks.push(chunk))
    stream.on('error', reject)
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
  })
}

async function fetchAllUSData() {
  var headers = {
    'Accept-Encoding': 'gzip'
  };

  let unzippedStream = request({
    url: window.location.origin + `/AllData/AllData.json.gz`,
    'headers': headers
  })
    .pipe(zlib.createGunzip());
  let jsonString = await streamToString(unzippedStream);
  return JSON.parse(jsonString);
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