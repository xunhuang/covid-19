const firebase = require('firebase/app');
require("firebase/firestore");
require("firebase/analytics");
const firebaseConfig = require('./firebaseConfig.json');
firebase.initializeApp(firebaseConfig);
const logger = firebase.analytics();
const firedb = firebase.firestore();

export { logger, firedb, firebase }
