import React from "react";
import { useContext } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import ReactTooltip from "react-tooltip";
import { CountryContext } from "./CountryContext";
import { AntSwitch } from "./graphs/AntSwitch"
import { Grid } from '@material-ui/core';
import { Country } from "./UnitedStates";
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
    const [perCapita, setPerCapita] = React.useState(false);
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
            {/* <Grid item xs />
            <Grid item>
                <AntSwitch checked={perCapita} onClick={() => { setPerCapita(!perCapita) }} />
            </Grid>
            <Grid item>
                Per Capita
            </Grid> */}
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
                    return `hsla(120, 100%, ${80 - 7 * Math.log(county.summary().daysToDouble * 100)}%, 1)`;
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
    const [county, setContent] = React.useState("");
    const source = props.source;
    function setCounty(c) {
        setContent(c)
    }
    let content;
    if (county) {
        content =
            `${county.name} Confirmed: \n${county.summary().confirmed} \nDeaths: ${county.summary().deaths}`
    }

    return (
        <div>
            <MapNew setTooltipContent={setCounty} source={source}
                stroke={"#000"}
                colorFunction={(county) => {
                    if (!county || !county.summary().deaths) {
                        return "#FFF";
                    }
                    return `hsla(240, 100%, ${80 - 7 * Math.log(county.summary().deaths)}%, 1)`;
                }
                }
            />
            <ReactTooltip>
                {content}
            </ReactTooltip>
        </div>
    );
});

const MapUSConfirmed = React.memo((props) => {
    const [county, setContent] = React.useState("");
    const source = props.source;
    function setCounty(c) {
        setContent(c)
    }
    let content;
    let confirmed, population, deaths;
    if (county) {
        population = county.population();
        confirmed = county.summary().confirmed;
        deaths = county.summary().deaths;
        content =
            `${county.name} Confirmed: \n` +
            `${confirmed} \n` +
            `Deaths: ${deaths} \n ` +
            `Confirm/Millon: ${(confirmed / population * 1000000).toFixed(1)}`
    }
    return (
        <div>
            <Grid></Grid>
            <MapNew setTooltipContent={setCounty}
                source={source}
                selectionCallback={props.selectionCallback}
                stroke={"#FFF"}
                colorFunction={(county) => {
                    if (!county) {
                        return "#FFF";
                    }
                    let confirmed = county.summary().confirmed;
                    let population = county.population();
                    if (!confirmed) {
                        return "#FFF";
                    }
                    if (props.perCapita) {
                        return `hsla(0, 100%, ${80 - 7 * Math.log(confirmed / population * 1000000)}%, 1)`;
                    }
                    return `hsla(0, 100%, ${80 - 7 * Math.log(confirmed)}%, 1)`;
                }
                }
            />
            <ReactTooltip>
                {content}
            </ReactTooltip>
        </div>
    );
});

export { MapUS }
