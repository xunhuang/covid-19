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
        display: 'flex',
        flexWrap: 'wrap',
        padding: '4px',
        margin: '5px 5px',
        flexGrow: 1,
        overflow: 'hidden',
    },
    innerDiv: {
        flexDirection: "column",
        alignContent: 'center',
        alignItems: 'center',
        display: 'flex',
        flexWrap: 'wrap',
        // padding: '4px',
        // margin: '5px 5px',
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

    function jumpTo(target, detailed) {
        if (target) {
            pushChangeTo(history, { "tab": target, "detailed": detailed });
        }
    }

    const pop = (label, total, change, target, detailed) =>
        <Paper className={classes.aspect} onClick={() => { jumpTo(target, detailed) }}>
            <div className={classes.innerDiv}>
                <div className={classes.change}>
                    {change ? change : "-"}
                </div>
                <div className={classes.total}>
                    {total}
                </div>
                <div className={classes.label}>
                    {label}
                </div>
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
                    `+${myShortNumber(summary.recoveredNew)}`,
                    'detailed',
                    'Recovery'
                )}
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
                    'detailed',
                    "Tests",
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

function pushChangeTo(history, input) {
    const params = new URLSearchParams(history.location.search);
    for (const [key, value] of Object.entries(input)) {
        console.log(key);
        console.log(value);
        if (value) {
            params.set(key, value);
        }
    }
    history.location.search = params.toString();
    history.push(history.location)
    return history.location;
}
