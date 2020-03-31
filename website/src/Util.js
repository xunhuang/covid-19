
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

function browseTo(history, state, county) {
    history.push(
        "/county/" + encodeURIComponent(state) + "/" + encodeURIComponent(county),
        history.search,
    );
}

function browseToState(history, state) {
    history.push(
        "/state/" + encodeURIComponent(state),
        history.search,
    );
}

function browseToUSPage(history) {
    history.push(
        "/US",
        history.search,
    );
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

export {
    myShortNumber,
    myGoodNumber,
    myGoodShortNumber,
    myGoodWholeNumber,
    myToNumber,
    browseTo,
    browseToState,
    browseToUSPage,
    getDefaultCounty,
}
