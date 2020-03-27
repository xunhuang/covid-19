
const firebase = require("firebase");
require("firebase/firestore");
const firebaseConfig = require('./firebaseConfig.json');
firebase.initializeApp(firebaseConfig);
const logger = firebase.analytics();
const firedb = firebase.firestore();

export { logger, firedb, firebase }
