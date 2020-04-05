var shortNumber = require('short-number');
const Cookies = require("js-cookie");
const states = require('us-state-codes');

function myShortNumber(n) {
    if (!n) {
        return "0";
    }
    if (isNaN(n)) {
        n = n.replace(/,/g, '');
        n = Number(n);
    }
    return shortNumber(n);
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
function getDefaultCountyForMetro(metro) {
    let county_info = CookieGetLastCounty();
    if (county_info) {
        if (county_info.state === metro.state().id) {
            return metro.state().countyForName(county_info.county);
        }
    }

    // cookie county not match, return the top county
    return metro
        .allCounties()
        .sort((a, b) => b.totalConfirmed() - a.totalConfirmed())[0];
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

export {
    myShortNumber,
    myGoodShortNumber,
    myGoodWholeNumber,

    CookieGetLastCounty,
    CookieSetLastCounty,
    getDefaultCountyForState,
    getDefaultCounty,
    getDefaultCountyForMetro,
    getStateNameByStateCode,
}
