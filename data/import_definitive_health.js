const firebase = require("firebase");
require("firebase/firestore");
const firebaseConfig = require('../website/src/firebaseConfig.json');
const getDistance = require('geolib').getDistance;
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const h_info = require('./healthcare.json').features;
const h2_info = require('./hospitals.json').features;

const h3_info = h2_info.reduce((m, h) => {
    m[h.NAME + h.COUNTYFIPS] = h;
    return m;
}, {})

function snapshotToArray(snapshot) {
    var returnArr = []
    snapshot.forEach(function (childSnapshot) {
        returnArr.push(childSnapshot.data());
    });
    return returnArr;
};

async function saveHospitalInDB(newState) {
    let docRef = db.collection("DEFINITIVE_HOSPITALS").doc();
    newState.key = docRef.id;
    console.log(newState);
    await docRef.set(newState).then((doc) => {
        console.log(`done adding new hospitals ${newState.HOSPITAL_NAME}`);
    }).catch(err => {
        console.log(err);
        return null;
    });
    return newState;
}

async function saveCountyInDB(county) {
    let docRef = db.collection("US_COUNTIES").doc();
    county.key = docRef.id;
    console.log(county);
    await docRef.set(county).then((doc) => {
        console.log(`done adding new county ${county.NAME}`);
    }).catch(err => {
        console.log(err);
        return null;
    });
    return county;
}

async function countyGeoIDExistURLInDB(geoid) {
    var exist = await db.collection("US_COUNTIES")
        .where("GEO_ID", "==", geoid)
        .get().then((querySnapshot) => {
            venues = snapshotToArray(querySnapshot);
            return venues.length != 0;
        });
    if (exist) {
        return true;
    }
    return exist;
}

async function stateNamExistURLInDB(name) {
    var exist = await db.collection("US_STATES")
        .where("NAME", "==", name)
        .get().then((querySnapshot) => {
            venues = snapshotToArray(querySnapshot);
            return venues.length != 0;
        });
    if (exist) {
        return true;
    }
    return exist;
}


function findhospital(info, LONGITUDE, LATITUDE) {
    let dd = h2_info.map(h => {
        h.d = getDistance(
            {
                latitude: h.properties.LATITUDE,
                longitude: h.properties.LONGITUDE
            },
            {
                latitude: LATITUDE,
                longitude: LONGITUDE
            }
        );
        return h;
    })
    match = dd.sort((a, b) => a.d - b.d)[0];
    if (match.d < 500) {
        return match;
    }
    if (match.d < 2000) {
        name1 = info.HOSPITAL_NAME.toUpperCase().trim().replace(/ /g, "");
        name2 = match.properties.NAME.toUpperCase().trim().replace(/ /g, "");
        if (name1 === name2) {
            console.log(".....................");
            return match;
        }

        address1 = info.HQ_ADDRESS.toUpperCase().trim();
        address2 = match.properties.ADDRESS.toUpperCase().trim();
        if (address1 === address2) {
            console.log("++++++++++++++");
            return match;
        }
        console.log("No Match");
        return null;
    }

    console.log("No Match");
    return null;
}

async function doHospitalsImport() {
    for (let i = 0; i < h_info.length; i++) {
        // for (let i = 0; i < 15; i++) {
        let h = h_info[i];
        info = h.properties;

        if (h.geometry) {
            info.LONGITUDE = h.geometry.coordinates[0];
            info.LATITUDE = h.geometry.coordinates[1];

            hmap = findhospital(info, info.LONGITUDE, info.LATITUDE);
            if (hmap) {
                n = hmap.properties;
                info.WEBSITE = n.WEBSITE;
                info.TELEPHONE = n.TELEPHONE;
                info.TYPE = n.TYPE;
                info.HELIPAD = n.HELIPAD;
                info.TRAUMA = n.TRAUMA;
            }
            await saveHospitalInDB(info);
        }
    }
}

async function doit() {
    await doHospitalsImport();
}

doit();