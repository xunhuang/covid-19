const superagent = require("superagent");

var cachedStates;
var cachedUS;

const testingUSURL = "https://gowatchit.net/data/testing/USA.json";
const testingUSStatesLastURL = "https://gowatchit.net/data/testing/states-last.json";

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

async function fetchTestingDataStates(stateShortName) {
  // if (cachedStates) {
  // return cachedStates;
  // }
  cachedStates = superagent
    .get(`https://gowatchit.net/data/testing/${stateShortName}.json`)
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

export async function fetchTestingDataStatesTable() {
  if (cachedUS) {
    return cachedUS;
  }
  cachedUS = superagent
    .get(testingUSStatesLastURL)
    .then(res => {
      return addfulldate(res.body);
    });
  return cachedUS;
}

export { fetchTestingDataStates, fetchTestingDataUS }
