import React from 'react';
import PropTypes from 'prop-types';
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import {Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis} from 'recharts';
import {fade, makeStyles} from '@material-ui/core/styles';

import {DataSeries} from '../models/DataSeries';

const moment = require('moment');

const baseToggleButtonStyles = {
  height: 'initial',
  textTransform: 'initial',
};

const useStyles = makeStyles(theme => ({
  options: {
    display: 'flex',
    flexWrap: 'wrap',
    marginBottom: '16px',
    '& > *': {
      margin: '8px',
    },
  },
  expand: {
    flexGrow: 1,
  },
}));

export const AdvancedGraph = (props) => {
  const classes = useStyles();

  const windows = new Map([
    ['2weeks', {
      label: '2 Weeks',
      filter: (data) => {
        const start =
            moment.unix(data[data.length - 1].timestamp)
                .subtract(14, 'day')
                .unix();
        return data.filter((p) => start <= p.timestamp);
      },
    }],
    ['all', {
      label: 'All',
      filter: (data) => data,
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

  const [selected, setSelected] =
      React.useState(() =>
          [...serieses.entries()]
              .filter(([, {initial}]) => initial !== 'off')
              .map(([label, ]) => label));

  return (
    <>
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
        <Display
            displays={styles}
            selected={style}
            onChange={setStyle}
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
    </>);
};

AdvancedGraph.propTypes = {
	serieses:
      PropTypes.arrayOf(
          PropTypes.exact({
            series: PropTypes.instanceOf(DataSeries).isRequired,
            color: PropTypes.string.isRequired,
            initial: PropTypes.oneOf([undefined, 'off', 'on']),
            trend: PropTypes.string,
          })).isRequired,
};

function expandSeriesesToMap(serieses) {
  const expanded = serieses.flatMap(series => {
    if (series.trend) {
      const trend = series.series.trend();
      const color = series.trend;

      if (trend) {
        return [
          {
            ...series,
            series: trend,
            color,
            stipple: true,
          },
          series,
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

  return (
      <ResponsiveContainer height={300}>
          <ChosenChart data={props.data} margin={{left: 24, right: 24}}>
              <Tooltip labelFormatter={props.timestampFormatter} />
              <XAxis
                  dataKey="timestamp"
                  tickFormatter={props.timestampFormatter}
              />
              {/* using scale='log' requires setting the domain */}
              <YAxis scale={props.scale} domain={['auto', 'auto']} />
              <CartesianGrid stroke="#d5d5d5" strokeDasharray="5 5" />

              {props.serieses && props.serieses.map(series =>
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
