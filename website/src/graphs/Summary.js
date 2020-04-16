import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Paper } from '@material-ui/core';
import { County } from '../UnitedStates';
import { myShortNumber } from '../Util';
import { useHistory } from 'react-router-dom'

const useStyles = makeStyles(theme => ({
    container: {
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: "space-around",
    },
    aspect: {
        flexDirection: "column",
        alignContent: 'center',
        alignItems: 'center',
        display: 'flex',
        flexWrap: 'wrap',
        padding: '4px',
        margin: '5px 5px',
        flexGrow: 1,
    },
    label: {
        fontSize: '.7em',
    },
    total: {
        flexGrow: 1,
        fontSize: '1.1em',
    },
    change: {
        flexGrow: 1,
        fontSize: '0.5em',
        minHeight: "0.5em"
    },
}));

export const Summary = (props) => {
    const classes = useStyles();
    const history = useHistory();

    const source = props.source;
    const summary = source.summary();

    let maybeHospitalization = source.testData && source.testData();

    // Where does this even belong...
    let maybeHospitals = !maybeHospitalization && source.hospitals && source.hospitals();
    if (!maybeHospitals && source instanceof County) {
        maybeHospitals = {
            'bedCount': "N/A",
            'count': "N/A",
        };
    }

    function jumpTo(target) {
        if (target) {
            pushChangeTo(history, "tab", target);
        }
    }

    const pop = (label, total, change, target) =>
        <Paper className={classes.aspect} onClick={() => { jumpTo(target) }}>
            <div className={classes.change}>
                {change ? change : "-"}
            </div>
            <div className={classes.total}>
                {total}
            </div>
            <div className={classes.label}>
                {label}
            </div>
        </Paper>;
    return (
        <div className={classes.container}>
            {pop(
                'Confirmed',
                myShortNumber(summary.confirmed),
                `+ ${myShortNumber(summary.newcases)}`)}
            {summary.recovered > 0 &&
                pop(
                    'Recovered',
                    myShortNumber(summary.recovered),
                    `+${myShortNumber(summary.recoveredNew)}`)}
            {pop(
                'Deaths',
                myShortNumber(summary.deaths),
                `+${myShortNumber(summary.deathsNew)}`,
                "peakdeath")}
            {maybeHospitals &&
                pop(
                    'Beds',
                    myShortNumber(maybeHospitals.bedCount),
                    `${maybeHospitals.bedsICU} ICU Beds`)}
            {maybeHospitalization &&
                pop(
                    'Tests',
                    myShortNumber(maybeHospitalization.totalTests),
                    `${Math.floor(maybeHospitalization.totalTestPositive / maybeHospitalization.totalTests * 100)}% pos `,
                )}
            {maybeHospitalization &&
                pop(
                    'Hospitalized',
                    myShortNumber(maybeHospitalization.hospitalized),
                    `+ ${maybeHospitalization.hospitalizedIncreased}`,
                    "peakhospitalization"
                )}
        </div>
    );
};

function pushChangeTo(history, key, value) {
    const params = new URLSearchParams(history.location.search);
    params.set(key, value);
    history.location.search = params.toString();
    history.push(history.location)
    return history.location;
}