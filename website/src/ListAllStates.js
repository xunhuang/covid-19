import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import {
  myShortNumber,
  myGoodWholeNumber,
  myGoodShortNumber,
  getStateNameByStateCode,
} from "./Util.js";
import { Link as MaterialLink } from '@material-ui/core';
import { Link as RouterLink } from 'react-router-dom';
import { EnhancedTableHead, stableSort, getComparator } from "./TableSortHelper";
import { reverse } from 'named-urls';
import { CountryContext } from "./CountryContext";
import { useContext } from 'react';
import routes from "./Routes"

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
  let list = props.country.allStates()
    .sort((a, b) => b.confirmed() - a.confirmed());
  let countySummary =
    <AllStateListRender states={list} />
  return countySummary;
}

const ListAllStatesPerCapita = (props) => {
  let list = props.country.allStates()
    .sort((a, b) => b.confirmed() - a.confirmed());
  let countySummary =
    <AllStateListCapita states={list} />
  return countySummary;
}

const ListAllStatesTesting = (props) => {
  let list = props.country.allStates()
    .sort((a, b) => b.confirmed() - a.confirmed());
  let countySummary =
    <AllStateListTesting states={list} />
  return countySummary;
}

function prepareDataForDisplay(list) {
  let extendlist = list.map(state => {
    const row = state.summary();
    let newrow = {};
    newrow.newcases = row.newcases;
    newrow.confirmed = row.confirmed;
    newrow.newpercent = row.newpercent;
    newrow.death = row.deaths;
    newrow.newEntry = (Number.isNaN(newrow.newpercent) || !isFinite(newrow.newpercent))
      ? newrow.newcases
      : `${(newrow.newpercent * 100).toFixed(1)}%`;
    if (newrow.newcases === 0) {
      newrow.newEntry = 0;
    }
    newrow.pop = state.population();
    newrow.statename = state.name;
    newrow.state = state.twoLetterName;
    newrow.partsPerMil = newrow.confirmed * 1000000 / newrow.pop;
    newrow.deathsPerMil = newrow.death * 1000000 / newrow.pop;
    newrow.daysToDouble = row.daysToDouble;
    newrow.daysToDoubleDeath = row.daysToDoubleDeath;
    newrow.recovered = row.recovered;
    return newrow;
  });
  return extendlist;
}

const AllStateListCapita = (props) => {
  const list = props.states;
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
              return <TableRow key={row.state}>
                <TableCell component="th" scope="row">
                  <MaterialLink component={RouterLink} to={reverse(routes.state, { state: row.state })}>
                    {row.statename}
                  </MaterialLink>
                </TableCell>
                <TableCell align="right">{row.confirmed}</TableCell>
                <TableCell align="right">{myGoodWholeNumber(row.partsPerMil)}</TableCell>
                <TableCell align="right">{myGoodShortNumber(row.death)}</TableCell>
                <TableCell align="right">{myGoodWholeNumber(row.deathsPerMil)}</TableCell>
                <TableCell align="right">{(row.pop === 0) ? "-" : myGoodShortNumber(row.pop)}</TableCell>
              </TableRow>;
            })
        }
      </TableBody>
    </Table>
  return countySummary;
};

const AllStateListRender = (props) => {
  const list = props.states;
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
    { id: 'recovered', numeric: true, disablePadding: false, label: 'Recovered' },
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
                <TableCell component="th" scope="row">
                  <MaterialLink component={RouterLink} to={reverse(routes.state, { state: row.state })}>
                    {row.statename}
                  </MaterialLink>
                </TableCell>
                <TableCell align="right">{row.confirmed}</TableCell>
                <TableCell align="right"> {newcolumn} </TableCell>
                <TableCell align="right">{row.recovered ? myGoodShortNumber(row.recovered) : "-"}</TableCell>
                <TableCell align="right">{myGoodShortNumber(row.death)}</TableCell>
                <TableCell align="right">{(!row.daysToDouble) ? "-" :
                  ((row.daysToDouble > 365 || row.daysToDouble < 0) ? "1 Year+" : row.daysToDouble.toFixed(1))}</TableCell>
                <TableCell align="right">{(!row.daysToDoubleDeath) ? "-" :
                  (row.daysToDoubleDeath > 365 ? "1 Year+" : row.daysToDoubleDeath.toFixed(1))}</TableCell>
              </TableRow>;
            })
        }
      </TableBody>
    </Table>
  return countySummary;
};

