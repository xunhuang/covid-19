import React from 'react';
import { Switch, Route, withRouter } from 'react-router-dom'
import { BrowserRouter } from 'react-router-dom';
import { GoogleMap, Marker, LoadScript } from '@react-google-maps/api'
import { countyModuleInit } from "./USCountyInfo.js";
import * as USCounty from "./USCountyInfo.js";
import { Splash } from './Splash.js';
import { NearbyCounties, CountiesForStateWidget, AllStatesListWidget } from "./CountyListRender.js"
import { BasicGraphNewCases } from "./GraphNewCases.js"
import { GraphUSTesting, GraphStateTesting } from "./GraphTestingEffort"
import { withHeader } from "./Header.js"
import { MyTabs } from "./MyTabs.js"
import { USInfoTopWidget } from './USInfoTopWidget.js'
import { EntireUSDetailCaseListWidget, CountyDetailCaseList, StateDetailCaseListWidget } from './DetailCaseLists'
import { GraphUSHospitalization, GraphStateHospitalization } from './GraphHospitalization.js'
import { CountyHospitalsWidget } from "./Hospitals"

const states = require('us-state-codes');
const Cookies = require("js-cookie");
const superagent = require("superagent");
const firebase = require("firebase");

require("firebase/firestore");
const firebaseConfig = require('./firebaseConfig.json');
firebase.initializeApp(firebaseConfig);

const logger = firebase.analytics();
var Hospitals = require('./hospitals.json');

var ApproxIPLocation;

async function fetchCounty() {
  let cookie = Cookies.getJSON("covidLocation");
  if (cookie) {
    if (cookie.county && cookie.state) {
      console.log("cookie hit");
      return cookie;
    }
  }

  let location = await fetchApproxIPLocation();

  let county_info = await superagent
    .get("https://geo.fcc.gov/api/census/area")
    .query({
      lat: location.latitude,
      lon: location.longitude,
      format: "json",
    }).then(res => {
      let c = res.body.results[0].county_name;
      let s = res.body.results[0].state_code;
      return {
        county: c,
        state: s,
      }
    })
    .catch(err => {
      return {
        county: "Santa Clara",
        state: "CA",
      }
    });

  Cookies.set("covidLocation", county_info, {
    expires: 90  // 7 day, people are not supposed to be moving anyways
  });

  return county_info;
}

async function fetchApproxIPLocation() {
  return await superagent
    .post(`https://www.googleapis.com/geolocation/v1/geolocate?key=${firebaseConfig.apiKey}`)
    .then(res => {
      ApproxIPLocation = {
        longitude: res.body.location.lng,
        latitude: res.body.location.lat,
      }
      return ApproxIPLocation;
    })
    .catch(err => {
      // fall back if can't determine GPS, this is santa clara
      ApproxIPLocation = {
        longitude: -121.979891,
        latitude: 37.333183,
      }
      return ApproxIPLocation;
    });
}

const GraphSectionUS = withRouter((props) => {
  let graphdata = USCounty.getUSDataForGrapth();
  let readyForGraph = dataMapToGraphSeries(graphdata);

  const tabs = [
    <BasicGraphNewCases data={readyForGraph} casesData={props.casesData} logScale={false} />,
    <GraphUSTesting />,
    <GraphUSHospitalization />,
  ]
  let graphlistSection = <MyTabs
    labels={["Cases", `USA Testing`, "Hospitalization"]}
    tabs={tabs}
  />;
  return graphlistSection;
});

const GraphSectionState = withRouter((props) => {
  const state = props.state;
  let state_title = states.getStateNameByStateCode(state);
  let state_mycases = USCounty.casesForState(state);
  let useLogScale = false;

  let graphdata = USCounty.getStateDataForGrapth(state);
  let readyForGraph = dataMapToGraphSeries(graphdata);

  const tabs = [
    <BasicGraphNewCases data={readyForGraph} casesData={state_mycases} logScale={useLogScale} />,
    <GraphStateTesting state={state} />,
    <GraphStateHospitalization state={state} />,
  ]
  let graphlistSection = <MyTabs
    labels={["Cases", `${state_title} Testing`, "Hospitalization"]}
    tabs={tabs}
  />;
  return graphlistSection;
});

