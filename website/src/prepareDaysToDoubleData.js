// const x = require("./USCountyInfo.js");
const AllData = require("./data/AllData.json");


/**
* Returns a flat array containing all counties in AllData (excluding special items like Summary, unallocated)
*/
function getAllProperCountyDataForUS() {
  return getAllProperStateKeys().reduce((acc, statekey) => {
      const all_county_data = getAllProperCountyDataForState(statekey);
      return acc.concat(all_county_data);
  }, []);
}

/**
* Returns data for all counties in given state found in AllData excluding data for Summary, unallocated, etc.
* @param {*} statekey 
*/
function getAllProperCountyDataForState(statekey) {
  const stateData = AllData[statekey];
  return getAllProperCountyKeysForState(statekey).map((k) => stateData[k])
}

/**
* Returns keys for all counties in a given state found in AllData excluding data for Summary, unallocated, etc.
* @param {*} statekey 
*/
function getAllProperCountyKeysForState(statekey) {
  const stateData = AllData[statekey];
  return Object.keys(stateData).filter((k) => k !== 'Summary' && k !== 'Metros' && k !== '0');
}

/**
* Returns the state keys used in AllData excluding "non-state" data (e.g Summary)
*/
function getAllProperStateKeys() {
  return Object.keys(AllData).filter((k) => k !== 'Summary' && k !== 'Metros');
}


// let states = reduceForAllStates(reducerForStates, []);
let states = getAllProperCountyDataForUS().reduce((acc, county) => {
  let countDataForMap = {id: county.CountyFIPS, name: county.CountyName, unemployment_rate: county.DaysToDouble};
  if (county.DaysToDouble) {
    acc.push(countDataForMap);
  }
  return acc;
}, []);
console.log(JSON.stringify(states));
