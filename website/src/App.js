import React from 'react';
import { GoogleMap, OverlayView, Marker, LoadScript } from '@react-google-maps/api'

var Hospitals = require('./hospitals.json');

const firebaseConfig = require('./firebaseConfig.json');

console.log("*************");
console.log(Hospitals.features);
console.log("*************");

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
        <div>
          US Hospitals 1 2 3
      </div>
        <BasicMap />
      </header>
    </div>
  );
}

export default App;
