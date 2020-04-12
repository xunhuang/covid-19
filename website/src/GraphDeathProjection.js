import React from 'react';
import {
    ResponsiveContainer, Tooltip,
    Line, Area,
    ReferenceLine,
    YAxis, XAxis, CartesianGrid,
    ComposedChart,
} from 'recharts';
import { Typography } from '@material-ui/core';
import Grid from '@material-ui/core/Grid';
import { myShortNumber } from './Util';
import { AntSwitch } from "./GraphNewCases.js"
import * as Util from "./Util";
import { makeStyles } from '@material-ui/core/styles';

const moment = require("moment");

const useStyles = makeStyles(theme => ({
    customtooltip: {
        backgroundColor: "#FFFFFF",
    },
}));

const DeathTooltip = (props) => {
    const classes = useStyles();
    const { active } = props;
    if (active) {
        const { payload, label } = props;
        let deaths_mean;
        let deathsTotal_mean;
        payload.map(p => {
            p = p.payload;
            if ("deaths_mean" in p) {
                deaths_mean = p.deaths_mean;
            }
            if ("deathsTotal_mean" in p) {
                deathsTotal_mean = p.deathsTotal_mean;
            }
            return null;
        });
        return (
            <div className={classes.customtooltip}>
                <Typography variant="body1" noWrap>
                    {label}
                </Typography>
                <Typography variant="body2" noWrap>
                    {`Projected Daily Death: ${deaths_mean}`}
                </Typography>
                <Typography variant="body2" noWrap>
                    {`Projected Total: ${deathsTotal_mean}`}
                </Typography>
            </div>
        );
    }
    return null;
}
const usdata = require("./data/us_only.json")

const GraphDeathProjectionState = (props) => {
    let data = usdata.filter(d => d.location_name === props.state.name);
    const [formateddata, max_date] = formatData(data, keydeath);
    return <GraphDeathProjectionRender
        data={formateddata}
        max_date={max_date}
        data_keys={keydeath}
        tooltip={<DeathTooltip />}
    />;
}
const keydeath = {
    key_lower: "deaths_lower",
    key_upper: "deaths_upper",
    key_delta: "delta",
    key_mean: "deaths_mean",
    key_upper_cumulative: "deathsTotal_upper",
    key_lower_cumulative: "deathsTotal_lower",
    key_delta_cumulative: "deathsTotal_delta",
    key_mean_cumulative: "deathsTotal_mean",
}

const GraphDeathProjectionUS = (props) => {
    let data = usdata.filter(d => d.location_name === "United States of America");
    const [formateddata, max_date] = formatData(data, keydeath);

    return <GraphDeathProjectionRender
        data={formateddata}
        max_date={max_date}
        data_keys={keydeath}
        tooltip={<DeathTooltip />}
    />;
}

const formatData = (data, keys) => {
    data = data.map(d => {
        d.fulldate = Util.normalize_date(d.date);
        d.name = moment(d.fulldate, "MM/DD/YYYY").format("M/D");
        return d;
    });
    data = data.sort((a, b) => moment(a.fulldate, "MM/DD/YYYY").isAfter(moment(b.fulldate, "MM/DD/YYYY")));
    let deathsTotal_mean = 0;
    let deathsTotal_upper = 0;
    let deathsTotal_lower = 0;
    let max_death = 0;
    let max_date = 0;
    data = data.map(d => {
        let r = {};
        let mean = Math.floor(d[keys.key_mean]);
        let lower = Math.floor(d[keys.key_lower]);
        let upper = Math.floor(d[keys.key_upper]);
        r[keys.key_mean] = mean;
        r[keys.key_lower] = lower;
        r[keys.key_upper] = upper;
        r[keys.key_delta] = upper - lower;
        if (max_death < mean) {
            max_death = mean;
            max_date = d.fulldate;
        }
        deathsTotal_mean += mean;
        r[keys.key_mean_cumulative] = deathsTotal_mean;

        deathsTotal_upper += upper;
        deathsTotal_lower += lower;

        r[keys.key_lower_cumulative] = deathsTotal_lower;
        r[keys.key_delta_cumulative] = deathsTotal_upper - deathsTotal_lower;

        r.fulldate = d.fulldate;
        r.name = d.name;

        return r;
    });
    return [data, max_date];
}

const GraphDeathProjectionRender = (props) => {
    let data = props.data;
    const max_date = props.max_date;
    const data_keys = props.data_keys;

    const [state, setState] = React.useState({
        showall: false,
    });

    const handleLogScaleToggle = event => {
        setState({ ...state, showall: !state.showall });
    };
    const cutoff = moment().subtract(30, 'days')
    const future = moment().add(30, 'days')
    data = data.filter(d => {
        let day = moment(d.fulldate, "MM/DD/YYYY");
        return day.isAfter(cutoff) && day.isBefore(future);
    });
    const formatYAxis = (tickItem) => {
        return myShortNumber(tickItem);
    }

    return <>
        <Grid container alignItems="center" spacing={1}>
            <Grid item>
                <AntSwitch checked={state.showall} onClick={handleLogScaleToggle} />
            </Grid>
            <Grid item onClick={handleLogScaleToggle}>
                <Typography>
                    Show Cumulative
                </Typography>
            </Grid>
            <Grid item></Grid>
        </Grid>
        <ResponsiveContainer height={300} >
            <ComposedChart data={data} margin={{ top: 5, right: 30, left: 5, bottom: 5 }} >
                <XAxis dataKey="name" />
                <YAxis yAxisId={0} tickFormatter={formatYAxis} />
                <ReferenceLine x={moment(max_date, "MM/DD/YYYY").format("M/D")} label={{ value: "Peak Death", fill: '#a3a3a3' }} stroke="#e3e3e3" strokeWidth={3} />
                <CartesianGrid stroke="#d5d5d5" strokeDasharray="5 5" />
                <Line type="monotone" dataKey={data_keys.key_mean} stroke="#000000" dot={{ r: 1 }} yAxisId={0} strokeWidth={3} />
                <Area type='monotone' dataKey={data_keys.key_lower} stackId="1" stroke='#8884d8' fill='#FFFFFF' />
                <Area type='monotone' dataKey={data_keys.key_delta} stackId="1" stroke='#82ca9d' fill='#82ca9d' />
                {state.showall && <Line type="monotone" dataKey={data_keys.key_mean_cumulative} stroke="#000000" yAxisId={0} strokeWidth={3} />}
                {state.showall && <Area type='monotone' dataKey={data_keys.key_lower_cumulative} stackId="2" stroke='#8884d8' fill='#FFFFFF' />}
                {state.showall && <Area type='monotone' dataKey={data_keys.key_delta_cumulative} stackId="2" stroke='#82ca9d' fill='#82ca9d' />}
                <Tooltip content={props.tooltip} />
            </ComposedChart>
        </ResponsiveContainer>
        <Typography variant="body2">
            Source: NPR, University of Washington, Census Bureau
                </Typography>
    </>
}

export { GraphDeathProjectionState, GraphDeathProjectionUS };
