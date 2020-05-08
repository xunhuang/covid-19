import React from 'react';
import {
  ResponsiveContainer, YAxis, XAxis, Tooltip,
  CartesianGrid, Legend, LineChart, Line
} from 'recharts';
import { myShortNumber, useStickyState } from '../Util.js';
import { computeMovingAverage, sortByFullDate, mergeDataSeries } from "./DataSeries";
import { makeStyles } from '@material-ui/core/styles';
import { Typography } from '@material-ui/core';
import Grid from '@material-ui/core/Grid';
import { AntSwitch } from "./AntSwitch"
import FormControl from '@material-ui/core/FormControl';
import ListItemText from '@material-ui/core/ListItemText';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select'
import Checkbox from '@material-ui/core/Checkbox';
import Input from '@material-ui/core/Input';
const moment = require("moment");

const formatYAxis = (tickItem) => {
  return myShortNumber(tickItem);
}

const useStyles = makeStyles(theme => ({
  customtooltip: {
    backgroundColor: "#FFFFFF",
  },
}));

const CustomTooltip = (props) => {
  const classes = useStyles();
  const dataDescr = props.dataDescr;
  const { active } = props;
  if (active) {
    const { payload, label } = props;
    return (
      <div className={classes.customtooltip}>
        <Typography variant="body1" noWrap>
          {label}
        </Typography>
        {
          payload.filter(i => !i.dataKey.endsWith("_avg")).map(item => {
            return <div style={{ color: dataDescr.find(i => i.dataKey === item.dataKey).color }} >
              {item.name} : {item.value}
            </div>
          })
        }
      </div >
    );
  }
  return null;
}

const GraphDailyGenericInner = (props) => {
  let data = props.data;
  const dataDescr = props.dataDescr;
  const showAllData = props.showAllData;

  for (let line of dataDescr) {
    let move_avg = computeMovingAverage(data, line.dataKey, line.dataKey + "_avg");
    data = mergeDataSeries(data, move_avg);
  }

  data = sortByFullDate(data);

  if (!showAllData) {
    const cutoff = moment().subtract(30, 'days')
    data = data.filter(d => {
      return moment(d.fulldate, "MM/DD/YYYY").isAfter(cutoff)
    });
  }

  data = data.map(t => {
    t.name = moment(t.fulldate, "MM/DD/YYYY").format("M/D");
    return t;
  })
  let chart =
    <LineChart
      data={data}
      margin={{ top: 5, right: 30, left: 5, bottom: 5 }}
    >
      <YAxis tickFormatter={formatYAxis} />
      <XAxis dataKey="name" />
      <CartesianGrid stroke="#d5d5d5" strokeDasharray="5 5" />
      {dataDescr.map(line => {
        return <Line type="monotone"
          name={line.legendName}
          dataKey={line.dataKey}
          key={line.dataKey}
          dot={{ r: 1 }}
          strokeDasharray="1 5"
          stroke={line.color}
          yAxisId={0}
          strokeWidth={1} />
      })}
      {dataDescr.map(line => {
        return <Line type="monotone"
          dataKey={line.dataKey + "_avg"}
          key={line.dataKey + "_avg"}
          dot={{ r: 1 }}
          stroke={line.color}
          yAxisId={0}
          strokeWidth={2} />
      })}

      <Legend verticalAlign="top" payload={
        dataDescr.map(line => {
          return {
            value: line.legendName,
            type: "line",
            color: line.color,
          }
        })
      } />
      <Tooltip content={<CustomTooltip dataDescr={dataDescr} />} />
    </LineChart>;

  return <div>
    <ResponsiveContainer height={300} >
      {chart}
    </ResponsiveContainer>
  </div>;
}

const GraphDailyGeneric = (props) => {

  const [state, setStateSticky] = useStickyState({
    defaultValue: {
      showlog: false,
      showAllData: false,
    },
    cookieId: "GraphDailyPreference"
  });

  const classes = useStyles();

  const handleShowAllData = event => {
    let newstate = { ...state, showAllData: !state.showAllData };
    setStateSticky(newstate);
  };
  let graphOptions = props.dataDescr.map(line => {
    return {
      name: line.legendName,
      value: (state[line.dataKey] !== undefined) ? state[line.dataKey] : true,
    }
  });
  let filtered_descr = props.dataDescr.filter(l => graphOptions.find(a => a.name === l.legendName).value)

  const handleGraphOptionsChange = event => {
    let selected = event.target.value;
    let newstate = { ...state };
    for (let line of props.dataDescr) {
      newstate[line.dataKey] = selected.includes(line.legendName);
    }
    setStateSticky(newstate);
  };

  return <div>
    <Grid container alignItems="center" spacing={1}>
      <Grid item>
        <AntSwitch checked={state.showAllData} onClick={handleShowAllData} />
      </Grid>
      <Grid item onClick={handleShowAllData}>
        <Typography>
          Show All Dates
                </Typography>
      </Grid>
      <Grid item xs></Grid>
      <Grid item>
        <FormControl size="medium" className={classes.formControl}>
          <Select
            id="new-case-graph-options-checkbox"
            multiple
            value={graphOptions.filter(o => o.value).map(o => o.name)}
            onChange={handleGraphOptionsChange}
            input={<Input />}
            renderValue={selected => 'Lines'}
          >
            {graphOptions.map((option) => (
              <MenuItem key={option.name} value={option.name}>
                <Checkbox checked={option.value} />
                <ListItemText primary={option.name} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
    </Grid>
    <GraphDailyGenericInner {...props} dataDescr={filtered_descr} showAllData={state.showAllData} />

  </div>;
}

export { GraphDailyGeneric }
