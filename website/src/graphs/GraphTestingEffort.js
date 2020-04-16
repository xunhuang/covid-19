import React from 'react';
import {
    ResponsiveContainer, AreaChart, Area, YAxis, XAxis, Tooltip,
    CartesianGrid, Legend, LineChart, Line
} from 'recharts';
import { makeStyles } from '@material-ui/core/styles';
import { Typography } from '@material-ui/core';
import { Grid } from '@material-ui/core';
import { AntSwitch } from "./GraphNewCases.js"
import { myShortNumber } from '../Util.js';
import { mergeDataSeries, makeDataSeriesFromTotal, exportColumnFromDataSeries } from "./DataSeries";

const useStyles = makeStyles(theme => ({
    customtooltip: {
        backgroundColor: "#FFFFFF",
    }
}));

const CustomTooltip = (props) => {
    const classes = useStyles();
    const { active } = props;
    if (active) {
        const { payload, label } = props;

        let tested;
        let positive;
        let negative;
        let totalPositve;
        let totalTested;
        let totalNegative;
        let totalPending;

        payload.map(p => {
            p = p.payload;
            if ("testsThatDay" in p) {
                tested = p.testsThatDay;
            }
            if ("positiveThatDay" in p) {
                positive = p.positiveThatDay;
            }
            if ("negativeThatDay" in p) {
                negative = p.negativeThatDay;
            }
            if ("positive" in p) {
                totalPositve = p.positive;
            }
            if ("negative" in p) {
                totalNegative = p.negative;
            }
            if ("pending" in p) {
                totalPending = p.pending;
            }
            if ("total" in p) {
                totalTested = p.total;
            }
            return null;
        });

        return (
            <div className={classes.customtooltip}>
                <Typography variant="body1" noWrap>
                    {label}
                </Typography>
                <Typography variant="body2" noWrap>
                    {`Daily Tested: ${tested}`}
                </Typography>
                <Typography variant="body2" noWrap>
                    {`Daily Positve : ${positive}`}
                </Typography>
                <Typography variant="body2" noWrap>
                    {`Daily Negative : ${negative}`}
                </Typography>
                <Typography variant="body2" noWrap>
                    {`Cumulative Positve Rate : ${(totalPositve / totalTested * 100).toFixed(1)} %`}
                </Typography>
                <Typography variant="body2" noWrap>
                    {`Cumulative Negative Rate : ${(totalNegative / totalTested * 100).toFixed(1)} %`}
                </Typography>
                <Typography variant="body2" noWrap>
                    {`Pending: ${totalPending ? totalPending : 0}`}
                </Typography>
            </div>
        );
    }
    return null;
}

const formatYAxis = (tickItem) => {
    return myShortNumber(tickItem);
}

function maybeFindTesting(source) {
    let ancestor = source;
    while (!ancestor.testing && ancestor.parent) {
        ancestor = ancestor.parent();
    }
    return ancestor;
}

