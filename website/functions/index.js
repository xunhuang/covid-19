const functions = require('firebase-functions');
const cors = require('cors')({ origin: true });
var admin = require('firebase-admin');
admin.initializeApp();
const firestore = require('@google-cloud/firestore');
const db = admin.firestore();

exports.helloWorld = functions.https.onRequest((request, response) => {
   response.send("Hello from Firebase!");
});

async function getDataJson() {
   return await db.collection("DATA").doc("latest1").get()
      .then(function (doc) {
         if (doc.exists) {
            return doc.data();
         } else {
            console.log("No such document!");
         }
         return {
            timestamp: "no data",
            data: "{}"
         }
      });
}

exports.datajson = functions.https.onRequest((req, res) => {
   cors(req, res, async () => {
      let json = await getDataJson();
      res.send({
         timestamp: json.timestamp,
         time: json.timestamp,
         data: json.data1,
      });
   })
});
