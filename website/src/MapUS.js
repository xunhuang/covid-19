import React from "react";
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import * as d3 from "d3-scale";

import { AntSwitch } from "./graphs/AntSwitch"
import { Grid } from '@material-ui/core';
import { withRouter } from 'react-router-dom'
import { NO_DATA_COLOR, MapCountyGeneric } from "./MapCountyGeneric"
import { MapStateGeneric } from "./MapStateGeneric";
import { Country } from "./UnitedStates";

const logColors = () => {
  return d3.scaleLog().clamp(true);
}

const ColorScale = {
  confirmed: logColors()
    .domain([1, 200, 10000])
    .range([NO_DATA_COLOR, "#f44336", "#2f0707"]),
  confirmedPerMillion: logColors()
    .domain([100, 1000, 10000])
    .range([NO_DATA_COLOR, "#f44336", "#2f0707"]),
  confirmedNew: logColors()
    .domain([1, 200, 2000])
    .range([NO_DATA_COLOR, "#f44336", "#2f0707"]),
  confirmedNewPerMillion: logColors()
    .domain([1, 200, 2000])
    .range([NO_DATA_COLOR, "#f44336", "#2f0707"]),
  death: logColors()
    .domain([1, 100, 1000])
    .range([NO_DATA_COLOR, "#5d99c6", "#002171"]),
  deathPerMillion: logColors()
    .domain([10, 100, 1000])
    .range([NO_DATA_COLOR, "#5d99c6", "#002171"]),
  timeToDouble: logColors()
    .domain([1, 15, 300])
    .range(["#004d40", "#4db6ac", NO_DATA_COLOR]),
  tests: logColors()
    .domain([10000, 650000])
    .range([NO_DATA_COLOR, "#3f51b5", "#000051"]),
  testsPerMillions: logColors()
    .domain([7200, 33000])
    .range([NO_DATA_COLOR, "#3f51b5", "#000051"]),
}

const CountyNavButtons = withRouter((props) => {
  const county = props.county;
  const state = county.state();
  const metro = county.metro();
  const history = props.history;
  return <ToggleButtonGroup
    value={null}
    exclusive
    size="large"
    onChange={(e, route) => {
      history.push(route);
    }}
  >
    <ToggleButton size="small" value={county.routeTo()} >
      {county.name}
    </ToggleButton>
    {metro &&
      <ToggleButton value={metro.routeTo()} >
        {metro.name} </ToggleButton>
    }
    <ToggleButton value={state.routeTo()} >
      {state.name}</ToggleButton>
  </ToggleButtonGroup>;
});

const MapUS = withRouter((props) => {
  const source = props.source;
  const [subtab, setAlignment] =
    React.useState(getURLParam(props.history.location.search, "detailed") ?? 'confirmed');
  const [perCapita, setPerCapita] = React.useState(true);
  const [selectedCounty, setSelectedCounty] = React.useState(null);

  let tabvalue = subtab;
  if (subtab === "testCoverage" && !(source instanceof Country)) {
    tabvalue = "confirmed";
  }

  const buttonGroup = <ToggleButtonGroup
    value={tabvalue}
    exclusive
    size="small"
    onChange={(e, newvalue) => {
      setAlignment(newvalue)
      pushChangeTo(props.history, "detailed", newvalue);
    }}
  >
    <ToggleButton value="confirmed"> Confirmed </ToggleButton>
    <ToggleButton value="confirmedNew"> New </ToggleButton>
    <ToggleButton value="death"> Death </ToggleButton>
    <ToggleButton value="daysToDouble"> Growth </ToggleButton>
    {source instanceof Country &&
      <ToggleButton value="testCoverage"> Tests</ToggleButton>
    }
  </ToggleButtonGroup>;

  const MyMap = {
    confirmed: MapUSConfirmed,
    confirmedNew: MapUSConfirmedNew,
    death: MapStateDeath,
    daysToDouble: MapDaysToDouble,
    testCoverage: MapUSTestCoverage,
  };
  const ChosenMap = MyMap[subtab];

  return <div>
    {buttonGroup}
    <Grid container alignItems="center">
      <Grid item>
        <AntSwitch checked={perCapita} onClick={() => { setPerCapita(!perCapita) }} />
      </Grid>
      <Grid item>
        Per Capita
            </Grid>
    </Grid>
    <ChosenMap {...props} source={source} perCapita={perCapita} selectionCallback={setSelectedCounty} />
    {
      selectedCounty &&
      <CountyNavButtons county={selectedCounty} />
    }

  </div >
});

