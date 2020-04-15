const superagent = require("superagent");

var cachedStates;
var cachedUS;

const testingStatesURL = "/data/state_testing.json";
const testingUSURL = "/data/us_testing.json";

async function fetchTestingDataStates() {
    if (cachedStates) {
        return cachedStates;
    }
    cachedStates = superagent
        .get(testingStatesURL)
        .then(res => {
            return res.body;
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
            return res.body;
        });
    return cachedUS;
}

export { fetchTestingDataStates, fetchTestingDataUS }