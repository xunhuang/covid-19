import React from 'react';
import { Switch, Route, withRouter } from 'react-router-dom'
import { BrowserRouter } from 'react-router-dom';
import { GoogleMap, Marker, LoadScript } from '@react-google-maps/api'
import { makeStyles } from '@material-ui/core/styles';
import { countyModuleInit, lookupCountyInfo } from "./USCountyInfo.js";
import * as USCounty from "./USCountyInfo.js";
import { Splash } from './Splash.js';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import { NearbyCounties, CountiesForStateWidget, AllStatesListWidget } from "./CountyListRender.js"
import { BasicGraphNewCases } from "./GraphNewCases.js"
import { GraphUSTesting, GraphStateTesting } from "./GraphTestingEffort"
import { withHeader } from "./Header.js"
import { MyTabs } from "./MyTabs.js"
import { USInfoTopWidget } from './USInfoTopWidget.js'

const states = require('us-state-codes');
const Cookies = require("js-cookie");
const superagent = require("superagent");
const moment = require("moment");
const firebase = require("firebase");

require("firebase/firestore");
const firebaseConfig = require('./firebaseConfig.json');
firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();
const logger = firebase.analytics();
var Hospitals = require('./hospitals.json');

const useStyles = makeStyles(theme => ({
  table: {
    width: "100%"
  },
}));

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
    expires: 7  // 7 day, people are not supposed to be moving anyways
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

const USCountyInfoWidget = withRouter((props) => {
  const value = props.state ? (props.county ? 0 : 1) : 2;

  const state = props.state ? props.state : "CA";
  const county = props.county ? props.county : USCounty.countyDataForState(state)[0].County;

  let state_title = states.getStateNameByStateCode(state);

  let countyInfo = lookupCountyInfo(state, county);
  if (!countyInfo) {
    countyInfo = {
      HospitalBeds: "N/A",
      Hospitals: "N/A",
    }
  }

  let county_cases = USCounty.casesForCounty(state, county);
  let state_mycases = USCounty.casesForState(state);
  let graphlistSection;
  let useLogScale = false;

  if (value === 0) {

    const tabs = [
      <BasicGraphNewCases casesData={county_cases} logScale={useLogScale} />,
      <GraphStateTesting state={state} />,
    ]
    graphlistSection = <MyTabs
      labels={["Confirmed Cases", `${state_title} Testing`]}
      tabs={tabs}
    />;
  }
  if (value === 1) {
    const tabs = [
      <BasicGraphNewCases casesData={state_mycases} logScale={useLogScale} />,
      <GraphStateTesting state={state} />,
    ]
    graphlistSection = <MyTabs
      labels={["Confirmed Cases", `${state_title} Testing`]}
      tabs={tabs}
    />;
  }
  if (value === 2) {
    const tabs = [
      <BasicGraphNewCases casesData={props.casesData} logScale={useLogScale} />,
      <GraphUSTesting />,
    ]
    graphlistSection = <MyTabs
      labels={["Confirmed Cases", `National Testing`]}
      tabs={tabs}
    />;
  }
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

async function fetchUSCaseDataFull() {
  let result = await firebase.functions().httpsCallable('datajson')();
  return result;
}

async function fetchCountyCases(state, county) {
  let result = await firebase.functions().httpsCallable('datajsonCounty')({
    state: state,
    county: county,
  });
  return result;
}

async function fetchStateCases(state) {
  let result = await firebase.functions().httpsCallable('datajsonState')({
    state: state,
  });
  return result;
}

const CountyDetailCaseList = (props) => {
  const [county_cases, setDetailCases] = React.useState(null);
  React.useEffect(() => {
    fetchCountyCases(props.state, props.county).then((result, b) => {
      setDetailCases(result.data.data.sort(sort_by_date));
    });
  }, [props.state, props.county]);

  if (!county_cases) {
    return <div> Loading</div>;
  }
  return <DetailCaseListWidget cases={county_cases} />;
}

function sort_by_date(a, b) {
  return moment(b.fulldate).toDate() - moment(a.fulldate).toDate();
};

const StateDetailCaseListWidget = (props) => {
  const [state_cases, setDetailCases] = React.useState(null);
  React.useEffect(() => {
    fetchStateCases(props.state).then((result, b) => {
      setDetailCases(result.data.data.sort(sort_by_date));
    });
  }, [props.state]);

  if (!state_cases) {
    return <div> Loading</div>;
  }
  return <DetailCaseListWidget cases={state_cases} />;
}
const EntireUSDetailCaseListWidget = (props) => {
  const [us_cases, setDetailCases] = React.useState(null);
  React.useEffect(() => {
    fetchUSCaseDataFull().then((result, b) => {
      setDetailCases(result.data.data.sort(sort_by_date));
    });
  }, []);

  if (!us_cases) {
    return <div> Loading</div>;
  }
  return <DetailCaseListWidget cases={us_cases} />;
}

const DetailCaseListWidget = (props) => {
  const classes = useStyles();
  const cases = props.cases;
  let list =
    <Table className={classes.table} size="small" aria-label="simple table">
      <TableHead>
        <TableRow>
          <TableCell > Date</TableCell>
          <TableCell align="center">Count</TableCell>
          <TableCell align="left">Detail</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {cases.map(row => (
          <TableRow key={row.id}>
            <TableCell component="th" scope="row">
              {row.confirmed_date}
            </TableCell>
            <TableCell align="center">{row.people_count}</TableCell>
            <TableCell align="left">{row.comments_en}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table >
  return list;
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


const EntireUSWidget = withHeader((props) => {
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
        county={props.county}
        state={props.state}
        selectedTab={"usa"}
        callback={(newcounty, newstate) => {
          browseTo(props.history, newstate, newcounty);
        }}
      />
      <USCountyInfoWidget
        casesData={casesData}
        callback={(newcounty, newstate) => {
          browseTo(props.history, newstate, newcounty);
        }}
      />
      <MyTabs
        labels={["States of USA", "Case Details"]}
        tabs={tabs}
      />
    </>
  );
});

const CountyWidget = withHeader((props) => {
  const state = props.match.params.state;
  const county = props.match.params.county;
  const casesData = props.casesData;

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
  ];
  return (
    <>
      <USInfoTopWidget
        casesData={casesData}
        county={county}
        state={state}
        selectedTab={"county"}
        callback={(newcounty, newstate) => {
          browseTo(props.history, newstate, newcounty);
        }}
      />
      <USCountyInfoWidget
        casesData={casesData}
        county={county}
        state={state}
        callback={(newcounty, newstate) => {
          browseTo(props.history, newstate, newcounty);
        }}
      />
      <MyTabs
        labels={["Nearby Counties", "Case Details"]}
        tabs={tabs}
      />
    </>
  );
});

const StateWidget = withHeader((props) => {
  const state = props.match.params.state;
  const county = props.match.params.county;
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
        casesData={casesData}
        county={county}
        state={state}
        selectedTab={"state"}
        callback={(newcounty, newstate) => {
          browseTo(props.history, newstate, newcounty);
        }}
      />
      <USCountyInfoWidget
        casesData={casesData}
        county={county}
        state={state}
        callback={(newcounty, newstate) => {
          browseTo(props.history, newstate, newcounty);
        }}
      />
      <MyTabs
        labels={[`Counties of ${states.getStateNameByStateCode(state)} `, "Case Details"]}
        tabs={tabs}
      />
    </>);
});

export default App;
