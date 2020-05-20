import React from 'react';
import { Label, ReferenceArea, ResponsiveContainer, LineChart, Line, ReferenceLine, YAxis, XAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { makeStyles } from '@material-ui/core/styles';
import { Typography } from '@material-ui/core';
import Grid from '@material-ui/core/Grid';
import { scaleSymlog } from 'd3-scale';
import { datesToDays, fitExponentialTrendingLine } from './TrendFitting';
import { mergeDataSeries, makeDataSeriesFromTotal, exportColumnFromDataSeries } from "./DataSeries";
import { myShortNumber, filterDataToRecent, getOldestMomentInData, useStickyState } from '../Util';
import { AntSwitch } from "./AntSwitch.js"
import { DateRangeSlider } from "../DateRangeSlider"
import axisScales from './GraphAxisScales'

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
    minWidth: '1vw'
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
    let confirmed_projected;
    let confirmed_new_projected;

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
      if ("newcase_avg" in p) {
        newcase_avg = p.newcase_avg;
      }
      if ("confirmed_projected" in p) {
        confirmed_projected = p.confirmed_projected;
      }
      if ("confirmed_new_projected" in p) {
        confirmed_new_projected = p.confirmed_new_projected;
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
          {confirmed && `Total: ${confirmed}`}
        </Typography>
        <Typography variant="body2" noWrap>
          {newcase !== undefined && `New: ${newcase}`}
        </Typography>
        <Typography variant="body2" noWrap>
          {newcase_avg && `New (3d-Avg): ${newcase_avg.toFixed(0)}`}
        </Typography>
        <Typography variant="body2" noWrap>
          {confirmed_projected && `MIT projected total: ${confirmed_projected}`}
        </Typography>
        <Typography variant="body2" noWrap>
          {confirmed_new_projected && `MIT projected new: ${confirmed_new_projected}`}
        </Typography>
      </div>
    );
  }
  return null;
}

const cookieStaleWhen = (cookie) => !cookie.verticalScale || !cookie.showPastDays

const BasicGraph = (props) => {
  const classes = useStyles()
  let data = props.USData;
  const column = props.column;
  const [state, setStateSticky] = useStickyState({
    defaultValue: {
      verticalScale: axisScales.linear,
      showPastDays: 30,
    },
    cookieId: "BasicGraphPreference1",
    isCookieStale: cookieStaleWhen
  });
  const handleLogScaleToggle = (event, newScale) => {
    setStateSticky({
      ...state,
      verticalScale: state.verticalScale === axisScales.log ? axisScales.linear : axisScales.log
    });
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

  /**
   * Add Trending Line
   */
  const startDate = data[0].name;
  const dates = data.filter(d => !moment(d.fulldate, "MM/DD/YYYY").isAfter(moment())).map(d => d.name);
  const daysFromStart = datesToDays(startDate, dates);
  const confirmed = data.filter(d => !moment(d.fulldate, "MM/DD/YYYY").isAfter(moment())).map(d => d.total);
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
      <ReferenceLine key={`vrefline${idx}`}
        x={moment(l.date, "MM/DD/YYYY").format("M/D")}
        stroke="#e3e3e3"
        strokeWidth={3}
      >
        <Label value={l.label} position="insideTop" fill="#b3b3b3" />

      </ReferenceLine>
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

  const future = moment().add(30, 'days')
  data = data.filter(d => {
    let day = moment(d.fulldate, "MM/DD/YYYY");
    return day.isBefore(future);
  });

  // deal with that last point with dashes
  // 
  const today = moment();
  const yesterday = moment().subtract(1, "days");

  const todayData = data.find(s => s.name === today.format("M/D"));
  if (todayData) {
    const yesterdayData = data.find(s => s.name === yesterday.format("M/D"));

    yesterdayData["total_lastpoint"] = yesterdayData["total"];
    todayData["total_lastpoint"] = todayData["total"];

    todayData["newcase_avg_lastpoint"] = todayData["newcase_avg"];
    yesterdayData["newcase_avg_lastpoint"] = yesterdayData["newcase_avg"];

    delete todayData["total"];
    delete todayData["newcase_avg"];
  }
  // console.log(data);

  return <>
    <Grid container alignItems="center" spacing={1}>
      <Grid item>
        <AntSwitch checked={state.verticalScale === axisScales.log} onClick={handleLogScaleToggle} />
      </Grid>
      <Grid item onClick={handleLogScaleToggle}>
        <Typography>
          Log
            </Typography>
      </Grid>
      <Grid item className={classes.gridPadding}> </Grid>
      <Grid item>
        <Typography>
          Date:
          </Typography>
      </Grid>
      <Grid item xs sm={3}>
        <DateRangeSlider
          currentDate={moment()}
          startDate={oldestMoment}
          valueChanged={handleSliderValueChange}
          defaultValue={state.showPastDays}
        />
      </Grid>
      <Grid item sm> </Grid>
    </Grid>
    <ResponsiveContainer height={300} >
      <LineChart
        data={data}
        margin={{ top: 5, right: 30, left: 5, bottom: 5 }}
      >
        <ReferenceArea x1={"5/7"} x2={future.format("M/D")} fillOpacity={0.2} />
        <Tooltip content={<CustomTooltip />} />
        <XAxis dataKey="name" />
        {
          (state.verticalScale === axisScales.log) ?
            <YAxis yAxisId={0} scale={scale} /> :
            <YAxis yAxisId={0} tickFormatter={(t) => myShortNumber(t)} width={40} tick={{ fill: props.colorTotal }} />
        }
        <YAxis yAxisId={1} tickFormatter={(t) => myShortNumber(t)} width={10} tick={{ fill: props.colorNew }} orientation="right" />

        <CartesianGrid stroke="#d5d5d5" strokeDasharray="5 5" />
        <Line type="monotone" dataKey="trending_line" strokeDasharray="1 3" stroke={props.colorTotal} yAxisId={0} dot={false} strokeWidth={2} />
        <Line type="monotone" dataKey="total" stroke={props.colorTotal} yAxisId={0} dot={{ r: 1 }} strokeWidth={2} />
        <Line type="monotone" dataKey="total_lastpoint" stroke={props.colorTotal} yAxisId={0} dot={{ r: 1 }} strokeDasharray="2 2" strokeWidth={2} />
        <Line type="monotone" dataKey="confirmed_projected" stroke={props.colorTotal} yAxisId={0} strokeDasharray="1 1" dot={{ r: 1 }} strokeWidth={2} />
        <Line type="monotone" dataKey="pending_confirmed" stroke={props.colorTotal} dot={{ r: 0 }} strokeDasharray="2 2" strokeWidth={2} />
        <Line type="monotone" dataKey="newcase_avg" stroke={props.colorNew} yAxisId={1} dot={{ r: 1 }} strokeWidth={2} />
        <Line type="monotone" dataKey="newcase_avg_lastpoint" stroke={props.colorNew} yAxisId={1} dot={{ r: 1 }} strokeDasharray="2 2" strokeWidth={2} />
        <Line type="monotone" dataKey="confirmed_new_projected" stroke={props.colorNew} yAxisId={1} dot={{ r: 1 }} strokeDasharray="1 1" strokeWidth={2} />
        <Line type="monotone" dataKey="newcase" stroke={props.colorNew} strokeDasharray="1 4" yAxisId={1} dot={{ r: 1 }} strokeWidth={1} />

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
