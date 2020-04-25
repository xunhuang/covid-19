const moment = require("moment")

/*
* merge array on "fulldate" keys
*    array1 = [{ fulldate: '12/22/2292", field1: "xxx"} ]
*    array2 = [{ fulldate: '12/22/2292", field2: "xxx"} ]

* Result
*
*    = [{fulldate: '12/22/2292", field1:"xxx", field2: "xxx"} ]
*/

export function mergeDataSeries(entry1, entry2) {
  let map1 = entry1.reduce((m, a) => {
    m[a.fulldate] = a;
    return m;
  }, {});

  for (let e2 of entry2) {
    let mitem = map1[e2.fulldate] ?? {};
    mitem = {
      ...mitem,
      ...e2,
    };
    map1[e2.fulldate] = mitem;
  }
  return Object.values(map1);
}

export function makeDataSeriesFromTotal(data, key_total, key_daily, key_moving) {
  let sorteddata = Object.keys(data).sort((a, b) => moment(a, "MM/DD/YYYY").toDate() - (moment(b, "MM/DD/YYYY")).toDate());
  let m = [];

  for (let date of sorteddata) {
    let entry = data[date];
    if (entry) {
      let item = {}
      item.fulldate = date;
      item[key_total] = entry;
      let lastday = moment(date, "MM/DD/YYYY").subtract(1, "days").format("MM/DD/YYYY");
      let lastentry = data[lastday];
      if (lastentry !== null) {
        item[key_daily] = entry - lastentry;
        if (item[key_daily] < 0) {
          item[key_daily] = 0; // really don't like this as this implies data error
        }
      }
      m.push(item);
    }
  }

  if (key_moving && m.length > 0) {
    let len = m.length;
    for (let i = 1; i < len - 1; i++) {
      var mean = (m[i][key_daily] + m[i - 1][key_daily] + m[i + 1][key_daily]) / 3.0;
      m[i][key_moving] = mean;
    }
    m[0][key_moving] = (m[0][key_daily] + m[1][key_daily]) / 2;
    m[len - 1][key_moving] = (m[len - 1][key_daily] + m[len - 2][key_daily]) / 2;
  }

  return m;
}

export function computeMovingAverage(data, key_daily, key_moving) {
  let m = sortByFullDate(data);
  let len = m.length;
  for (let i = 1; i < len - 1; i++) {
    var mean = (m[i][key_daily] + m[i - 1][key_daily] + m[i + 1][key_daily]) / 3.0;
    m[i][key_moving] = mean;
  }
  m[0][key_moving] = (m[0][key_daily] + m[1][key_daily]) / 2;
  m[len - 1][key_moving] = (m[len - 1][key_daily] + m[len - 2][key_daily]) / 2;
  return m;
}

/*
[
{fulldate: "02/28/2020", total: 9, testsThatDay: NaN, testsThatDay_avg: NaN}
{fulldate: "02/29/2020", total: 18, testsThatDay: 9, testsThatDay_avg: NaN}
{fulldate: "03/01/2020", total: 40, testsThatDay: 22, testsThatDay_avg: 14.666666666666666}
{fulldate: "03/02/2020", total: 53, testsThatDay: 13, testsThatDay_avg: 27.333333333333332}
{fulldate: "03/03/2020", total: 100, testsThatDay: 47, testsThatDay_avg: 343.6666666666667}
: {fulldate: "03/04/2020", total: 1071, testsThatDay: 971, testsThatDay_avg: 463.3333333333333}
: {fulldate: "03/05/2020", total: 1443, testsThatDay: 372, testsThatDay_avg: 780}
: {fulldate: "03/06/2020", total: 2440, testsThatDay: 997, testsThatDay_avg: 640}
]

exportColumnFromDataSeries (data, "total") 

===> 

{ 
 "02/28/2020", : 9, 
 "02/29/2020" : 18, 
 "03/01/2020" : 40
 ...
}

*/
export function exportColumnFromDataSeries(data, column) {
  let ret = data.reduce((m, b) => {
    m[b.fulldate] = b[column];
    return m;
  }, {})
  return ret
}

export function sortByFullDate(data) {
  return data.sort((a, b) => moment(a.fulldate, "MM/DD/YYYY").toDate() - (moment(b.fulldate, "MM/DD/YYYY")).toDate());
}