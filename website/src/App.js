import React from 'react';
import { GoogleMap, Marker, LoadScript } from '@react-google-maps/api'
import { LineChart, Line, YAxis, XAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

const moment = require("moment");

const firebase = require("firebase");
require("firebase/firestore");
const firebaseConfig = require('./firebaseConfig.json');
firebase.initializeApp(firebaseConfig);

const CasesData = require('./data/1.3cases.json');
const db = firebase.firestore();
var Hospitals = require('./hospitals.json');

function snapshotToArrayData(snapshot) {
  var returnArr = []
  snapshot.forEach(function (childSnapshot) {
    returnArr.push(childSnapshot.data());
  });
  return returnArr;
}

async function getCountyList() {
  let counties = await db.collection("US_COUNTIES")
    .where("hasData", "==", true)
    .get().then((querySnapshot) => {
      return snapshotToArrayData(querySnapshot);
    });
  return counties;
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

const USCountyInfoOld = (props) => {
  const [county, setCounty] = React.useState(null);

  React.useEffect(() => {
    getCountyFromDb(props.state, props.county).then(c => {
      setCounty(c);
    });
  }, [props.state, props.county]);

  if (!county) return <div>loading</div>;

  let intvalues = Object.values(county.DataConfirmed).map(v => parseInt(v));
  let total = Math.max(...intvalues);

  return <div>
    {county.NAME},
    {county.STATE_NAME},
    Total: {total}
    <div>
      <BasicGraph
        newcases={county.DataConfirmed}
        deaths={county.DataDeath}
        recovered={county.DataRecovered}
      />
    </div>
  </div>;
};


const USCountyInfo = (props) => {

  const [county, setCounty] = React.useState(null);

  const mycases = CasesData.filter(c => {
    return (c.state_name === props.state && c.county === props.county);
  });

  const newcases = mycases.reduce((m, c) => {
    let a = m[c.confirmed_date];
    if (!a) a = 0;
    a += c.people_count;
    m[c.confirmed_date] = a;
    return m;
  }, {});

  console.log(newcases);

  React.useEffect(() => {
    getCountyFromDb(props.state, props.county).then(c => {
      setCounty(c);
    });
  }, [props.state, props.county]);

  if (!county) return <div>loading</div>;

  let intvalues = Object.values(county.DataConfirmed).map(v => parseInt(v));
  let total = Math.max(...intvalues);

  return <div>
    {county.NAME},
    {county.STATE_NAME},
    Total: {total}
    <div>
      <BasicGraphNewCases
        newcases={newcases}
      />
    </div>
  </div>;
};

const USCountyList = (props) => {
  const [counties, setCounties] = React.useState(null);

  function clicked(newcounty, newstate) {
    if (props.callback) {
      props.callback(newcounty, newstate);
    }
  }

  React.useEffect(() => {
    getCountyList().then(cs => {
      setCounties(cs);
    });
  }, []);

  if (!counties) return null;

  let content = counties.sort((a, b) => {
    let max_a = Math.max(...Object.values(a.DataConfirmed).map(v => parseInt(v)));
    let max_b = Math.max(...Object.values(b.DataConfirmed).map(v => parseInt(v)));
    return max_b - max_a;
  }).map(county => {
    let total = Math.max(...Object.values(county.DataConfirmed).map(v => parseInt(v)));
    return <div>
      <span onClick={() => { clicked(county.NAME, county.STATE_SHORT_NAME); }}> {county.NAME}</span>,
      <span> {county.STATE_SHORT_NAME}</span>
      <span> Total: {total} </span>
    </div>
  })


  return <div>{content} </div>;
};

function countyDataToGraphData(confirmed, deaths, recovered) {
  let r = {};
  r = Object.entries(confirmed).reduce((m, item) => {
    let a = m[item[0]];
    if (!a) {
      a = {};
    }
    a.confirmed = item[1];
    m[item[0]] = a;
    return m;
  }, r);

  r = Object.entries(deaths).reduce((m, item) => {
    let a = m[item[0]];
    if (!a) {
      a = {};
    }
    a.deaths = item[1];
    m[item[0]] = a;
    return m;
  }, r);

  r = Object.entries(recovered).reduce((m, item) => {
    let a = m[item[0]];
    if (!a) {
      a = {};
    }
    a.recovered = item[1];
    m[item[0]] = a;
    return m;
  }, r);

  let sorted_keys = Object.keys(r).sort(function (a, b) {
    return moment(a).toDate() - moment(b).toDate();
  });


  let last_confirmed = undefined;

  return sorted_keys.map(key => {
    let v = r[key];
    let newcase = 0;
    if (last_confirmed === undefined) {
      last_confirmed = Number(v.confirmed);
    } else {
      newcase = Number(v.confirmed) - last_confirmed;
      if (newcase < 0) {
        newcase = 0; // likely due to no data update
      }
      if (Number(v.confirmed) > 0) {
        last_confirmed = Number(v.confirmed);
      }
    }

    return {
      name: key,
      confirmed: last_confirmed,
      deaths: Number(v.deaths),
      recovered: Number(v.recovered),
      newcase: newcase,
    };
  });
}

function countyFromNewCases(newcases) {

  let sorted_keys = Object.keys(newcases).sort(function (a, b) {
    return moment(a).toDate() - moment(b).toDate();
  });

  console.log(sorted_keys);

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

const BasicGraph = (props) => {
  const data = countyDataToGraphData(
    props.confirmed,
    props.deaths,
    props.recovered,
  );

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


function App() {
  const [county, setCounty] = React.useState("Santa Clara");
  const [state, setState] = React.useState("CA");
  return (
    <div className="App">
      <header className="App-header">
        <USCountyInfo
          county={county}
          state={state}
        />
        <div>
          <USCountyList
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
