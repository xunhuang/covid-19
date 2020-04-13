import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Paper } from '@material-ui/core';
import { County } from '../UnitedStates';
import { myShortNumber } from '../Util';

const useStyles = makeStyles(theme => ({
		container: {
			display: 'flex',
      flexWrap: 'wrap',
			justifyContent: 'center',
		},
    aspect: {
        alignContent: 'flex-start',
        alignItems: 'center',
        display: 'flex',
        flexWrap: 'wrap',
        padding: '12px',
        margin: '16px 8px',
    },
    label: {
        width: '100%',
    },
    total: {
        flexGrow: 1,
        fontSize: '2em',
    },
    change: {
        flexGrow: 1,
        minHeight: '1em',
    },
}));

export const Summary = (props) => {
    const classes = useStyles();

		const source = props.source;
		const summary = source.summary();

		// Where does this even belong...
		let maybeHospitals = source.hospitals && source.hospitals();
		if (!maybeHospitals && source instanceof County) {
        maybeHospitals = {
						'bedCount': "N/A",
						'count': "N/A",
				};
		}

    const pop = (label, total, change) =>
        <Paper className={classes.aspect}>
            <div className={classes.label}>
                {label}
            </div>
            <div className={classes.total}>
                {total}
            </div>
            <div className={classes.change}>
                {change > 0 && change}
            </div>
        </Paper>;

    return (
				<div className={classes.container}>
            {pop(
                'Confirmed',
                myShortNumber(summary.confirmed),
                `+${myShortNumber(summary.newcases)}`)}
            {summary.recovered > 0 &&
                pop(
                    'Recovered',
                    myShortNumber(summary.recovered),
                    `+${myShortNumber(summary.recoveredNew)}`)}
						{pop(
								'Deaths',
								myShortNumber(summary.deaths),
								`+${myShortNumber(summary.deathsNew)}`)}
            {maybeHospitals &&
                pop(
                    'Hospitalized',
                    myShortNumber(maybeHospitals.bedCount),
                    '')}
        </div>
    );
};
