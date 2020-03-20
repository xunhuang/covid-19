const functions = require('firebase-functions');
const cors = require('cors')({ origin: true });
var admin = require('firebase-admin');
admin.initializeApp();
const firestore = require('@google-cloud/firestore');
const db = admin.firestore();

const { Storage } = require('@google-cloud/storage');
const storage = new Storage();

exports.helloWorld = functions.https.onRequest((request, response) => {
   response.send("Hello from Firebase!");
});

async function getDataJsonWhich(f) {
   const myBucket = storage.bucket('covid-19-live.appspot.com');
   const file = myBucket.file(f);
   let result = await file.download();
   let str = result.toString();
   return str;
}

async function getDataJsonNew() {
   const myBucket = storage.bucket('covid-19-live.appspot.com');
   const file = myBucket.file('latest');
   let result = await file.download();
   let str = result.toString();
   return str;
}

exports.datajsonShort = functions.https.onRequest((req, res) => {
   cors(req, res, async () => {
      let json = JSON.parse(await getDataJsonWhich("abridged"));
      res.send({
         data: {
            generationTime: json.timestamp,
            data: json.data1,
         }
      });
   })
});

exports.datajson = functions.https.onRequest((req, res) => {
   cors(req, res, async () => {
      let json = JSON.parse(await getDataJsonNew());
      res.send({
         data: {
            generationTime: json.timestamp,
            data: json.data1,
         }
      });
   })
});

exports.datajsonNew = functions.https.onRequest((req, res) => {
   cors(req, res, async () => {
      let json = JSON.parse(await getDataJsonNew());
      res.send({
         data: {
            generationTime: json.timestamp,
            data: json.data1,
         }
      });
   })
});