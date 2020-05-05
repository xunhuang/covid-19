const moment = require("moment");
const fs = require('fs');
const csv = require('csvtojson')
const Util = require('covidmodule').Util;

const KeyFields = ["Confirmed", "Active", "Recovered", "Deaths"];
let WorldData = {};


function find_key_path(key, create = false) {
  let keyparts = key.split(",");
  let curobject = WorldData;
  while (keyparts.length > 0) {
    let key = keyparts.pop().trim();
    if (key.length === 0) {
      continue;
    }
    if (!curobject[key]) {
      if (create) {
        curobject[key] = {};
      } else {
        console.log(`key ${key} not exist`);
        return null;
      }
    }
    curobject = curobject[key];
  }
  return curobject;
}

const CountryKeyMap = {
  "Mainland China": "China",
  "Hong Kong": "China",
  "Taiwan*": "Taiwan",
  "Hong Kong SAR": "China",
  "Macau": "China",
  "Macau SAR": "China",
  "Macao SAR": "China",
  "South Korea": "Korea South",
  "Republic of Korea": "Korea South",
  "Ivory Coast": "Cote d'Ivoire",
  "UK": "United Kingdom",
  "Czech Republic": "Czechia",
  "Iran (Islamic Republic of)": "Iran",
  "Russian Federation": "Russia",
  "East Timor": "Timor-Leste",
}

const DirectKeyMap = {
  "Taiwan*": "Taiwan",
  "Greenland": "Greenland, Denmark",
  "Cayman Islands": "Cayman Islands, United Kingdom",
  "Channel Islands": "Channel Islands, United Kingdom",
  "Netherlands, Netherlands": "Netherlands",
  "Curacao": "Curacao, Netherlands",
  "Aruba": "Aruba, Netherlands",
  "Taipei and environs": "Taiwan",
  "Viet Nam": "Vietnam",
  "Saint Barthelemy": "Saint Barthelemy, France",
  "Faroe Islands": "Faroe Islands,Denmark",
  "Gibraltar": "Gibraltar,United Kingdom",
  "French Guiana": "French Guiana,France",
  "Guadeloupe": "Guadeloupe, France",
  "Reunion": "Reunion, France",
  "Martinique": "Martinique, France",
  "French Polynesia": "French Polynesia, France",
  "Mayotte": "Mayotte, France",
  "St Martin": "St Martin, France",
  "St. Martin": "St Martin, France",
  "Saint Martin": "St Martin, France",
  "New Caledonia": "New Caledonia, France",
  "The Bahamas": "Bahamas",
  "Bahamas, The": "Bahamas",
  "Gambia, The": "Gambia",
  "The Gambia": "Gambia",
  "Republic of Moldova": "Moldova",
  "Republic of the Congo": "Congo (Brazzaville)",
}

const ProvinceSkipList = [
  "Bavaria",
  "Toronto, ON",
  "London, ON",
  " Montreal, QC",
  "Diamond Princess",
  "From Diamond Princess",
  "Calgary, Alberta",
  "Edmonton, Alberta",
  "Cape Verde"
];

const CountrySkipList = [
  "US",
  "Guernsey",
  "Cruise Ship",
  "Others",
  "Diamond Princess",
  "North Ireland",
  "Republic of Ireland",
  "Palestine", // no data 
  "Palestinian territory",// no data 
  "occupied Palestinian territory",// no data 
  "Vatican City",
  "Cape Verde",
  "Guam",
  "Jersey",
  "Puerto Rico",
]

const COMBINED_KEY_SKIP_LIST = [
  "External territories, Australia",
  "Jervis Bay Territory, Australia",
  "Diamond Princess, Cruise Ship",
];
const COMBINED_KEY_REWRITE = {
  "Falkland Islands (Islas Malvinas), United Kingdom": "Falkland Islands (Malvinas), United Kingdom",
  "Fench Guiana, France": "French Guiana, France",
  "UK, United Kingdom": "United Kingdom",
  "Korea, South": "Korea South",
  "Taiwan*": "Taiwan",
}

