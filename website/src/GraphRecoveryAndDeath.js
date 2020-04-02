import React from 'react';
import { ResponsiveContainer, LineChart, Label, Line, ReferenceLine, ReferenceArea, YAxis, XAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { makeStyles, withStyles } from '@material-ui/core/styles';
import { Typography } from '@material-ui/core';
import Grid from '@material-ui/core/Grid';
import { scaleSymlog } from 'd3-scale';
import { myShortNumber } from './Util';
import { AntSwitch } from "./GraphNewCases.js"

const moment = require("moment");

const scale = scaleSymlog().domain([0, 'dataMax']);

const useStyles = makeStyles(theme => ({
    customtooltip: {
        backgroundColor: "#FFFFFF",
    },
    grow: {
        flex: 1,
    },
    formControl: {
        margin: theme.spacing(1),
        minWidth: 130,
        maxWidth: 300,
    },
}));

const BasicGraphRecoveryAndDeath = (props) => {

    const classes = useStyles();
    const [state, setState] = React.useState({
        showlog: false,
        show2weeks: false,
    });

    const handleLogScaleToggle = event => {
        setState({ ...state, showlog: !state.showlog });
    };

    const handle2WeeksToggle = event => {
        setState({ ...state, show2weeks: !state.show2weeks });
    };

    let data = props.data;
    data = data.map(d => {
        d.name = moment(d.fulldate, "MM/DD/YYYY").format("M/D");
        return d;
    });

    if (state.show2weeks) {
        const cutoff = moment().subtract(14, 'days')
        data = data.filter(d => {
            return moment(d.fulldate, "MM/DD/YYYY").isAfter(cutoff)
        });
    } else {
        const cutoff = moment().subtract(30, 'days')
        data = data.filter(d => {
            return moment(d.fulldate, "MM/DD/YYYY").isAfter(cutoff)
        });
    }


    const formatYAxis = (tickItem) => {
        console.log(tickItem);
        return myShortNumber(tickItem);
    }

    data = data.sort((a, b) => moment(a.fulldate, "MM/DD/YYYY").isAfter(moment(b.fulldate, "MM/DD/YYYY")));

    console.log(data)

    return <>
        <Grid container alignItems="center" spacing={1}>
            <Grid item>
                <AntSwitch checked={state.showlog} onClick={handleLogScaleToggle} />
            </Grid>
            <Grid item onClick={handleLogScaleToggle}>
                <Typography>
                    Log
                </Typography>
            </Grid>
            <Grid item></Grid>

            <Grid item>
                <AntSwitch checked={state.show30days} onClick={handle2WeeksToggle} />
            </Grid>
            <Grid item onClick={handle2WeeksToggle}>
                <Typography>
                    2 weeks
                </Typography>
            </Grid>
            <Grid item></Grid>
        </Grid>
        <ResponsiveContainer height={300} >
            <LineChart
                data={data}
                margin={{ top: 5, right: 30, left: 5, bottom: 5 }}
            >
                <XAxis dataKey="name" />

                {
                    state.showlog ?
                        <YAxis yAxisId={0} scale={scale} /> :
                        <YAxis yAxisId={0} tickFormatter={formatYAxis} />
                }

                <CartesianGrid stroke="#d5d5d5" strokeDasharray="5 5" />
                <Line type="monotone" dataKey="recovery" stroke="#387908" yAxisId={0} strokeWidth={2} />
                <Line type="monotone" dataKey="death" stroke="#000000" yAxisId={0} strokeWidth={3} />

            </LineChart></ResponsiveContainer>
    </>
}

export { BasicGraphRecoveryAndDeath };
