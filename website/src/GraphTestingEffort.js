import React from 'react';
import { ResponsiveContainer, LineChart, Line, YAxis, XAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { makeStyles } from '@material-ui/core/styles';
import { Typography } from '@material-ui/core';

const useStyles = makeStyles(theme => ({
    customtooltip: {
        backgroundColor: "#FFFFFF",
    }
}));

const CustomTooltip = (props) => {
    const classes = useStyles();
    const { active } = props;
    if (active) {
        const { payload, label } = props;

        let tested;
        let positive;

        payload.map(p => {
            p = p.payload;
            if ("testsThatDay" in p) {
                tested = p.testsThatDay;
            }
            if ("positiveThatDay" in p) {
                positive = p.positiveThatDay;
            }
            return null;
        });

        return (
            <div className={classes.customtooltip}>
                <Typography variant="body1" noWrap>
                    {label}
                </Typography>
                <Typography variant="body2" noWrap>
                    {`Tested: ${tested}`}
                </Typography>
                <Typography variant="body2" noWrap>
                    {`Positve : ${positive}`}
                </Typography>
                <Typography variant="body2" noWrap>
                    {`Positve Rate : ${(positive / tested * 100).toFixed(1)} %`}
                </Typography>
            </div>
        );
    }
    return null;
}

const GraphUSTesting = (props) => {
    const USTesting = require("./data/us_testing.json");
    console.log(USTesting);

    const data = USTesting.map(t => {
        let md = t.date % 1000;
        let m = Math.floor(md / 100);
        let d = md % 100;
        t.name = `${m}/${d}`;
        return t;
    })

    for (let i = 0; i < data.length; i++) {
        data[i].testsThatDay = (i === 0) ? data[i].total : data[i].total - data[i - 1].total;
        data[i].positiveThatDay = (i === 0) ? data[i].positive : data[i].positive - data[i - 1].positive;
    }

    return <ResponsiveContainer height={300} >
        <LineChart
            data={data}
            margin={{ top: 5, right: 30, left: 5, bottom: 5 }}
        >
            <YAxis />
            <XAxis dataKey="name" />
            <CartesianGrid stroke="#f5f5f5" strokeDasharray="5 5" />
            {/* <Line type="monotone" name="Total Tested" dataKey="total" stroke="#387908" yAxisId={0} strokeWidth={3} />
            <Line type="monotone" name="Tested Positive" dataKey="positive" stroke="#ff7300" yAxisId={0} strokeWidth={3} /> */}
            <Line type="monotone" name="Daily Tested " dataKey="testsThatDay" stroke="#387908" yAxisId={0} strokeWidth={3} />
            <Line type="monotone" name="Positive" dataKey="positiveThatDay" stroke="#ff7300" yAxisId={0} strokeWidth={3} />
            <Legend verticalAlign="top" />
            <Tooltip content={<CustomTooltip />} />
        </LineChart></ResponsiveContainer>;
}

export { GraphUSTesting };
