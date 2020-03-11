// 
// before running me you should do a "npm install firebase-tools" in current directory
//
const fbcli = require('firebase-tools');
const fs = require('fs');

fbcli.setup.web().then(config => {
  fs.writeFileSync(
    'src/firebaseConfig.json',
    JSON.stringify(config),
  );
});
