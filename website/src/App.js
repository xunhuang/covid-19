import React from 'react';
import { GoogleMap, Marker, LoadScript } from '@react-google-maps/api'
import { LineChart, Line, YAxis, XAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
const superagent = require("superagent");

var ApproxIPLocation;

async function fetchCounty() {

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

  return county_info;
}

async function fetchApproxIPLocation() {
  let iplocation = await superagent
    .get("https://api.ipdata.co/?api-key=fde5c5229bc2f57db71114590baaf58ce032876915321889a66cec61")
    .then(res => {
      ApproxIPLocation = {
        longitude: res.body.longitude,
        latitude: res.body.latitude,
      }
      return ApproxIPLocation;
    })
    .catch(err => {
      return null;
    });

  if (iplocation != null) {
    return iplocation;
  }

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

const moment = require("moment");

const firebase = require("firebase");
require("firebase/firestore");
const firebaseConfig = require('./firebaseConfig.json');
firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();
var Hospitals = require('./hospitals.json');

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

const USCountyInfo = (props) => {
  const [county, setCounty] = React.useState(null);
  const mycases = props.casesData.filter(c => {
    return (c.state_name === props.state && c.county === props.county);
  });

  const newcases = mycases.reduce((m, c) => {
    let a = m[c.confirmed_date];
    if (!a) a = 0;
    a += c.people_count;
    m[c.confirmed_date] = a;
    return m;
  }, {});

  React.useEffect(() => {
    getCountyFromDb(props.state, props.county).then(c => {
      setCounty(c);
    });
  }, [props.state, props.county]);

  let total = Object.values(newcases).reduce((a, b) => a + b, 0);

  return <div>
    {mycases[0].county},
    {mycases[0].state_name},
    Total: {total}
    <div>
      <BasicGraphNewCases
        newcases={newcases}
      />
    </div>
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
    return <div>
      <span onClick={() => { clicked(county.county, county.state_name); }}>
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
    let newcase = 0;
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
  return <div><LineChart
    width={400}
    height={400}
    data={data}
    margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
  >
    <Tooltip />
    <YAxis />
    <XAxis dataKey="name" />
    <CartesianGrid stroke="#f5f5f5" strokeDasharray="5 5" />
    <Line type="monotone" dataKey="confirmed" stroke="#ff7300" yAxisId={0} />
    <Line type="monotone" dataKey="newcase" stroke="#387908" yAxisId={0} />
    <Legend verticalAlign="top" />
    {/* <Line type="monotone" dataKey="deaths" stroke="#387908" yAxisId={0} /> */}
    {/* <Line type="monotone" dataKey="recovered" stroke="#3879ff" yAxisId={0} /> */}
  </LineChart></div>;
}

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

  if (casesData === null) {
    return <div> Loading</div>;

  }

  return (
    <div className="App">
      <header className="App-header">
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
