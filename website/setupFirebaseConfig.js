// 
// before running me you should do a "npm install firebase-tools" in current directory
//
const fbcli = require('firebase-tools');
const fs = require('fs');

fbcli.setup.web().then(config => {
  const geoapi_keyfile_location = '/Users/xhuang/APIKEYs/ipgeojson_api.json';
  if (fs.existsSync(geoapi_keyfile_location)) {
    const geokey = JSON.parse(fs.readFileSync(geoapi_keyfile_location));
    config.ipgeolocation_key = geokey.ipgeolocation;
  }
  fs.writeFileSync(
    'src/firebaseConfig.json',
    JSON.stringify(config),
  );
});
