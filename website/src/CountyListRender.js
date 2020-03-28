import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { lookupCountyInfo, nearbyCounties } from "./USCountyInfo.js";
import * as USCounty from "./USCountyInfo.js";
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import { myShortNumber, myToNumber } from "./Util.js";
import Hidden from '@material-ui/core/Hidden';
import { ThemeProvider } from '@material-ui/core'
import { createMuiTheme } from '@material-ui/core/styles';
import TableSortLabel from '@material-ui/core/TableSortLabel';

const compact = createMuiTheme({
    overrides: {
        MuiTableCell: {
            sizeSmall: {  //This can be referred from Material UI API documentation. 
                padding: '1px 1px 1px 1px',
                // backgroundColor: "#eaeaea",
            },
        },
    },
});

const states = require('us-state-codes');

const useStyles = makeStyles(theme => ({
    row: {
        padding: theme.spacing(1, 1),
        justifyContent: "space-between",
        display: "flex",
    },
    tag: {
        display: "inline-block",
        textAlign: "center",
        backgroundColor: "#f3f3f3",
        padding: theme.spacing(1, 1),
        flex: 1,
        margin: 3,
    },
    grow: {
        flexGrow: 1,
    },
    table: {
        width: "100%"
    }
}));

const NearbyCounties = (props) => {
    let county = props.county;
    if (county === "New York City") {
        console.log("NYYYYC");
        county = "New York";
    }
    let countyInfo = lookupCountyInfo(props.state, county);
    let countySummary = <div></div>;
    if (countyInfo) {
        let nearby = nearbyCounties(props.state, county)
            // data source combined all NYC Boroughs into New York, NY
            // this is a hack to remove these counties and they showed up as 
            // zeros. 
            .filter(a => a.State !== "NY" ||
                (a.County !== "Queens" && a.County !== "Kings" &&
                    a.County !== "Bronx" && a.County !== "Richmond"))
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 10);
        countySummary = <CountyListRender countylist={nearby} callback={props.callback} />
    }
    return countySummary;
}
const CountiesForStateWidget = (props) => {
    let countyInfo = true;
    let countySummary = <div></div>;
    if (countyInfo) {
        let list = USCounty.countyDataForState(props.state);
        countySummary =
            <CountyListRender countylist={list} callback={props.callback} />
    }
    return countySummary;
}

const AllStatesListWidget = (props) => {
    let list = USCounty.getAllStatesSummary()
        .sort((a, b) => b.confirmed - a.confirmed);
    let countySummary =
        <AllStateListRender countylist={list} callback={props.callback} />
    return countySummary;
}

function EnhancedTableHead(props) {
    const { classes, order, orderBy, onRequestSort } = props;
    const createSortHandler = property => event => {
        onRequestSort(event, property);
    };

    return (
        <TableHead>
            <TableRow>
                {headCells.map(headCell => (
                    <TableCell
                        key={headCell.id}
                        align={headCell.numeric ? 'right' : 'left'}
                        sortDirection={orderBy === headCell.id ? order : false}
                    >
                        <TableSortLabel
                            active={orderBy === headCell.id}
                            direction={orderBy === headCell.id ? order : 'asc'}
                            onClick={createSortHandler(headCell.id)}
                        >
                            {headCell.label}
                        </TableSortLabel>
                    </TableCell>
                ))}
            </TableRow>
        </TableHead>
    );
}

const AllStateListRender = (props) => {
    const list = props.countylist;
    const classes = useStyles();
    let countySummary =
        <Table className={classes.table} size="small" aria-label="simple table">
            <TableHead>
                <TableRow>
                    <Hidden xsDown>
                        <TableCell > Name</TableCell>
                        <TableCell align="right">Total</TableCell>
                        <TableCell align="right">New</TableCell>
                        <TableCell align="right">Population</TableCell>
                        <TableCell align="right">Cases Per Million</TableCell>
                    </Hidden>
                    <Hidden smUp>
                        <ThemeProvider theme={compact}>
                            <TableCell > Name</TableCell>
                            <TableCell align="right">Total</TableCell>
                            <TableCell align="right">New</TableCell>
                            <TableCell align="right">Pop</TableCell>
                            <TableCell align="right">Cases/Mil</TableCell>
                        </ThemeProvider>
                    </Hidden>
                </TableRow>
            </TableHead>
            <TableBody>
                {
                    list.map(row => {
                        let newcases = row.newcases;
                        let confirmed = row.confirmed;
                        let newpercent = row.newpercent;
                        let newEntry = (Number.isNaN(newpercent) || isFinite(newpercent)) ? newcases : `${newcases}(+${newpercent}%)`;
                        if (newcases === 0) {
                            newEntry = 0;
                        }
                        let statename = states.getStateNameByStateCode(row.state);
                        if (!statename) {
                            statename = row.state;
                        }
                        let pop = myToNumber(row.Population2010);
                        return <TableRow key={statename}>
                            <Hidden xsDown>
                                <TableCell component="th" scope="row" onClick={() => {
                                    props.callback(row.state)
                                }}>
                                    {statename}
                                </TableCell>
                                <TableCell align="right">{confirmed}</TableCell>
                                <TableCell align="right"> {newEntry} </TableCell>
                                <TableCell align="right">{myShortNumber(pop)}</TableCell>
                                <TableCell align="right">{(confirmed * 1000000 / pop).toFixed(1)}</TableCell>
                            </Hidden>
                            <Hidden smUp>
                                <ThemeProvider theme={compact}>

                                    <TableCell component="th" scope="row" onClick={() => {
                                        props.callback(row.state)
                                    }}>
                                        {statename}
                                    </TableCell>
                                    <TableCell align="right">{confirmed}</TableCell>
                                    <TableCell align="right"> {newEntry} </TableCell>
                                    <TableCell align="right">{myShortNumber(pop)}</TableCell>
                                    <TableCell align="right">{(confirmed * 1000000 / pop).toFixed(0)}</TableCell>
                                </ThemeProvider>
                            </Hidden>
                        </TableRow>;
                    })
                }
            </TableBody>
        </Table>
    return countySummary;
};

