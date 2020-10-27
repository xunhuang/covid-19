const CountyGeoData = require('../src/data/county_gps.json');

function findCountyStrict(state_two_letter, countyname) {
  return CountyGeoData.find(s => s.State == state_two_letter && s.County === countyname);
}

function getFipsFromStateCountyName(state_two_letter, countyname) {

  const methods = [
    () => findCountyStrict(state_two_letter, countyname),
    () => findCountyStrict(state_two_letter, countyname.replace(" County", "")),
    () => findCountyStrict(state_two_letter, countyname.replace(" Parish", "")),
    () => findCountyStrict(state_two_letter, countyname.replace(" city", "")),
    () => findCountyStrict(state_two_letter, countyname.replace(" city", " City")),
    () => findCountyStrict(state_two_letter, countyname.replace(" City", "")),
    () => findCountyStrict(state_two_letter, countyname.replace(" Borough", "")),
  ];


  let county;
  for (const method of methods) {
    try {
      county = method();
      if (county)
        break;
    } catch (err) {
      continue;
    }
  }
  if (county) {
    return county.FIPS.padStart(5, "0");
  }
  return null;
}

const STATE_TWO_LETTER_TO_POPULATIONS = {
  "CA": 39937489,
  "TX": 29472295,
  "FL": 21992985,
  "NY": 19440469,
  "PA": 12820878,
  "IL": 12659682,
  "OH": 11747694,
  "GA": 10736059,
  "NC": 10611862,
  "MI": 10045029,
  "NJ": 8936574,
  "VA": 8626207,
  "WA": 7797095,
  "AZ": 7378494,
  "MA": 6976597,
  "TN": 6897576,
  "IN": 6745354,
  "MO": 6169270,
  "MD": 6083116,
  "WI": 5851754,
  "CO": 5845526,
  "MN": 5700671,
  "SC": 5210095,
  "AL": 4908621,
  "LA": 4645184,
  "KY": 4499692,
  "OR": 4301089,
  "OK": 3954821,
  "CT": 3563077,
  "UT": 3282115,
  "IA": 3179849,
  "NV": 3139658,
  "AR": 3038999,
  "PR": 3032165,
  "MS": 2989260,
  "KS": 2910357,
  "NM": 2096640,
  "NE": 1952570,
  "ID": 1826156,
  "WV": 1778070,
  "HI": 1412687,
  "NH": 1371246,
  "ME": 1345790,
  "MT": 1086759,
  "RI": 1056161,
  "DE": 982895,
  "SD": 903027,
  "ND": 761723,
  "AK": 734002,
  "DC": 720687,
  "VT": 628061,
  "WY": 567025,
  "GU": 164229,
  "VI": 107268,
  "AS": 55641,
  "MP": 55144,
};
const STATE_FIPS_TO_NAME = {
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
  "60": "American Samoa",
  "69": "Northern Mariana Islands",
  "88": "Grand Princess",
  "96": "US Military",
  "97": "Federal Prison",
  "99": "Diamond Princess",
};

