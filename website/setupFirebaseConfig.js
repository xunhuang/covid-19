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
    config.ipdataco_key = geokey.ipdataco_key;
    config.ipdataco_key2 = geokey.ipdataco_key2;
  }
  fs.writeFileSync(
    'src/firebaseConfig.json',
    JSON.stringify(config, 2, 2),
  );
});
