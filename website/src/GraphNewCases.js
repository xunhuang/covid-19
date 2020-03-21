import React from 'react';
import { ResponsiveContainer, LineChart, Line, YAxis, XAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { makeStyles } from '@material-ui/core/styles';
import { Typography } from '@material-ui/core';
import { scaleSymlog } from 'd3-scale';

const moment = require("moment");

const scale = scaleSymlog().domain([0, 'dataMax']);

const useStyles = makeStyles(theme => ({
    customtooltip: {
        backgroundColor: "#FFFFFF",
    }
}));

function countyFromNewCases(cases_data) {
    let newcases = cases_data.reduce((m, c) => {
        let a = m[c.fulldate];
        if (!a) a = 0;
        a += c.people_count;
        m[c.fulldate] = a;
        return m;
    }, {});

    const today = moment().format("MM/DD/YYYY");
    var newcasenum = newcases[today];
    if (!newcasenum) {
        newcases[today] = 0;
    }

    let sorted_keys = Object.keys(newcases).sort(function (a, b) {
        return moment(a, "MM/DD/YYY").toDate() - moment(b, "MM/DD/YYY").toDate();
    });
    let total = 0;
    return sorted_keys.map(key => {
        let v = newcases[key];
        total += v;

        const day = moment(key).format("M/D");

        return {
            name: day,
            confirmed: total,
            newcase: v,
        };
    });
}

const CustomTooltip = (props) => {
    const classes = useStyles();
    const { active } = props;
    if (active) {
        const today = moment().format("M/D");
        const { payload, label } = props;
        let confirmed;
        let newcase;

        payload.map(p => {
            p = p.payload;
            if ("confirmed" in p) {
                confirmed = p.confirmed;
            }
            if ("pending_confirmed" in p) {
                confirmed = p.pending_confirmed;
            }
            if ("newcase" in p) {
                newcase = p.newcase;
            }
            if ("pending_newcase" in p) {
                newcase = p.pending_newcase;
            }
            return null;
        });

        let pending_help;
        if (today === payload[0].payload.name) {
            pending_help = "Last # potentially incomplete";
        }

        return (
            <div className={classes.customtooltip}>
                <Typography variant="body1" noWrap>
                    {label}
                </Typography>
                <Typography variant="body2" noWrap>
                    {`Confirmed: ${confirmed}`}
                </Typography>
                <Typography variant="body2" noWrap>
                    {`New: ${newcase}`}
                </Typography>
                <Typography variant="body2" noWrap>
                    {pending_help}
                </Typography>
            </div>
        );
    }
    return null;
}

const BasicGraphNewCases = (props) => {

    let data = countyFromNewCases(props.casesData);

    let yAxis = <YAxis />;
    if (props.logScale) {
        yAxis = <YAxis yAxisId={0} scale={scale} />;
    }
    if (data.length > 2) {
        let newdata = data.slice(0, data.length - 2);
        let second_last = data[data.length - 2];
        let last = data[data.length - 1];
        second_last.pending_confirmed = second_last.confirmed;
        second_last.pending_newcase = second_last.newcase;
        let newlast = {
            name: last.name,
            pending_confirmed: last.confirmed,
            pending_newcase: last.newcase,
        };
        newdata.push(second_last);
        newdata.push(newlast);
        data = newdata;
    }

    return <ResponsiveContainer height={300} >
        <LineChart
            data={data}
            margin={{ top: 5, right: 30, left: 5, bottom: 5 }}
        >
            <Tooltip content={<CustomTooltip />} />
            <XAxis dataKey="name" />
            {yAxis}
            <CartesianGrid stroke="#f5f5f5" strokeDasharray="5 5" />
            <Line type="monotone" dataKey="confirmed" stroke="#ff7300" yAxisId={0} strokeWidth={3} />
            <Line type="monotone" dataKey="newcase" stroke="#387908" yAxisId={0} strokeWidth={3} />
            <Line type="monotone" dataKey="pending_confirmed" stroke="#ff7300" yAxisId={0} strokeDasharray="1 1" strokeWidth={3} />
            <Line type="monotone" dataKey="pending_newcase" stroke="#387908" yAxisId={0} strokeDasharray="1 1" strokeWidth={3} />
            <Legend verticalAlign="top" payload={[
                { value: 'Total Confirmed', type: 'line', color: '#ff7300' },
                { value: 'New', type: 'line', color: '#389708' },
            ]} />
        </LineChart></ResponsiveContainer>;
}

export { BasicGraphNewCases };
