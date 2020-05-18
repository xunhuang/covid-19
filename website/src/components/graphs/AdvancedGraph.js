import PropTypes from 'prop-types';
import React from 'react';
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {fade, makeStyles} from '@material-ui/core/styles';
import {scaleSymlog} from 'd3-scale';
import { myShortNumber} from '../../Util';

import {DataSeries} from '../../models/DataSeries';
import {Envelope} from '../../models/Envelope';

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
  expand: {
    flexGrow: 1,
  },
}));

/** A graph that allows the user to click series on and off. */
export const AdvancedGraph = (props) => {
  const classes = useStyles();

  const windows = new Map([
    ['all', {
      label: 'All',
      filter: (data) => data,
    }],
    ['4weeks', {
      label: '4 Weeks',
      filter: (data) => {
        if (data.length === 0) {
          return [];
        }

        const preferredStart = moment().subtract(28, 'day');
        const lastMoment = moment.unix(data[data.length - 1].timestamp);
        let startMoment;
        if (lastMoment.isBefore(preferredStart)) {
          startMoment = lastMoment.subtract(28, 'day');
        } else {
          startMoment = preferredStart;
        }

        const start = startMoment.unix();
        const end = startMoment.add(28 + 14 /* for projections */, 'day').unix();
        return data.filter((p) => start <= p.timestamp && p.timestamp <= end);
      },
    }],
  ]);
  const [window, setWindow] = React.useState(windows.keys().next().value);

  const scales = new Map([
    ['linear', {
      label: 'Linear',
      scale: 'linear',
    }],
    ['log', {
      label: 'Log',
      scale: 'log',
    }],
  ]);
  const [scale, setScale] = React.useState(scales.keys().next().value);

  // Expands series that are supposed to have trend lines into an entry for the
  // original series and one for the trend line.
  const expandedSerieses = expandSeriesesToMap(props.serieses);

  // Okay, here's where it gets terrible. We have raw serieses and envelopes.
  // We want the user to be able to toggle serieses and evelopes on and off one
  // by one, but not to toggle the serieses inside of a envelope. So for the
  // purposes of Recharts we're going to decompose the envelopes to be raw
  // serieses. But for our code, we're going to merge them and be confused a
  // lot.

  const allSerieses =
        [...expandedSerieses.values()]
            .concat(
                (props.envelopes || [])
                    .flatMap(e =>
                        e.envelope.serieses().map(s => ({
                          series: s,
                          color: e.stroke,
                          ...e,
                        }))));
  const {data, timestampFormatter} =
      DataSeries.flatten([...allSerieses.values()].map(({series}) => series));

  const seriesesAndEnvelopes =
      [...expandedSerieses.entries()]
          .concat(
              (props.envelopes || [])
                  // Legend just wants one color, so use the stroke as the color
                  .map(e => ({color: e.stroke, ...e}))
                  .map(e => [e.envelope.label(), e]))
  const allLabels = seriesesAndEnvelopes.map(([label, ]) => label);
  const [known, setKnown] = React.useState(allLabels);
  const [selected, setSelected] =
      React.useState(() => allLabels.filter(({initial}) => initial !== 'off'));

  // As the user switches pages, graphs that were previously unknown may become
  // available. So turn them off if they default to on when they appear.
  if (known.join() !== allLabels.join()) {
    const add = [];
    for (const [key, {initial}] of seriesesAndEnvelopes) {
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
      <div className={classes.options}>
        <Display
            displays={windows}
            selected={window}
            onChange={setWindow}
        />
        <Display
            displays={scales}
            selected={scale}
            onChange={setScale}
        />
        <div className={classes.expand} />
        <Legend
            spec={seriesesAndEnvelopes}
            selected={selected}
            onChange={setSelected} />
      </div>
      <Chart
          data={windows.get(window).filter(data)}
          scale={scales.get(scale).scale}
          timestampFormatter={timestampFormatter}
          specs={
            seriesesAndEnvelopes
                .filter(([label,]) => selected.includes(label))
                .map(([label, s]) => ({label, ...s}))
          }
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
          })).isRequired,
  envelopes:
      PropTypes.arrayOf(
          PropTypes.exact({
            envelope: PropTypes.instanceOf(Envelope).isRequired,
            fill: PropTypes.string.isRequired,
            stroke: PropTypes.string.isRequired,
            initial: PropTypes.oneOf([undefined, 'off', 'on']),
          })),
};

function expandSeriesesToMap(serieses) {
  const expanded = serieses.flatMap(series => {
    if (series.trend) {
      const trend = series.series.trend();
      const color = series.trend;

      if (trend) {
        return [
          series,
          {
            ...series,
            series: trend,
            color,
            derived: true,
            stipple: true,
          },
        ];
      } else {
        return [series];
      }
    } else {
      return [series];
    }
  });

  return new Map(expanded.map((seriesInfo) =>
      [seriesInfo.series.label(), seriesInfo]));
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
      {props.spec.map(([label, {color, stipple}]) =>
        <ToggleButton
            key={label}
            value={label}
            classes={{root: classes.series, selected: 'selected'}}>
          <span
              className={classes.icon}
              style={
                props.selected.includes(label) ? {color} : {}
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
    if (a.envelope && !b.envelope) {
      return -1;
    } else if (!a.envelope && b.envelope) {
      return 1;
    } else if (a.derived && !b.derived) {
      return -1;
    } else if (!a.derived && b.derived) {
      return 1;
    } else {
      return a.label < b.label ? -1 : 1;
    }
  });

  return (
    <ResponsiveContainer height={300}>
      <ComposedChart data={props.data} margin={{left: -4, right: 8}}>
        <Tooltip
            formatter={valueFormatter}
            labelFormatter={props.timestampFormatter}
        />
        <XAxis
            dataKey="timestamp"
            tickFormatter={props.timestampFormatter}
        />
        <YAxis
            scale={props.scale === 'log' ? logScale : props.scale}
            tickFormatter={(t) => myShortNumber(t)}
        />
        <CartesianGrid stroke="#d5d5d5" strokeDasharray="5 5" />

        {ordered.flatMap(spec => specToElements(spec))}
      </ComposedChart>
    </ResponsiveContainer>
  );
};

function specToElements(spec) {
  if (spec.envelope) {
    const envelope = spec.envelope;
    return [
      <Area
          key={envelope.high().label()}
          type="monotone"
          dataKey={envelope.high().label()}
          stroke={spec.stroke}
          fill={spec.fill}
      />,
      <Area
          key={envelope.low().label()}
          type="monotone"
          dataKey={spec.envelope.low().label()}
          stroke={spec.stroke}
          fill="#fff"
          fillOpacity={1}
      />,
    ].concat(
        envelope.extras().map(s => lineForSpec({
          label: s.label(),
          color: envelope.stroke,
        })));
  } else {
    return [lineForSpec(spec)];
  }
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
        strokeDasharray={spec.stipple ? '2 2' : undefined}
        dot={false}
        strokeWidth={2}
    />
  );
};

function valueFormatter(value) {
  if (isNaN(value)) {
    return 'unknown';
  } else {
    return value.toFixed(1).replace(/\.?0+$/, '');
  }
}
