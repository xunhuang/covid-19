const firebase = require("firebase");
const moment = require("moment");
require("firebase/firestore");
const firebaseConfig = require('./src/firebaseConfig.json');
firebase.initializeApp(firebaseConfig);

const superagent = require('superagent');
const fs = require('fs');
const cheerio = require('cheerio');

const vaccine = require("./vaccine-bloomberg.json");

async function superAgentFetchSource(url) {
  return await
    superagent.get(url)
      .set('user-agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.132 Safari/537.36')
      .set('authority', 'www.bloomberg.com')
      .set('cache-control', 'max-age=0')
      .set('sec-ch-ua', '"Google Chrome";v="87", " Not;A Brand";v="99", "Chromium";v="87"')
      .set('sec-ch-ua-mobile', '?0')
      .set('upgrade-insecure-requests', '1')
      .set('accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9')
      .set('sec-fetch-site', 'none')
      .set('sec-fetch-mode', 'navigate')
      .set('sec-fetch-user', '?1')
      .set('sec-fetch-dest', 'document')
      .then((res) => {
        const html = res.text;
        const $ = cheerio.load(html);
        let data = $("#dvz-data-cave");
        return data.html();;
      })
      .catch(err => {
        if (err) {
          console.log("err" + err);
        }
        return null;
      });
};

async function doit() {
  let datastr = await superAgentFetchSource("https://www.bloomberg.com/graphics/covid-vaccine-tracker-global-distribution/");
  data = JSON.parse(datastr);
  for (entry of data.vaccination.usa) {
    const key = `${entry.fips}/${entry.code}/${entry.parentFips}/${entry.dateUpdated}`;
    vaccine[key] = entry;
    console.log(entry);

  }

  const contentPretty = JSON.stringify(vaccine, null, 2);
  fs.writeFileSync("./vaccine-bloomberg.json", contentPretty);

  let today = moment().format("MM-DD-YYYY");
  fs.writeFileSync(`./src/data/bloomberg-${today}.json`,
    JSON.stringify(data, null, 2));

}

doit();
