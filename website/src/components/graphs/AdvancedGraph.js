import PropTypes from 'prop-types';
import React from 'react';
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {fade, makeStyles} from '@material-ui/core/styles';
import {scaleSymlog} from 'd3-scale';
import { myShortNumber} from '../../Util';

import {DataSeries} from '../../models/DataSeries';

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

  const styles = new Map([
    ['line', {
      label: 'Line',
      chart: LineChart,
      series: Line,
    }],
    ['area', {
      label: 'Area',
      chart: AreaChart,
      series: Area,
    }],
  ]);
  const [style, setStyle] = React.useState(styles.keys().next().value);

  const serieses = expandSeriesesToMap(props.serieses);
  const {data, timestampFormatter} =
      DataSeries.flatten([...serieses.values()].map(({series}) => series));

  const [known, setKnown] = React.useState([]);
  const [selected, setSelected] =
      React.useState(() =>
          [...serieses.entries()]
              .filter(([, {initial}]) => initial !== 'off')
              .map(([label, ]) => label));

  // As the user switches pages, graphs that were previously unknown may become
  // available. So turn them off if they default to on when they appear.
  const nowKnown = [...serieses.keys()];
  if (known.join() !== nowKnown.join()) {
    const add = [];
    for (const [key, {initial}] of serieses.entries()) {
      if (!known.includes(key) && !selected.includes(key) && initial !== 'off') {
        add.push(key);
      }
    }

    if (add.length > 0) {
      // We might as well just do this in here, even though technically we
      // should probably do it in the else branch too.
      setKnown(nowKnown);
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
            serieses={serieses}
            selected={selected}
            onChange={setSelected} />
      </div>
      <Chart
          data={windows.get(window).filter(data)}
          scale={scales.get(scale).scale}
          style={styles.get(style)}
          timestampFormatter={timestampFormatter}
          serieses={selected.map(key => ({
            ...serieses.get(key),
            label: key,
          }))}
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
            {[...props.serieses.entries()].map(([label, {color, stipple}]) =>
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
  const ChosenChart = props.style.chart;
  const ChosenSeries = props.style.series;

  const ordered = props.serieses && props.serieses.sort((a, b) => {
    if (a.derived && !b.derived) {
      return -1;
    } else if (!a.derived && b.derived) {
      return 1;
    } else {
      return a.label < b.label ? -1 : 1;
    }
  });

  return (
    <ResponsiveContainer height={300}>
      <ChosenChart data={props.data} margin={{left: -4, right: 8}}>
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

        {ordered && ordered.map(series =>
            <ChosenSeries
                type="monotone"
                key={series.label}
                dataKey={series.label}
                isAnimationActive={false}
                fill={series.color}
                stroke={series.color}
                strokeDasharray={series.stipple ? '2 2' : undefined}
                dot={false}
                strokeWidth={2}
            />
        )}
      </ChosenChart>
    </ResponsiveContainer>
  );
};

function valueFormatter(value) {
  if (isNaN(value)) {
    return 'unknown';
  } else {
    return value.toFixed(1).replace(/\.?0+$/, '');
  }
}
