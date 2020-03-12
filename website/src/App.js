import React from 'react';
import { GoogleMap, Marker, LoadScript } from '@react-google-maps/api'
import { LineChart, Line, XAxis, Tooltip, CartesianGrid } from 'recharts';

const firebase = require("firebase");
require("firebase/firestore");
const firebaseConfig = require('./firebaseConfig.json');
firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();

var Hospitals = require('./hospitals.json');

const DataConfirmed = require('./data/time_series_19-covid-Confirmed.json');

const ConfirmedMap = DataConfirmed.reduce((map, item) => {
  map[item["Province/State"]] = item;
  return map;
}, {});

function LookupCountyCount(county_name) {
  let info = ConfirmedMap[county_name];
  delete info["Country/Region"];
  delete info["Province/State"];
  delete info["Lat"];
  delete info["Long"];
  return info;
}

function LookupCountyCountTotal(county_name) {
  let countInfo = LookupCountyCount(county_name);
  let count_array = Object.values(countInfo).map(n => parseInt(n));
  let arraySum = arr => arr.reduce((a, b) => a + b, 0)
  let total = arraySum(count_array);
  return total;
}

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

const USCountyInfo = (props) => {
  const [county, setCounty] = React.useState(null);

  React.useEffect(() => {
    getCountyFromDb(props.state, props.county).then(c => {
      setCounty(c);
    });
  }, [props.state, props.county]);

  if (!county) return <div>loading</div>;

  return <div>
    {county.NAME},
    {county.STATE_NAME},
    Total:  TBD
  </div>;
};

const USCountyList = (props) => {
  React.useEffect(() => {
    getCountyList().then(counties => {
      console.log(counties);
    });
  }, []);
  return <div>Placeholder</div>;
};

function countyDataToGraphData(county_data) {
  const keys_to_drop = ["Province/State", "Country/Region", "Lat", "Long"];
  return Object.entries(county_data).reduce((result, v) => {
    if (!keys_to_drop.includes(v[0])) {
      result.push({ name: v[0], infected: Number(v[1]), deathrate: 0.2, recovery: 234 });
    }
    return result;
  }, []);
}

const BasicGraph = (props) => {
  const santa_clara = { "Province/State": "Santa Clara County, CA", "Country/Region": "US", "Lat": "37.3541", "Long": "-121.9552", "1/22/20": "0", "1/23/20": "0", "1/24/20": "0", "1/25/20": "0", "1/26/20": "0", "1/27/20": "0", "1/28/20": "0", "1/29/20": "0", "1/30/20": "0", "1/31/20": "1", "2/1/20": "1", "2/2/20": "1", "2/3/20": "2", "2/4/20": "2", "2/5/20": "2", "2/6/20": "2", "2/7/20": "2", "2/8/20": "2", "2/9/20": "2", "2/10/20": "2", "2/11/20": "2", "2/12/20": "2", "2/13/20": "2", "2/14/20": "2", "2/15/20": "2", "2/16/20": "2", "2/17/20": "2", "2/18/20": "2", "2/19/20": "2", "2/20/20": "2", "2/21/20": "2", "2/22/20": "2", "2/23/20": "2", "2/24/20": "2", "2/25/20": "2", "2/26/20": "2", "2/27/20": "2", "2/28/20": "2", "2/29/20": "3", "3/1/20": "3", "3/2/20": "9", "3/3/20": "11", "3/4/20": "11", "3/5/20": "20", "3/6/20": "20", "3/7/20": "32", "3/8/20": "38", "3/9/20": "38", "3/10/20": "43" };
  const data = countyDataToGraphData(santa_clara);
  return <div><LineChart
    width={400}
    height={400}
    data={data}
    margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
  >
    <XAxis dataKey="name" />
    <Tooltip />
    <CartesianGrid stroke="#f5f5f5" />
    <Line type="monotone" dataKey="infected" stroke="#ff7300" yAxisId={0} />
    <Line type="monotone" dataKey="deathrate" stroke="#387908" yAxisId={1} />
    <Line type="monotone" dataKey="recovery" stroke="#3879ff" yAxisId={2} />
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

  return (
    <div className="App">
      <header className="App-header">
        <USCountyList />
        <USCountyInfo
          county="Santa Clara"
          state="CA"
        />
        <div>
          US Hospitals
      </div>
        <BasicGraph />
        <BasicMap />
      </header>
    </div>
  );
}

export default App;