function dataMapToGraphSeries(g) {
  let arr = [];

  for (let i in g) {
    let entry = g[i];
    entry.fulldate = i;
    arr.push(entry);
  }
  return arr;
}

const GraphSectionCounty = withRouter((props) => {
  const state = props.state;
  const county = props.county;
  let state_title = states.getStateNameByStateCode(state);
  let county_cases = USCounty.casesForCounty(state, county);

  let graphdata = USCounty.getCountyDataForGrapth(state, county);
  let readyForGraph = dataMapToGraphSeries(graphdata);
  console.log(readyForGraph);

  const tabs = [
    <BasicGraphNewCases data={readyForGraph} casesData={county_cases} logScale={false} />,
    <GraphStateTesting state={state} />,
  ]
  let graphlistSection = <MyTabs
    labels={["Confirmed Cases", `${state_title} Testing`]}
    tabs={tabs}
  />;
  return graphlistSection;
});

const BasicMap = (props) => {
  const center = {
    lat: 44.58,
    lng: -96.451580,
  }

  let hospitals = Hospitals.features.map(a => {
    return <Marker position={{
      lat: a.geometry.coordinates[1],
      lng: a.geometry.coordinates[0],
    }}
      title={a.properties.NAME}
    />;
  })

  return <div className='map'>
    <div className='map-container'>
      <LoadScript
        id="script-loader"
        googleMapsApiKey={firebaseConfig.apiKey}
      >
        <GoogleMap
          id='traffic-example'
          mapContainerStyle={{
            height: "100vh",
            width: "100%"
          }}
          zoom={4}
          center={center}
        >
          <Marker position={center} />
          {hospitals}
        </GoogleMap>
      </LoadScript>
    </div>
  </div>;
}

async function getCaseData() {
  // let result = await firebase.functions().httpsCallable('datajsonNew')();
  let result = await firebase.functions().httpsCallable('datajsonShort')();
  return result;
}

const App = (props) => {
  return <BrowserRouter>
    <MainApp  {...props} />
  </BrowserRouter>;
};

function browseTo(history, state, county) {
  history.push(
    "/county/" + encodeURIComponent(state) + "/" + encodeURIComponent(county),
    history.search,
  );
}

function browseToState(history, state) {
  history.push(
    "/state/" + encodeURIComponent(state),
    history.search,
  );
}

const MainApp = withRouter((props) => {
  const [county, setCounty] = React.useState("Santa Clara");
  const [state, setState] = React.useState("CA");
  const [casesData, setCaseData] = React.useState(null);
  React.useEffect(() => {
    getCaseData().then(abc => {
      countyModuleInit(abc.data.data, abc.generationTime);
      setCaseData(abc.data.data);
    });
    fetchCounty().then(mycounty => {
      setCounty(mycounty.county)
      setState(mycounty.state);
      logger.logEvent("AppStart", {
        county: mycounty.county,
        state: mycounty.state,
      });
    });
  }, []);

  // return <Splash />
  if (casesData === null || state === null) {
    return <Splash />
  }

  if (props.location.pathname === "/") {
    browseTo(props.history, state, county);
  }
  return (
    <div>
      <Switch>
        {/* <Route exact path='/' component={App2} /> */}
        <Route exact path='/county/:state/:county' render={(props) => <CountyWidget {...props} casesData={casesData} state={state} county={county} />} />
        <Route exact path='/state/:state' render={(props) => <StateWidget {...props} casesData={casesData} state={state} county={county} />} />
        <Route exact path='/US' render={(props) => <EntireUSWidget {...props} casesData={casesData} state={state} county={county} />} />
      </Switch>
    </div>
  );
});

function getDefaultCounty() {
  let county_info = CookieGetLastCounty();
  if (county_info) {
    return county_info;
  }
  return {
    county: "Santa Clara",
    state: "CA",
  }
}

