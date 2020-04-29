
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

const Util = {
  normalize_date,
}

exports.Util = Util;
