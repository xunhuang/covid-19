const Cookies = require("js-cookie");

function getDefaultCounty() {
  const county_info = CookieGetLastCounty();
  if (county_info) {
    return county_info;
  }
  return {
    county: "Santa Clara",
    state: "CA",
  }
};

function CookieGetLastCounty() {
  let county_info = Cookies.getJSON("LastCounty");
  return county_info;
}

export {
  getDefaultCounty,
  CookieGetLastCounty,
}; 
