import React from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { scaleQuantile } from "d3-scale";

import ReactTooltip from "react-tooltip";
import { sum } from "simple-statistics";
import Typography from "material-ui/styles/typography";
const geoUrl = "https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json";
const unemployment = require("./unemployment-by-county-2017.json");
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
    let data = unemployment;
    const colorScale = scaleQuantile()
        .domain(data.map(d => d.unemployment_rate))
        .range([
            "#ffedea",
            "#ffcec5",
            "#ffad9f",
            "#ff8a75",
            "#ff5533",
            "#e2492d",
            "#be3d26",
            "#9a311f",
            "#782618"
        ]);
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
                        /// console.log(geo)
                        // const cur = data.find(s => s.id === geo.id);
                        // const cur = state.counties.find(s => s.fips() === geo.properties.STATEFP + geo.properties.COUNTYFP);
                        const county = state.countyForId(geo.properties.STATEFP + geo.properties.COUNTYFP);
                        const summary = county.summary();
                        const color = `hsla(0, 100%, ${80 - 7 * Math.log(summary.confirmed)}%, 1)`;
                        return (
                            <Geography
                                key={geo.rsmKey}
                                geography={geo}
                                fill={summary.confirmed ? color : "#FFF"}
                                onMouseEnter={() => {
                                    const name = geo.properties.NAME;
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
