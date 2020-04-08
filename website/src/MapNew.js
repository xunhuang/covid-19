import React from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { scaleQuantile } from "d3-scale";

import ReactTooltip from "react-tooltip";
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
    console.log(state);
    let url = geoUrl;
    if (state) {
        url = process.env.PUBLIC_URL + `/topojson/us-states/${state.twoLetterName}-${state.fips()}-${state.name.toLowerCase().replace(" ", "-")}-counties.json`;
        // url = process.env.PUBLIC_URL + `/topojson/us-states/CA-06-california-counties.json`;
        // url = process.env.PUBLIC_URL + `/topojson/us-states/FL-12-florida-counties.json`;
        console.log(url);
    }

    let projection = getProjectionConfig(state.fips());
    return (
        // <ComposableMap data-tip="" projection="geoAlbersUsa"
        <ComposableMap data-tip="" projection="geoMercator"
            projectionConfig={projection}
        >
            <Geographies geography={url}>
                {({ geographies }) =>
                    geographies.map(geo => {
                        console.log(geo)
                        // const cur = data.find(s => s.id === geo.id);
                        const cur = data.find(s => s.id === geo.properties.STATEFP + geo.properties.COUNTYFP);
                        return (
                            <Geography
                                key={geo.rsmKey}
                                geography={geo}
                                fill={cur ? colorScale(cur.unemployment_rate) : "#EEE"}
                                onMouseEnter={() => {
                                    const name = geo.properties.NAME;
                                    // console.log(name);
                                    setTooltipContent(name);
                                }}
                                onMouseLeave={() => {
                                    setTooltipContent("");
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
    const [content, setContent] = React.useState("");
    const state = props.state;
    function aaa(a) {
        setContent(a)
    }

    return (
        <div>
            <MapNew setTooltipContent={aaa} state={state} />
            <ReactTooltip>{content}</ReactTooltip>
            {content}
        </div>
    );
});

export { MapState }
