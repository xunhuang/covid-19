
const AllData = require("./src/data/AllData.json");

console.log(" -----------");

console.log("US Total:" + AllData.Summary.LastConfirmed);
console.log("US New:" + AllData.Summary.LastConfirmedNew);

console.log(" -----------");

const NYC = AllData["Metros"]["NYC"].Summary;
console.log("NYC Total:" + NYC.LastConfirmed);
console.log("NYC New:" + NYC.LastConfirmedNew);

console.log(" -----------");

const NYState = AllData["36"].Summary;
console.log("New York State Total:" + NYState.LastConfirmed);
console.log("New York State New: " + NYState.LastConfirmedNew);

const NYUnAssigned = AllData["36"]["0"];
console.log("New YORK Unassigned :" + NYUnAssigned.LastConfirmed);

console.log(" -----------");

const NJState = AllData["34"].Summary;
console.log("New Jersey State Total: " + NJState.LastConfirmed);
console.log("New Jersey State New: " + NJState.LastConfirmedNew);

const NJUnAssigned = AllData["34"]["0"];
console.log("New Jersey Unassigned: " + NJUnAssigned.LastConfirmed);

console.log(" -----------");
console.log("data generated: " + AllData.Summary.generated);
