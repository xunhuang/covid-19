import React from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import ReactTooltip from "react-tooltip";
import { Metro } from "./UnitedStates";
import { makeStyles } from '@material-ui/core/styles';

const NO_DATA_COLOR = '#fcfcfc';

const useStyles = makeStyles(theme => ({
  container: {
    display: 'flex',
    justifyContent: 'center',
  },
  map: {
    maxHeight: '100vh',
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

  const source = props.source instanceof Metro ? props.source.state() : props.source;
  const config = source.countyMapConfig();
  if (!config) {
    return null;
  }
  // Gross!
  const isZoomed = !!config.projection.config;

  const setTooltipContent = props.setTooltipContent;
  return (
    <ComposableMap
      className={`${classes.map} ${isZoomed ? classes.small : ''}`}
      data-tip=""
      projection={config.projection.projection}
      projectionConfig={config.projection.config}
    >
      <Geographies geography={config.geoUrl}>
        {({ geographies }) =>
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
      </Geographies>
    </ComposableMap >
  );
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