const fipsToState =
{
  "96": {
    "abbreviation": "AY",
    "name": "US Military"
  },
  "97": {
    "abbreviation": "FP",
    "name": "Federal Prison"
  },
  "88": {
    "abbreviation": "GP",
    "name": "Grand Princess"
  },
  "99": {
    "abbreviation": "DP",
    "name": "Diamond Princess"
  },
  "01": {
    "abbreviation": "AL",
    "name": "Alabama"
  },
  "02": {
    "abbreviation": "AK",
    "name": "Alaska"
  },
  "03": {
    "abbreviation": "AS",
    "name": "American Samoa"
  },
  "04": {
    "abbreviation": "AZ",
    "name": "Arizona"
  },
  "05": {
    "abbreviation": "AR",
    "name": "Arkansas"
  },
  "06": {
    "abbreviation": "CA",
    "name": "California"
  },
  "07": {
    "abbreviation": "CZ",
    "name": "Canal Zone"
  },
  "08": {
    "abbreviation": "CO",
    "name": "Colorado"
  },
  "09": {
    "abbreviation": "CT",
    "name": "Connecticut"
  },
  "10": {
    "abbreviation": "DE",
    "name": "Delaware"
  },
  "11": {
    "abbreviation": "DC",
    "name": "District Of Columbia"
  },
  "12": {
    "abbreviation": "FL",
    "name": "Florida"
  },
  "13": {
    "abbreviation": "GA",
    "name": "Georgia"
  },
  "14": {
    "abbreviation": "GU",
    "name": "Guam"
  },
  "15": {
    "abbreviation": "HI",
    "name": "Hawaii"
  },
  "16": {
    "abbreviation": "ID",
    "name": "Idaho"
  },
  "17": {
    "abbreviation": "IL",
    "name": "Illinois"
  },
  "18": {
    "abbreviation": "IN",
    "name": "Indiana"
  },
  "19": {
    "abbreviation": "IA",
    "name": "Iowa"
  },
  "20": {
    "abbreviation": "KS",
    "name": "Kansas"
  },
  "21": {
    "abbreviation": "KY",
    "name": "Kentucky"
  },
  "22": {
    "abbreviation": "LA",
    "name": "Louisiana"
  },
  "23": {
    "abbreviation": "ME",
    "name": "Maine"
  },
  "24": {
    "abbreviation": "MD",
    "name": "Maryland"
  },
  "25": {
    "abbreviation": "MA",
    "name": "Massachusetts"
  },
  "26": {
    "abbreviation": "MI",
    "name": "Michigan"
  },
  "27": {
    "abbreviation": "MN",
    "name": "Minnesota"
  },
  "28": {
    "abbreviation": "MS",
    "name": "Mississippi"
  },
  "29": {
    "abbreviation": "MO",
    "name": "Missouri"
  },
  "30": {
    "abbreviation": "MT",
    "name": "Montana"
  },
  "31": {
    "abbreviation": "NE",
    "name": "Nebraska"
  },
  "32": {
    "abbreviation": "NV",
    "name": "Nevada"
  },
  "33": {
    "abbreviation": "NH",
    "name": "New Hampshire"
  },
  "34": {
    "abbreviation": "NJ",
    "name": "New Jersey"
  },
  "35": {
    "abbreviation": "NM",
    "name": "New Mexico"
  },
  "36": {
    "abbreviation": "NY",
    "name": "New York"
  },
  "37": {
    "abbreviation": "NC",
    "name": "North Carolina"
  },
  "38": {
    "abbreviation": "ND",
    "name": "North Dakota"
  },
  "39": {
    "abbreviation": "OH",
    "name": "Ohio"
  },
  "40": {
    "abbreviation": "OK",
    "name": "Oklahoma"
  },
  "41": {
    "abbreviation": "OR",
    "name": "Oregon"
  },
  "42": {
    "abbreviation": "PA",
    "name": "Pennsylvania"
  },
  "43": {
    "abbreviation": "PR",
    "name": "Puerto Rico"
  },
  "44": {
    "abbreviation": "RI",
    "name": "Rhode Island"
  },
  "45": {
    "abbreviation": "SC",
    "name": "South Carolina"
  },
  "46": {
    "abbreviation": "SD",
    "name": "South Dakota"
  },
  "47": {
    "abbreviation": "TN",
    "name": "Tennessee"
  },
  "48": {
    "abbreviation": "TX",
    "name": "Texas"
  },
  "49": {
    "abbreviation": "UT",
    "name": "Utah"
  },
  "50": {
    "abbreviation": "VT",
    "name": "Vermont"
  },
  "51": {
    "abbreviation": "VA",
    "name": "Virginia"
  },
  "52": {
    "abbreviation": "VI",
    "name": "Virgin Islands"
  },
  "53": {
    "abbreviation": "WA",
    "name": "Washington"
  },
  "54": {
    "abbreviation": "WV",
    "name": "West Virginia"
  },
  "55": {
    "abbreviation": "WI",
    "name": "Wisconsin"
  },
  "56": {
    "abbreviation": "WY",
    "name": "Wyoming"
  },
  "72": {
    "abbreviation": "PR",
    "name": "Puerto Rico",
  },
  "66": {
    "abbreviation": "GU",
    "name": "Guam",
  },
  "78": {
    "abbreviation": "VI",
    "name": "Virgin Islands",
  },
  "60": {
    "abbreviation": "AS",
    "name": "American Samoa",
  },
  "69": {
    "abbreviation": "MP",
    "name": "Northern Mariana Islands",
  },
}

const STATE_SHORTNAME_TO_FIPS = (() => {
  return Object.keys(fipsToState).reduce((m, k) => {
    m[fipsToState[k].abbreviation] = k;
    return m;
  }, {});
})();

const STATE_Name_To_FIPS = (() => {
  return Object.keys(STATE_FIPS_TO_NAME).reduce((m, k) => {
    m[STATE_FIPS_TO_NAME[k]] = k
    return m;
  }, {});
})();

function getStatePopulation(two_letter_state_name) {
  return STATE_TWO_LETTER_TO_POPULATIONS[two_letter_state_name];
}

function getStateNameFromFips(state_fips) {
  return STATE_FIPS_TO_NAME[state_fips];
}

function getStateAbbreviationFromFips(state_fips) {
  // console.log(state_fips)
  if (state_fips === '00') {
    return "NN";
  }
  return fipsToState[state_fips].abbreviation;
}

function getFipsFromStateName(state_name) {
  return STATE_Name_To_FIPS[state_name];
}

function getFipsFromStateShortName(state_name_short) {
  return STATE_SHORTNAME_TO_FIPS[state_name_short];
}

function getAllStateFips() {
  return Object.keys(STATE_FIPS_TO_NAME);
}

const CountyInfo = {
  getStatePopulation,
  getStateNameFromFips,
  getStateAbbreviationFromFips,
  getFipsFromStateName,
  getFipsFromStateShortName,
  getAllStateFips,
  getFipsFromStateCountyName,
}

exports.CountyInfo = CountyInfo;