const GraphTestingWidget = (props) => {
    const [sourceData, setSourceData] = React.useState(null);
    const [useAreaChart, setUseAreaChart] = React.useState(false);

    React.useEffect(() => {
        props.source.testingAsync()
            .then(data => setSourceData(data));
    }, [props.source])

    if (!sourceData || sourceData.length === 0) {
        return <div> Loading</div>;
    }

    let data = sourceData.map(t => {
        let md = t.date % 1000;
        let m = Math.floor(md / 100);
        let d = md % 100;
        t.name = `${m}/${d}`;

        m = m.toString().padStart(2, "0");
        d = d.toString().padStart(2, "0");
        let y = Math.floor(t.date / 10000);

        t.fulldate = `${m}/${d}/${y}`;

        return t;
    })

    data = data.sort(function (a, b) {
        return a.date - b.date;
    });

    let testTotalArray = exportColumnFromDataSeries(data, "total");
    let testPostives = exportColumnFromDataSeries(data, "positive");
    let testNegatives = exportColumnFromDataSeries(data, "negative");
    let total = makeDataSeriesFromTotal(testTotalArray, "total", "testsThatDay", "testsThatDay_avg");
    let pos = makeDataSeriesFromTotal(testPostives, "postive", "positiveThatDay", "positiveThatDay_avg");
    let neg = makeDataSeriesFromTotal(testNegatives, "negative", "negativeThatDay", "negativeThatDay_avg");

    data = mergeDataSeries(data, total);
    data = mergeDataSeries(data, pos);
    data = mergeDataSeries(data, neg);

    let total_tests = data.reduce((m, a) => { return a.total > m ? a.total : m }, 0);
    let total_positives = data.reduce((m, a) => { return a.positive > m ? a.positive : m }, 0);
    let total_negatives = data.reduce((m, a) => { return a.negative > m ? a.negative : m }, 0);

    // If true, show area chart.
    // If false, show line chart.
    let chart = useAreaChart ?
        <AreaChart
            data={data}
            margin={{ top: 5, right: 30, left: 5, bottom: 5 }}
        >
            <YAxis tickFormatter={formatYAxis} />
            <XAxis dataKey="name" />
            <CartesianGrid stroke="#d5d5d5" strokeDasharray="5 5" />
            {/* <Line type="monotone" name="Total Tested" dataKey="total" stroke="#387908" yAxisId={0} strokeWidth={3} />
        <Line type="monotone" name="Tested Positive" dataKey="positive" stroke="#ff7300" yAxisId={0} strokeWidth={3} /> */}
            <Area stackId="1" type="monotone" name="Positive" dataKey="positiveThatDay" stroke="#ff7300" fill="#ff7300" yAxisId={0} strokeWidth={3} />
            <Area stackId="1" type="monotone" name="Negative" dataKey="negativeThatDay" stroke="#00aeef" fill="#00aeef" yAxisId={0} strokeWidth={3} />
            {/* <Area stackId="1" type="monotone" name="Pending" dataKey="pendingThatDay" stroke="#387908" fill="#387908" yAxisId={0} strokeWidth={3} /> */}
            <Legend verticalAlign="top" />
            <Tooltip content={<CustomTooltip />} />
        </AreaChart>
        :
        <LineChart
            data={data}
            margin={{ top: 5, right: 30, left: 5, bottom: 5 }}
        >
            <YAxis tickFormatter={formatYAxis} />
            <XAxis dataKey="name" />
            <CartesianGrid stroke="#d5d5d5" strokeDasharray="5 5" />
            {/* <Line type="monotone" name="Total" dataKey="total" stroke="#ff7300" yAxisId={0} strokeWidth={3} /> */}
            <Line type="monotone" name="Daily" dataKey="testsThatDay" dot={{ r: 1 }} strokeDasharray="2 2" stroke="#387908" yAxisId={0} strokeWidth={1} />
            <Line type="monotone" name="3d daily avg" dataKey="testsThatDay_avg" dot={{ r: 1 }} stroke="#387908" yAxisId={0} strokeWidth={2} />
            <Line type="monotone" name="Positive" dataKey="positiveThatDay" dot={{ r: 1 }} strokeDasharray="2 2" stroke="#a3a3a3" yAxisId={0} strokeWidth={1} />
            <Line type="monotone" name="3d daily avg" dataKey="positiveThatDay_avg" dot={{ r: 1 }} stroke="#a3a3a3" yAxisId={0} strokeWidth={2} />
            {/* <Line type="monotone" name="Negative" dataKey="negativeThatDay" stroke="#00aeef" yAxisId={0} strokeWidth={3} /> */}
            <Legend verticalAlign="top" />
            <Tooltip content={<CustomTooltip />} />
        </LineChart>;

    return <div>
        <Grid container alignItems="center" justify="space-between" spacing={1}>
            <Grid item container xs={12} sm={12} md={6} alignItems="center" justify="flex-start" spacing={1}>
                <Grid item>
                    <Typography variant="body2" noWrap>
                        {`Total: ${myShortNumber(total_tests)}
                    Pos.:${(total_positives / total_tests * 100).toFixed(0)}%
                    Neg.: ${(total_negatives / total_tests * 100).toFixed(0)}%
                    `}
                    </Typography>
                </Grid>
                {/* Case 1: click on the "Line chart" text -> show line chart */}
                <Grid item onClick={event => setUseAreaChart(false)}>
                    <Typography>
                    </Typography>
                </Grid>
                {/* Case 2: click on the ant switch -> change to the other chart type */}
                <Grid item>
                    <AntSwitch
                        checked={useAreaChart}
                        onClick={event => setUseAreaChart(!useAreaChart)}
                    />
                </Grid>
                {/* Case 3: click on the "Area chart" text -> show area chart */}
                <Grid item onClick={event => setUseAreaChart(true)}>
                    <Typography>
                        Results
                    </Typography>
                </Grid>
            </Grid>
        </Grid>
        <ResponsiveContainer height={300} >
            {chart}
        </ResponsiveContainer>
        <Typography variant="body2" noWrap>
            Data source: https://covidtracking.com/api/
        </Typography>
    </div>;
}

function maybeTestingTabFor(source) {
    if (source.testingAsync) {
        return {
            id: 'testing',
            label: 'Tests',
            graph: GraphTestingWidget,
        };
    } else {
        const maybeAncestor = maybeFindTesting(source);
        if (maybeAncestor.testing) {
            return {
                id: 'testing',
                label: `${maybeAncestor.name} Testing`,
                graph: GraphTestingWidget,
            };
        } else {
            return undefined;
        }
    }
}

export { maybeTestingTabFor };
