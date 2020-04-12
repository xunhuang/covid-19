import React from 'react';
import { fade, makeStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

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

    const serieses = new Map([
        ['confirmed', {
            'label': 'Confirmed',
            'color': 'orange',
        }],
        ['deaths', {
            'label': 'Deaths',
            'color': 'red',
        }],
        ['hospitalized', {
            'label': 'Hospitalized',
            'color': 'purple',
        }],
        ['recovered', {
            'label': 'Recovered',
            'color': 'green',
        }],
        ['tested', {
            'label': 'Tested',
            'color': 'gray',
        }],
        ['tested-negative', {
            'label': 'Tested negative',
            'color': 'blue',
        }],
        ['tested-positive', {
            'label': 'Tested positive',
            'color': 'pink',
        }],
    ]);
    const [selected, setSelected] = React.useState(() => ['confirmed', 'deaths']);

    return <>
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
            serieses={
                selected.map(
                    key => ({
                        key,
                        color: serieses.get(key).color,
                    }))} />
    </>;
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
    icon: {
      fontSize: '2em',
    },
}));

const Legend = (props) => {
    const classes = useLegendStyles();

    return (
        <ToggleButtonGroup
                value={props.selected}
                onChange={(event, desired) => props.onChange(desired)}
                className={classes.serieses}>
            {[...props.serieses.entries()].map(([id, series]) =>
                <ToggleButton
                    key={id}
                    value={id}
                    classes={{root: classes.series, selected: 'selected'}}>
                    <span
                        className={series.icon}
                        style={
                            props.selected.includes(id)
                                ? {color: series.color}
                                : {}}>
                      —
                    </span>
                    {series.label}
                </ToggleButton>
            )}
        </ToggleButtonGroup>
    );
};

const Chart = (props) => {
    const data = [
        {
          'date': '4/1',
          'confirmed': 12,
          'hospitalized': 2,
          'deaths': 1,
        },
        {
          'date': '4/2',
          'confirmed': 24,
          'hospitalized': 4,
          'deaths': 2,
        },
        {
          'date': '4/3',
          'confirmed': 48,
          'hospitalized': 8,
          'deaths': 4,
        },
        {
          'date': '4/4',
          'confirmed': 96,
          'hospitalized': 16,
          'deaths': 8,
        },
    ];

    const ChosenChart = props.display.chart;
    const ChosenSeries = props.display.series;

    return (
        <ResponsiveContainer height={300}>
            <ChosenChart data={data} width={500} height={300}>
                <Tooltip />
                <XAxis dataKey="date" />
                <YAxis />
                <CartesianGrid stroke="#d5d5d5" strokeDasharray="5 5" />

                {props.serieses && props.serieses.map(series =>
                    <ChosenSeries
                        type="monotone"
                        key={series.key}
                        dataKey={series.key}
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