function prepareStatesTestingDataForDisplay(list) {
  let extendlist = list.map(row => {
    let newrow = {};
    let totalTested = row.positive + row.negative;
    newrow.statename = getStateNameByStateCode(row.state);
    newrow.positiveNumber = row.positive ?? 0;
    newrow.positiveRate = row.positive / totalTested * 100;
    newrow.negativeNumber = row.negative ?? 0;
    newrow.negativeRate = row.negative / totalTested * 100;
    newrow.pending = row.pending ?? "-";
    newrow.total = row.total;
    newrow.testCoverage = row.testCoverage;
    return newrow;
  });
  return extendlist;
}

const AllStateListTesting = (props) => {
  const classes = useStyles();
  const [order, setOrder] = React.useState('desc');
  const [orderBy, setOrderBy] = React.useState('confirmed');

  const country = useContext(CountryContext);
  const [sourceData, setSourceData] = React.useState(null);
  React.useEffect(() => {
    country.testingAllAsync()
      .then(data => setSourceData(data));
  }, [country])
  if (!sourceData || sourceData.length === 0) {
    return <div> Loading</div>;
  }

  let states_data = {};
  for (let i = 0; i < sourceData.length; i++) {
    let record = sourceData[i];
    let state = record.state;
    if ((state in states_data) && (states_data[state].date > record.date)) {
      continue;
    }
    if (record.pending === null) {
      // have to do this other sort doesn't work
      record.pending = Number.NEGATIVE_INFINITY;
    }
    const stateObject = country.stateForId(record.fips);
    record.testCoverage = record.total / stateObject.population();
    states_data[state] = record;
  }


  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const myHeadCells = [
    { id: 'statename', numeric: false, disablePadding: false, label: 'Name' },
    { id: 'positiveNumber', numeric: true, disablePadding: false, label: 'Pos' },
    { id: 'positiveRate', numeric: true, disablePadding: false, label: 'Pos%' },
    { id: 'negativeNumber', numeric: true, disablePadding: false, label: 'Neg' },
    { id: 'negativeRate', numeric: true, disablePadding: false, label: 'Neg%' },
    { id: 'pending', numeric: true, disablePadding: false, label: 'Pending' },
    { id: 'testCoverage', numeric: true, disablePadding: false, label: 'Test Coverage' },
    { id: 'total', numeric: true, disablePadding: false, label: 'Total' },
  ];

  let list = Object.values(states_data);
  let extendlist = prepareStatesTestingDataForDisplay(list);

  let table =
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
              return <TableRow key={row.state}>
                <TableCell component="th" scope="row">
                  <MaterialLink component={RouterLink} to={reverse(routes.state, { state: row.state })}>
                    {row.statename}
                  </MaterialLink>
                </TableCell>
                <TableCell align="right">{row.positiveNumber}</TableCell>
                <TableCell align="right">{row.positiveRate.toFixed(1)}%</TableCell>
                <TableCell align="right">{row.negativeNumber}</TableCell>
                <TableCell align="right">{row.negativeRate.toFixed(1)}%</TableCell>
                <TableCell align="right">{!isFinite(row.pending) ? "-" : row.pending}</TableCell>
                <TableCell align="right">{(row.testCoverage * 100).toFixed(1)} %</TableCell>
                <TableCell align="right">{row.total}</TableCell>
              </TableRow>;
            })
        }
      </TableBody>
    </Table>
  return table;
};

export {
  ListAllStates,
  ListAllStatesPerCapita,
  ListAllStatesTesting,
}
