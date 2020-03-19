import React from 'react';
import { Switch, Route, withRouter } from 'react-router-dom'
import { BrowserRouter } from 'react-router-dom';
import { GoogleMap, Marker, LoadScript } from '@react-google-maps/api'
import { makeStyles } from '@material-ui/core/styles';
import { countyModuleInit, lookupCountyInfo } from "./USCountyInfo.js";
import * as USCounty from "./USCountyInfo.js";
import Select from 'react-select';
import { Splash } from './Splash.js';

import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import { NearbyCounties, CountiesForStateWidget, AllStatesListWidget } from "./CountyListRender.js"
import { BasicGraphNewCases } from "./GraphNewCases.js"

const useStyles = makeStyles(theme => ({
  row: {
    padding: theme.spacing(1, 1),
    justifyContent: "space-between",
    display: "flex",
  },
  tag: {
    display: "inline-block",
    textAlign: "center",
    backgroundColor: "#f3f3f3",
    borderRadius: 10,
    flex: 1,
    margin: 3,
  },
  tagSelected: {
    display: "inline-block",
    textAlign: "center",
    color: "#FFFFFF",
    backgroundColor: "#00aeef",
    borderRadius: 10,
    flex: 1,
    margin: 3,
  },
  tagTitle: {
    marginTop: 5,
  },
  topTag: {
    fontSize: "0.55rem",
  },
  smallTag: {
    fontSize: "0.6rem",
  },
  mainTag: {
    fontSize: "1.3rem",
  },
  grow: {
    flexGrow: 1,
  },
  table: {
    width: "100%"
  },
}));

var shortNumber = require('short-number');

function myShortNumber(n) {
  if (!n) {
    return "0";
  }
  if (isNaN(n)) {
    n = n.replace(/,/g, '');
    n = Number(n);
  }
  return shortNumber(n);
}

const states = require('us-state-codes');
const Cookies = require("js-cookie");
const superagent = require("superagent");
const moment = require("moment");
const firebase = require("firebase");

require("firebase/firestore");
const firebaseConfig = require('./firebaseConfig.json');
firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();
var Hospitals = require('./hospitals.json');
var ApproxIPLocation;

async function fetchCounty() {
  let cookie = Cookies.getJSON("covidLocation");
  if (cookie) {
    return cookie;
  }
  let location = await fetchApproxIPLocation();

  let county_info = await superagent
    .get("https://geo.fcc.gov/api/census/area")
    .query({
      lat: location.latitude,
      lon: location.longitude,
      format: "json",
    }).then(res => {
      return res.body;
    })
    .catch(err => {
      return null;
    });

  Cookies.set("covidLocation", county_info, {
    expires: 1  // 1 day
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
      console.log(res.body);
      return ApproxIPLocation;
    })
    .catch(err => {
      return null;
    });
}

function snapshotToArrayData(snapshot) {
  var returnArr = []
  snapshot.forEach(function (childSnapshot) {
    returnArr.push(childSnapshot.data());
  });
  return returnArr;
}

async function getCountyFromDb(state_short_name, county_name) {
  let counties = await db.collection("US_COUNTIES")
    .where("STATE_SHORT_NAME", "==", state_short_name)
    .where("NAME", "==", county_name)
    .get().then((querySnapshot) => {
      return snapshotToArrayData(querySnapshot);
    });

  if (counties.length === 1) {
    return counties[0];
  }

  if (counties && counties.length !== 0) {
    console.log("duplicate counties names in the same state");
    console.log(counties);
  }
  return null;
}


