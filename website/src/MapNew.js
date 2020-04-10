import React from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import ReactTooltip from "react-tooltip";
import { createMuiTheme } from "@material-ui/core/styles";
import { ThemeProvider } from "@material-ui/core";


const geoUrl = "https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json";
const stateBounds = require("./data/states-bounding.json");

const statemap = stateBounds.reduce((m, b) => {
    m[b.STATEFP] = b;
    return m;
}, {});

function getProjectionConfig(state_fips) {
    let state1 = statemap[state_fips];
    let x = (parseFloat(state1.xmin) + parseFloat(state1.xmax)) / 2;
    let y = (parseFloat(state1.ymin) + parseFloat(state1.ymax)) / 2;
    let xscale =
        (800 * 180) / (parseFloat(state1.xmax) - parseFloat(state1.xmin));
    let yscale =
        (600 * 180) / (parseFloat(state1.ymax) - parseFloat(state1.ymin));
    let scale = xscale > yscale ? yscale : xscale;
    scale = scale * 0.3;

    // manually tune some state that doens't show up well.
    if (state_fips === "02") {
        return {
            scale: 2000,
            rotate: [149.4937, -64.2008, 0]
        };
    }

    return {
        scale: scale,
        rotate: [-x, -y, 0]
        // center: [x, y],
    };
}

const MapNew = (props) => {
    let setTooltipContent = props.setTooltipContent;
    const state = props.state;
    let url = geoUrl;
    if (state) {
        url = process.env.PUBLIC_URL + `/topojson/us-states/${state.twoLetterName}-${state.fips()}-${state.name.toLowerCase().replace(" ", "-")}-counties.json`;
    }

    let projection = getProjectionConfig(state.fips());
    return (
        <ComposableMap data-tip="" projection="geoMercator"
            projectionConfig={projection}
        >
            <Geographies geography={url}>
                {({ geographies }) =>
                    geographies.map(geo => {
                        const county = state.countyForId(geo.properties.STATEFP + geo.properties.COUNTYFP);
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
                            />
                        );
                    })
                }
            </Geographies>
        </ComposableMap >
    );
};

const compact = createMuiTheme({
    overrides: {
        MuiToggleButton: {
            sizeSmall: {
                //This can be referred from Material UI API documentation.
                maxHeight: 24,
            }
        }
    }
});

const MapState = (props) => {
    const [alignment, setAlignment] = React.useState('left');

    const handleAlignment = (event, newAlignment) => {
        setAlignment(newAlignment);
    };
    return <div>
        <ThemeProvider theme={compact}>

            <ToggleButtonGroup
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
            </ToggleButtonGroup>
        </ThemeProvider>
        {(alignment === "left") &&
            <MapStateConfirmed {...props} />
        }
        {(alignment === "center") &&
            <MapStateDeath {...props} />
        }
        {(alignment === "right") &&
            <MapStateDay2Doulbe {...props} />
        }
    </div>
};

const MapStateDay2Doulbe = React.memo((props) => {
    const [county, setContent] = React.useState("");
    const state = props.state;
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
            <MapNew setTooltipContent={setCounty} state={state}
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
    const state = props.state;
    function setCounty(c) {
        setContent(c)
    }
    let content;
    if (county) {
        content =
            `${county.name} Confirmed: \n${county.summary().confirmed} \nDeaths: ${county.summary().death}`
    }

    return (
        <div>
            <MapNew setTooltipContent={setCounty} state={state}
                stroke={"#000"}
                colorFunction={(county) => {
                    if (!county || !county.summary().death) {
                        return "#FFF";
                    }
                    return `hsla(240, 100%, ${80 - 7 * Math.log(county.summary().death)}%, 1)`;
                }
                }
            />
            <ReactTooltip>
                {content}
            </ReactTooltip>
        </div>
    );
});

const MapStateConfirmed = React.memo((props) => {
    const [county, setContent] = React.useState("");
    const state = props.state;
    function setCounty(c) {
        setContent(c)
    }
    let content;
    if (county) {
        content =
            `${county.name} Confirmed: \n${county.summary().confirmed} \nDeaths: ${county.summary().death}`
    }

    return (
        <div>
            <MapNew setTooltipContent={setCounty} state={state}
                stroke={"#FFF"}
                colorFunction={(county) => {
                    if (!county || !county.summary().confirmed) {
                        return "#FFF";
                    }
                    return `hsla(0, 100%, ${80 - 7 * Math.log(county.summary().confirmed)}%, 1)`;
                }
                }
            />
            <ReactTooltip>
                {content}
            </ReactTooltip>
        </div>
    );
});

export { MapState }
