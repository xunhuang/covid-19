import React from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import ReactTooltip from "react-tooltip";
import * as d3 from "d3-scale";

import { AntSwitch } from "./graphs/AntSwitch"
import { Grid } from '@material-ui/core';
import { withRouter } from 'react-router-dom'
import { Metro } from "./UnitedStates";

const ColorScale = {
    confirmed: d3.scaleLog()
        .domain([1, 200, 10000])
        .range(["white", "red", "black"]),
    confirmedPerMillion: d3.scaleLog()
        .domain([100, 1000, 10000])
        .range(["white", "red", "black"]),
    death: d3.scaleLog()
        .domain([1, 100, 1000])
        .range(["white", "blue", "black"]),
    deathPerMillion: d3.scaleLog()
        .domain([10, 100, 1000])
        .range(["white", "blue", "black"]),
    timeToDouble: d3.scaleLog()
        .domain([2, 15, 300])
        .range(["white", "green", "black"]),
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

const MapNew = (props) => {
    const source = props.source instanceof Metro ? props.source.state() : props.source;
    const config = source.mapConfig();
    let setTooltipContent = props.setTooltipContent;
    return (
        <ComposableMap data-tip=""
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
                                stroke={props.stroke}
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


const MapUS = withRouter((props) => {
    const country = props.source;
    const [subtab, setAlignment] = React.useState(getURLParam(props.history.location.search, "detailed") ?? 'confirmed');
    const [perCapita, setPerCapita] = React.useState(true);
    const [selectedCounty, setSelectedCounty] = React.useState(null);

    const buttonGroup = <ToggleButtonGroup
        value={subtab}
        exclusive
        size="small"
        onChange={(e, newvalue) => {
            setAlignment(newvalue)
            pushChangeTo(props.history, "detailed", newvalue);
        }}
    >
        <ToggleButton size="small" value="confirmed"> Confirmed </ToggleButton>
        <ToggleButton value="death"> Death </ToggleButton>
        <ToggleButton value="daysToDouble"> Days to Double </ToggleButton>
    </ToggleButtonGroup>;

    const MyMap = {
        confirmed: <MapUSConfirmed {...props} source={country} perCapita={perCapita} selectionCallback={setSelectedCounty} />,
        death: <MapStateDeath {...props} source={country} perCapita={perCapita} selectionCallback={setSelectedCounty} />,
        daysToDouble: <MapDaysToDouble {...props} source={country} perCapita={perCapita} selectionCallback={setSelectedCounty} />,
    }

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
        {MyMap[subtab]}
        {
            selectedCounty &&
            <CountyNavButtons county={selectedCounty} />
        }

    </div >
});

const MapDaysToDouble = React.memo((props) => {
    return (
        <MapUSGenericCounty
            {...props}
            stroke={"#000"}
            skipCapita={true}
            getCountyDataPoint={(county) => {
                return county.summary().daysToDouble;
            }}
            colorFunction={(data) => {
                return ColorScale.timeToDouble(data);
            }}
            colorFunctionPerMillion={(data) => {
                return ColorScale.timeToDouble(data);
            }}
            toolip={county => {
                let days = county.summary().daysToDouble;
                days = days ? days.toFixed(1) + " days" : "no data"
                return `${county.name} Days to 2x: \n${days}`
            }}
        />
    );
});

const MapUSConfirmed = React.memo((props) => {
    return (
        <MapUSGenericCounty
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

const MapStateDeath = React.memo((props) => {
    return (
        <MapUSGenericCounty
            {...props}
            stroke={"#000"}
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

const MapUSGenericCounty = React.memo((props) => {
    const [county, setSelectedCounty] = React.useState("");
    const source = props.source;
    return (
        <div>
            <MapNew setTooltipContent={setSelectedCounty}
                source={source}
                selectionCallback={props.selectionCallback}
                stroke={props.stroke ?? "#FFF"}
                colorFunction={(county) => {
                    if (!county || !props.getCountyDataPoint(county)) {
                        return "#FFF";
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
