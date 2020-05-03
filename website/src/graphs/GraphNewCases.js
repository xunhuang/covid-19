import React from 'react';
import { ResponsiveContainer, LineChart, Line, ReferenceLine, YAxis, XAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { makeStyles } from '@material-ui/core/styles';
import { Typography } from '@material-ui/core';
import Grid from '@material-ui/core/Grid';
import { scaleSymlog } from 'd3-scale';
import { datesToDays, fitExponentialTrendingLine } from './TrendFitting';
import { mergeDataSeries, makeDataSeriesFromTotal, exportColumnFromDataSeries } from "./DataSeries";
import { myShortNumber, filterDataToRecent, getOldestMomentInData } from '../Util';
import { AntSwitch } from "./AntSwitch"
import { DateRangeSlider } from "../DateRangeSlider"

const Cookies = require("js-cookie");
const moment = require("moment");
const scale = scaleSymlog().domain([0, 'dataMax']);

const useStyles = makeStyles(theme => ({
  customtooltip: {
    backgroundColor: "#FFFFFF",
  },
  grow: {
    flex: 1,
  },
  formControl: {
    margin: theme.spacing(1),
    minWidth: 130,
    maxWidth: 300,
  },
  gridPadding: {
      minWidth: '3vw'
  }
}));

const CustomTooltip = (props) => {
  const classes = useStyles();
  const { active } = props;
  if (active) {
    const { payload, label } = props;
    let confirmed;
    let newcase;
    let newcase_avg;

    payload.map(p => {
      p = p.payload;
      if ("confirmed" in p) {
        confirmed = p.total;
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
      if ("newcase_avg" in p) {
        newcase_avg = p.newcase_avg;
      }
      return null;
    });

    if (typeof payload[0] == 'undefined') {
      // This can happen when all the three lines are hidden
      return null;
    }

    return (
      <div className={classes.customtooltip}>
        <Typography variant="body1" noWrap>
          {label}
        </Typography>
        <Typography variant="body2" noWrap>
          {`Total: ${confirmed}`}
        </Typography>
        <Typography variant="body2" noWrap>
          {`New: ${newcase}`}
        </Typography>
        <Typography variant="body2" noWrap>
          {`New (3d-Avg): ${newcase_avg ? newcase_avg.toFixed(0) : ""}`}
        </Typography>
      </div>
    );
  }
  return null;
}

const CookieSetPreference = (state) => {
    Cookies.set("BasicGraphPreference", state, {
        expires: 100
    });
}

const CookieGetPreference = () => {
  let pref = Cookies.getJSON("BasicGraphPreference");
  if (!pref) {
    return {
      showlog: false,
      showPastDays: 30,
    }
  }
  return pref;
}


const BasicGraph = (props) => {
  const classes = useStyles()
  let data = props.USData;
  const column = props.column;
  const [state, setState] = React.useState(CookieGetPreference());
  const setStateSticky = (state) => {
    CookieSetPreference(state);
    setState(state);
  }
  const handleLogScaleToggle = event => {
    setStateSticky({ ...state, showlog: !state.showlog });
  };

  const handleSliderValueChange = (value) => {
      let newstate = { ...state, showPastDays: value }
      setStateSticky(newstate)
  }

  data = data.map(d => {
    d.name = moment(d.fulldate, "MM/DD/YYYY").format("M/D");
    return d;
  });

  let confirmedTotalArray = exportColumnFromDataSeries(data, column);
  let confirmedArray = makeDataSeriesFromTotal(confirmedTotalArray, "total", "newcase", "newcase_avg");
  data = mergeDataSeries(data, confirmedArray);

  if (data.length > 2) {
    let newdata = data.slice(0, data.length - 2);
    let second_last = data[data.length - 2];
    let last = data[data.length - 1];
    second_last.pending_confirmed = second_last.total;
    second_last.pending_newcase = second_last.newcase;
    let newlast = {
      name: last.name,
      fulldate: moment().format("MM/DD/YYYY"),
      pending_confirmed: last.total,
      pending_newcase: last.newcase,
    };
    newdata.push(second_last);
    newdata.push(newlast);
    data = newdata;
  }



  /**
   * Add Trending Line
   */
  const startDate = data[0].name;
  const dates = data.map(d => d.name);
  const daysFromStart = datesToDays(startDate, dates);
  const confirmed = data.map(d => d.total);
  const results = fitExponentialTrendingLine(daysFromStart, confirmed, 10);
  const hasTrendingLine = results != null;

  let dailyGrowthRate = null;
  let daysToDouble = null;
  if (hasTrendingLine) {
    data = data.map((d, idx) => {
      d.trending_line = results.fittedYs[idx];
      return d;
    });
    dailyGrowthRate = results.dailyGrowthRate;
    daysToDouble = results.daysToDouble;
  }

  const oldestMoment = getOldestMomentInData(data);

  data = filterDataToRecent(data, state.showPastDays)

  data = data.sort((a, b) => moment(a.fulldate, "MM/DD/YYYY").toDate() - (moment(b.fulldate, "MM/DD/YYYY")).toDate());

  let vRefLines = (typeof props.vRefLines == 'undefined') ?
    null :
    props.vRefLines.map((l, idx) =>
      <ReferenceLine key={`vrefline${idx}`} x={l.date} label={{ value: l.label, fill: '#b3b3b3' }} stroke="#e3e3e3" strokeWidth={3} />
    )

  let hRefLines = (typeof props.hRefLines == 'undefined') ?
    null :
    props.hRefLines.map((l, idx) =>
      <ReferenceLine key={`hrefline${idx}`} y={l.y} label={l.label} stroke="#e3e3e3" strokeWidth={2} />
    )

  const legendPayload = [
    { value: props.labelTotal, type: 'line', color: props.colorTotal },
    { value: props.labelNew, type: 'line', color: props.colorNew }
  ];
  if (hasTrendingLine) {
    legendPayload.push({
      value: `${daysToDouble.toFixed(0)} Days to Double (+${(dailyGrowthRate * 100).toFixed(0)}% Daily)`,
      type: 'plainline',
      payload: { strokeDasharray: '2 2' },
      color: props.colorTotal
    });
  }

  return <>
    <Grid container alignItems="center" spacing={1}>
        <Typography>
          Linear
        </Typography>
      <Grid item>
        <AntSwitch checked={state.showlog} onClick={handleLogScaleToggle} />
      </Grid>
      <Grid item onClick={handleLogScaleToggle}>
        <Typography>
          Log
        </Typography>
      </Grid>
      <Grid item className={classes.gridPadding}> </Grid>
      <Grid item>
          <Typography>
            Show Data From:
          </Typography>
      </Grid>
      <Grid item xs>
        <DateRangeSlider
            currentDate={moment()}
            startDate={oldestMoment}
            valueChanged={handleSliderValueChange}
            defaultValue={state.showPastDays}
        />
      </Grid>
      <Grid item className={classes.gridPadding}> </Grid>
    </Grid>
    <ResponsiveContainer height={300} >
      <LineChart
        data={data}
        margin={{ top: 5, right: 30, left: 5, bottom: 5 }}
      >
        <Tooltip content={<CustomTooltip />} />
        <XAxis dataKey="name" />
        {
          state.showlog ?
            <YAxis yAxisId={0} scale={scale} /> :
            <YAxis yAxisId={0} tickFormatter={(t) => myShortNumber(t)} width={30} tick={{ fill: props.colorTotal }} />
        }
        <YAxis yAxisId={1} tickFormatter={(t) => myShortNumber(t)} width={10} tick={{ fill: props.colorNew }} orientation="right" />

        <CartesianGrid stroke="#d5d5d5" strokeDasharray="5 5" />
        <Line type="monotone" dataKey="trending_line" strokeDasharray="2 2" stroke={props.colorTotal} yAxisId={0} dot={false} strokeWidth={2} />
        <Line type="monotone" dataKey="total" stroke={props.colorTotal} yAxisId={0} dot={{ r: 1 }} strokeWidth={2} />
        <Line type="monotone" dataKey="pending_confirmed" stroke={props.colorTotal} dot={{ r: 1 }} strokeDasharray="2 2" strokeWidth={2} />
        <Line type="monotone" dataKey="newcase_avg" stroke={props.colorNew} yAxisId={1} dot={{ r: 1 }} strokeWidth={2} />
        <Line type="monotone" dataKey="newcase" stroke={props.colorNew} strokeDasharray="1 3" yAxisId={1} dot={{ r: 1 }} strokeWidth={2} />
        <Line type="monotone" dataKey="pending_newcase" stroke={props.colorNew} yAxisId={1} dot={{ r: 1 }} strokeDasharray="2 2" strokeWidth={2} />

        <Line visibility="hidden" dataKey="pending_death" />
        {vRefLines}
        {hRefLines}

        <Legend
          verticalAlign="top"
          payload={legendPayload} />

      </LineChart></ResponsiveContainer>
  </>
}

export { BasicGraph };
