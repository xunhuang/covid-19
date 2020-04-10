const all = require("./all.json");
const state = require("./state.json");

const filtered = all.filter (entry => state.includes(entry.location_name));
console.log(JSON.stringify(filtered, 2, 2));
