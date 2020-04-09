import React from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";

import ReactTooltip from "react-tooltip";
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
                        const summary = county.summary();
                        const color = `hsla(0, 100%, ${80 - 7 * Math.log(summary.confirmed)}%, 1)`;
                        return (
                            <Geography
                                key={geo.rsmKey}
                                geography={geo}
                                stroke="#FFF"
                                fill={summary.confirmed ? color : "#FFF"}
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

const MapState = React.memo((props) => {
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
            <MapNew setTooltipContent={setCounty} state={state} />
            <ReactTooltip>
                {content}
            </ReactTooltip>
        </div>
    );
});

export { MapState }