const EntireUSWidget = withHeader((props) => {
  const default_county_info = getDefaultCounty();

  const casesData = props.casesData;
  const tabs = [
    <AllStatesListWidget
      casesData={casesData}
      callback={(newstate) => {
        browseToState(props.history, newstate);
      }}
    ></AllStatesListWidget>,
    <EntireUSDetailCaseListWidget />,
  ];
  return (
    <>
      <USInfoTopWidget
        casesData={casesData}
        county={default_county_info.county}
        state={default_county_info.state}
        selectedTab={"usa"}
        callback={(newcounty, newstate) => {
          browseTo(props.history, newstate, newcounty);
        }}
      />
      <GraphSectionUS
        casesData={casesData}
        callback={(newcounty, newstate) => {
          browseTo(props.history, newstate, newcounty);
        }}
      />
      <MyTabs
        // labels={["States of USA", "Case Details"]}
        labels={["States of USA"]}
        tabs={tabs}
      />
    </>
  );
});

function CookieSetLastCounty(state, county) {
  let county_info = {
    state: state,
    county: county,
  }

  Cookies.set("LastCounty", county_info, {
    expires: 7  // 7 day, people are not supposed to be moving anyways
  });
}

function CookieGetLastCounty() {
  let county_info = Cookies.getJSON("LastCounty");
  return county_info;
}

const CountyWidget = withHeader((props) => {
  const state = props.match.params.state;
  const county = props.match.params.county;
  const casesData = props.casesData;

  CookieSetLastCounty(state, county);

  const tabs = [
    <NearbyCounties
      casesData={casesData}
      county={county}
      state={state}
      callback={(newcounty, newstate) => {
        browseTo(props.history, newstate, newcounty);
      }}
    />,
    <CountyDetailCaseList
      county={county}
      state={state}
    />,
    <CountyHospitalsWidget
      county={county}
      state={state}
    >
    </CountyHospitalsWidget >,
  ];
  return (
    <>
      <USInfoTopWidget
        county={county}
        state={state}
        selectedTab={"county"}
        callback={(newcounty, newstate) => {
          browseTo(props.history, newstate, newcounty);
        }}
      />
      <GraphSectionCounty
        casesData={casesData}
        county={county}
        state={state}
        callback={(newcounty, newstate) => {
          browseTo(props.history, newstate, newcounty);
        }}
      />
      <MyTabs
        // labels={["Nearby", "Case Details", "Hospitals"]}
        labels={["Nearby", "Hospitals"]}
        tabs={tabs}
      />
    </>
  );
});

function getDefaultCountyForState(state, county) {
  if (county) {
    return county;
  }
  let county_info = CookieGetLastCounty();
  console.log(county_info);
  if (county_info) {
    if (county_info.state === state) {
      return county_info.county;
    }
  }

  // cookie county not match, return the top county
  return USCounty.countyDataForState(state)[0].County;
}

const StateWidget = withHeader((props) => {
  const state = props.match.params.state;
  const county = getDefaultCountyForState(
    props.match.params.state,
    props.match.params.county);
  const casesData = props.casesData;

  const tabs = [
    <CountiesForStateWidget
      casesData={casesData}
      county={county}
      state={state}
      callback={(newcounty, newstate) => {
        browseTo(props.history, newstate, newcounty);
      }}
    />,
    <StateDetailCaseListWidget
      state={state}
    />,
  ];

  return (
    <>
      <USInfoTopWidget
        county={county}
        state={state}
        selectedTab={"state"}
        callback={(newcounty, newstate) => {
          browseTo(props.history, newstate, newcounty);
        }}
      />
      <GraphSectionState
        casesData={casesData}
        state={state}
        callback={(newcounty, newstate) => {
          browseTo(props.history, newstate, newcounty);
        }}
      />
      <MyTabs
        // labels={[`Counties of ${states.getStateNameByStateCode(state)} `, "Case Details"]}
        labels={[`Counties of ${states.getStateNameByStateCode(state)} `]}
        tabs={tabs}
      />
    </>);
});

export default App;
