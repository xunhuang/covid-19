import { useState } from 'react'

var shortNumber = require('short-number');
const Cookies = require("js-cookie");
const states = require('us-state-codes');
const moment = require("moment");

function myShortNumber(n) {
  if (!n) {
    return "0";
  }
  if (isNaN(n)) {
    n = n.replace(/,/g, '');
    n = Number(n);
  } else if (!isFinite(n)) {
    return "∞";
  }
  return shortNumber(n);
}

function filterDataToRecent(data, numDays) {
  const cutoff = moment().subtract(numDays + 1, 'days')
  return data.filter(d => {
    return moment(d.fulldate, "MM/DD/YYYY").isAfter(cutoff)
  });
}

function getOldestMomentInData(data, evaluationFunc = (data) => true) {
  let currentOldest = moment();
  data.forEach(element => {
    if (evaluationFunc(element)) {
      const elementMoment = moment(element.fulldate, "MM/DD/YYYY")
      currentOldest = currentOldest.isAfter(elementMoment) ? elementMoment : currentOldest
    }
  })
  return currentOldest
}

function makeCountyFromDescription(myCountry, stateCountyDescription) {
  const state = myCountry.stateForTwoLetterName(stateCountyDescription.state);
  return state.countyForName(stateCountyDescription.county);
}

function myGoodWholeNumber(n) {
  if (Number.isNaN(n) || !isFinite(n)) {
    return "-";
  }
  return n.toFixed(0);
}


function myGoodShortNumber(n) {
  if (Number.isNaN(n) || !isFinite(n)) {
    return "-";
  }
  return myShortNumber(n);
}

function CookieGetLastCounty() {
  let county_info = Cookies.getJSON("LastCounty");
  return county_info;
}

function getDefaultCounty() {
  let county_info = CookieGetLastCounty();
  if (county_info) {
    return county_info;
  }
  return {
    county: "Santa Clara",
    state: "CA",
  }
}
function getDefaultCountyForState(state) {
  let county_info = CookieGetLastCounty();
  if (county_info) {
    if (county_info.state === state.twoLetterName) {
      return state.countyForName(county_info.county);
    }
  }

  // cookie county not match, return the top county
  let counties =
    state
      .allCounties()
      .sort((a, b) => b.totalConfirmed() - a.totalConfirmed());
  let topcounty = counties[0];
  if (!topcounty) {
    // some "state" like Puerto Rico has no counties
    return;
  }
  if (topcounty.name === "Statewide Unallocated") {
    topcounty = counties[1];
  }
  return topcounty;
}
function CookieSetLastCounty(state, county) {
  let county_info = {
    state: state,
    county: county,
  }

  Cookies.set("LastCounty", county_info, {
    expires: 7  // 7 day, people are not supposed to be moving anyways
  });
}

function getStateNameByStateCode(stateCode) {
  switch (stateCode) {
    case "AS":
      return "American Samoa";
    case "GU":
      return "Guam";
    case "MP":
      return "Northern Marianas";
    case "VI":
      return "Virgin Islands";
    default:
      return states.getStateNameByStateCode(stateCode);
  }
}

function pad(n) { return n < 10 ? '0' + n : n }

function normalize_date(k) {
  let p = k.split("/");
  if (p.length !== 3) {
    return null;
  }
  let m = pad(parseInt(p[0]));
  let d = pad(parseInt(p[1]));
  let y = p[2];
  if (y.length === 2) {
    y = "20" + y;
  }
  return `${m}/${d}/${y}`;
}

function useStickyState({ defaultValue, cookieId, isCookieStale = (c) => false, expiration = null }) {
  let readCookie = Cookies.getJSON(cookieId);
  if (!readCookie || (isCookieStale(readCookie))) {
    readCookie = defaultValue;
  }

  const [state, setState] = useState(readCookie);

  const setStateSticky = (newState) => {
    Cookies.set(cookieId, newState, {
      expires: expiration
    });
    setState(newState);
  }

  return [state, setStateSticky];
}


export function getRefLines(source) {
  const vKeyRefLines = [
    {
      date: moment("05/25/2020", "MM/DD/YYYY").unix(),
      label: "Memorial",
    },
    {
      date: moment("07/04/2020", "MM/DD/YYYY").unix(),
      label: "July 4th",
    },
    {
      date: moment("09/07/2020", "MM/DD/YYYY").unix(),
      label: "Labor Day",
    },
  ]
  if (!source) {
    return vKeyRefLines
  }

  let stayhome;
  if (source.stayHomeOrder) {
    stayhome = source.stayHomeOrder();
  }
  if (stayhome) {
    if (stayhome.StartDate) {
      vKeyRefLines.push({
        date: moment(moment(stayhome.StartDate).format("MM/DD/YYYY"), "MM/DD/YYYY").unix(),
        label: "Stay-Home-Order",
      });
    }
    if (stayhome.EndDate) {
      vKeyRefLines.push({
        date: moment(moment(stayhome.EndDate).format("MM/DD/YYYY"), "MM/DD/YYYY").unix(),
        label: "Re-Opens",
      });
    }
  }
  return vKeyRefLines;
}

export {
  myShortNumber,
  myGoodShortNumber,
  myGoodWholeNumber,

  CookieGetLastCounty,
  CookieSetLastCounty,
  getDefaultCountyForState,
  getDefaultCounty,
  getStateNameByStateCode,
  normalize_date,
  makeCountyFromDescription,
  filterDataToRecent,
  getOldestMomentInData,
  useStickyState,
}
