const moment = require("moment");
const fs = require('fs');
const csv = require('csvtojson');
const { exception } = require("console");
const raw = "./hospitals_by_county.raw.csv";
const CountyInfo = require('covidmodule').CountyInfo;

function parseNumber(num) {
    let parsed = Math.round(parseFloat(num));
    if (isNaN(parsed)) {
        return 0;
    }
    return parsed;

}

function processLine(line) {
    const out = {};
    if (!line.county || line.county.length == 0) {
        return null;
    }
    out.CountyName = line.county;
    out.StateFIPS = "06";
    out.CountyFIPS = CountyInfo.getFipsFromStateCountyName("CA", line.county);

    console.assert(out.CountyFIPS);
    if (!out.CountyFIPS) {
        throw ("no county FIPS.")
    }
    out.date = line.todays_date; // YYYY-MM-DD

    out.hospitalized_covid_confirmed_patients = parseNumber(line.hospitalized_covid_confirmed_patients);
    out.hospitalized_suspected_covid_patients = parseNumber(line.hospitalized_suspected_covid_patients);
    out.hospitalized_covid_patients = parseNumber(line.hospitalized_covid_patients);

    if (!out.hospitalized_covid_patients) {
        out.hospitalized_covid_patients = out.hospitalized_covid_confirmed_patients + out.hospitalized_suspected_covid_patients;
    }
    out.all_hospital_beds = parseNumber(line.all_hospital_beds);
    out.icu_covid_confirmed_patients = parseNumber(line.icu_covid_confirmed_patients);
    out.icu_suspected_covid_patients = parseNumber(line.icu_suspected_covid_patients);

    out.icu_covid_patients = out.icu_covid_confirmed_patients + out.icu_suspected_covid_patients;
    out.icu_available_beds = parseNumber(line.icu_available_beds);

    return out;
}

async function main() {
    const json = await csv().fromFile(raw);
    const out = [];
    for (let line of json) {
        let processed = processLine(line);
        if (processed) {
            out.push(processed)
        }
    }
    return out;
}

main().then((result) => {
    const content = JSON.stringify(result, null, 2);
    fs.writeFileSync("./hospitals_by_county.final.json", content);
    console.log(result);
});
