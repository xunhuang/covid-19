const superagent = require("superagent");

var cached;

async function fetchNPRProjectionData() {
    if (cached) {
        return cached;
    }
    cached = superagent
        .get("/data/npr_projection.json")
        .then(res => {
            return res.body;
        });
    return cached;
}

export { fetchNPRProjectionData }