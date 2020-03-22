import React from 'react';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import { makeStyles } from '@material-ui/core/styles';
import Hidden from '@material-ui/core/Hidden';

const moment = require("moment");
const firebase = require("firebase");

const useStyles = makeStyles(theme => ({
    table: {
        width: "100%"
    },
}));

async function fetchUSCaseDataFull() {
    let result = await firebase.functions().httpsCallable('datajson')();
    return result;
}

async function fetchCountyCases(state, county) {
    let result = await firebase.functions().httpsCallable('datajsonCounty')({
        state: state,
        county: county,
    });
    return result;
}

async function fetchStateCases(state) {
    let result = await firebase.functions().httpsCallable('datajsonState')({
        state: state,
    });
    return result;
}

const CountyDetailCaseList = (props) => {
    const [county_cases, setDetailCases] = React.useState(null);
    React.useEffect(() => {
        fetchCountyCases(props.state, props.county).then((result, b) => {
            setDetailCases(result.data.data.sort(sort_by_date));
        });
    }, [props.state, props.county]);

    if (!county_cases) {
        return <div> Loading</div>;
    }
    return <DetailCaseListWidget cases={county_cases} />;
}

function sort_by_date(a, b) {
    return moment(b.fulldate).toDate() - moment(a.fulldate).toDate();
};

const StateDetailCaseListWidget = (props) => {
    const [state_cases, setDetailCases] = React.useState(null);
    React.useEffect(() => {
        fetchStateCases(props.state).then((result, b) => {
            setDetailCases(result.data.data.sort(sort_by_date));
        });
    }, [props.state]);

    if (!state_cases) {
        return <div> Loading</div>;
    }
    return <DetailCaseListWidget cases={state_cases} />;
}
const EntireUSDetailCaseListWidget = (props) => {
    const [us_cases, setDetailCases] = React.useState(null);
    React.useEffect(() => {
        fetchUSCaseDataFull().then((result, b) => {
            setDetailCases(result.data.data.sort(sort_by_date));
        });
    }, []);

    if (!us_cases) {
        return <div> Loading</div>;
    }
    return <DetailCaseListWidget cases={us_cases} />;
}

const DetailCaseListWidget = (props) => {
    const classes = useStyles();
    const cases = props.cases;
    let list =
        <Table className={classes.table} size="small" aria-label="simple table">
            <TableHead>
                <TableRow>
                    <TableCell > Date</TableCell>
                    <TableCell align="center">Count</TableCell>
                    <TableCell align="left">Detail</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {cases.map(row => (
                    <TableRow key={row.id}>
                        <TableCell component="th" scope="row">
                            {moment(row.fulldate).format("M/D")}
                        </TableCell>
                        <TableCell align="center">{row.people_count}</TableCell>
                        <TableCell align="left">{row.comments_en}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table >
    return list;
}

export {
    CountyDetailCaseList,
    StateDetailCaseListWidget,
    EntireUSDetailCaseListWidget,
}