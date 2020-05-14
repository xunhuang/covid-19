import React from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Sphere,
  Graticule,
  ZoomableGroup,
} from "react-simple-maps";
import ReactTooltip from "react-tooltip";
import { makeStyles } from '@material-ui/core/styles';
import { WorldContext } from './WorldContext';
import { BasicDataComponent } from './models/BasicDataComponent';
import { NameComponent } from './models/NameComponent';
import { PopulationComponent } from './models/PopulationComponent';
import { Path } from './models/Path';

const geoUrl =
  "https://raw.githubusercontent.com/zcreativelabs/react-simple-maps/master/topojson-maps/world-110m.json";

const useStyles = makeStyles(theme => ({
  container: {
    display: 'flex',
    justifyContent: 'center',
  },
  map: {
    fontFamily: theme.typography.fontFamily,
    maxHeight: '50vh',
    stroke: "#DDD",
    strokeWidth: 0.1,
    width: '95vw',
    minHeight: 300,
  },
}));

const MapWorld = (props) => {
  const classes = useStyles();
  const setTooltipContent = props.setTooltipContent;
  const world = React.useContext(WorldContext);

  let center = [0, 0];
  let zoom = 1;
  if (props.geography) {
    const pos = props.geography.position();
    center = [pos.longitude, pos.latitude];
    zoom = 4;
  }

  return (
    <ComposableMap
      className={classes.map}
      data-tip=""
    >
      <ZoomableGroup zoom={zoom} center={center} >
        <Sphere stroke="#E4E5E6" strokeWidth={0.5} />
        <Graticule stroke="#E4E5E6" strokeWidth={0.5} />


        <Geographies geography={geoUrl}
        >
          {({ geographies }) => (
            <>
              {geographies.map(geo => {
                const path = Path.parse('/' + geo.properties.ISO_A2);
                let country;
                try {
                  country = world.getMultiple(path, [NameComponent, BasicDataComponent, PopulationComponent]);
                } catch (e) {

                }
                const color = props.colorFunction(country);

                return <Geography
                  key={geo.rsmKey}
                  stroke="#000"
                  geography={geo}
                  fill={color}
                  onMouseEnter={() => {
                    setTooltipContent(country);
                  }}
                  onMouseLeave={() => {
                    setTooltipContent(null);
                  }}
                  onClick={() => {
                    if (props.selectionCallback) {
                      props.selectionCallback(path);
                    }
                  }}
                />
              })}
            </>
          )}
        </Geographies>
      </ZoomableGroup>

    </ComposableMap>
  );
};

const MapWorldGeneric = React.memo((props) => {
  const [state, setSelectedState] = React.useState("");
  const source = props.source;
  const classes = useStyles();
  return (
    <div className={classes.container}>
      <MapWorld setTooltipContent={setSelectedState}
        source={source}
        geography={props.geography}
        selectionCallback={props.selectionCallback}
        stroke={props.stroke ?? "#000000"}
        colorFunction={(country) => {
          if (!country || !props.getCountyDataPoint(country)) {
            return "#FFF";
          }
          let data = props.getCountyDataPoint(country);
          const [name, basic, pop] = country;
          let population = pop.population();
          return (props.perCapita && !props.skipCapita)
            ? props.colorFunctionPerMillion(data / population * 1000000)
            : props.colorFunction(data);
        }
        }
      />
      {state &&
        <ReactTooltip>
          {
            props.toolip(state)
          }
        </ReactTooltip>
      }
    </div>
  );
});

export { MapWorldGeneric }
