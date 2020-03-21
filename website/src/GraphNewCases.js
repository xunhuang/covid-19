import React from 'react';
import { Text, ResponsiveContainer, LineChart, Line, YAxis, XAxis, Tooltip, CartesianGrid, Legend, Label } from 'recharts';
import { makeStyles, withStyles } from '@material-ui/core/styles';
import { Typography } from '@material-ui/core';
import { purple } from '@material-ui/core/colors';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';
import Grid from '@material-ui/core/Grid';
import { scaleSymlog } from 'd3-scale';

const moment = require("moment");

const scale = scaleSymlog().domain([0, 'dataMax']);

const useStyles = makeStyles(theme => ({
    customtooltip: {
        backgroundColor: "#FFFFFF",
    },
    grow: {
        flex: 1,
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

const AntSwitch = withStyles(theme => ({
    root: {
        width: 28,
        height: 16,
        padding: 0,
        display: 'flex',
    },
    switchBase: {
        padding: 2,
        color: theme.palette.grey[500],
        '&$checked': {
            transform: 'translateX(12px)',
            color: theme.palette.common.white,
            '& + $track': {
                opacity: 1,
                backgroundColor: "#00aeef",
                borderColor: theme.palette.primary.main,
                border: `0px solid ${theme.palette.grey[500]}`,
            },
        },
    },
    thumb: {
        width: 12,
        height: 12,
        boxShadow: 'none',
    },
    track: {
        border: `1px solid ${theme.palette.grey[500]}`,
        borderRadius: 16 / 2,
        opacity: 1,
        height: "auto",
        backgroundColor: theme.palette.common.white,
    },
    checked: {},
}))(Switch);


const BasicGraphNewCases = (props) => {
    const classes = useStyles();

    const [state, setState] = React.useState({
        showlog: false,
    });

    const handleChange = event => {
        setState({ ...state, [event.target.name]: event.target.checked });
    };

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

    return <>
        <Typography component="div">
            <Grid component="label" container alignItems="center" spacing={1}>
                <Grid item></Grid>
                <Grid item>
                    <AntSwitch checked={state.showlog} onClick={handleChange} name="showlog" />
                </Grid>
                <Grid item>Show Log Scale</Grid>
                <Grid item className={classes.grow} />
                {/* <Grid item onClick={() => { console.log("hi") }} > Data Source</Grid> */}
            </Grid>
        </Typography>
        <ResponsiveContainer height={300} >
            <LineChart
                data={data}
                margin={{ top: 5, right: 30, left: 5, bottom: 5 }}
            >
                <Text textAnchor={"start"} verticalAnchor={"start"} > hello</Text>
                <Tooltip content={<CustomTooltip />} />
                <XAxis dataKey="name" />
                {
                    state.showlog ?
                        <YAxis scale="log" domain={['auto', 'auto']} /> :
                        <YAxis />
                }

                <CartesianGrid stroke="#f5f5f5" strokeDasharray="5 5" />
                <Line type="monotone" dataKey="confirmed" stroke="#ff7300" yAxisId={0} strokeWidth={3} />
                <Line type="monotone" dataKey="newcase" stroke="#387908" yAxisId={0} strokeWidth={3} />
                <Line type="monotone" dataKey="pending_confirmed" stroke="#ff7300" strokeDasharray="1 1" strokeWidth={3} />
                <Line type="monotone" dataKey="pending_newcase" stroke="#387908" strokeDasharray="1 1" strokeWidth={3} />
                <Legend verticalAlign="top" payload={[
                    { value: 'Total Confirmed', type: 'line', color: '#ff7300' },
                    { value: 'New', type: 'line', color: '#389708' },
                ]} />

            </LineChart></ResponsiveContainer>
    </>
}

export { BasicGraphNewCases };
