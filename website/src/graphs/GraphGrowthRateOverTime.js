import React from 'react';
import { ResponsiveContainer, Tooltip, LineChart, Line, YAxis, XAxis, CartesianGrid, Legend } from 'recharts';
import { Typography } from '@material-ui/core';
import Grid from '@material-ui/core/Grid';
import { myShortNumber } from '../Util';
import { AntSwitch } from "./AntSwitch.js"

const moment = require("moment");

const GraphGrowthRateOverTime = (props) => {

    const [state, setState] = React.useState({
        show2weeks: false,
    });

    const [mydata, setMydata] = React.useState(null);
    React.useEffect(() => {
        props.source.growthRateTimeSeries()
            .then(data => setMydata(data));
    }, [props.source])

    if (!mydata || mydata.length === 0) {
        return <div>loading</div>;
    }

    let data = mydata;

    const handle2WeeksToggle = event => {
        setState({ ...state, show2weeks: !state.show2weeks });
    };

    data = data.map(d => {
        return {
            fulldate: d.fulldate,
            name: moment(d.fulldate, "MM/DD/YYYY").format("M/D"),
            confirmed: d.confirmed && isFinite(d.confirmed) ? parseFloat((100 * d.confirmed).toFixed(1)) : null,
            death: d.death && isFinite(d.death) ? parseFloat((100 * d.death).toFixed(1)) : null,
        };
    });

    if (state.show2weeks) {
        // const cutoff = moment().subtract(14, 'days')
        // data = data.filter(d => {
        // return moment(d.fulldate, "MM/DD/YYYY").isAfter(cutoff)
        // });
    } else {
        const cutoff = moment().subtract(30, 'days')
        data = data.filter(d => {
            return moment(d.fulldate, "MM/DD/YYYY").isAfter(cutoff)
        });
    }
    const formatYAxis = (tickItem) => {
        return myShortNumber(tickItem) + ' %';
    }

    data = data.sort((a, b) => moment(a.fulldate, "MM/DD/YYYY").toDate() - (moment(b.fulldate, "MM/DD/YYYY")).toDate());

    return <>
        <Grid container alignItems="center" spacing={1}>
            <Grid item >
                <Typography variant="body1">
                    Daily Growth Rate
                </Typography>
            </Grid>
            <Grid item xs />
            <Grid item>
                <AntSwitch checked={state.show30days} onClick={handle2WeeksToggle} />
            </Grid>
            <Grid item onClick={handle2WeeksToggle}>
                <Typography>
                    All Dates
                </Typography>
            </Grid>
        </Grid >
        <ResponsiveContainer height={300} >
            <LineChart
                data={data}
                margin={{ top: 5, right: 30, left: 5, bottom: 5 }}
            >
                <XAxis dataKey="name" />
                <YAxis yAxisId={0} tickFormatter={formatYAxis} />
                <Tooltip formatter={(value) => `${value}%`} />

                <CartesianGrid stroke="#d5d5d5" strokeDasharray="5 5" />
                <Line type="monotone" dataKey="confirmed" stroke="#387908" yAxisId={0} strokeWidth={2} dot={{ r: 1 }} />
                <Line type="monotone" dataKey="death" stroke="#000000" yAxisId={0} strokeWidth={3} dot={{ r: 1 }} />
                <Legend verticalAlign="top" />

            </LineChart>
        </ResponsiveContainer>
    </>
}

export { GraphGrowthRateOverTime };
