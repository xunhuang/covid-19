const superagent = require("superagent");

var cachedStates;
var cachedUS;

const testingStatesURL = "/data/state_testing.json";
const testingUSURL = "/data/us_testing.json";

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

async function fetchTestingDataStates() {
  if (cachedStates) {
    return cachedStates;
  }
  cachedStates = superagent
    .get(testingStatesURL)
    .then(res => {
      return addfulldate(res.body);
    });
  return cachedStates;
}

async function fetchTestingDataUS() {
  if (cachedUS) {
    return cachedUS;
  }
  cachedUS = superagent
    .get(testingUSURL)
    .then(res => {
      return addfulldate(res.body);
    });
  return cachedUS;
}

export { fetchTestingDataStates, fetchTestingDataUS }