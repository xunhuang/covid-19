const firebase = require("firebase");
require("firebase/firestore");
const firebaseConfig = require('./src/firebaseConfig.json');
firebase.initializeApp(firebaseConfig);

// const db = firebase.firestore();
const superagent = require('superagent');
const fs = require('fs');
const execSync = require('child_process').execSync;
const URLNewCasesJHU = "https://services1.arcgis.com/0MSEUqKaxRlEPj5g/arcgis/rest/services/ncov_cases_US/FeatureServer/0/query?f=json&where=(Confirmed%20%3E%200)%20AND%20(1%3D1)&returnGeometry=false&spatialRel=esriSpatialRelIntersects&outFields=*&orderByFields=OBJECTID%20ASC&resultOffset=0&resultRecordCount=4000&cacheHint=true&quantizationParameters=%7B%22mode%22%3A%22edit%22%7D"
const latestJsonLocation = 'src/data/new-latest.json';
const latestJsonLocationOriginal = 'src/data/latest.json';
const archivelocation = '../data/archive';
const moment = require("moment");

async function fetchRemoteJson(url) {
    return await
        superagent.get(url)
            .then((res) => {
                let textinJosn = res.text;
                return JSON.parse(res.text);
            })
            .catch(err => {
                if (err) {
                    console.log(err);
                }
            });
}

//  return true if sucessful, false if failed
async function processDailyNew() {
    console.log('-----------------------------');
    console.log('Fetching new data ');
    console.log('-----------------------------');
    try {
        let doc = await fetchRemoteJson(URLNewCasesJHU);
        if (doc.features && doc.features.length > 1000) {
            console.log(`New data has ${doc.features.length}`);
            let docstring = JSON.stringify(doc, 2, 2);
            fs.writeFileSync(latestJsonLocation, docstring);

            const archive = archivelocation + "/JHU-" + moment().format("MM-DD-YYYY") + ".json";
            fs.writeFileSync(archive, docstring);
            execSync(`git add ${archive}`);

            console.log("Data file has been updated");
            return true;
        };

    } catch (err) {
        console.error(err);
        return false;
    }
    return false;
}

async function deploy() {

    var spawn = require('child_process').spawn;
    var prc = spawn('npm', ['run', 'deploy']);
    let exitCode = 0;

    prc.stdout.setEncoding('utf8');
    prc.on('close', function (code) {
        console.log('process exit code ' + code);
        exitCode = code;
    });

    for await (const data of prc.stdout) {
        var str = data.toString()
        var lines = str.split(/(\r?\n)/g);
        console.log(lines.join(""));
    };
    console.log("done deploying");
}

async function data_normalization() {

    var spawn = require('child_process').spawn;
    // var prc = spawn('node', ['normalize_data.js']);
    var prc = spawn('npm', ['run', 'data']);
    let exitCode = 0;

    console.log('-----------------------------');
    console.log('Performing data normalization');
    console.log('-----------------------------');

    prc.on('close', function (code) {
        exitCode = code;
    });

    for await (const data of prc.stdout) {
        var str = data.toString()
        var lines = str.split(/(\r?\n)/g);
        console.log(lines.join(""));
    };
    return exitCode;
}

async function data_summary() {

    var spawn = require('child_process').spawn;
    var prc = spawn('node', ['data_summary.js']);
    let exitCode = 0;

    prc.on('close', function (code) {
        exitCode = code;
    });

    for await (const data of prc.stdout) {
        var str = data.toString()
        var lines = str.split(/(\r?\n)/g);
        console.log(lines.join(""));
    };
    return exitCode;
}

async function rundiff(file1, file2) {
    var spawn = require('child_process').spawn;
    var prc = spawn('diff', ['-w', latestJsonLocation, latestJsonLocationOriginal]);
    let linecount = 0;
    for await (const data of prc.stdout) {
        var str = data.toString()
        var lines = str.split(/(\r?\n)/g);
        linecount += lines.length;
        // console.log(lines.join(""));
    };
    return linecount;
}

async function doit() {
    console.log("Last executed:" + moment().format());
    if (await processDailyNew()) {
        let lineschanged = await rundiff(latestJsonLocation, latestJsonLocationOriginal);
        console.log(`Got updates.  ${lineschanged} lines changed`);

        if (lineschanged > 20) {
            // execSync(`git pull`);
            execSync(`cp -f ${latestJsonLocation} ${latestJsonLocationOriginal}`);
            await data_normalization();
            await data_summary();
            execSync(`node normalize_data.js`);
            console.log("Deploying");
            await deploy();
            execSync(`git commit -am "data push"`);
            execSync(`git push `);
        } else {
            await data_summary();
        }

    } else {
        console.log("Fail to get new updates");
    }
}

doit();
