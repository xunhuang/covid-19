const moment = require("moment");
const fs = require('fs');
const csv = require('csvtojson')
const Util = require('covidmodule').Util;

const KeyFields = ["Confirmed", "Active", "Recovered", "Deaths"];
let WorldData = {};

function find_key_path(key) {
  let keyparts = key.split(",");
  let curobject = WorldData;
  while (keyparts.length > 0) {
    let key = keyparts.pop().trim();
    if (key.length === 0) {
      continue;
    }
    if (!curobject[key]) {
      curobject[key] = {};
    }
    curobject = curobject[key];
  }
  return curobject;
}

// date is moment() date
async function process_one_JHU_file(json, date) {
  for (let line of json) {
    let Combined_Key = line.Combined_Key;
    if (!Combined_Key || Combined_Key.length === 0) {
      const country = line["Country/Region"];
      if (country.length > 0) {
        const province = line["Province/State"];
        if (province && province.length > 0) {
          Combined_Key = province + ", " + country;
        } else {
          Combined_Key = country;
        }
      } else {
        console.log("no key!!!  ");
        console.log(line);
        continue;
      }
    }
    let node = find_key_path(Combined_Key);
    let datekey = date.format("MM/DD/YYYY");
    for (let f of KeyFields) {
      let holder = node[f] ? node[f] : {};
      holder[datekey] = parseInt(line[f]);
      node[f] = holder;
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
  await process_all_JHU_files();
  summarize_recursively(WorldData);
}

main().then(() => {
  const content = JSON.stringify(WorldData, null, 2);
  fs.writeFileSync("./src/data/WorldData.json", content);
})