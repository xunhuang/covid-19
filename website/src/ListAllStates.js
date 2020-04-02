import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import * as USCounty from "./USCountyInfo.js";
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import { myShortNumber, myToNumber, myGoodWholeNumber, myGoodShortNumber } from "./Util.js";
import { ThemeProvider } from '@material-ui/core'
import { createMuiTheme } from '@material-ui/core/styles';
import { Link } from '@material-ui/core';
import { EnhancedTableHead, stableSort, getComparator } from "./TableSortHelper";

const compact = createMuiTheme({
    overrides: {
        MuiTableCell: {
            sizeSmall: {  //This can be referred from Material UI API documentation. 
                padding: '1px 1px 1px 1px',
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
    topTag: {
        fontSize: "0.5rem",
    },
    table: {
        width: "100%"
    }
}));

const ListAllStates = (props) => {
    let list = USCounty.getAllStatesSummary()
        .sort((a, b) => b.confirmed - a.confirmed);
    let countySummary =
        <AllStateListRender countylist={list} callback={props.callback} />
    return countySummary;
}

const ListAllStatesPerCapita = (props) => {
    let list = USCounty.getAllStatesSummary()
        .sort((a, b) => b.confirmed - a.confirmed);
    let countySummary =
        <AllStateListCapita countylist={list} callback={props.callback} />
    return countySummary;
}

function prepareDataForDisplay(list) {
    let extendlist = list.map(row => {
        let newrow = {};
        newrow.newcases = row.newcases;
        newrow.confirmed = row.confirmed;
        newrow.newpercent = row.newpercent;
        newrow.death = row.death;
        newrow.newEntry = (Number.isNaN(newrow.newpercent) || !isFinite(newrow.newpercent))
            ? newrow.newcases
            : `${(newrow.newpercent * 100).toFixed(1)}%`;
        if (newrow.newcases === 0) {
            newrow.newEntry = 0;
        }
        let statename = states.getStateNameByStateCode(row.state);
        newrow.pop = myToNumber(row.Population2010);
        newrow.statename = statename;
        newrow.state = row.state;
        newrow.partsPerMil = newrow.confirmed * 1000000 / newrow.pop;
        newrow.deathsPerMil = newrow.death * 1000000 / newrow.pop;
        newrow.daysToDouble = row.daysToDouble;
        newrow.daysToDoubleDeath = row.daysToDoubleDeath;
        return newrow;
    });
    return extendlist;
}

const AllStateListCapita = (props) => {
    const list = props.countylist;
    const classes = useStyles();

    const [order, setOrder] = React.useState('desc');
    const [orderBy, setOrderBy] = React.useState('confirmed');
    const handleRequestSort = (event, property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const myHeadCells = [
        { id: 'state', numeric: false, disablePadding: false, label: 'Name' },
        { id: 'confirmed', numeric: true, disablePadding: true, label: 'Total' },
        { id: 'partsPerMil', numeric: true, disablePadding: false, label: '#/mil' },
        { id: 'death', numeric: true, disablePadding: false, label: 'Deaths' },
        { id: 'deathsPerMil', numeric: true, disablePadding: false, label: 'Deaths/mil' },
        { id: 'pop', numeric: true, disablePadding: false, label: 'Pop.' },
    ];

    let extendlist = prepareDataForDisplay(list);

    let countySummary =
        <Table className={classes.table} size="small" aria-label="simple table">
            <EnhancedTableHead
                classes={classes}
                order={order}
                orderBy={orderBy}
                onRequestSort={handleRequestSort}
                headCells={myHeadCells}
            />
            <TableBody>
                {
                    stableSort(extendlist, getComparator(order, orderBy))
                        .map(row => {
                            let newcolumn = row.newcases ? `${myShortNumber(row.newcases)}(${row.newEntry})` : 0;
                            if (row.newcases === 0) {
                                newcolumn = "-";
                            } else {
                                newcolumn = <section>
                                    <div className={classes.topTag}>
                                        +{row.newEntry}
                                    </div>
                                    <div className={classes.mainTag}>
                                        {myShortNumber(row.newcases)} </div>
                                </section>;
                            }
                            return <TableRow key={row.state}>
                                <ThemeProvider theme={compact}>
                                    <TableCell component="th" scope="row" onClick={() => {
                                        props.callback(row.state)
                                    }}>
                                        <Link>
                                            {row.statename}
                                        </Link>
                                    </TableCell>
                                    <TableCell align="right">{row.confirmed}</TableCell>
                                    <TableCell align="right">{myGoodWholeNumber(row.partsPerMil)}</TableCell>
                                    <TableCell align="right">{myGoodShortNumber(row.death)}</TableCell>
                                    <TableCell align="right">{myGoodWholeNumber(row.deathsPerMil)}</TableCell>
                                    <TableCell align="right">{(row.pop === 0) ? "-" : myGoodShortNumber(row.pop)}</TableCell>
                                </ThemeProvider>
                            </TableRow>;
                        })
                }
            </TableBody>
        </Table>
    return countySummary;
};

const AllStateListRender = (props) => {
    const list = props.countylist;
    const classes = useStyles();

    const [order, setOrder] = React.useState('desc');
    const [orderBy, setOrderBy] = React.useState('confirmed');
    const handleRequestSort = (event, property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const myHeadCells = [
        { id: 'state', numeric: false, disablePadding: false, label: 'Name' },
        { id: 'confirmed', numeric: true, disablePadding: true, label: 'Total' },
        { id: 'newcases', numeric: true, disablePadding: false, label: 'New' },
        { id: 'partsPerMil', numeric: true, disablePadding: false, label: '#/mil' },
        { id: 'death', numeric: true, disablePadding: false, label: 'Deaths' },
        { id: 'daysToDouble', numeric: true, disablePadding: false, label: 'Days 2x' },
        { id: 'daysToDoubleDeath', numeric: true, disablePadding: false, label: 'Deaths 2x' },
    ];

    let extendlist = prepareDataForDisplay(list);

    let countySummary =
        <Table className={classes.table} size="small" aria-label="simple table">
            <EnhancedTableHead
                classes={classes}
                order={order}
                orderBy={orderBy}
                onRequestSort={handleRequestSort}
                headCells={myHeadCells}
            />
            <TableBody>
                {
                    stableSort(extendlist, getComparator(order, orderBy))
                        .map(row => {
                            let newcolumn = row.newcases ? `${myShortNumber(row.newcases)}(${row.newEntry})` : 0;
                            if (row.newcases === 0) {
                                newcolumn = "-";
                            } else {
                                newcolumn = <section>
                                    <div className={classes.topTag}>
                                        +{row.newEntry}
                                    </div>
                                    <div className={classes.mainTag}>
                                        {myShortNumber(row.newcases)} </div>
                                </section>;
                            }
                            return <TableRow key={row.state}>
                                <ThemeProvider theme={compact}>
                                    <TableCell component="th" scope="row" onClick={() => {
                                        props.callback(row.state)
                                    }}>
                                        <Link>
                                            {row.statename}
                                        </Link>
                                    </TableCell>
                                    <TableCell align="right">{row.confirmed}</TableCell>
                                    <TableCell align="right"> {newcolumn} </TableCell>
                                    <TableCell align="right">{myGoodWholeNumber(row.partsPerMil)}</TableCell>
                                    {/* <TableCell align="right">{myGoodWholeNumber(row.deathsPerMil)}</TableCell> */}
                                    <TableCell align="right">{myGoodShortNumber(row.death)}</TableCell>
                                    <TableCell align="right">{(!row.daysToDouble) ? "-" : row.daysToDouble.toFixed(1)}</TableCell>
                                    <TableCell align="right">{(!row.daysToDoubleDeath) ? "-" : row.daysToDoubleDeath.toFixed(1)}</TableCell>
                                </ThemeProvider>
                            </TableRow>;
                        })
                }
            </TableBody>
        </Table>
    return countySummary;
};

export {
    ListAllStates,
    ListAllStatesPerCapita,
}