const USCountyInfoWidget = withRouter((props) => {
  const classes = useStyles();
  const startvalue = props.state ? (props.county ? 0 : 1) : 2;
  const [value, setValue] = React.useState(startvalue);

  const state = props.state ? props.state : "CA";
  const county = props.county ? props.county : USCounty.countyDataForState(state)[0].County;

  const handleChange = (event, newValue) => {
    setValue(newValue);
    if (newValue === 0) {
      browseTo(props.history, state, county);
    }
    if (newValue === 1) {
      browseToState(props.history, state);
    }
    if (newValue === 2) {
      browseToUSPage(props.history);
    };
  }

  let countyInfo = lookupCountyInfo(state, county);
  if (!countyInfo) {
    countyInfo = {
      HospitalBeds: "N/A",
      Hospitals: "N/A",
    }
  }

  let county_cases = USCounty.casesForCounty(state, county);
  let state_mycases = USCounty.casesForState(state);
  let state_summary = USCounty.casesForStateSummary(state);
  let county_summary = USCounty.casesForCountySummary(state, county);
  let us_summary = USCounty.casesSummary(props.casesData);
  let state_hospitals = USCounty.hospitalsForState(state);

  let graphlist = [
    <BasicGraphNewCases casesData={county_cases} />,
    <BasicGraphNewCases casesData={state_mycases} />,
    <BasicGraphNewCases casesData={props.casesData} />,
  ];

  let state_title = states.getStateNameByStateCode(state);
  let county_title = county;
  let US_title = "US";

  return <div>
    <div className={classes.row} >
      <Tag
        title={county_title}
        confirmed={county_summary.confirmed}
        newcases={county_summary.newcases}
        hospitals={countyInfo.Hospitals}
        beds={countyInfo.HospitalBeds}
        selected={value === 0}
        callback={() => {
          browseTo(props.history, state, county);
        }}
      />
      <Tag title={state_title}
        confirmed={state_summary.confirmed}
        newcases={state_summary.newcases}
        hospitals={state_hospitals.hospitals}
        beds={state_hospitals.beds}
        selected={value === 1}
        callback={() => {
          browseToState(props.history, state);
        }}
      />
      <Tag
        title={US_title}
        confirmed={us_summary.confirmed}
        newcases={us_summary.newcases}
        hospitals={6146}
        beds={924107}
        selected={value === 2}
        callback={() => {
          browseToUSPage(props.history);
        }}
      />
    </div>
    <div>
      {graphlist[value]}
    </div>
  </div >;
});

const Tag = (props) => {
  const classes = useStyles();
  return <div className={props.selected ? classes.tagSelected : classes.tag}
    onClick={() => {
      if (props.callback) {
        props.callback();
      }
    }}
  >
    <div className={classes.tagTitle}> {props.title} </div>
    <div className={classes.row} >
      <section>
        <div className={classes.topTag}>
          +{myShortNumber(props.newcases)}
        </div>
        <div className={classes.mainTag}>
          {myShortNumber(props.confirmed)} </div>
        <div className={classes.smallTag}>
          Confirmed </div>
      </section>
      <section>
        <div className={classes.topTag}>
          {myShortNumber(props.beds)} Beds
          </div>
        <div className={classes.mainTag}>
          {myShortNumber(props.hospitals)} </div>
        <div className={classes.smallTag}>
          Hospitals </div>
      </section>
    </div>
  </div >;
};

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
  let result = await firebase.functions().httpsCallable('datajsonNew')();
  return result;
}

const DetailCaseList = (props) => {
  let countyInfo = lookupCountyInfo(props.state, props.county);
  let county_cases = USCounty.casesForCounty(props.state, props.county).sort(sort_by_date);
  let countySummary = <div />;
  if (countyInfo) {
    countySummary =
      <div>
        <h3> Case details for {props.county}, {states.getStateNameByStateCode(props.state)} </h3>
        <DetailCaseListWidget cases={county_cases} />
      </div>
  }
  return countySummary;
}

function sort_by_date(a, b) {
  return moment(b.fulldate).toDate() - moment(a.fulldate).toDate();
};

