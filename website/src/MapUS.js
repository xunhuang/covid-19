import React from "react";
import { useContext } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import ReactTooltip from "react-tooltip";
import { CountryContext } from "./CountryContext";

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
                            />
                        );
                    })
                }
            </Geographies>
        </ComposableMap >
    );
};

const MapUS = (props) => {
    const country = useContext(CountryContext);
    const [alignment, setAlignment] = React.useState('left');

    const handleAlignment = (event, newAlignment) => {
        setAlignment(newAlignment);
    };
    return <div>
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
        {(alignment === "left") &&
            <MapUSConfirmed {...props} source={country} />
        }
        {(alignment === "center") &&
            <MapStateDeath {...props} source={country} />
        }
        {(alignment === "right") &&
            <MapStateDay2Doulbe {...props} source={country} />
        }
    </div>
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
    if (county) {
        content =
            `${county.name} Confirmed: \n${county.summary().confirmed} \nDeaths: ${county.summary().deaths}`
    }
    return (
        <div>
            <MapNew setTooltipContent={setCounty} source={source}
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

export { MapUS }
