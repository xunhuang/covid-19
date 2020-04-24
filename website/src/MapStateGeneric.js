import React from "react";
import {
    ComposableMap,
    Geographies,
    Geography,
    Marker,
    Annotation
} from "react-simple-maps";
import ReactTooltip from "react-tooltip";
import { geoCentroid } from "d3-geo";
import { CountyInfo } from 'covidmodule';

const geoUrl = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

const offsets = {
    VT: [50, -8],
    NH: [34, 2],
    MA: [30, -1],
    RI: [28, 2],
    CT: [35, 10],
    NJ: [34, 1],
    DE: [33, 0],
    MD: [47, 10],
    DC: [49, 21]
};

const MapStates = (props) => {
    let setTooltipContent = props.setTooltipContent;
    return (
        <ComposableMap data-tip="" projection="geoAlbersUsa">
            <Geographies geography={geoUrl}>
                {({ geographies }) => (
                    <>
                        {geographies.map(geo => {
                            const state_fips = geo.id;
                            const state = props.source.stateForId(state_fips);
                            const color = props.colorFunction(state);
                            return <Geography
                                key={geo.rsmKey}
                                stroke="#DDD"
                                geography={geo}
                                fill={color}
                                onMouseEnter={() => {
                                    setTooltipContent(state);
                                }}
                                onMouseLeave={() => {
                                    setTooltipContent(null);
                                }}
                            />
                        })}
                        {geographies.map(geo => {
                            const centroid = geoCentroid(geo);
                            // const cur = allStates.find(s => s.val === geo.id);
                            let cur = {
                                id: CountyInfo.getStateAbbreviationFromFips(geo.id),
                            }
                            return (
                                <g key={geo.rsmKey + "-name"}
                                >
                                    {cur &&
                                        centroid[0] > -160 &&
                                        centroid[0] < -67 &&
                                        (Object.keys(offsets).indexOf(cur.id) === -1 ? (
                                            <Marker coordinates={centroid}>
                                                <text y="2" fontSize={14} textAnchor="middle">
                                                    {cur.id}
                                                </text>
                                            </Marker>
                                        ) : (
                                                <Annotation
                                                    subject={centroid}
                                                    dx={offsets[cur.id][0]}
                                                    dy={offsets[cur.id][1]}
                                                >
                                                    <text x={4} fontSize={14} alignmentBaseline="middle">
                                                        {cur.id}
                                                    </text>
                                                </Annotation>
                                            ))}
                                </g>
                            );
                        })}
                    </>
                )}
            </Geographies>
        </ComposableMap>
    );
};

const MapStateGeneric = React.memo((props) => {
    const [state, setSelectedState] = React.useState("");
    const source = props.source;
    return (
        <div>
            <MapStates setTooltipContent={setSelectedState}
                source={source}
                selectionCallback={props.selectionCallback}
                stroke={props.stroke ?? "#FFF"}
                colorFunction={(state) => {
                    if (!state || !props.getCountyDataPoint(state)) {
                        return "#FFF";
                    }
                    let data = props.getCountyDataPoint(state);
                    let population = state.population();
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

export { MapStateGeneric }
