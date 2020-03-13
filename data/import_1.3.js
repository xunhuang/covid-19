const firebase = require("firebase");
require("firebase/firestore");
const firebaseConfig = require('../website/src/firebaseConfig.json');
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const superagent = require('superagent');
const cheerio = require('cheerio');

function snapshotToArray(snapshot) {
    var returnArr = []
    snapshot.forEach(function (childSnapshot) {
        returnArr.push(childSnapshot.data());
    });
    return returnArr;
};

async function findCountyInDB(state_shortname, countyname) {
    var county = await db.collection("US_COUNTIES")
        .where("STATE_SHORT_NAME", "==", state_shortname)
        .where("NAME", "==", countyname)
        .get().then((querySnapshot) => {
            venues = snapshotToArray(querySnapshot);
            if (venues.length !== 1) {
                return null;
            }
            return venues[0];
        });
    return county;
}

async function updateCountyInfoInDB(key, info) {
    let docRef = db.collection("US_COUNTIES").doc(key);
    info.hasData = true;
    await docRef.update(info).then((doc) => {
        console.log(`done updating ${key}`);
    }).catch(err => {
        console.log(err);
        return null;
    });
}

var fs = require('fs');
var cases_to_eval = fs.readFileSync('./new.js');

cases = eval(cases_to_eval.toString());

async function doit() {
    let g = cases.reduce((result, c) => {
        let group = result[c.county];
        if (group) {
            group.push(c);
        } else {
            group = [c];
        }
        result[c.county] = group;
        return result;
    }, {});
    let g_group = Object.keys(g).reduce((result, key) => {
        county = g[key];
        total = county.reduce((sum, c) => {
            sum += c.people_count;
            return sum;
        }, 0);
        result[key] = total;
        return result;
    }, {});

    // console.log(JSON.stringify(g, 0, 2));
    console.log(JSON.stringify(g_group, 0, 2));
    process.exit();
}

doit();
