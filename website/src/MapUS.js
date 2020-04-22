import React from "react";
import { useContext } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import ReactTooltip from "react-tooltip";
import { CountryContext } from "./CountryContext";
import * as d3 from "d3-scale";

import { AntSwitch } from "./graphs/AntSwitch"
import { Grid } from '@material-ui/core';
import { withRouter } from 'react-router-dom'

const geoUrl = "https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json";

const MapNew = (props) => {
    const source = props.source;
    let setTooltipContent = props.setTooltipContent;
    let url = geoUrl;
    return (
        <ComposableMap data-tip="" projection="geoAlbersUsa" >
            <Geographies geography={url}>
                {({ geographies }) =>
                    geographies.map(geo => {
                        const county = source.countyForId(geo.id);
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

const MapUS = (props) => {
    const country = useContext(CountryContext);
    const [alignment, setAlignment] = React.useState('left');
    const [perCapita, setPerCapita] = React.useState(true);
    const [selectedCounty, setSelectedCounty] = React.useState(null);

    const handleAlignment = (event, newAlignment) => {
        setAlignment(newAlignment);
    };
    const buttonGroup = <ToggleButtonGroup
        value={alignment}
        exclusive
        size="small"
        onChange={handleAlignment}
        aria-label="text alignment"
    >
        <ToggleButton size="small" value="left" aria-label="left aligned">
            Confirmed            </ToggleButton>
        <ToggleButton value="center" aria-label="centered">
            Death </ToggleButton>
        <ToggleButton value="right" aria-label="right aligned">
            Days to Double            </ToggleButton>
    </ToggleButtonGroup>;
    return <div>
        <Grid container alignItems="center">
            <Grid item>
                {buttonGroup}
            </Grid>
            <Grid item xs />
            <Grid item>
                <AntSwitch checked={perCapita} onClick={() => { setPerCapita(!perCapita) }} />
            </Grid>
            <Grid item>
                Per Capita
            </Grid>
        </Grid>
        {
            (alignment === "left") &&
            <MapUSConfirmed {...props} source={country} perCapita={perCapita} selectionCallback={setSelectedCounty} />
        }
        {
            (alignment === "center") &&
            <MapStateDeath {...props} source={country} perCapita={perCapita} />
        }
        {
            (alignment === "right") &&
            <MapStateDay2Doulbe {...props} source={country} perCapita={perCapita} />
        }
        {
            selectedCounty &&
            <CountyNavButtons county={selectedCounty} />
        }

    </div >
};


const MapStateDay2Doulbe = React.memo((props) => {
    const [county, setContent] = React.useState("");
    const source = props.source;
    function setCounty(c) {
        setContent(c)
    }
    let content;
    if (county) {
        let days = county.summary().daysToDouble;
        days = days ? days.toFixed(1) + " days" : "no data"
        content =
            `${county.name} Days to 2x: \n${days}`
    }

    return (
        <div>
            <MapNew setTooltipContent={setCounty} source={source}
                stroke={"#000"}
                colorFunction={(county) => {
                    if (!county || !county.summary().daysToDouble) {
                        return "#FFF";
                    }
                    return ColorScale.timeToDouble(county.summary().daysToDouble);
                }
                }
            />
            <ReactTooltip>
                {content}
            </ReactTooltip>
        </div>
    );
});

const MapStateDeath = React.memo((props) => {
    const [county, setSelectedCounty] = React.useState("");
    const source = props.source;
    let c = source.allCounties().map(c => c.summary().deaths / c.population() * 1000000);
    return (
        <div>
            <MapNew setTooltipContent={setSelectedCounty} source={source}
                stroke={"#000"}
                colorFunction={(county) => {
                    if (!county || !county.summary().deaths) {
                        return "#FFF";
                    }
                    let deaths = county.summary().deaths;
                    let population = county.population();
                    return props.perCapita
                        ? ColorScale.deathPerMillion(deaths / population * 1000000)
                        : ColorScale.death(deaths);
                }
                }
            />
            {county &&
                <ReactTooltip>
                    {
                        `${county.name}, Deaths: ${county.summary().deaths}, \n` +
                        `Deaths/Mil: ${(county.summary().deaths / county.population() * 1000000).toFixed(0)}`
                    }
                </ReactTooltip>
            }
        </div>
    );
});

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

const MapUSConfirmed = React.memo((props) => {
    const [county, setSelectedCounty] = React.useState("");
    const source = props.source;
    return (
        <div>
            <MapNew setTooltipContent={setSelectedCounty}
                source={source}
                selectionCallback={props.selectionCallback}
                stroke={"#FFF"}
                colorFunction={(county) => {
                    if (!county) {
                        return "#FFF";
                    }
                    let confirmed = county.summary().confirmed;
                    let population = county.population();
                    return props.perCapita
                        ? ColorScale.confirmedPerMillion(confirmed / population * 1000000)
                        : ColorScale.confirmed(confirmed);
                }
                }
            />
            {county &&
                <ReactTooltip>
                    {
                        `${county.name}, Confirmed: ${county.summary().confirmed}, \n` +
                        `Confirm/Mil: ${(county.summary().confirmed / county.population() * 1000000).toFixed(0)}`
                    }
                </ReactTooltip>
            }
        </div>
    );
});

export { MapUS }
