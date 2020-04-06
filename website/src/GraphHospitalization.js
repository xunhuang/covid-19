import React from 'react';
import { ResponsiveContainer, LineChart, Line, YAxis, XAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { Typography } from '@material-ui/core';
import { myShortNumber } from './Util';

const GraphTestingWidget = (props) => {
    let data = props.data.map(t => {
        let md = t.date % 1000;
        let m = Math.floor(md / 100);
        let d = md % 100;
        t.name = `${m}/${d}`;
        return t;
    })
    console.log(data);
    data = data.sort(function (a, b) {
        return a.date - b.date;
    });

    const formatYAxis = (tickItem) => {
        console.log(tickItem);
        if (!isFinite(tickItem)) {
            return tickItem;

        }
        return myShortNumber(tickItem);
    }

    return <div>
        <Typography variant="body2" >
            Partial data coming in starting 3/21 for some states. Please be patient.
        </Typography>
        <ResponsiveContainer height={300} >
            <LineChart
                data={data}
                margin={{ top: 5, right: 30, left: 5, bottom: 5 }}
            >
                <YAxis tickFormatter={formatYAxis} />
                <XAxis dataKey="name" />
                <CartesianGrid stroke="#d5d5d5" strokeDasharray="5 5" />
                <Line type="monotone" name="Positive" dataKey="positive" stroke="#ff7300" yAxisId={0} strokeWidth={3} />
                <Line type="monotone" name="Hospitalized" dataKey="hospitalized" stroke="#00aeef" yAxisId={0} strokeWidth={3} />
                <Legend verticalAlign="top" />
                <Tooltip />
            </LineChart>
        </ResponsiveContainer>
        <Typography variant="body2" noWrap>
            Data source: https://covidtracking.com/api/
        </Typography>
    </div>;
}

const GraphUSHospitalization = (props) => {
    const data = require("./data/us_testing.json");
    return <GraphTestingWidget data={data} />;
}

const GraphStateHospitalization = (props) => {
    const usdata = require("./data/state_testing.json");
    const statedata = usdata.filter(d => d.state === props.state.twoLetterName)
        .sort((a, b) => a.date - b.date);

    return <GraphTestingWidget data={statedata} />;
}

export { GraphUSHospitalization, GraphStateHospitalization };
