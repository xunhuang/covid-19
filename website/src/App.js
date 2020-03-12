import React from 'react';
import { GoogleMap, Marker, LoadScript } from '@react-google-maps/api'

var Hospitals = require('./hospitals.json');

const firebaseConfig = require('./firebaseConfig.json');
const DataConfirmed = require('./data/time_series_19-covid-Confirmed.json');

const ConfirmedMap = DataConfirmed.reduce((map, item) => {
        map[item["Province/State"]] = item;
        return map;
    }, {});


function LookupCountyCount(county_name) {
   let info = ConfirmedMap[county_name];
   delete info[ "Country/Region"];
   delete info[ "Province/State"];
   delete info[ "Lat"];
   delete info[ "Long"];
   return info;
}

function LookupCountyCountTotal(county_name) {
   let countInfo = LookupCountyCount(county_name);
   let count_array = Object.values(countInfo).map (n => parseInt(n)); 
   let arraySum = arr => arr.reduce((a,b) => a + b, 0)
   let total = arraySum(count_array);
    return total;
}

const USCountyInfo = (props) => {
   const county_name = props.county;

   let county = ConfirmedMap[county_name];
   let total = LookupCountyCountTotal(county_name);

   return <div> 
        {county_name},
        {county["Country/Region"]}
    Total:  {total}
    </div>;
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

function App() {

  return (
    <div className="App">
      <header className="App-header">
      <USCountyInfo
         county="Santa Clara County, CA" /> 
        <div>
          US Hospitals
      </div>
        <BasicMap />
      </header>
    </div>
  );
}

export default App;
