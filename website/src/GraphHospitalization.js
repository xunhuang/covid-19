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
        let negative;
        let totalPositve;
        let totalTested;
        let totalNegative;
        let totalPending;

        payload.map(p => {
            p = p.payload;
            if ("testsThatDay" in p) {
                tested = p.testsThatDay;
            }
            if ("positiveThatDay" in p) {
                positive = p.positiveThatDay;
            }
            if ("negativeThatDay" in p) {
                negative = p.negativeThatDay;
            }
            if ("positive" in p) {
                totalPositve = p.positive;
            }
            if ("negative" in p) {
                totalNegative = p.negative;
            }
            if ("pending" in p) {
                totalPending = p.pending;
            }
            if ("total" in p) {
                totalTested = p.total;
            }
            return null;
        });

        return (
            <div className={classes.customtooltip}>
                <Typography variant="body1" noWrap>
                    {label}
                </Typography>
                <Typography variant="body2" noWrap>
                    {`Daily Tested: ${tested}`}
                </Typography>
                <Typography variant="body2" noWrap>
                    {`Daily Positve : ${positive}`}
                </Typography>
                <Typography variant="body2" noWrap>
                    {`Daily Negative : ${negative}`}
                </Typography>
                <Typography variant="body2" noWrap>
                    {`Cumulative Positve Rate : ${(totalPositve / totalTested * 100).toFixed(1)} %`}
                </Typography>
                <Typography variant="body2" noWrap>
                    {`Cumulative Negative Rate : ${(totalNegative / totalTested * 100).toFixed(1)} %`}
                </Typography>
                <Typography variant="body2" noWrap>
                    {`Pending: ${totalPending ? totalPending : 0}`}
                </Typography>
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
    return <div>
        <Typography variant="body2" >
            Partial data coming in starting 3/21 for some states. Please be patient.
        </Typography>
        <ResponsiveContainer height={300} >
            <LineChart
                data={data}
                margin={{ top: 5, right: 30, left: 5, bottom: 5 }}
            >
                <YAxis />
                <XAxis dataKey="name" />
                <CartesianGrid stroke="#f5f5f5" strokeDasharray="5 5" />
                <Line type="monotone" name="Positive" dataKey="positive" stroke="#ff7300" yAxisId={0} strokeWidth={3} />
                <Line type="monotone" name="Hospitalized" dataKey="hospitalized" stroke="#00aeef" yAxisId={0} strokeWidth={3} />
                <Legend verticalAlign="top" />
                <Tooltip />
            </LineChart>
        </ResponsiveContainer>
        <Typography variant="body2" noWrap>
            Data source: https://covidtracking.com/api/
        </Typography>
    </div>;
}

const GraphUSHospitalization = (props) => {
    const data = require("./data/us_testing.json");
    return <GraphTestingWidget data={data} />;
}

const GraphStateHospitalization = (props) => {
    const usdata = require("./data/state_testing.json");
    const statedata = usdata.filter(d => d.state === props.state)
        .sort((a, b) => a.date - b.date);

    return <GraphTestingWidget data={statedata} />;
}

export { GraphUSHospitalization, GraphStateHospitalization };
