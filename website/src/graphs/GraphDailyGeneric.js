import React from 'react';
import {
    ResponsiveContainer, YAxis, XAxis, Tooltip,
    CartesianGrid, Legend, LineChart, Line
} from 'recharts';
import { myShortNumber } from '../Util.js';
import { computeMovingAverage, sortByFullDate, mergeDataSeries } from "./DataSeries";
import { makeStyles } from '@material-ui/core/styles';
import { Typography } from '@material-ui/core';
import Grid from '@material-ui/core/Grid';
import { AntSwitch } from "./AntSwitch"
const Cookies = require("js-cookie");
const moment = require("moment");

const formatYAxis = (tickItem) => {
    return myShortNumber(tickItem);
}

const useStyles = makeStyles(theme => ({
    customtooltip: {
        backgroundColor: "#FFFFFF",
    },
}));

const CustomTooltip = (props) => {
    const classes = useStyles();
    const dataDescr = props.dataDescr;
    const { active } = props;
    if (active) {
        const { payload, label } = props;
        return (
            <div className={classes.customtooltip}>
                <Typography variant="body1" noWrap>
                    {label}
                </Typography>
                {
                    payload.filter(i => !i.dataKey.endsWith("_avg")).map(item => {
                        return <div style={{ color: dataDescr.find(i => i.dataKey === item.dataKey).color }} >
                            {item.name} : {item.value}
                        </div>
                    })
                }
            </div >
        );
    }
    return null;
}

const GraphDailyGenericInner = (props) => {
    let data = props.data;
    const dataDescr = props.dataDescr;
    const showAllData = props.showAllData;

    for (let line of dataDescr) {
        let move_avg = computeMovingAverage(data, line.dataKey, line.dataKey + "_avg");
        data = mergeDataSeries(data, move_avg);
    }

    data = sortByFullDate(data);

    if (!showAllData) {
        const cutoff = moment().subtract(30, 'days')
        data = data.filter(d => {
            return moment(d.fulldate, "MM/DD/YYYY").isAfter(cutoff)
        });
    }

    data = data.map(t => {
        t.name = moment(t.fulldate, "MM/DD/YYYY").format("M/D");
        return t;
    })
    let chart =
        <LineChart
            data={data}
            margin={{ top: 5, right: 30, left: 5, bottom: 5 }}
        >
            <YAxis tickFormatter={formatYAxis} />
            <XAxis dataKey="name" />
            <CartesianGrid stroke="#d5d5d5" strokeDasharray="5 5" />
            {dataDescr.map(line => {
                return <Line type="monotone"
                    name={line.legendName}
                    dataKey={line.dataKey}
                    dot={{ r: 1 }}
                    strokeDasharray="2 2"
                    stroke={line.color}
                    yAxisId={0}
                    strokeWidth={1} />
            })}
            {dataDescr.map(line => {
                return <Line type="monotone"
                    dataKey={line.dataKey + "_avg"}
                    dot={{ r: 1 }}
                    stroke={line.color}
                    yAxisId={0}
                    strokeWidth={2} />
            })}

            <Legend verticalAlign="top" payload={
                dataDescr.map(line => {
                    return {
                        value: line.legendName,
                        type: "line",
                        color: line.color,
                    }
                })
            } />
            <Tooltip content={<CustomTooltip dataDescr={dataDescr} />} />
        </LineChart>;

    return <div>
        <ResponsiveContainer height={300} >
            {chart}
        </ResponsiveContainer>
    </div>;
}

const GraphDailyGeneric = (props) => {
    const CookieSetPreference = (state) => {
        Cookies.set("GraphDailyPreference", state, {
            expires: 100
        });
    }
    const CookieGetPreference = () => {
        let pref = Cookies.getJSON("GraphDailyPreference");
        if (!pref) {
            return {
                showlog: false,
                showAllData: false,
            }
        }
        return pref;
    }

    const [state, setState] = React.useState(CookieGetPreference());
    const setStateSticky = (state) => {
        CookieSetPreference(state);
        setState(state);
    }

    const handleShowAllData = event => {
        let newstate = { ...state, showAllData: !state.showAllData };
        setStateSticky(newstate);
    };

    return <div>
        <Grid container alignItems="center" spacing={1}>
            <Grid item>
                <AntSwitch checked={state.showAllData} onClick={handleShowAllData} />
            </Grid>
            <Grid item onClick={handleShowAllData}>
                <Typography>
                    Show All Data
                </Typography>
            </Grid>
            <Grid item></Grid>
        </Grid>
        <GraphDailyGenericInner {...props} showAllData={state.showAllData} />
    </div>;
}

export { GraphDailyGeneric }