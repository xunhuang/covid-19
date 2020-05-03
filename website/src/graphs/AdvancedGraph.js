import React from 'react';
import PropTypes from 'prop-types';
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import {Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis} from 'recharts';
import {DataSeries} from '../models/DataSeries';
import {fade, makeStyles} from '@material-ui/core/styles';

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
  displayOptions: {
    flexGrow: 1,
  },
}));

export const AdvancedGraph = (props) => {
  const classes = useStyles();

  const displays = new Map([
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
  const [display, setDisplay] = React.useState(displays.keys().next().value);

  const serieses = new Map(props.serieses.map(({series, color}) => [
    series.label(), {
      color,
      series,
    },
  ]));
  const data = DataSeries.flatten(props.serieses.map(({series}) => series));

  const [selected, setSelected] =
      React.useState(() =>
          props.serieses
              .filter(({state}) => state !== 'off')
              .map(({series}) => series.label()));

  return (
    <>
      <div className={classes.options}>
        <Display
            displays={displays}
            selected={display}
            onChange={setDisplay}
            className={classes.displayOptions} />
        <Legend
            serieses={serieses}
            selected={selected}
            onChange={setSelected} />
      </div>
      <Chart
          display={displays.get(display)}
          data={data}
          serieses={selected.map(key => ({
            color: serieses.get(key).color,
            label: key,
          }))}
      />
    </>);
};

AdvancedGraph.propTypes = {
	serieses: PropTypes.arrayOf(
      PropTypes.shape({
        series: PropTypes.instanceOf(DataSeries).isRequired,
        color: PropTypes.string.isRequired,
      })).isRequired,
};

const useDisplayStyles = makeStyles(theme => ({
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
                onChange={(event, desired) => props.onChange(desired)}
                className={props.className}>
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
}));

const Legend = (props) => {
    const classes = useLegendStyles();

    return (
        <ToggleButtonGroup
                value={props.selected}
                onChange={(event, desired) => props.onChange(desired)}
                className={classes.serieses}>
            {[...props.serieses.entries()].map(([label, {color}]) =>
                <ToggleButton
                    key={label}
                    value={label}
                    classes={{root: classes.series, selected: 'selected'}}>
                    <span
                        style={
                            props.selected.includes(label) ? {color} : {}
                        }>
                      —
                    </span>
                    {label}
                </ToggleButton>
            )}
        </ToggleButtonGroup>
    );
};

const Chart = (props) => {
  const ChosenChart = props.display.chart;
  const ChosenSeries = props.display.series;

  return (
      <ResponsiveContainer height={300}>
          <ChosenChart data={props.data} margin={{left: 24, right: 24}}>
              <Tooltip />
              <XAxis dataKey="key" />
              <YAxis />
              <CartesianGrid stroke="#d5d5d5" strokeDasharray="5 5" />

              {props.serieses && props.serieses.map(series =>
                  <ChosenSeries
                      type="monotone"
                      key={series.label}
                      dataKey={series.label}
                      isAnimationActive={false}
                      fill={series.color}
                      stroke={series.color}
                      dot={false}
                      strokeWidth={2} />
              )}
          </ChosenChart>
      </ResponsiveContainer>
  );
};