const StateDetailCaseListWidget = (props) => {
  let state_cases = USCounty.casesForState(props.state).sort(sort_by_date);
  let countySummary =
    <div>
      <h3> Case details for {states.getStateNameByStateCode(props.state)} </h3>
      <DetailCaseListWidget cases={state_cases} />
    </div>
  return countySummary;
}
const EntireUSDetailCaseListWidget = (props) => {
  let state_cases = USCounty.casesForUS().sort(sort_by_date);
  let countySummary =
    <div>
      <h3> Case details for United States </h3>
      <DetailCaseListWidget cases={state_cases} />
    </div>
  return countySummary;
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

const SearchBox = (props) => {

  let summary = USCounty.getCountySummary(props.casesData);
  let counties = summary.sort((a, b) => b.total - a.total)
    .map(c => {
      return {
        label: `${c.county} , ${c.state_name} (${c.total})`,
        value: c,
      };
    });
  return <Select
    className="basic-single"
    classNamePrefix="select"
    defaultValue={""}
    placeholder={"Search for a County"}
    isDisabled={false}
    isLoading={false}
    isClearable={true}
    isRtl={false}
    isSearchable={true}
    name="county_selection"
    options={counties}
    onChange={param => {
      console.log(param);
      if (props.callback) {
        props.callback(param.value.county, param.value.state_name);
      }

    }}
  />;
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

function browseToUSPage(history) {
  history.push(
    "/US",
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
      setCounty(mycounty.results[0].county_name);
      setState(mycounty.results[0].state_code);
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
        <Route exact path='/county/:state/:county' render={(props) => <CountyWidget {...props} casesData={casesData} />} />
        <Route exact path='/state/:state' render={(props) => <StateWidget {...props} casesData={casesData} />} />
        <Route exact path='/US' render={(props) => <EntireUSWidget {...props} casesData={casesData} />} />
      </Switch>
    </div>
  );
});

const EntireUSWidget = (props) => {
  const casesData = props.casesData;
  return (
    <div className="App">
      <header className="App-header">
        <h2>COVID-19.direct: US Counties</h2>
        <SearchBox
          casesData={casesData}
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
        <AllStatesListWidget
          casesData={casesData}
          callback={(newstate) => {
            browseToState(props.history, newstate);
          }}
        ></AllStatesListWidget>
        <EntireUSDetailCaseListWidget />
        <DataCrediWidget />
      </header>
    </div>
  );
}

const CountyWidget = (props) => {
  const state = props.match.params.state;
  const county = props.match.params.county;
  const casesData = props.casesData;
  return (
    <div className="App">
      <header className="App-header">
        <h2>COVID-19.direct: US Counties</h2>
        <SearchBox
          casesData={casesData}
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
        <NearbyCounties
          casesData={casesData}
          county={county}
          state={state}
          callback={(newcounty, newstate) => {
            browseTo(props.history, newstate, newcounty);
          }}
        />
        <DetailCaseList
          county={county}
          state={state}
        />
        <DataCrediWidget />
      </header>
    </div>
  );
}
const StateWidget = (props) => {
  const state = props.match.params.state;
  const county = props.match.params.county;
  const casesData = props.casesData;

  return (
    <div className="App">
      <header className="App-header">
        <h2>COVID-19.direct: US Counties</h2>
        <SearchBox
          casesData={casesData}
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
        <CountiesForStateWidget
          casesData={casesData}
          county={county}
          state={state}
          callback={(newcounty, newstate) => {
            browseTo(props.history, newstate, newcounty);
          }}
        />
        <StateDetailCaseListWidget
          state={state}
        />
        <DataCrediWidget />
      </header>
    </div>
  );
}

const DataCrediWidget = () => {
  return (
    <div>
      <h4> Data Sources </h4>
      <li>
        <a target="_blank" href="https://github.com/CSSEGISandData/COVID-19" rel="noopener noreferrer" >
          Johns Hopkins CSSE
          </a>
      </li>
      <li>
        <a target="_blank" href="https://coronavirus.1point3acres.com/en" rel="noopener noreferrer" >
          1point3acres.com
          </a>
      </li>

      <li>
        <a target="_blank" href="https://en.wikipedia.org/wiki/User:Michael_J/County_table" rel="noopener noreferrer" >
          Wikipedia county info
          </a>
      </li>
      <li>
        <a target="_blank" href="https://hifld-geoplatform.opendata.arcgis.com/search?groupIds=2900322cc0b14948a74dca886b7d7cfc" rel="noopener noreferrer" >
          Homeland Infrastructure Foundation-Level Data (HIFLD)
           </a>
      </li>
    </div>
  );
}


export default App;
