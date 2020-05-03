import React from 'react';
import { ResponsiveContainer, Tooltip, LineChart, Line, YAxis, XAxis, CartesianGrid } from 'recharts';
import { Typography } from '@material-ui/core';
import Grid from '@material-ui/core/Grid';
import { scaleSymlog } from 'd3-scale';
import { myShortNumber, filterDataToRecent, getOldestMomentInData } from '../Util';
import { AntSwitch } from "./AntSwitch.js"
import { State } from '../UnitedStates';
import { DateRangeSlider } from "../DateRangeSlider"
import axisScales from './GraphAxisScales'

const moment = require("moment");

const scale = scaleSymlog().domain([0, 'dataMax']);

const BasicGraphRecoveryAndDeath = (props) => {
    const [state, setState] = React.useState({
        verticalScale: axisScales.linear,
        showPastDays: 30,
    });

    const [USData, setUSdata] = React.useState(null);
    React.useEffect(() => {
        props.source.dataPointsAsync().then(data => setUSdata(data));
    }, [props.source])

    if (!USData || USData.length === 0) {
        return <div> Loading</div>;
    }

    let data = USData;

    const handleLogScaleToggle = event => {
        setState({
            ...state,
            verticalScale: state.verticalScale === axisScales.log ? axisScales.linear : axisScales.log
        });
    };

    data = data.map(d => {
        d.name = moment(d.fulldate, "MM/DD/YYYY").format("M/D");
        return d;
    });


    const formatYAxis = (tickItem) => {
        return myShortNumber(tickItem);
    }

    const handleSliderValueChange = (value) => {
        let newstate = { ...state, showPastDays: value }
        setState(newstate)
    }

    const oldestMoment = getOldestMomentInData(data);
    data = filterDataToRecent(data, state.showPastDays)

    data = data.sort((a, b) => moment(a.fulldate, "MM/DD/YYYY").toDate() - (moment(b.fulldate, "MM/DD/YYYY")).toDate());

    return <>
        <Grid container alignItems="center" spacing={1}>
            <Grid item>
                <AntSwitch checked={state.verticalScale === axisScales.log} onClick={handleLogScaleToggle} />
            </Grid>
            <Grid item onClick={handleLogScaleToggle}>
                <Typography>
                    Log
                </Typography>
            </Grid>
            <Grid item > </Grid>
            <Grid item>
                <Typography>
                  Show Data From:
                </Typography>
            </Grid>
            <Grid item xs>
              <DateRangeSlider
                  currentDate={moment()}
                  startDate={oldestMoment}
                  valueChanged={handleSliderValueChange}
                  defaultValue={state.showPastDays}
              />
            </Grid>
            <Grid item > </Grid>
        </Grid>
        <ResponsiveContainer height={300} >
            <LineChart
                data={data}
                margin={{ top: 5, right: 30, left: 5, bottom: 5 }}
            >
                <XAxis dataKey="name" />

                {
                    state.verticalScale === axisScales.log ?
                        <YAxis yAxisId={0} scale={scale} /> :
                        <YAxis yAxisId={0} tickFormatter={formatYAxis} />
                }

                <Tooltip />

                <CartesianGrid stroke="#d5d5d5" strokeDasharray="5 5" />
                <Line type="monotone" dataKey="recovery" stroke="#387908" yAxisId={0} strokeWidth={2} />
                <Line type="monotone" dataKey="death" stroke="#000000" yAxisId={0} strokeWidth={3} />

            </LineChart></ResponsiveContainer>
    </>
}

const CaveatStateGraph = (props) => {
    return (
        <>
            <Typography variant="body2">
                Recovery data collection started on 4/2.
              {props.source.summary().recovered > 0 ||
                    " No recovery data for this state yet."
                }
            </Typography>
            <BasicGraphRecoveryAndDeath source={props.source} />
        </>
    );
}

function maybeRecoveryAndDeathTabFor(source) {
    let graph;
    if (source instanceof State) {
        graph = CaveatStateGraph;
    } else if (source.summary().recovered) {
        graph = BasicGraphRecoveryAndDeath;
    } else {
        // Avoid showing hopeless graphs
        return undefined;
    }

    return {
        id: 'recovery',
        label: 'Recovery',
        graph,
    };
}

export { maybeRecoveryAndDeathTabFor };
