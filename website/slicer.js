const fs = require('fs');
const AllData = require("./src/data/AllData.json");

const topdir = "./public/AllData";
mkdir_p(topdir);

fs.writeFileSync(`${topdir}/AllData.json`,JSON.stringify(AllData));

function mkdir_p(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
}

for (const [id, data] of Object.entries(AllData)) {
    // Check if this looks like a state FIPS id
    if (isNaN(id)) {
        continue;
    }
    let statedir = `${topdir}/${id}`;
    mkdir_p(statedir);
    for (const [county_id, county] of Object.entries(data)) {
        if (isNaN(county_id)) {
            continue;
        }
        fs.writeFileSync(`${statedir}/${county_id}.json`,
            JSON.stringify(county, null, 2));
        AllData[id][county_id].Confirmed = null;
        AllData[id][county_id].Death = null;
        AllData[id][county_id].Recovered = null;
    }

    fs.writeFileSync(`${statedir}/summary.json`,
        JSON.stringify(data, null, 2));
    // AllData[id].Summary.Confirmed = null;
    // AllData[id].Summary.Death = null;
    // AllData[id].Summary.Recovered = null; 
}

let metrodir = `${topdir}/metro`;
mkdir_p(metrodir);
for (const [id, data] of Object.entries(AllData.Metros)) {
    fs.writeFileSync(`${metrodir}/${id}.json`,
        JSON.stringify(data, null, 2));
    // AllData.Metros[id].Summary.Confirmed = null;
    // AllData.Metros[id].Summary.Death = null;
    // AllData.Metros[id].Summary.Recovered = null;
}

// AllData.Summary.Confirmed = null;
// AllData.Summary.Death = null;
// AllData.Summary.Recovered = null;

// console.log(JSON.stringify(AllData, null, 2))
fs.writeFileSync('./src/data/AllData.slim.json', JSON.stringify(AllData, null, 2));
