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
                {/* <Typography variant="body2" noWrap>
                    {`Positve Rate : ${(positive / tested * 100).toFixed(1)} %`}
                </Typography> */}
            </div>
        );
    }
    return null;
}

const GraphTestingWidget = (props) => {
    let data = props.data.map(t => {
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

    let total_tests = data.reduce((m, a) => { return a.total > m ? a.total : m }, 0);
    let total_positives = data.reduce((m, a) => { return a.positive > m ? a.positive : m }, 0);

    return <div>
        <Typography variant="body2" noWrap>
            {`Total Tests: ${total_tests}   Postive Rate: ${(total_positives / total_tests * 100).toFixed(1)}% `}
        </Typography>
        <ResponsiveContainer height={300} >
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
            </LineChart>
        </ResponsiveContainer>
        <Typography variant="body2" noWrap>
            Data source: https://covidtracking.com/api/
        </Typography>
    </div>;
}

const GraphUSTesting = (props) => {
    const data = require("./data/us_testing.json");
    return <GraphTestingWidget data={data} />;
}

const GraphStateTesting = (props) => {
    const usdata = require("./data/state_testing.json");
    const statedata = usdata.filter(d => d.state === props.state)
        .sort((a, b) => a.date - b.date);

    return <GraphTestingWidget data={statedata} />;
}

export { GraphUSTesting, GraphStateTesting };
