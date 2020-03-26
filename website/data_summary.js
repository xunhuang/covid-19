
const AllData = require("./src/data/AllData.json");

console.log("US Total:" + AllData.Summary.LastConfirmed);
console.log("US New:" +  AllData.Summary.LastConfirmedNew);

console.log(" -----------");

const NYC =AllData["36"]["36061"];
console.log("NYC Total:"+ NYC.LastConfirmed);
console.log("NYC Total:" +  NYC.LastConfirmedNew);

console.log(" -----------");

const NYState =AllData["36"].Summary;
console.log("New York State Total:"+ NYState.LastConfirmed);
console.log("New York State Total:" +  NYState.LastConfirmedNew);