function descendingComparator(a, b, orderBy) {
    if (b[orderBy] < a[orderBy]) {
        return -1;
    }
    if (b[orderBy] > a[orderBy]) {
        return 1;
    }
    return 0;
}

function stableSort(array, comparator) {
    const stabilizedThis = array.map((el, index) => [el, index]);
    stabilizedThis.sort((a, b) => {
        const order = comparator(a[0], b[0]);
        if (order !== 0) return order;
        return a[1] - b[1];
    });
    return stabilizedThis.map(el => el[0]);
}

function getComparator(order, orderBy) {
    return order === 'desc'
        ? (a, b) => descendingComparator(a, b, orderBy)
        : (a, b) => -descendingComparator(a, b, orderBy);
}

const headCells = [
    { id: 'County', numeric: false, disablePadding: false, label: 'Name' },
    { id: 'confirmed', numeric: true, disablePadding: true, label: 'Total' },
    { id: 'newcases', numeric: true, disablePadding: false, label: 'New' },
    { id: 'population', numeric: true, disablePadding: false, label: 'Pop.' },
    { id: 'partsPerMil', numeric: true, disablePadding: false, label: '#/Mil.' },
];

const CountyListRender = (props) => {
    const list = props.countylist.sort((a, b) => b.total - a.total);
    const classes = useStyles();
    function clicked(newcounty, newstate) {
        if (props.callback) {
            props.callback(newcounty, newstate);
        }
    }

    const [order, setOrder] = React.useState('desc');
    const [orderBy, setOrderBy] = React.useState('confirmed');
    const handleRequestSort = (event, property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    let extendlist = list.map(row => {
        let newrow = {};
        let sum = USCounty.casesForCountySummary(row.State, row.County);
        let newcases = sum.newcases;
        let confirmed = sum.confirmed;
        let newpercent = sum.newpercent;
        let population = myToNumber(row.Population2010);

        // hard coding a special here for NYC because
        // all 5 boroughs are lumped together. terrible hack
        if (row.State === "NY" && (row.County === "New York City" || row.County === "New York")) {
            population = 8500000;
        }

        newrow.partsPerMil = confirmed * 1000000 / population;

        newrow.newEntry = (Number.isNaN(newpercent) || isFinite(newpercent)) ? newcases : `${newcases}(+${newpercent}%)`;
        if (newcases === 0) {
            newrow.newEntry = 0;
        }

        if (row.County === "Statewide Unallocated") {
            population = 0;
            newrow.newEntry = newcases;
            // newrow.partsPerMil = 1;
        }
        // note. doing this row overwrite can be dangerous... references.
        newrow.newcases = newcases;
        newrow.County = row.County;
        newrow.State = row.State;
        newrow.confirmed = confirmed;
        newrow.newpercent = newpercent;
        newrow.population = population;
        newrow.County = row.County;
        return newrow;
    });

    let countySummary =
        <Table className={classes.table} size="small" aria-label="simple table">
            <EnhancedTableHead
                classes={classes}
                order={order}
                orderBy={orderBy}
                onRequestSort={handleRequestSort}
            />
            <TableBody>
                {
                    stableSort(extendlist, getComparator(order, orderBy))
                        .map(row => {

                            return <TableRow key={row.County}>
                                <Hidden xsDown>
                                    <TableCell component="th" scope="row" onClick={() => { clicked(row.County, row.State); }}>
                                        {row.County}
                                    </TableCell>
                                    <TableCell align="right">{row.confirmed}</TableCell>
                                    <TableCell align="right"> {row.newEntry} </TableCell>
                                    <TableCell align="right">{myShortNumber(row.population)}</TableCell>
                                    <TableCell align="right">{row.partsPerMil.toFixed(0)}</TableCell>
                                </Hidden>
                                <Hidden smUp>
                                    <ThemeProvider theme={compact}>
                                        <TableCell component="th" scope="row" onClick={() => { clicked(row.County, row.State); }}>
                                            {row.County}
                                        </TableCell>
                                        <TableCell align="right">{row.confirmed}</TableCell>
                                        <TableCell align="right"> {row.newEntry} </TableCell>
                                        <TableCell align="right">{myShortNumber(row.population)}</TableCell>
                                        <TableCell align="right">{row.partsPerMil.toFixed(1)}</TableCell>
                                    </ThemeProvider>
                                </Hidden>
                            </TableRow>;
                        })
                }
            </TableBody>
        </Table >

    return countySummary;
}

export {
    NearbyCounties,
    CountiesForStateWidget,
    AllStatesListWidget,
}