const superagent = require("superagent");

var cachedStates;
var cachedUS;

const hospitalizationURL = "https://gowatchit.net/data/hospitalization/USA.json";

function addfulldate(sourceData) {
  let data = sourceData.map(t => {
    let md = t.date % 10000;
    let m = Math.floor(md / 100);
    let d = md % 100;
    t.name = `${m}/${d}`;

    m = m.toString().padStart(2, "0");
    d = d.toString().padStart(2, "0");
    let y = Math.floor(t.date / 10000);

    t.fulldate = `${m}/${d}/${y}`;
    return t;
  })
  return data;
}

export async function fetchHospitalizationDataStates(stateShortName) {
  // if (cachedStates) {
  // return cachedStates;
  // }
  cachedStates = superagent
    .get(`https://gowatchit.net/data/hospitalization/${stateShortName}.json`)
    .then(res => {
      return addfulldate(res.body);
    });
  return cachedStates;
}

export async function fetchHospitalizationDataUS() {
  if (cachedUS) {
    return cachedUS;
  }
  cachedUS = superagent
    .get(hospitalizationURL)
    .then(res => {
      return addfulldate(res.body);
    });
  return cachedUS;
}
