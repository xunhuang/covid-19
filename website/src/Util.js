
var shortNumber = require('short-number');
const fips = require('fips-county-codes');
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
const state_fips_to_name =
{
    "10": "Delaware",
    "11": "District of Columbia",
    "12": "Florida",
    "13": "Georgia",
    "15": "Hawaii",
    "16": "Idaho",
    "17": "Illinois",
    "18": "Indiana",
    "19": "Iowa",
    "20": "Kansas",
    "21": "Kentucky",
    "22": "Louisiana",
    "23": "Maine",
    "24": "Maryland",
    "25": "Massachusetts",
    "26": "Michigan",
    "27": "Minnesota",
    "28": "Mississippi",
    "29": "Missouri",
    "30": "Montana",
    "31": "Nebraska",
    "32": "Nevada",
    "33": "New Hampshire",
    "34": "New Jersey",
    "35": "New Mexico",
    "36": "New York",
    "37": "North Carolina",
    "38": "North Dakota",
    "39": "Ohio",
    "40": "Oklahoma",
    "41": "Oregon",
    "42": "Pennsylvania",
    "44": "Rhode Island",
    "45": "South Carolina",
    "46": "South Dakota",
    "47": "Tennessee",
    "48": "Texas",
    "49": "Utah",
    "50": "Vermont",
    "51": "Virginia",
    "53": "Washington",
    "54": "West Virginia",
    "55": "Wisconsin",
    "56": "Wyoming",
    "01": "Alabama",
    "02": "Alaska",
    "04": "Arizona",
    "05": "Arkansas",
    "06": "California",
    "08": "Colorado",
    "09": "Connecticut",
    "72": "Puerto Rico",
    "66": "Guam",
    "78": "Virgin Islands",
    "60": "American Samoa"
};

function covert() {
    return Object.keys(state_fips_to_name).reduce((m, k) => {
        m[state_fips_to_name[k]] = k
        return m;
    }, {});
}

const STATE_Name_To_FIPS = covert();

function myFipsCode(state, county) {
    if (!county || county === "Statewide Unallocated" || county === "Grand Princess Cruise Ship") {
        let statefips = STATE_Name_To_FIPS[states.getStateNameByStateCode(state)];
        return [statefips, "0"];
    }
    if (county === "New York City") {
        county = "New York";
    }
    // console.log(`checking fips code for ${state} ${county}`);
    let a = fips.get({
        "state": state,
        "county": county,
    });
    // console.log(a);

    return [a.fips.slice(0, 2), a.fips]
}

export {
    myShortNumber,
    myToNumber,
    browseTo,
    browseToState,
    browseToUSPage,
    myFipsCode,
}
