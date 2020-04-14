
const DHC = require("./DHC.json");

const CountyTemplate = {
    NUM_ICU_BEDS: 0,
    NUM_LICENSED_BEDS: 0,
    AVG_AVAIL_BEDS: 0,
    NUM_HOSPITALS: 0,
}

let CountyData = {};
let StateData = {};
let USAData = {
    ...CountyTemplate,
};

for (let entry of DHC) {
    let h = entry;
    let county = CountyData[h.FIPS];
    if (!county) {
        county = {
            ...CountyTemplate,
        };
    }
    let state = StateData[h.STATE_FIPS];
    if (!state) {
        state = {
            ...CountyTemplate,
        };
    }
    if (h.NUM_ICU_BEDS) {
        county.NUM_ICU_BEDS += h.NUM_ICU_BEDS;
        state.NUM_ICU_BEDS += h.NUM_ICU_BEDS;
        USAData.NUM_ICU_BEDS += h.NUM_ICU_BEDS;
    }
    if (h.NUM_LICENSED_BEDS) {
        county.NUM_LICENSED_BEDS += h.NUM_LICENSED_BEDS;
        state.NUM_LICENSED_BEDS += h.NUM_LICENSED_BEDS;
        USAData.NUM_LICENSED_BEDS += h.NUM_LICENSED_BEDS;

        if (h.BED_UTILIZATION) {
            county.AVG_AVAIL_BEDS += h.NUM_LICENSED_BEDS * (1 - h.BED_UTILIZATION);
            state.AVG_AVAIL_BEDS += h.NUM_LICENSED_BEDS * (1 - h.BED_UTILIZATION);
            USAData.AVG_AVAIL_BEDS += h.NUM_LICENSED_BEDS * (1 - h.BED_UTILIZATION);
        }
    }
    county.NUM_HOSPITALS += 1;
    state.NUM_HOSPITALS += 1;
    USAData.NUM_HOSPITALS += 1;

    CountyData[h.FIPS] = county;
    StateData[h.STATE_FIPS] = state;
}

const fs = require('fs');

// console.log(JSON.stringify(CountyData, 2, 2));
// console.log(JSON.stringify(StateData, 2, 2));
// console.log(JSON.stringify(USAData, 2, 2));

fs.writeFileSync("../website/src/data/DFH-County.json", JSON.stringify(CountyData, 2, 2));
fs.writeFileSync("../website/src/data/DFH-State.json", JSON.stringify(StateData, 2, 2));
fs.writeFileSync("../website/src/data/DFH-USA.json", JSON.stringify(USAData, 2, 2));
