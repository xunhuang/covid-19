const firebase = require("firebase");
require("firebase/firestore");
require("firebase/storage");
const firebaseConfig = require('../website/src/firebaseConfig.json');
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const moment = require("moment");
var states = require('us-state-codes');

global.XMLHttpRequest = require("xhr2");

function snapshotToArray(snapshot) {
    var returnArr = []
    snapshot.forEach(function (childSnapshot) {
        returnArr.push(childSnapshot.data());
    });
    return returnArr;
};

const { Storage } = require('@google-cloud/storage');
const storage = new Storage();

bucketname = firebaseConfig.storageBucket;

async function uploadDataToBlobStoreNoComment(info) {
    const myBucket = storage.bucket(bucketname);
    let contents = JSON.stringify(info, 2, 2);
    try {
        let file = myBucket.file('abridged');
        await file.save(contents);
    } catch{ }
}

async function uploadDataToBlobStore(info) {
    const myBucket = storage.bucket(bucketname);
    let contents = JSON.stringify(info, 2, 2);
    try {
        let file = myBucket.file('latest');
        await file.save(contents);
    } catch{ }
    try {
        let file = myBucket.file('archive/' + info.timestamp);
        await file.save(contents);
    } catch{ }
}

async function updateDataInDB(info) {
    let docRef = db.collection("DATA").doc("latest1");
    await docRef.set(info).then((doc) => {
        console.log(`done updating latest`);
    }).catch(err => {
        console.log(err);
        return null;
    });

    docRef = db.collection("ARCHIVED_DATA").doc(info.timestamp);
    await docRef.set(info).then((doc) => {
        console.log(`done updating archive`);
    }).catch(err => {
        console.log(err);
        return null;
    });
}

var cases = require('../website/src/data/1.3cases.json');

function pad(n) { return n < 10 ? '0' + n : n }

async function doit() {
    let time = moment();
    cases = cases.map(c => {
        let d = c.confirmed_date.split("/");
        c.fulldate = pad(d[0]) + '/' + pad(d[1]) + '/' + 2020;
        // c.state_full_name = states.getStateNameByStateCode(c.state_name);
        c.die = c["die_count"];
        return c
    });

    let info = {
        timestamp: time.format(),
        // data: JSON.stringify(cases, 0, 2),
        data1: cases,
    }

    await uploadDataToBlobStore(info);
    // await updateDataInDB(info);

    cases = cases.map(c => {
        delete c["comments"];
        delete c["links"];
        delete c["comments_en"];
        delete c["gender"];
        delete c["id"];
        delete c["die_count"];
        delete c["num"];
        delete c["comments"];
        delete c["links"];
        return c;
    });

    info = {
        timestamp: time.format(),
        data1: cases,
    }
    await uploadDataToBlobStoreNoComment(info);
    process.exit();
}

doit();

