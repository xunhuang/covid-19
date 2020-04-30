
const moment = require("moment");
function pad(n) { return n < 10 ? '0' + n : n }

//    3/26/20 ===> 03/26/2020
function normalize_date(k) {
  let p = k.split("/");
  if (p.length !== 3) {
    return null;
  }
  let m = pad(parseInt(p[0]));
  let d = pad(parseInt(p[1]));
  let y = p[2];
  if (y.length === 2) {
    y = "20" + y;
  }
  return `${m}/${d}/${y}`;
}

function getValueFromLastDate(v, comment) {
  if (!v || Object.keys(v).length === 0) {
    return { num: 0, newnum: 0 }
  }
  if (Object.keys(v).length === 1) {
    let ret = {
      num: Object.values(v)[0],
      newnum: Object.values(v)[0],
    }
    return ret;
  }
  let nv = Object.keys(v).sort((a, b) => moment(b, "MM/DD/YYYY").toDate() - moment(a, "MM/DD/YYYY").toDate());

  let last = v[nv[0]]
  let newnum = v[nv[0]] - v[nv[1]];
  if (newnum < 0) {
    newnum = 0;
  }
  return { num: last, newnum: newnum };
}

function mergeTwoMapValues(m1, m2) {
  for (let i in m2) {
    let a = m1[i];
    if (isNaN(a)) {
      a = 0;
    }
    if (!isNaN(m2[i])) {
      a += m2[i];
    }
    m1[i] = a;
  }
}

const Util = {
  normalize_date,
  getValueFromLastDate,
  mergeTwoMapValues,
}

exports.Util = Util;
