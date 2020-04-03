import * as USCounty from "./USCountyInfo.js"
var shortNumber = require('short-number');
const Cookies = require("js-cookie");

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

function myGoodNumber(n) {
    if (Number.isNaN(n) || !isFinite(n)) {
        return "-";
    }
    return n;
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

function myToNumber(n) {
    let ret;
    if (!n) {
        return 0;
    }
    if (isNaN(n) || typeof n === "string") {
        ret = Number(n.replace(/,/g, ''));
    } else {
        ret = n;
    }
    return ret;
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
    let metro_info = USCounty.getMetro(metro);
    let county_info = CookieGetLastCounty();
    if (county_info) {
        if (county_info.state === metro_info.State) {
            return county_info.county;
        }
    }

    // cookie county not match, return the top county
    let counties = USCounty.countyDataForMetro(metro).sort((a, b) => b.total - a.total);
    let topcounty = counties[0].County;
    return topcounty;
}
function getDefaultCountyForState(state, county) {
    if (county) {
        return county;
    }
    let county_info = CookieGetLastCounty();
    if (county_info) {
        if (county_info.state === state) {
            return county_info.county;
        }
    }

    // cookie county not match, return the top county
    let counties = USCounty.countyDataForState(state).sort((a, b) => b.total - a.total);
    let topcounty = counties[0].County;
    if (topcounty === "Statewide Unallocated") {
        topcounty = counties[1].County;
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

export {
    myShortNumber,
    myGoodNumber,
    myGoodShortNumber,
    myGoodWholeNumber,
    myToNumber,

    CookieGetLastCounty,
    CookieSetLastCounty,
    getDefaultCountyForState,
    getDefaultCounty,
    getDefaultCountyForMetro,
}
