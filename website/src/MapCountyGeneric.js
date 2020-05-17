import React from "react";
import { ZoomableGroup, ComposableMap, Geographies, Geography } from "react-simple-maps";
import ReactTooltip from "react-tooltip";
import { Metro } from "./UnitedStates";
import { makeStyles } from '@material-ui/core/styles';
const superagent = require('superagent');

const NO_DATA_COLOR = '#fcfcfc';

const useStyles = makeStyles(theme => ({
  container: {
    display: 'flex',
    justifyContent: 'center',
  },
  map: {
    maxHeight: '50vh',
    stroke: '#DDD',
    strokeWidth: 1,
    width: '100vh',
    minHeight: 300,
  },
  small: {
    // maxHeight: '50vh',
  },
}));

const MapNew = (props) => {
  const classes = useStyles();

  const [geographyArray, setGeographyArray] = React.useState(null)

  const source = props.source instanceof Metro ? props.source.state() : props.source;
  console.log("source");
  console.log(source);
  const config = source.countyMapConfig();
  console.log("config")
  console.log(config)
  let geoURL;
  if (!config) {
    geoURL = null
  } else {
    geoURL = config.geoUrl;
  }


  React.useEffect(() => {
    if (geoURL) {
      superagent
          .get(geoURL)
          .then(res => {
            console.log(res.body);
            setGeographyArray(res.body);
          })
          .catch(err => {
            setGeographyArray(null)
          });
    }
  }, [geoURL])

  // Gross!
  const isZoomed = !!config.projection.config;

  const setTooltipContent = props.setTooltipContent;
  console.log(`geography array:`)
  console.log(geographyArray)

  if (geographyArray) {
    return (
      <ComposableMap
        className={`${classes.map} ${isZoomed ? classes.small : ''}`}
        data-tip=""
        projection={config.projection.projection}
        projectionConfig={config.projection.config}
      >
        <ZoomableGroup zoom={1}>
        <Geographies geography={geographyArray}>
          {({ geographies }) => {
            console.log("geographies map:")
            console.log(geographies);
            geographies.map(geo => {
              const county_id = geo.id ?? geo.properties.STATEFP + geo.properties.COUNTYFP;
              const county = source.countyForId(county_id);
              const color = props.colorFunction(county);
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={color}
                  onMouseEnter={() => {
                    setTooltipContent(county);
                  }}
                  onMouseLeave={() => {
                    setTooltipContent(null);
                  }}
                  onClick={() => {
                    if (props.selectionCallback) {
                      props.selectionCallback(county);
                    }
                  }

                  }
                />
              );
            })
          }
          }
        </Geographies>
          </ZoomableGroup>
      </ComposableMap >
    )
  } else {
    return (
      <div>No map!</div>
    )
  }
};

const MapCountyGeneric = React.memo((props) => {
  const [county, setSelectedCounty] = React.useState("");
  const source = props.source;
  const classes = useStyles();
  return (
    <div className={classes.container}>
      <MapNew setTooltipContent={setSelectedCounty}
        source={source}
        selectionCallback={props.selectionCallback}
        colorFunction={(county) => {
          if (!county || !props.getCountyDataPoint(county)) {
            return NO_DATA_COLOR;
          }
          let data = props.getCountyDataPoint(county);
          let population = county.population();
          return (props.perCapita && !props.skipCapita)
            ? props.colorFunctionPerMillion(data / population * 1000000)
            : props.colorFunction(data);
        }
        }
      />
      {county &&
        <ReactTooltip>
          {
            props.toolip(county)
          }
        </ReactTooltip>
      }
    </div>
  );
});

export { NO_DATA_COLOR, MapCountyGeneric }
