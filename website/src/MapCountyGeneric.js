import React from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import ReactTooltip from "react-tooltip";
import { Metro } from "./UnitedStates";

const MapNew = (props) => {
    const source = props.source instanceof Metro ? props.source.state() : props.source;
    const config = source.countyMapConfig();
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

const MapCountyGeneric = React.memo((props) => {
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

export { MapCountyGeneric }
