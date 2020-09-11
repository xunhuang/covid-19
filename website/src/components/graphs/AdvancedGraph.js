import PropTypes from 'prop-types';
import React from 'react';
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import { LineChart, ReferenceLine, ReferenceArea, Label, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { fade, makeStyles } from '@material-ui/core/styles';
import { scaleSymlog } from 'd3-scale';
import { myShortNumber } from '../../Util';
import { DateRangeSlider } from "../../DateRangeSlider"
import { useStickyState } from '../../Util';
import { SectionHeader } from "../../CovidUI"
import Typography from '@material-ui/core/Typography'

import { DataSeries } from '../../models/DataSeries';
import axisScales from '../../graphs/GraphAxisScales'

const moment = require('moment');

const baseToggleButtonStyles = {
  height: 'initial',
  textTransform: 'initial',
};

// This scale for logs works consistenly, whereas setting ReCharts to use the
// scale 'log' only works sometimes under certain mystery situations.
const logScale = scaleSymlog().domain([0, 'dataMax']);

const useStyles = makeStyles(theme => ({
  options: {
    display: 'flex',
    flexWrap: 'wrap',
    marginBottom: '16px',
    '& > *': {
      margin: '0 8px 8px 0',
    },
  },
  slider: {
    display: "flex",
    width: 200,
    alignItems: "center",
  },
  expand: {
    flexGrow: 1,
  },
}));

const cookieStaleWhen = (cookie) => !cookie.verticalScale || !cookie.showPastDays;

/** A graph that allows the user to click series on and off. */
export const AdvancedGraph = (props) => {
  const classes = useStyles();

  const [state, setStateSticky] = useStickyState({
    defaultValue: {
      verticalScale: axisScales.linear,
      showPastDays: 30,
    },
    cookieId: "AdvanceGraphPreference1",
    isCookieStale: cookieStaleWhen
  });
  const handleLogScaleToggle = (newScale) => {
    setStateSticky({
      ...state,
      verticalScale: newScale,
    });
  };

  const handleSliderValueChange = (value) => {
    let newstate = { ...state, showPastDays: value }
    setStateSticky(newstate)
  }

  function filterData(data) {
    const cutoff = moment().subtract(state.showPastDays, 'days').unix();
    const future = moment().add(14, 'days').unix();
    return data.filter((p) => p.timestamp >= cutoff && p.timestamp <= future);
  }

  const scales = new Map([
    ['Linear', {
      label: 'Linear',
      scale: 'Linear',
    }],
    ['Log', {
      label: 'Log',
      scale: 'Log',
    }],
  ]);
  const scale = state.verticalScale;

  // Expands series that are supposed to have trend lines into an entry for the
  // original series and one for the trend line.
  const expandedSerieses = expandSeriesesToMap(props.serieses);

  // Okay, here's where it gets terrible. We have raw serieses and envelopes.
  // We want the user to be able to toggle serieses and evelopes on and off one
  // by one, but not to toggle the serieses inside of a envelope. So for the
  // purposes of Recharts we're going to decompose the envelopes to be raw
  // serieses. But for our code, we're going to merge them and be confused a
  // lot.

  const allSerieses = [...expandedSerieses.values()];

  let { data, timestampFormatter } = (props.alignT0)
    ? DataSeries.alignT0([...allSerieses.values()].map(({ series }) => series))
    : DataSeries.flatten([...allSerieses.values()].map(({ series }) => series));

  let yAxisFormatter = (props.yAxisFormatter)
    ? props.yAxisFormatter
    : myShortNumber;

  const seriesesAndEnvelopes = [...expandedSerieses.entries()];
  const allLabels = seriesesAndEnvelopes.map(([label,]) => label);
  const [known, setKnown] = React.useState(allLabels);
  const [selected, setSelected] =
    React.useState(
      () => seriesesAndEnvelopes.filter((item) => item[1].initial !== 'off')
        .map(([label,]) => label));

  // As the user switches pages, graphs that were previously unknown may become
  // available. So turn them off if they default to on when they appear.
  if (known.join() !== allLabels.join()) {
    const add = [];
    for (const [key, { initial }] of seriesesAndEnvelopes) {
      if (!known.includes(key) && !selected.includes(key) && initial !== 'off') {
        add.push(key);
      }
    }

    if (add.length > 0) {
      // We might as well just do this in here, even though technically we
      // should probably do it in the else branch too.
      setKnown(allLabels);
      setSelected(selected.concat(add));
    }
  }

  return (
    <div className={props.className}>
      {props.title &&
        <SectionHeader>
          <Typography variant="h5" noWrap>
            {props.title}
            <Typography variant="body1" noWrap>
              {props.subtitle}
            </Typography>
          </Typography>
        </SectionHeader>
      }
      {props.showControls &&
        <div className={classes.options}>
          <Display
            displays={scales}
            selected={scale}
            onChange={handleLogScaleToggle}
          />
          <div className={classes.slider} >
            <div>
              Date:</div>
            <DateRangeSlider
              currentDate={moment()}
              startDate={moment("02/01/2020", "MM/DD/YYYY")}
              valueChanged={handleSliderValueChange}
              defaultValue={state.showPastDays}
            />
          </div>
          <div className={classes.expand} />
          <Legend
            spec={seriesesAndEnvelopes}
            selected={selected}
            onChange={setSelected} />
        </div>
      }
      <Chart
        data={filterData(data)}
        scale={scales.get(scale).scale}
        timestampFormatter={timestampFormatter}
        yAxisFormatter={yAxisFormatter}
        specs={
          seriesesAndEnvelopes
            .filter(([label,]) => selected.includes(label))
            .map(([label, s]) => ({ label, ...s }))
        }
        vRefLines={props.vRefLines}
        hRefLines={props.hRefLines}
      />
    </div>);
};

AdvancedGraph.propTypes = {
  className: PropTypes.string,
  serieses:
    PropTypes.arrayOf(
      PropTypes.exact({
        series: PropTypes.instanceOf(DataSeries).isRequired,
        color: PropTypes.string.isRequired,
        initial: PropTypes.oneOf([undefined, 'off', 'on']),
        trend: PropTypes.string,
        stipple: PropTypes.bool,
        rightAxis: PropTypes.bool,
        lastDayIncomplete: PropTypes.bool,
        covidspecial: PropTypes.bool,
        showMovingAverage: PropTypes.bool,
      })).isRequired,
  showControls: PropTypes.bool,
};

AdvancedGraph.defaultProps = {
  showControls: true,
};

function expandSeriesesToMap(serieses) {
  const expanded = serieses.flatMap(s => {
    const result = [];
    if (s.covidspecial) {

      let s_for_display;
      if (s.showMovingAverage) {
        s_for_display = s.series.nDayAverage(7);
      } else {
        s_for_display = s.series;
      }

      let main = {
        ...s,
        series: s_for_display.dropLastPoint(),
        stipple: false,
      };
      let last = {
        ...s,
        series: s_for_display.last2PointSeries().suffixLabel("*"),
        stipple: true,
        derived: true,
      }
      result.push(main);
      result.push(last);

      if (s.showMovingAverage) {
        let original = {
          ...s,
          series: s.series,
          // derived: true,
          stipple: true,
        }
        result.push(original);
      }

    } else {
      result.push(s);
    }
    return result;
  });

  return new Map(expanded.map((seriesInfo) => {
    let series = seriesInfo.series;
    let label = "empty";
    if (series) {
      label = series.label();
    }
    return [label, seriesInfo];
  }));
}

const useDisplayStyles = makeStyles(theme => ({
  options: {
    display: 'initial',
  },
  option: {
    ...baseToggleButtonStyles,
  },
}));

const Display = (props) => {
  const classes = useDisplayStyles();

  return (
    <ToggleButtonGroup
      exclusive
      value={props.selected}
      onChange={(event, desired) => desired && props.onChange(desired)}
      className={classes.options}>
      {[...props.displays.entries()].map(([key, data]) =>
        <ToggleButton key={key} value={key} className={classes.option}>
          {data.label}
        </ToggleButton>
      )}
    </ToggleButtonGroup>
  );
};

const useLegendStyles = makeStyles(theme => ({
  serieses: {
    border: `1px solid ${fade(theme.palette.action.active, 0.12)}`,
    display: 'flex',
    flexWrap: 'wrap',
    maxWidth: '500px',
  },
  series: {
    border: 'none',
    color: fade(theme.palette.action.active, 0.12),
    '&.selected': {
      backgroundColor: 'initial',
      color: fade(theme.palette.action.active, 0.8),
      fontWeight: 'initial',
    },
    ...baseToggleButtonStyles,
  },
  icon: {
    paddingRight: '4px',
  },
}));

const Legend = (props) => {
  const classes = useLegendStyles();

  return (
    <ToggleButtonGroup
      value={props.selected}
      onChange={(event, desired) => props.onChange(desired)}
      className={classes.serieses}>
      {props.spec
        .filter(([label, { derived }]) => !derived)
        .map(([label, { color, stipple }]) =>
          <ToggleButton
            key={label}
            value={label}
            classes={{ root: classes.series, selected: 'selected' }}>
            <span
              className={classes.icon}
              style={
                props.selected.includes(label) ? { color } : {}
              }>
              {stipple ? '···' : '—'}
            </span>
            {label}
          </ToggleButton>
        )}
    </ToggleButtonGroup>
  );
};

const Chart = (props) => {
  const ordered = (props.specs || []).sort((a, b) => {
    if (a.derived && !b.derived) {
      return -1;
    } else if (!a.derived && b.derived) {
      return 1;
    } else {
      return a.label < b.label ? -1 : 1;
    }
  });

  let YAxis0Color = "black";
  let YAxis1Color = undefined;
  for (const s of ordered) {
    if (s.rightAxis) {
      YAxis1Color = s.color;
    } else {
      YAxis0Color = s.color;
    }
  }

  function getvRefLines(lines) {
    let result = (lines || []).map((l, idx) => {
      return <ReferenceLine key={`vrefline${idx}`}
        x={l.date}
        stroke="#e3e3e3"
        strokeWidth={1}
      >
        <Label value={l.label} position={"insideTop"} fill="#b3b3b3" />
      </ReferenceLine>
    }
    );
    return result;
  }

  function getvRefAreas(lines) {
    let result = (lines || []).map((l, idx) => {
      const startdate = l.date;
      const today = moment().unix();
      let enddate = startdate + 14 * 24 * 60 * 60;
      while (enddate > today) {
        enddate -= 24 * 60 * 60;
      }
      return <ReferenceArea key={`vrefarea${idx}`}
        x1={startdate} x2={enddate}
        // stroke="red"
        // strokeOpacity={0.3}
        fillOpacity={0.15}
      />
    }
    );
    return result;
  }


  function gethRefLines(lines) {
    let result = (lines || []).map((l, idx) => {
      return <>
        <ReferenceLine key={`vrefline${idx}`}
          y={l.value}
          stroke="#e3e3e3"
          strokeWidth={1}
        >
          <Label value={l.label} position={"insideLeft"} ></Label>
        </ReferenceLine>
      </>
    }
    );
    return result;
  }

  let vRefLines = getvRefLines(props.vRefLines);
  let hRefLines = gethRefLines(props.hRefLines);

  return (
    <ResponsiveContainer height={300}>
      <LineChart data={props.data} margin={{ left: -4, right: 8 }}>
        {vRefLines}
        {hRefLines}
        {getvRefAreas(props.vRefLines)}
        <Tooltip
          formatter={valueFormatter}
          labelFormatter={props.timestampFormatter}
        />
        <XAxis
          dataKey="timestamp"
          tickFormatter={props.timestampFormatter}
        />
        <YAxis
          yAxisId={0}
          tick={{ fill: YAxis0Color }}
          scale={props.scale === 'Log' ? logScale : props.scale}
          width={50}
          tickFormatter={props.yAxisFormatter}
        />
        {YAxis1Color &&
          <YAxis
            yAxisId={1}
            tickFormatter={props.yAxisFormatter}
            width={35}
            tick={{ fill: YAxis1Color }}
            orientation="right"
          />
        }
        <CartesianGrid stroke="#d5d5d5" strokeDasharray="5 5" />

        {ordered.flatMap(spec => specToElements(spec))}
      </LineChart>
    </ResponsiveContainer>
  );
};

function specToElements(spec) {
  return [lineForSpec(spec)];
};

function lineForSpec(spec) {
  return (
    <Line
      key={spec.label}
      baseLine={10000}
      type="monotone"
      dataKey={spec.label}
      isAnimationActive={false}
      fill={spec.color}
      stroke={spec.color}
      strokeDasharray={spec.stipple ? '1 2' : undefined}
      dot={false}
      strokeWidth={2}
      yAxisId={spec.rightAxis ? 1 : 0}
    />
  );
};

function valueFormatter(value) {
  if (isNaN(value)) {
    return 'unknown';
  } else {
    if (value < 1) {
      return (value * 100).toFixed(1) + "%";
    }
    return value.toFixed(1).replace(/\.?0+$/, '');
  }
}
