import React from 'react';
import {
    ResponsiveContainer, YAxis, XAxis, Tooltip,
    CartesianGrid, Legend, LineChart, Line
} from 'recharts';
import { myShortNumber } from '../Util.js';
import { sortByFullDate, mergeDataSeries, makeDataSeriesFromTotal, exportColumnFromDataSeries } from "./DataSeries";
const moment = require("moment");

const formatYAxis = (tickItem) => {
    return myShortNumber(tickItem);
}

const GraphDaily = (props) => {
    const [sourceData, setSourceData] = React.useState(null);
    const [caseData, setCaseData] = React.useState(null);

    React.useEffect(() => {
        if (props.source.testingAsync) {
            props.source.testingAsync()
                .then(data => setSourceData(data));
        }
        props.source.dataPointsAsync().then(data => setCaseData(data));
    }, [props.source])

    if (!caseData || caseData.length === 0) {
        return <div> Loading</div>;
    }

    let data = [];
    if (sourceData) {
        data = sourceData.map(t => {
            let str = "" + t.date;
            let y = str.slice(0, 4);
            let m = str.slice(4, 6);
            let d = str.slice(6, 8);
            t.fulldate = `${m}/${d}/${y}`;

            function max(a, b) {
                if (!a) return b;
                if (!b) return a;
                return (a > b) ? a : b;
            }
            t.combinedHosptializaiton = max(max(t.hospitalized, t.hospitalizedCurrently), t.hospitalizedCumulative);
            return t;
        })
        let testTotalArray = exportColumnFromDataSeries(data, "total");
        let total = makeDataSeriesFromTotal(testTotalArray, "total", "testsThatDay", "testsThatDay_avg");
        let hosptializationArray = exportColumnFromDataSeries(data, "combinedHosptializaiton");
        let hospitizlation = makeDataSeriesFromTotal(hosptializationArray, "hospTotal", "hospDaily", "hospDaily_avg");
        data = mergeDataSeries(data, total);
        data = mergeDataSeries(data, hospitizlation);
    }

    let deathsTotalArray = exportColumnFromDataSeries(caseData, "death");
    let deaths = makeDataSeriesFromTotal(deathsTotalArray, "deathsTotal", "deathsDaily", "deathsDaily_avg");

    let confirmedTotalArray = exportColumnFromDataSeries(caseData, "confirmed");
    let confirmed = makeDataSeriesFromTotal(confirmedTotalArray, "confirmedTotal", "confirmedDaily", "confirmedDaily_avg");

    data = mergeDataSeries(data, deaths);
    data = mergeDataSeries(data, confirmed);

    // done assembly data
    data = sortByFullDate(data);

    const cutoff = moment().subtract(30, 'days')
    data = data.filter(d => {
        return moment(d.fulldate, "MM/DD/YYYY").isAfter(cutoff)
    });

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
            {/* <Line type="monotone" name="Testing Daily" dataKey="testsThatDay" dot={{ r: 1 }} strokeDasharray="2 2" stroke="#387908" yAxisId={0} strokeWidth={1} />
            <Line type="monotone" name="Testing Daily Avg" dataKey="testsThatDay_avg" dot={{ r: 1 }} stroke="#387908" yAxisId={0} strokeWidth={2} /> */}
            <Line type="monotone" name="Hospitalization Daily" dataKey="hospDaily" dot={{ r: 1 }} strokeDasharray="2 2" stroke="#00aeef" yAxisId={0} strokeWidth={1} />
            <Line type="monotone" name="Hospitalization Daily Avg" dataKey="hospDaily_avg" dot={{ r: 1 }} stroke="#00aeef" yAxisId={0} strokeWidth={2} />

            <Line type="monotone" name="Death Daily" dataKey="deathsDaily" dot={{ r: 1 }} strokeDasharray="2 2" stroke="#000000" yAxisId={0} strokeWidth={1} />
            <Line type="monotone" name="Death Avg" dataKey="deathsDaily_avg" dot={{ r: 1 }} stroke="#000000" yAxisId={0} strokeWidth={2} />

            <Line type="monotone" name="Confirmed Daily" dataKey="confirmedDaily" dot={{ r: 1 }} strokeDasharray="2 2" stroke="#0000FF" yAxisId={0} strokeWidth={1} />
            <Line type="monotone" name="Confirmed Avg" dataKey="confirmedDaily_avg" dot={{ r: 1 }} stroke="#0000FF" yAxisId={0} strokeWidth={2} />
            <Legend verticalAlign="top" />
            <Tooltip />
        </LineChart>;

    return <div>
        <ResponsiveContainer height={300} >
            {chart}
        </ResponsiveContainer>
    </div>;
}

function maybeDailyTabFor(source) {
    return {
        id: 'daily',
        label: 'Daily',
        graph: GraphDaily
    };
}

export { maybeDailyTabFor };
