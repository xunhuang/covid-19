import React from 'react';
import {
    ResponsiveContainer, Tooltip,
    Line, Area, Legend,
    ReferenceLine,
    YAxis, XAxis, CartesianGrid,
    ComposedChart,
} from 'recharts';
import { Typography } from '@material-ui/core';
import Grid from '@material-ui/core/Grid';
import { myShortNumber } from '../Util';
import { AntSwitch } from "./GraphNewCases.js"
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
        let actualDeath_total;
        let actualDeath_daily;
        payload.map(p => {
            p = p.payload;
            if ("deaths_mean" in p) {
                deaths_mean = p.deaths_mean;
            }
            if ("deathsTotal_mean" in p) {
                deathsTotal_mean = p.deathsTotal_mean;
            }
            if ("actualDeath_total" in p) {
                actualDeath_total = p.actualDeath_total;
            }
            if ("actualDeath_daily" in p) {
                actualDeath_daily = p.actualDeath_daily;
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
                {actualDeath_daily &&
                    <Typography variant="body2" noWrap>
                        {`Actual Daily: ${actualDeath_daily}`}
                    </Typography>
                }
                <Typography variant="body2" noWrap>
                    {`Projected Total: ${deathsTotal_mean}`}
                </Typography>
                {actualDeath_total &&
                    <Typography variant="body2" noWrap>
                        {`Actual Total: ${actualDeath_total}`}
                    </Typography>
                }
            </div>
        );
    }
    return null;
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

const GraphDeathProjection = (props) => {

    const [sourceData, setSourceData] = React.useState(null);
    React.useEffect(() => {
        props.source.projectionsAsync()
            .then(data => setSourceData(data));
    }, [props.source])
    if (!sourceData || sourceData.length === 0) {
        return <div> Loading</div>;
    }

    const [formateddata, max_date] =
        formatData(sourceData, keydeath);
    const actual_deaths_total = props.source.deaths();

    for (let item of formateddata) {
        let entry = actual_deaths_total[item.fulldate];
        if (entry) {
            item.actualDeath_total = entry;
            let lastday = moment(item.fulldate, "MM/DD/YYYY").subtract(1, "days").format("MM/DD/YYYY");
            let lastentry = actual_deaths_total[lastday];
            if (lastentry !== null) {
                item.actualDeath_daily = entry - lastentry;
            }
        }
    }

    return <GraphDeathProjectionRender
        data={formateddata}
        max_date={max_date}
        max_label="Peak Death"
        data_keys={keydeath}
        tooltip={<DeathTooltip />}
    />;
}

const formatData = (data, keys) => {
    data = data.map(d => {
        d.fulldate = moment(d.date, "YYYY-MM-DD").format("MM/DD/YYYY");
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
        let mean = Math.round(d[keys.key_mean]);
        let lower = Math.round(d[keys.key_lower]);
        let upper = Math.round(d[keys.key_upper]);
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
            <Grid item onClick={handleLogScaleToggle}>
                <Typography>
                    Daily
                </Typography>
            </Grid>
            <Grid item>
                <AntSwitch checked={state.showall} onClick={handleLogScaleToggle} />
            </Grid>
            <Grid item onClick={handleLogScaleToggle}>
                <Typography>
                    Total
                </Typography>
            </Grid>
            <Grid item></Grid>
        </Grid>
        <ResponsiveContainer height={300} >
            <ComposedChart data={data} margin={{ top: 5, right: 30, left: 5, bottom: 5 }} >
                <XAxis dataKey="name" />
                <YAxis yAxisId={0} tickFormatter={formatYAxis} />
                <ReferenceLine x={moment(max_date, "MM/DD/YYYY").format("M/D")} label={{ value: props.max_label, fill: '#a3a3a3' }} stroke="#e3e3e3" strokeWidth={3} />
                <CartesianGrid stroke="#d5d5d5" strokeDasharray="5 5" />
                <Line type="monotone" dataKey={data_keys.key_mean} stroke="#000000" dot={{ r: 1 }} yAxisId={0} strokeWidth={2} />
                <Area type='monotone' dataKey={data_keys.key_lower} stackId="1" stroke='#8884d8' fill='#FFFFFF' />
                <Area type='monotone' dataKey={data_keys.key_delta} stackId="1" stroke='#82ca9d' fill='#82ca9d' />
                <Line type="monotone" dataKey="actualDeath_daily" stroke="#FF0000" dot={{ r: 1 }} yAxisId={0} strokeWidth={3} />
                {state.showall && <Line type="monotone" dataKey={data_keys.key_mean_cumulative} dot={{ r: 1 }} stroke="#000000" yAxisId={0} strokeWidth={2} />}
                {state.showall && <Line type="monotone" dataKey="actualDeath_total" dot={{ r: 1 }} stroke="#ff0000" yAxisId={0} strokeWidth={2} />}
                {state.showall && <Area type='monotone' dataKey={data_keys.key_lower_cumulative} stackId="2" stroke='#8884d8' fill='#FFFFFF' />}
                {state.showall && <Area type='monotone' dataKey={data_keys.key_delta_cumulative} stackId="2" stroke='#82ca9d' fill='#82ca9d' />}
                <Tooltip content={props.tooltip} />
                <Legend verticalAlign="top" payload={[
                    { value: 'Actual Death', type: 'line', color: '#ff0000' },
                    { value: 'Projection', type: 'line', color: '#000000' },
                ]} />
            </ComposedChart>
        </ResponsiveContainer>
        <Typography variant="body2">
            Source: NPR, University of Washington, Census Bureau
                </Typography>
    </>
}

function maybeDeathProjectionTabFor(source) {
    if (source.projectionsAsync) {
        return {
            id: 'peakdeath',
            label: 'Death*',
            graph: GraphDeathProjection,
        };
    } else {
        return undefined;
    }
}

export {
    maybeDeathProjectionTabFor,
}