function CountryProvinceToCombinedKey(country, province) {
  let Combined_Key = null;
  if (CountrySkipList.includes(country)) {
    return null;
  }
  if (DirectKeyMap[country]) {
    Combined_Key = DirectKeyMap[country];
  } else {
    country = CountryKeyMap[country] ? CountryKeyMap[country] : country;
    if (country.length > 0) {
      if (ProvinceSkipList.includes(province)) {
        return null;
      }
      if (province && province === country) {
        Combined_Key = country;
      } else if (province && province.length > 0 && province !== "None") {
        Combined_Key = province + ", " + country;
      } else {
        Combined_Key = country;
      }
    } else {
      console.log("no key!!!  ");
      console.log(line);
    }
  }
  return Combined_Key;
}

// date is moment() date
async function process_one_JHU_file(json, date) {
  for (let line of json) {
    let Combined_Key = line.Combined_Key;
    if (!Combined_Key || Combined_Key.length === 0) {
      let country = line["Country/Region"];
      let province = line["Province/State"];
      Combined_Key = CountryProvinceToCombinedKey(country, province);
    }

    if (!Combined_Key) {
      continue;
    }

    // skip US for now
    // if (Combined_Key.endsWith("US")) {
    //   console.log(Combined_Key);
    //   continue;
    // }
    if (COMBINED_KEY_SKIP_LIST.includes(Combined_Key)) {
      continue;
    }

    if (COMBINED_KEY_REWRITE[Combined_Key]) {
      Combined_Key = COMBINED_KEY_REWRITE[Combined_Key];
    }

    // create the key only if it's the US because US states are not 
    // in the original name space file
    let node = find_key_path(Combined_Key, Combined_Key.endsWith("US"));
    if (!node) {
      console.log("bad key = " + Combined_Key);
      throw ("bad key");
      continue;
    }
    let datekey = date.format("MM/DD/YYYY");
    for (let f of KeyFields) {
      let holder = node[f] ? node[f] : {};
      holder[datekey] = parseInt(line[f]);
      node[f] = holder;
    }
  }
}

async function establish_name_spaces() {
  let file = "../COVID-19/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_deaths_global.csv";
  const json = await csv().fromFile(file);
  for (let entity of json) {
    const state = entity["Province/State"];
    let country = entity["Country/Region"];

    country = country.replace(",", "");
    if (country === "Taiwan*") {
      country = "Taiwan";
    }

    if (state.length === 0) {
      node = find_key_path(country, true);
    } else {
      node = find_key_path([state, country].join(","), true);
    }
  }
}

async function process_all_JHU_files() {
  for (let d = moment("01/22/2020", "MM/DD/YYYY"); d.isBefore(moment()); d = d.add(1, "days")) {
    let file = `../COVID-19/csse_covid_19_data/csse_covid_19_daily_reports/${d.format("MM-DD-YYYY")}.csv`;
    if (fs.existsSync(file)) {
      const json = await csv().fromFile(file);
      await process_one_JHU_file(json, d)
    } else {
      console.log(`Data file ${file} is missing`)
    }
  }
}

function summarize_recursively(data) {
  let Summary = {};
  let aggregate = {};
  let leafnode = true;

  for (const key of KeyFields) {
    aggregate[key] = {};
  }

  for (let key in data) {
    let value = data[key];
    if (!KeyFields.includes(key)) {
      leafnode = false;
      summarize_recursively(value);
      for (const key1 of KeyFields) {
        Util.mergeTwoMapValues(aggregate[key1], value[key1]);
      }

    } else {
      const CC = Util.getValueFromLastDate(value);
      Summary["Last" + key] = CC.num;
      Summary[`Last${key}New`] = CC.newnum;
    }
  }

  if (!leafnode) {
    for (const key of KeyFields) {
      data[key] = aggregate[key];
      const CC = Util.getValueFromLastDate(aggregate[key]);
      Summary["Last" + key] = CC.num;
      Summary[`Last${key}New`] = CC.newnum;
    }
  }
  data.Summary = Summary;
}

async function main() {
  await establish_name_spaces();
  await process_all_JHU_files();
  summarize_recursively(WorldData);
}

main().then(() => {
  WorldData["United States"] = WorldData.US;
  delete WorldData.US;
  const content = JSON.stringify(WorldData, null, 2);
  fs.writeFileSync("./src/data/WorldData.json", content);
})