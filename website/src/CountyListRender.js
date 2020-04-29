import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import { myShortNumber, myGoodWholeNumber, myGoodShortNumber } from "./Util.js";
import { Link as MaterialLink } from '@material-ui/core';
import { Link as RouterLink } from 'react-router-dom';
import { EnhancedTableHead, stableSort, getComparator } from "./TableSortHelper";
import { reverse } from 'named-urls';
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
    width: "100%",
    "& a": {
      display: "inline-block",
      height: "100%",
      width: "100%",
    },
  },
}));

const NearbyCounties = (props) => {
  const county = props.county;
  const allNearby = county.nearby();
  if (allNearby) {
    const nearby = allNearby.slice(0, 10);
    return <CountyListRender countylist={nearby} />
  } else {
    return <></>;
  }
}

const ListCountiesForMetro = (props) => {
  return <CountyListRender countylist={props.metro.allCounties()} />
}

function positiveCountiesIn(state) {
  return state.allCounties().filter(c => c.totalConfirmed() > 0);
}

const CountiesForStateWidget = (props) => {
  return <CountyListRender countylist={positiveCountiesIn(props.state)} />;
}

const ListStateCountiesCapita = (props) => {
  return <CountyListRenderCapita countylist={positiveCountiesIn(props.state)} />;
}

function prepCountyDataForDisplay(list) {
  let extendlist =
    list
      .map(county => [county, county.summary()])
      .filter(([c, s]) => s)
      .map(([county, sum]) => {
        let newrow = {};
        let newcases = sum.newcases;
        let confirmed = sum.confirmed;
        let newpercent = sum.newpercent;
        let population = county.population();

        newrow.partsPerMil = confirmed * 1000000 / population;

        newrow.newEntry = (Number.isNaN(newpercent) || !isFinite(newpercent)) ? newcases : `${(newpercent * 100).toFixed(1)}%`;
        if (newcases === 0) {
          newrow.newEntry = 0;
        }

        if (county.name === "Statewide Unallocated") {
          population = 0;
          newrow.newEntry = newcases;
        }
        // note. doing this row overwrite can be dangerous... references.
        newrow.newcases = newcases;
        newrow.State = county.state().twoLetterName;
        newrow.confirmed = confirmed;
        newrow.newpercent = newpercent;
        newrow.population = population;
        newrow.County = county.name;
        newrow.deathsPerMil = sum.deaths * 1000000 / population;
        newrow.death = sum.deaths;
        newrow.daysToDouble = sum.daysToDouble;
        newrow.daysToDoubleDeath = sum.daysToDoubleDeath;
        return newrow;
      });
  return extendlist;
}

const CountyListRender = (props) => {
  const list = props.countylist.sort((a, b) => b.total - a.total);
  const classes = useStyles();
  const [order, setOrder] = React.useState('desc');
  const [orderBy, setOrderBy] = React.useState('confirmed');
  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const myHeadCells = [
    { id: 'County', numeric: false, disablePadding: false, label: 'Name' },
    { id: 'confirmed', numeric: true, disablePadding: true, label: 'Total' },
    { id: 'newcases', numeric: true, disablePadding: false, label: 'New' },
    { id: 'partsPerMil', numeric: true, disablePadding: false, label: '#/Mil' },
    { id: 'death', numeric: true, disablePadding: false, label: 'Deaths' },
    { id: 'daysToDouble', numeric: true, disablePadding: false, label: 'Days 2x' },
  ];

  let extendlist = prepCountyDataForDisplay(list);

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
              let newcolumn = row.newcases ? `+${row.newcases}(${row.newEntry})` : 0;
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

              return <TableRow key={row.County}>
                <TableCell component="th" scope="row">
                  <MaterialLink component={RouterLink} to={reverse(routes.county, { state: row.State, county: row.County })}>
                    {row.County}
                  </MaterialLink>
                </TableCell>
                <TableCell align="right">{row.confirmed}</TableCell>
                <TableCell align="right"> {newcolumn} </TableCell>
                <TableCell align="right">{myGoodWholeNumber(row.partsPerMil)}</TableCell>
                <TableCell align="right">{myGoodShortNumber(row.death)}</TableCell>
                <TableCell align="right">{(!row.daysToDouble) ? "-" : ((row.daysToDouble > 10000) ? "-" : row.daysToDouble.toFixed(1))}</TableCell>
              </TableRow>;
            })
        }
      </TableBody>
    </Table >

  return countySummary;
}
const CountyListRenderCapita = (props) => {
  const list = props.countylist.sort((a, b) => b.total - a.total);
  const classes = useStyles();
  const [order, setOrder] = React.useState('desc');
  const [orderBy, setOrderBy] = React.useState('confirmed');
  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const myHeadCells = [
    { id: 'County', numeric: false, disablePadding: false, label: 'Name' },
    { id: 'confirmed', numeric: true, disablePadding: false, label: 'Total' },
    { id: 'partsPerMil', numeric: true, disablePadding: false, label: '#/Mil' },
    { id: 'deathsPerMil', numeric: true, disablePadding: false, label: 'D/Mil' },
    { id: 'death', numeric: true, disablePadding: false, label: 'Deaths' },
    { id: 'population', numeric: true, disablePadding: false, label: 'Pop.' },
  ];

  let extendlist = prepCountyDataForDisplay(list);

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
              return <TableRow key={row.County}>
                <TableCell component="th" scope="row">
                  <MaterialLink component={RouterLink} to={reverse(routes.county, { county: row.County, state: row.State })}>
                    {row.County}
                  </MaterialLink>
                </TableCell>
                <TableCell align="right">{row.confirmed}</TableCell>
                <TableCell align="right">{myGoodWholeNumber(row.partsPerMil)}</TableCell>
                <TableCell align="right">{myGoodWholeNumber(row.deathsPerMil)}</TableCell>
                <TableCell align="right">{myGoodShortNumber(row.death)}</TableCell>
                <TableCell align="right">{(row.population === 0) ? '-' : myGoodShortNumber(row.population)}</TableCell>
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
  ListStateCountiesCapita,
  ListCountiesForMetro,
}
