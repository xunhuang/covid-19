import React from 'react';
import { Switch, Route, withRouter } from 'react-router-dom'
import { BrowserRouter } from 'react-router-dom';
import { countyModuleInit } from "./USCountyInfo.js";
import * as USCounty from "./USCountyInfo.js";
import { Splash } from './Splash.js';
import { NearbyCounties } from "./CountyListRender.js"
import { BasicGraphNewCases } from "./GraphNewCases.js"
import { GraphStateTesting } from "./GraphTestingEffort"
import { withHeader } from "./Header.js"
import { MyTabs } from "./MyTabs.js"
import { USInfoTopWidget } from './USInfoTopWidget.js'
import { CountyHospitalsWidget } from "./Hospitals"
import { fetchCounty } from "./GeoLocation"
import { logger } from "./AppModule"
import { PageUS } from "./PageUS"
import { PageState } from "./PageState"

const moment = require("moment");

const states = require('us-state-codes');
const Cookies = require("js-cookie");

const GraphSectionCounty = withRouter((props) => {
  const state = props.state;
  const county = props.county;
  let state_title = states.getStateNameByStateCode(state);

  let graphdata = USCounty.getCountyDataForGrapth(state, county);
  let countySummary = USCounty.casesForCountySummary(state, county);
  let stayHomeOrder = countySummary.stayHomeOrder;

  const tabs = [
    <BasicGraphNewCases
      data={graphdata}
      logScale={false}
      vRefLines={
        stayHomeOrder ?
          [{
            date: moment(stayHomeOrder.StartDate
            ).format("M/D"),
            label: "Stay-At-Home Order",
          }] : []
      }
    />,
    <GraphStateTesting state={state} />,
  ]
  let graphlistSection = <MyTabs
    labels={["Confirmed Cases", `${state_title} Testing`]}
    tabs={tabs}
  />;
  return graphlistSection;
});

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

const MainApp = withRouter((props) => {
  const [county, setCounty] = React.useState(null);
  const [state, setState] = React.useState(null);
  React.useEffect(() => {
    fetchCounty().then(mycounty => {
      countyModuleInit([]);
      setCounty(mycounty.county)
      setState(mycounty.state);
      logger.logEvent("AppStart", {
        county: mycounty.county,
        state: mycounty.state,
      });
    });
  }, []);

  // return <Splash />
  if (state === null) {
    return <Splash />
  }

  if (props.location.pathname === "/") {
    browseTo(props.history, state, county);
  }
  return (
    <div>
      <Switch>
        {/* <Route exact path='/' component={App2} /> */}
        <Route exact path='/county/:state/:county' render={(props) => <CountyWidget {...props} state={state} county={county} />} />
        <Route exact path='/state/:state' render={(props) => <PageState {...props} state={state} county={county} />} />
        <Route exact path='/US' render={(props) => <PageUS {...props} state={state} county={county} />} />
      </Switch>
    </div>
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

const CountyWidget = withHeader((props) => {
  const state = props.match.params.state;
  const county = props.match.params.county;

  CookieSetLastCounty(state, county);

  const tabs = [
    <NearbyCounties
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
export default App;