const MapDaysToDouble = React.memo((props) => {
  return (
    <MapCountyGeneric
      {...props}
      skipCapita={true}
      getCountyDataPoint={(county) => {
        return county.summary().daysToDouble > 0 ? county.summary().daysToDouble : 0;
      }}
      colorFunction={(data) => {
        return ColorScale.timeToDouble(data);
      }}
      colorFunctionPerMillion={(data) => {
        return ColorScale.timeToDouble(data);
      }}
      toolip={county => {
        let days = county.summary().daysToDouble;
        let dailygrowth = Math.exp(Math.log(2) * (1 / days)) - 1;
        if (!days) {
          return `${county.name} no data`;
        }
        days = days.toFixed(1) + " days";
        return `${county.name}, Daily Growth: ${(dailygrowth * 100).toFixed(1)}%, Days to 2x: \n${days}`
      }}
    />
  );
});

const MapUSConfirmed = React.memo((props) => {
  return (
    <MapCountyGeneric
      {...props}
      getCountyDataPoint={(county) => {
        return county.summary().confirmed;
      }}
      colorFunction={(data) => {
        return ColorScale.confirmed(data);
      }}
      colorFunctionPerMillion={(data) => {
        return ColorScale.confirmedPerMillion(data);
      }}
      toolip={county => {
        return `${county.name}, Confirmed: ${county.summary().confirmed}, \n` +
          `Confirm/Mil: ${(county.summary().confirmed / county.population() * 1000000).toFixed(0)}`
      }}
    />
  );
});

const MapUSConfirmedNew = React.memo((props) => {
  return (
    <MapCountyGeneric
      {...props}
      getCountyDataPoint={(county) => {
        return county.summary().newcases;
      }}
      colorFunction={(data) => {
        return ColorScale.confirmedNew(data);
      }}
      colorFunctionPerMillion={(data) => {
        return ColorScale.confirmedNewPerMillion(data);
      }}
      toolip={county => {
        return `${county.name}, New: ${county.summary().newcases}, \n` +
          `New/Mil: ${(county.summary().newcases / county.population() * 1000000).toFixed(0)}`
      }}
    />
  );
});

const MapStateDeath = React.memo((props) => {
  return (
    <MapCountyGeneric
      {...props}
      getCountyDataPoint={(county) => {
        return county.summary().deaths;
      }}
      colorFunction={(data) => {
        return ColorScale.death(data);
      }}
      colorFunctionPerMillion={(data) => {
        return ColorScale.deathPerMillion(data);
      }}
      toolip={county => {
        return `${county.name}, Deaths: ${county.summary().deaths}, \n` +
          `Deaths/Mil: ${(county.summary().deaths / county.population() * 1000000).toFixed(0)}`
      }}
    />
  );
});

const MapUSTestCoverage = React.memo((props) => {
  return (
    <MapStateGeneric
      {...props}
      getCountyDataPoint={(county) => {
        return county.summary().tests;
      }}
      colorFunction={(data) => {
        return ColorScale.tests(data);
      }}
      colorFunctionPerMillion={(data) => {
        return ColorScale.testsPerMillions(data);
      }}
      toolip={county => {
        return `${county.name}, Tests: ${county.summary().tests}, \n` +
          `Tests % : ${(county.summary().tests / county.population() * 100).toFixed(1)}%`
      }}
    />
  );
});


function getURLParam(url, key) {
  const params = new URLSearchParams(url);
  if (params.has(key)) {
    return params.get(key);
  } else {
    return undefined;
  }
}

function pushChangeTo(history, key, value) {
  const params = new URLSearchParams(history.location.search);
  params.set(key, value);
  history.location.search = params.toString();
  history.push(history.location)
}

export { MapUS }
