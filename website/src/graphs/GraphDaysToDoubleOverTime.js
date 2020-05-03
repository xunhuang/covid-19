import React from 'react';
import { ResponsiveContainer, Tooltip, LineChart, Line, YAxis, XAxis, CartesianGrid, Legend } from 'recharts';
import { Typography } from '@material-ui/core';
import Grid from '@material-ui/core/Grid';
import { myShortNumber, filterDataToRecent, getOldestMomentInData } from '../Util';
import { makeStyles } from '@material-ui/core/styles';
import { DateRangeSlider } from "../DateRangeSlider"

const useStyles = makeStyles(theme => ({
    gridPadding: {
        minWidth: '3vw'
    },
}));

const moment = require("moment");

const GraphDaysToDoubleOverTime = (props) => {
    const classes = useStyles();

    const [state, setState] = React.useState({
        showPastDays: 30,
    });

    const [mydata, setMydata] = React.useState(null);
    React.useEffect(() => {
        props.source.daysToDoubleTimeSeries()
            .then(data => setMydata(data));
    }, [props.source])

    if (!mydata || mydata.length === 0) {
        return <div>loading</div>;
    }

    let data = mydata;

    data = data.map(d => {
        d.name = moment(d.fulldate, "MM/DD/YYYY").format("M/D");
        d.confirmed = d.confirmed ? parseFloat(d.confirmed.toFixed(1)) : null;
        d.death = d.death ? parseFloat(d.death.toFixed(1)) : null;
        return d;
    });

    const handleSliderValueChange = (value) => {
        let newstate = { ...state, showPastDays: value }
        setState(newstate)
    }

    const oldestMoment = getOldestMomentInData(data);
    data = filterDataToRecent(data, state.showPastDays)

    const formatYAxis = (tickItem) => {
        return myShortNumber(tickItem);
    }

    data = data.sort((a, b) => moment(a.fulldate, "MM/DD/YYYY").toDate() - (moment(b.fulldate, "MM/DD/YYYY")).toDate());

    return <>
        <Grid container alignItems="center" spacing={1}>
            <Grid item xs="auto">
                <Typography>
                  Show Data From:
                </Typography>
            </Grid>
            <Grid item xs sm>
              <DateRangeSlider
                  currentDate={moment()}
                  startDate={oldestMoment}
                  valueChanged={handleSliderValueChange}
                  defaultValue={state.showPastDays}
              />
            </Grid>
            <Grid className={classes.gridPadding}></Grid>
            <Grid item xs={12} sm="auto">
                <Typography align="center">
                    High Days-to-2x means slower spread.
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
                <Tooltip />

                <CartesianGrid stroke="#d5d5d5" strokeDasharray="5 5" />
                <Line type="monotone" dataKey="confirmed" stroke="#387908" yAxisId={0} strokeWidth={2} dot={{ r: 1 }} />
                <Line type="monotone" dataKey="death" stroke="#000000" yAxisId={0} strokeWidth={3} dot={{ r: 1 }} />
                <Legend verticalAlign="top" />

            </LineChart></ResponsiveContainer>
    </>
}

export { GraphDaysToDoubleOverTime };
