import React from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { scaleQuantile } from "d3-scale";

import ReactTooltip from "react-tooltip";
const geoUrl = "https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json";
const unemployment = require("./unemployment-by-county-2017.json");

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

    return (
        <ComposableMap data-tip="" projection="geoAlbersUsa">
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
        </ComposableMap>
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
