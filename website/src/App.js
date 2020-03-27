import React from 'react';
import { Switch, Route, withRouter } from 'react-router-dom'
import { BrowserRouter } from 'react-router-dom';
import { countyModuleInit } from "./USCountyInfo.js";
import * as USCounty from "./USCountyInfo.js";
import { Splash } from './Splash.js';
import { NearbyCounties, CountiesForStateWidget, AllStatesListWidget } from "./CountyListRender.js"
import { BasicGraphNewCases } from "./GraphNewCases.js"
import { GraphUSTesting, GraphStateTesting } from "./GraphTestingEffort"
import { withHeader } from "./Header.js"
import { MyTabs } from "./MyTabs.js"
import { USInfoTopWidget } from './USInfoTopWidget.js'
import { GraphUSHospitalization, GraphStateHospitalization } from './GraphHospitalization.js'
import { CountyHospitalsWidget } from "./Hospitals"
import { fetchCounty } from "./GeoLocation"

const states = require('us-state-codes');
const Cookies = require("js-cookie");
const firebase = require("firebase");

require("firebase/firestore");
const firebaseConfig = require('./firebaseConfig.json');
firebase.initializeApp(firebaseConfig);
const logger = firebase.analytics();

const GraphSectionUS = withRouter((props) => {
  let graphdata = USCounty.getUSDataForGrapth();
  const tabs = [
    <BasicGraphNewCases data={graphdata} casesData={props.casesData} logScale={false} />,
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

  let graphdata = USCounty.getStateDataForGrapth(state);
  console.log(graphdata);

  const tabs = [
    <BasicGraphNewCases data={graphdata} logScale={false} />,
    <GraphStateTesting state={state} />,
    <GraphStateHospitalization state={state} />,
  ]
  let graphlistSection = <MyTabs
    labels={["Cases", `${state_title} Testing`, "Hospitalization"]}
    tabs={tabs}
  />;
  return graphlistSection;
});

function dataMapToGraphSeriesNew(g) {
  let arr = [];

  for (let i in g.Confirmed) {
    let entry = {}
    entry.confirmed = g.Confirmed[i];
    entry.death = g.Death[i];
    entry.recovered = g.Recovered[i];
    entry.active = g.Active[i];
    entry.fulldate = i;
    arr.push(entry);
  }
  return arr;
}

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

  let graphdata = USCounty.getCountyDataForGrapth(state, county);
  // let readyForGraph = dataMapToGraphSeriesNew(graphdata);
  // console.log(readyForGraph);

  const tabs = [
    <BasicGraphNewCases data={graphdata} logScale={false} />,
    <GraphStateTesting state={state} />,
  ]
  let graphlistSection = <MyTabs
    labels={["Confirmed Cases", `${state_title} Testing`]}
    tabs={tabs}
  />;
  return graphlistSection;
});

async function getCaseData() {
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
  const [county, setCounty] = React.useState(null);
  const [state, setState] = React.useState(null);
  const [casesData, setCaseData] = React.useState(true);
  React.useEffect(() => {
    getCaseData().then(abc => {
      countyModuleInit([], abc.generationTime);
      setCaseData([]);
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
  if (county_info) {
    if (county_info.state === state) {
      return county_info.county;
    }
  }

  // cookie county not match, return the top county
  let counties = USCounty.countyDataForState(state).sort((a, b) => b.total - a.total);
  let topcounty = counties[0].County;
  if (topcounty === "Statewide Unallocated") {
    topcounty = counties[1].County;
  }
  return topcounty;
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
        labels={[`Counties of ${states.getStateNameByStateCode(state)} `]}
        tabs={tabs}
      />
    </>);
});

export default App;
