import React from 'react';
import { Switch, Route, withRouter } from 'react-router-dom'
import { BrowserRouter } from 'react-router-dom';


import { GoogleMap, Marker, LoadScript } from '@react-google-maps/api'
import { ResponsiveContainer, LineChart, Line, YAxis, XAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { makeStyles } from '@material-ui/core/styles';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import { countyModuleInit, lookupCountyInfo } from "./USCountyInfo.js";
import * as USCounty from "./USCountyInfo.js";
import Select from 'react-select';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography'

import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import { NearbyCounties, CountiesForStateWidget } from "./CountyListRender.js"

const buildUrl = require('build-url');
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
    padding: theme.spacing(1, 1),
    flex: 1,
    margin: 3,
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
  title: {
    display: 'block',
    color: '#FFFFFF',
    background: '#FF0000',
    padding: 5,
    margin: 5,
  },
  subtitle: {
    display: 'block',
    padding: 5,
    margin: 5,
  },

  rootSplash: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "60vh",
    flexGrow: 1,
  },
}));


const USCountyInfoWidget = (props) => {
  const classes = useStyles();
  const startvalue = props.state ? (props.county ? 0 : 1) : 2;
  const [value, setValue] = React.useState(startvalue);

  console.log(props.state);
  console.log(props.county);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  let countyInfo = lookupCountyInfo(props.state, props.county);
  if (!countyInfo) {
    countyInfo = {
      HospitalBeds: "N/A",
      Hospitals: "N/A",
    }
  }

  let county_cases = USCounty.casesForCounty(props.state, props.county);
  let state_mycases = USCounty.casesForState(props.state);
  let state_summary = USCounty.casesForStateSummary(props.state);
  let county_summary = USCounty.casesForCountySummary(props.state, props.county);
  let us_summary = USCounty.casesSummary(props.casesData);
  let state_hospitals = USCounty.hospitalsForState(props.state);

  let graphlist = [
    <BasicGraphNewCases casesData={county_cases} />,
    <BasicGraphNewCases casesData={state_mycases} />,
    <BasicGraphNewCases casesData={props.casesData} />,
  ];

  return <div>
    <div className={classes.row} >
      <Tag
        title={`${props.county} County`}
        confirmed={county_summary.confirmed}
        newcases={county_summary.newcases}
        hospitals={countyInfo.Hospitals}
        beds={countyInfo.HospitalBeds}
      />
      <Tag
        title={states.getStateNameByStateCode(props.state)}
        confirmed={state_summary.confirmed}
        newcases={state_summary.newcases}
        hospitals={state_hospitals.hospitals}
        beds={state_hospitals.beds}
      />
      <Tag
        title="US"
        confirmed={us_summary.confirmed}
        newcases={us_summary.newcases}
        hospitals={"6,146"}
        beds={"924,107"}
      />
    </div>
    <Tabs
      value={value}
      onChange={handleChange}
      indicatorColor="primary"
      textColor="primary"
      centered
    >
      <Tab label={`${props.county} County`} />
      <Tab label={states.getStateNameByStateCode(props.state)} />
      <Tab label={"United States"} />
    </Tabs>
    <div>
      {graphlist[value]}
    </div>
  </div>;
};

function countyFromNewCases(cases_data) {
  let newcases = cases_data.reduce((m, c) => {
    let a = m[c.confirmed_date];
    if (!a) a = 0;
    a += c.people_count;
    m[c.confirmed_date] = a;
    return m;
  }, {});

  const today = moment().format("M/D");
  var newcasenum = newcases[today];
  if (!newcasenum) {
    newcases[today] = 0;
  }

  let sorted_keys = Object.keys(newcases).sort(function (a, b) {
    return moment(a).toDate() - moment(b).toDate();
  });
  let total = 0;
  return sorted_keys.map(key => {
    let v = newcases[key];
    total += v;

    return {
      name: key,
      confirmed: total,
      newcase: v,
    };
  });
}

