import React from 'react';
import { GoogleMap, Marker, LoadScript } from '@react-google-maps/api'
import { ResponsiveContainer, LineChart, Line, YAxis, XAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { makeStyles } from '@material-ui/core/styles';
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
    width: "100%",
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
}));

function casesSummary(mycases) {
  const newcases = mycases.reduce((m, c) => {
    let a = m[c.confirmed_date];
    if (!a) a = 0;
    a += c.people_count;
    m[c.confirmed_date] = a;
    return m;
  }, {});
  let total = Object.values(newcases).reduce((a, b) => a + b, 0);
  const today = moment().format("M/D");
  var newcasenum = newcases[today];
  if (!newcasenum) {
    newcasenum = 0;
  }
  return {
    confirmed: total,
    newcases: newcasenum,
  }
}

const USCountyInfo = (props) => {
  const classes = useStyles();
  let mycases = props.casesData.filter(c => {
    return (c.state_name === props.state && c.county === props.county);
  });

  let state_mycases = props.casesData.filter(c => {
    return (c.state_name === props.state);
  });

  let state_summary = casesSummary(state_mycases);
  let county_summary = casesSummary(mycases);
  let us_summary = casesSummary(props.casesData);

  const newcases = mycases.reduce((m, c) => {
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

  console.log(mycases);

  return <div>
    <div className={classes.row} >
      <Tag
        title={`${props.county} County`}
        confirmed={county_summary.confirmed}
        newcases={county_summary.newcases}
        hospitals={"15?"}
        beds={"1500?"}
      />
      <Tag
        title="Bay Area"
        confirmed={"tbd"}
        newcases={"tbd"}
        hospitals={"15?"}
        beds={"1500?"}
      />
      <Tag
        title={props.state}
        confirmed={state_summary.confirmed}
        newcases={state_summary.newcases}
        hospitals={"15?"}
        beds={"1500?"}
      />
      <Tag
        title="US"
        confirmed={us_summary.confirmed}
        newcases={us_summary.newcases}
        hospitals={"6049"}
        beds={"90000"}
      />
    </div>
    <BasicGraphNewCases
      newcases={newcases}
    />
  </div>;
};

function getCountySummary(cases) {
  let g = cases.reduce((result, c) => {
    if (!c.county || c.county === "undefined" || c.countuy === "Unassigned" || c.county === "Unknown") {
      c.county = "Unknown";
    }

    let key = c.state_name + "," + c.county;

    let group = result[key];
    if (group) {
      group.push(c);
    } else {
      group = [c];
    }
    result[key] = group;
    return result;
  }, {});

  let g_group = Object.keys(g).reduce((result, key) => {
    let county = g[key];
    let total = county.reduce((sum, c) => {
      sum += c.people_count;
      return sum;
    }, 0);
    result.push({
      total: total,
      county: county[0].county,
      state_name: county[0].state_name,
    });
    return result;
  }, []);

  return g_group;
}

const USCountyList = (props) => {
  function clicked(newcounty, newstate) {
    if (props.callback) {
      props.callback(newcounty, newstate);
    }
  }

  let summary = getCountySummary(props.casesData);
  let content = summary.sort((a, b) => {
    return b.total - a.total;
  }).map(county => {
    let total = county.total
    return <div onClick={() => { clicked(county.county, county.state_name); }}>
      <span>
        {county.county}
      </span>,
      <span> {county.state_name}</span>
      <span> Total: {total} </span>
    </div>
  })
  return <div>{content} </div>;
};

function countyFromNewCases(newcases) {
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
  const data = countyFromNewCases(props.newcases);
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

function App() {

  const [county, setCounty] = React.useState("Santa Clara");
  const [state, setState] = React.useState("CA");
  const [casesData, setCaseData] = React.useState(null);

  React.useEffect(() => {
    getCaseData().then(abc => {
      console.log(abc.data);
      setCaseData(abc.data);
    });
    fetchCounty().then(mycounty => {
      console.log(mycounty);
      setCounty(mycounty.results[0].county_name);
      setState(mycounty.results[0].state_code);
    });
  }, []);

  if (casesData === null || casesData === null) {
    return <div> Loading</div>;
  }

  return (
    <div className="App">
      <header className="App-header">
        <h2>COVID-19.direct : US County Level Information</h2>
        <USCountyInfo
          casesData={casesData}
          county={county}
          state={state}
        />
        <div>
          <USCountyList
            casesData={casesData}
            callback={(newcounty, newstate) => {
              setCounty(newcounty);
              setState(newstate);
            }}
          />
        </div>
      </header>
    </div>
  );
}

export default App;
