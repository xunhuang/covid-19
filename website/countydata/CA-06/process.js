const moment = require("moment");
const fs = require('fs');
const csv = require('csvtojson');
const raw = "./hospitals_by_county.raw.csv";

async function main() {
    const json = await csv().fromFile(raw);

    return json;
}

main().then((result) => {
    // const content = JSON.stringify(hierarchical, null, 2);
    // fs.writeFileSync("./src/data/WorldData.json", content);
    console.log(result);
});