const BasicGraphNewCases = (props) => {
  const data = countyFromNewCases(props.casesData);
  return <ResponsiveContainer height={300} >
    <LineChart
      data={data}
      margin={{ top: 5, right: 30, left: 5, bottom: 5 }}
    >
      <Tooltip />
      <YAxis />
      <XAxis dataKey="name" />
      <CartesianGrid stroke="#f5f5f5" strokeDasharray="5 5" />
      <Line type="monotone" dataKey="confirmed" stroke="#ff7300" yAxisId={0} strokeWidth={3} />
      <Line type="monotone" dataKey="newcase" stroke="#387908" yAxisId={0} strokeWidth={3} />
      <Legend verticalAlign="top" />
    </LineChart></ResponsiveContainer>;
}

const Tag = (props) => {
  const classes = useStyles();
  return <div className={classes.tag}>
    <div> {props.title}</div>
    <div className={classes.row} >
      <section>
        <div className={classes.topTag}>
          + {props.newcases}
        </div>
        <div className={classes.mainTag}>
          {props.confirmed} </div>
        <div className={classes.smallTag}>
          Confirmed </div>
      </section>
      <section>
        <div className={classes.topTag}>
          {props.beds} Beds
          </div>
        <div className={classes.mainTag}>
          {props.hospitals} </div>
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
  let result = await firebase.functions().httpsCallable('datajson')();
  return result;
}

const DetailCaseList = (props) => {
  const classes = useStyles();
  let countyInfo = lookupCountyInfo(props.state, props.county);
  let county_cases = USCounty.casesForCounty(props.state, props.county).reverse();
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

const StateDetailCaseListWidget = (props) => {
  const classes = useStyles();
  let state_cases = USCounty.casesForState(props.state).reverse();
  let countySummary =
    <div>
      <h3> Case details for {states.getStateNameByStateCode(props.state)} </h3>
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
          <TableRow key={row.name}>
            <TableCell component="th" scope="row">
              {row.confirmed_date}
            </TableCell>
            <TableCell align="center">{row.people_count}</TableCell>
            <TableCell align="left">{row.comments_en}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
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
    <App1  {...props} />
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

const App1 = withRouter((props) => {
  const [county, setCounty] = React.useState("Santa Clara");
  const [state, setState] = React.useState("CA");
  const [casesData, setCaseData] = React.useState(null);
  React.useEffect(() => {
    getCaseData().then(abc => {
      countyModuleInit(abc.data);
      setCaseData(abc.data);
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
      </Switch>
    </div>
  );
});

const CountyWidget = (props) => {
  const state = props.match.params.state;
  const county = props.match.params.county;
  const casesData = props.casesData;
  return (
    <div className="App">
      <header className="App-header">
        <h2>COVID-19.direct : US County Level Information</h2>
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
        <h2>COVID-19.direct : US County Level Information</h2>
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
        <a target="_blank" href="https://github.com/CSSEGISandData/COVID-19">
          Johns Hopkins CSSE
          </a>
      </li>
      <li>
        <a target="_blank" href="https://coronavirus.1point3acres.com/en">
          1point3acres.com
          </a>
      </li>

      <li>
        <a target="_blank" href="https://en.wikipedia.org/wiki/User:Michael_J/County_table">
          Wikipedia county info
          </a>
      </li>
      <li>
        <a target="_blank" href="https://hifld-geoplatform.opendata.arcgis.com/search?groupIds=2900322cc0b14948a74dca886b7d7cfc">
          Homeland Infrastructure Foundation-Level Data (HIFLD)
           </a>
      </li>
    </div>
  );
}

const Splash = (props) => {
  const classes = useStyles();
  return (
    <div className={classes.rootSplash}>
      <div>
        <Toolbar>
          <div className={classes.grow}> </div>
          <Typography className={classes.title} variant="h2" noWrap>
            Stay Calm
        </Typography>
          <div className={classes.grow}> </div>
        </Toolbar>

        <Toolbar>
          <div className={classes.grow}> </div>
          <Typography className={classes.subtitle} variant="h5" noWrap>
            THIS TOO SHALL PASS
          </Typography>
          <div className={classes.grow}> </div>
        </Toolbar>
      </div>
    </div>);
}




export default App;
