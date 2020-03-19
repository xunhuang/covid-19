import React from 'react';
import { ResponsiveContainer, LineChart, Line, YAxis, XAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { makeStyles } from '@material-ui/core/styles';
import { Typography } from '@material-ui/core';

const moment = require("moment");

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

        let total;
        let positive;

        payload.map(p => {
            p = p.payload;
            if ("total" in p) {
                total = p.total;
            }
            if ("positive" in p) {
                positive = p.positive;
            }
        });

        return (
            <div className={classes.customtooltip}>
                <Typography variant="body1" noWrap>
                    {label}
                </Typography>
                <Typography variant="body2" noWrap>
                    {`Total Tested: ${total}`}
                </Typography>
                <Typography variant="body2" noWrap>
                    {`Tested Positve : ${positive}`}
                </Typography>
                <Typography variant="body2" noWrap>
                    {`Positve Rate : ${positive / total}`}
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
        let d = m % 100;
        t.name = `${m}/${d}`;
        return t;
    })

    return <ResponsiveContainer height={300} >
        <LineChart
            data={data}
            margin={{ top: 5, right: 30, left: 5, bottom: 5 }}
        >
            <YAxis />
            <XAxis dataKey="name" />
            <CartesianGrid stroke="#f5f5f5" strokeDasharray="5 5" />
            <Line type="monotone" name="Total Tested" dataKey="total" stroke="#387908" yAxisId={0} strokeWidth={3} />
            <Line type="monotone" name="Tested Positive" dataKey="positive" stroke="#ff7300" yAxisId={0} strokeWidth={3} />
            <Legend verticalAlign="top" />
            <Tooltip content={<CustomTooltip />} />
        </LineChart></ResponsiveContainer>;
}

export { GraphUSTesting };
