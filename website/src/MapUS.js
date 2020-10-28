import React from "react";
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import { Typography } from '@material-ui/core';
import * as d3 from "d3-scale";

import Button from '@material-ui/core/Button';

import { AntSwitch } from "./graphs/AntSwitch"
import { Grid, makeStyles } from '@material-ui/core';
import { withRouter } from 'react-router-dom'
import { NO_DATA_COLOR, MapCountyGeneric } from "./MapCountyGeneric"
import { MapStateGeneric } from "./MapStateGeneric";
import { Country } from "./UnitedStates";
import { CountryContext } from "./CountryContext"
import { DateRangeSlider } from "./DateRangeSlider"
import { MapWorldGeneric } from "./MapWorldGeneric";
import { BasicDataComponent } from './models/BasicDataComponent';
import { NameComponent } from './models/NameComponent';
import { County } from './UnitedStates'
import { WorldContext } from './WorldContext';

const moment = require("moment");

const useStyles = makeStyles(theme => ({
  gridPadding: {
    minWidth: '1vw'
  },
  container: {
    minHeight: 45
  },
  dateLabel: {
    width: 45
  }
}));

const logColors = () => {
  return d3.scaleLog().clamp(true);
}

const ColorScale = {
  confirmed: logColors()
    .domain([1, 200, 10000])
    .range([NO_DATA_COLOR, "#f44336", "#2f0707"]),
  confirmedWorld: logColors()
    .domain([1000, 10000, 1000000])
    .range([NO_DATA_COLOR, "#f44336", "#2f0707"]),
  confirmedPerMillion: logColors()
    .domain([1000, 20000, 40000])
    .range([NO_DATA_COLOR, "#f44336", "#2f0707"]),
  confirmedNew: logColors()
    .domain([1, 200, 2000])
    .range([NO_DATA_COLOR, "#f44336", "#2f0707"]),
  confirmedNewWorld: logColors()
    .domain([50, 3000, 30000])
    .range([NO_DATA_COLOR, "#f44336", "#2f0707"]),
  confirmedNewPerMillion: logColors()
    .domain([1, 200, 2000])
    .range([NO_DATA_COLOR, "#f44336", "#2f0707"]),
  confirmedNewPerMillionWorld: logColors()
    .domain([1, 30, 130])
    .range([NO_DATA_COLOR, "#f44336", "#2f0707"]),
  death: logColors()
    .domain([1, 100, 1000])
    .range([NO_DATA_COLOR, "#5d99c6", "#002171"]),
  deathWorld: logColors()
    .domain([1, 7000, 70000])
    .range([NO_DATA_COLOR, "#5d99c6", "#002171"]),
  deathPerMillion: logColors()
    .domain([10, 100, 1000])
    .range([NO_DATA_COLOR, "#5d99c6", "#002171"]),
  deathPerMillionWorld: logColors()
    .domain([1, 80, 800])
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

const CountryButton = withRouter((props) => {

  const history = props.history;
  const world = React.useContext(WorldContext);
  const [name] = world.getMultiple(props.country, [NameComponent, BasicDataComponent]);

  return (
    <Button variant="contained" color="primary"
      onClick={(e, route) => {
        history.push("/country" + props.country.string());
      }}
    >
      {name.english()}
    </Button>)
});

const MapUS = withRouter((props) => {
  const classes = useStyles()

  const source = props.source;
  const [perCapita, setPerCapita] = React.useState(true);
  const [selectedCounty, setSelectedCounty] = React.useState(null);

  let subtabs = new Map([
    ['confirmed', {
      label: "Confirmed",
      map: MapUSConfirmed,
    }],
    ['confirmedNew', {
      label: "New",
      map: MapUSConfirmedNew,
    }],
    ['death', {
      label: "Death",
      map: MapStateDeath,
    }],
    ['daysToDouble', {
      label: "Growth",
      map: MapDaysToDouble,
    }],
  ]);
  if (source instanceof Country) {
    subtabs.set('testCoverage', {
      label: "Tests",
      map: MapUSTestCoverage,
    });
  }

  if (source instanceof BasicDataComponent) {

    subtabs = new Map([
      ['confirmed', {
        label: "Confirmed",
        map: MapWorldConfirmed,
      }],
      ['confirmedNew', {
        label: "New",
        map: MapWorldConfirmedNew,
      }],
      ['death', {
        label: "Death",
        map: MapWorldDeath,
      }],
    ]);

  }

  let desired = getURLParam(props.history.location.search, "detailed");
  if (!subtabs.has(desired)) {
    desired = subtabs.keys().next().value;
  }
  const [subtab, setSubtab] = React.useState(desired);
  const ChosenMap = subtabs.get(desired).map;

  const buttonGroup = <ToggleButtonGroup
    value={subtab}
    exclusive
    size="small"
    onChange={(e, newvalue) => {
      setSubtab(newvalue)
      pushChangeTo(props.history, "detailed", newvalue);
    }}
  >
    {[...subtabs].map(([id, { label }]) =>
      <ToggleButton key={id} value={id}>{label}</ToggleButton>
    )}
  </ToggleButtonGroup>;

  const [dataFetched, setDataFetched] = React.useState(null);
  const [showPastDays, setShowPastDays] = React.useState(0);
  const oldestMoment = moment("03/10/2020", "MM/DD/YYYY");

  const getDate = (isDataFetched, showPastNumDays) => {
    return isDataFetched ? moment().subtract(showPastNumDays, 'days').format('MM/DD/YYYY') : null
  }

  const country = React.useContext(CountryContext);

  React.useEffect(() => {
    if (country) {
      country.fetchAllUSCountyData().then(() => {
        setDataFetched(true);
      });
    }
  }, [country]);


  if (!dataFetched) {
    return <div>Loading</div>;
  }

  return <div>
    {buttonGroup}
    <Grid container alignItems="center" spacing={1} className={classes.container}>
      <Grid item>
        <AntSwitch checked={perCapita} onClick={() => { setPerCapita(!perCapita) }} />
      </Grid>
      <Grid item>
        <Typography>Per Capita</Typography>
      </Grid>
      {dataFetched && oldestMoment && (desired === "confirmed" || desired === "confirmedNew" || desired === "death") &&
        <Grid item>
          <Typography align="right" className={classes.dateLabel}>{moment().subtract(showPastDays, 'days').format('M/D')}:</Typography>
        </Grid>
      }
      {dataFetched && oldestMoment && (desired === "confirmed" || desired === "confirmedNew" || desired === "death") &&
        <Grid item xs sm={3}>
          <DateRangeSlider
            startDate={moment(oldestMoment)}
            currentDate={moment()}
            minOffset={0}
            defaultValue={showPastDays}
            valueChanged={(val) => {
              setShowPastDays(val);
            }}
          />
        </Grid>
      }
      <Grid item sm></Grid>
      <Grid className={classes.gridPadding}></Grid>
    </Grid>
    <ChosenMap {...props} date={getDate(dataFetched, showPastDays)} source={source} perCapita={perCapita} selectionCallback={setSelectedCounty} />
    {
      selectedCounty && selectedCounty instanceof County &&
      <CountyNavButtons county={selectedCounty} />
    }
    {
      selectedCounty && !(selectedCounty instanceof County) &&
      <CountryButton country={selectedCounty} />
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

const MapWorldConfirmed = React.memo((props) => {
  const ts = moment(props.date, "MM/DD/YYYY").unix();
  return (
    <MapWorldGeneric
      {...props}
      getCountyDataPoint={(country) => {
        if (country) {
          const [, basic] = country;
          return basic.confirmed().dateOrLastValue(ts);
        }
      }}
      colorFunction={(data) => {
        return ColorScale.confirmedWorld(data);
      }}
      colorFunctionPerMillion={(data) => {
        return ColorScale.confirmedPerMillion(data);
      }}
      toolip={country => {
        const [name, basic, population] = country;
        let confirmed = basic.confirmed().dateOrLastValue(ts);
        return `${name.english()}, Confirmed: ${confirmed}, \n` +
          `Confirm/Mil: ${(confirmed / population.population() * 1000000).toFixed(0)}`
      }}
    />
  );
});

const MapWorldDeath = React.memo((props) => {
  const ts = moment(props.date, "MM/DD/YYYY").unix();
  return (
    <MapWorldGeneric
      {...props}
      getCountyDataPoint={(country) => {
        if (country) {
          const [, basic] = country;
          return basic.died().dateOrLastValue(ts);
        }
      }}
      colorFunction={(data) => {
        return ColorScale.deathWorld(data);
      }}
      colorFunctionPerMillion={(data) => {
        return ColorScale.deathPerMillionWorld(data);
      }}
      toolip={country => {
        const [name, basic, population] = country;
        let confirmed = basic.died().dateOrLastValue(ts);
        return `${name.english()}, Deaths: ${confirmed}, \n` +
          `Deaths/Mil: ${(confirmed / population.population() * 1000000).toFixed(0)}`
      }}
    />
  );
});

const MapWorldConfirmedNew = React.memo((props) => {
  const ts = moment(props.date, "MM/DD/YYYY").unix();
  return (
    <MapWorldGeneric
      {...props}
      getCountyDataPoint={(country) => {
        if (country) {
          const [, basic] = country;
          return basic.confirmed().dateOrLastValueNew(ts);
        }
      }}
      colorFunction={(data) => {
        return ColorScale.confirmedNew(data);
      }}
      colorFunctionPerMillion={(data) => {
        return ColorScale.confirmedNewPerMillionWorld(data);
      }}
      toolip={country => {
        const [name, basic, population] = country;
        let confirmed = basic.confirmed().dateOrLastValueNew(ts);
        return `${name.english()}, New: ${confirmed}, \n` +
          `New/Mil: ${(confirmed / population.population() * 1000000).toFixed(0)}`
      }}
    />
  );
});

const MapUSConfirmed = React.memo((props) => {
  return (
    <MapCountyGeneric
      {...props}
      getCountyDataPoint={(county) => {
        return county.getConfirmedByDate(props.date);
      }}
      colorFunction={(data) => {
        return ColorScale.confirmed(data);
      }}
      colorFunctionPerMillion={(data) => {
        return ColorScale.confirmedPerMillion(data);
      }}
      toolip={county => {
        let confirmed = county.getConfirmedByDate(props.date);
        return `${county.name}, Confirmed: ${confirmed}, \n` +
          `Confirm/Mil: ${(confirmed / county.population() * 1000000).toFixed(0)}`
      }}
    />
  );
});

const MapUSConfirmedNew = React.memo((props) => {
  return (
    <MapCountyGeneric
      {...props}
      getCountyDataPoint={(county) => {
        return county.getConfirmedNewByDate(props.date);
      }}
      colorFunction={(data) => {
        return ColorScale.confirmedNewWorld(data);
      }}
      colorFunctionPerMillion={(data) => {
        return ColorScale.confirmedNewPerMillion(data);
      }}
      toolip={county => {
        let newcases = county.getConfirmedNewByDate(props.date);
        return `${county.name}, New: ${newcases}, \n` +
          `New/Mil: ${(newcases / county.population() * 1000000).toFixed(0)}`
      }}
    />
  );
});

const MapStateDeath = React.memo((props) => {
  return (
    <MapCountyGeneric
      {...props}
      getCountyDataPoint={(county) => {
        return county.getDeathsByDate(props.date);
      }}
      colorFunction={(data) => {
        return ColorScale.death(data);
      }}
      colorFunctionPerMillion={(data) => {
        return ColorScale.deathPerMillion(data);
      }}
      toolip={county => {
        const deaths = county.getDeathsByDate(props.date);
        return `${county.name}, Deaths: ${deaths}, \n` +
          `Deaths/Mil: ${(deaths / county.population() * 1000000).toFixed(0)}`
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
