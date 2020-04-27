import React, { useContext } from 'react';
import { CountryContext } from "../CountryContext"
import {
  ResponsiveContainer, Tooltip,
  Line, Area, Legend,
  ReferenceLine, Label,
  YAxis, XAxis, CartesianGrid,
  ComposedChart,
} from 'recharts';
import { Typography } from '@material-ui/core';
import { myShortNumber } from '../Util';
import { makeStyles } from '@material-ui/core/styles';
import { Country, State } from '../UnitedStates';


const moment = require("moment");

const useStyles = makeStyles(theme => ({
  customtooltip: {
    backgroundColor: "#FFFFFF",
  },
}));

const AllBedsTooltip = (props) => {
  const classes = useStyles();
  const { active } = props;
  if (active) {
    const { payload, label } = props;

    let allbed_mean;
    let hospitalized;
    let inIcuCurrently;
    let onVentilatorCurrently;

    payload.map(p => {
      p = p.payload;
      if ("allbed_mean" in p) {
        allbed_mean = p.allbed_mean;
      }
      if ("inIcuCurrently" in p) {
        inIcuCurrently = p.inIcuCurrently;
      }
      if ("hospitalized" in p) {
        hospitalized = p.hospitalized;
      }
      if ("onVentilatorCurrently" in p) {
        onVentilatorCurrently = p.onVentilatorCurrently;
      }
      return null;
    });
    return (
      <div className={classes.customtooltip}>
        <Typography variant="body1" noWrap>
          {label}
        </Typography>
        <Typography variant="body2" noWrap>
          {`Projected Total : ${allbed_mean}`}
        </Typography>
        {hospitalized &&
          <Typography variant="body2" noWrap>
            {`Hospitalized: ${hospitalized}`}
          </Typography>
        }
        {inIcuCurrently &&
          <Typography variant="body2" noWrap>
            {`In ICU: ${inIcuCurrently}`}
          </Typography>
        }
        {onVentilatorCurrently &&
          <Typography variant="body2" noWrap>
            {`On Ventilator: ${onVentilatorCurrently}`}
          </Typography>
        }
      </div>
    );
  }
  return null;
}

const keybeds = {
  key_lower: "allbed_lower",
  key_upper: "allbed_upper",
  key_delta: "delta",
  key_mean: "allbed_mean",
  key_upper_cumulative: "dallbedotal_upper",
  key_lower_cumulative: "allbedTotal_lower",
  key_delta_cumulative: "allbedTotal_delta",
  key_mean_cumulative: "allbedTotal_mean",
}

const GraphAllBedProjectionState = (props) => {

  const [USData, setUSdata] = React.useState(null);
  const [state_testing_data, setStatesTestingData] = React.useState(null);
  React.useEffect(() => {
    props.state.projectionsAsync().then(data => setUSdata(data));
    props.state.testingAsync().then(data => setStatesTestingData(data));
  }, [props.state]);

  if (!USData || USData.length === 0 || !state_testing_data || state_testing_data.length === 0) {
    return <div> Loading</div>;
  }

  let data = USData.filter(d => d.location_name === props.state.name);

  const [formateddata, max_date] = formatData(data, keybeds);

  for (let item of formateddata) {
    let entry = state_testing_data.find(t => {
      let d = t.date.toString();
      let year = d.slice(0, 4);
      let month = d.slice(4, 6);
      let day = d.slice(6, 8);
      let date = `${month}/${day}/${year}`;
      return item.fulldate === date;
    })
    if (entry) {
      item.hospitalized = entry.hospitalizedCurrently ?? entry.hospitalized;
      item.inIcuCurrently = entry.inIcuCurrently;
      item.onVentilatorCurrently = entry.onVentilatorCurrently;
    }
  }

  return <GraphDeathProjectionRender
    data={formateddata}
    max_date={max_date}
    max_label="Peak Hospitalization"
    data_keys={keybeds}
    tooltip={<AllBedsTooltip />}
    hospitals={props.state.hospitals()}
  />;
}

const GraphAllBedProjectionUS = (props) => {
  const country = useContext(CountryContext);
  const [USData, setUSdata] = React.useState(null);
  const [testingActual, setTestingActual] = React.useState(null);
  React.useEffect(() => {
    country.projectionsAsync().then(data => setUSdata(data));
    country.testingAsync().then(data => setTestingActual(data));
  }, [country]);

  if (!USData || USData.length === 0 || !testingActual || testingActual.length === 0) {
    return <div> Loading</div>;
  }

  let data = USData.filter(d => d.location_name === "United States of America");
  const [formateddata, max_date] = formatData(data, keybeds);


  for (let item of formateddata) {
    let entry = testingActual.find(t => {
      let d = t.date.toString();
      let year = d.slice(0, 4);
      let month = d.slice(4, 6);
      let day = d.slice(6, 8);
      let date = `${month}/${day}/${year}`;
      return item.fulldate === date;
    })
    if (entry) {
      item.hospitalized = entry.hospitalized;
      item.inIcuCurrently = entry.inIcuCurrently;
      item.onVentilatorCurrently = entry.onVentilatorCurrently;
    }
  }

  return <GraphDeathProjectionRender
    data={formateddata}
    max_date={max_date}
    max_label="Peak Hospitalization"
    data_keys={keybeds}
    tooltip={<AllBedsTooltip />}
    hospitals={country.hospitals()}
  />;
}

const formatData = (data, keys) => {
  data = data.map(d => {
    d.fulldate = moment(d.date, "YYYY-MM-DD").format("MM/DD/YYYY");
    d.name = moment(d.fulldate, "MM/DD/YYYY").format("M/D");
    return d;
  });
  data = data.sort((a, b) => moment(a.fulldate, "MM/DD/YYYY").toDate() - (moment(b.fulldate, "MM/DD/YYYY")).toDate());
  let deathsTotal_mean = 0;
  let deathsTotal_upper = 0;
  let deathsTotal_lower = 0;
  let max_death = 0;
  let max_date = 0;
  data = data.map(d => {
    let r = {};
    let mean = Math.round(d[keys.key_mean]);
    let lower = Math.round(d[keys.key_lower]);
    let upper = Math.round(d[keys.key_upper]);
    r[keys.key_mean] = mean;
    r[keys.key_lower] = lower;
    r[keys.key_upper] = upper;
    r[keys.key_delta] = upper - lower;
    if (max_death < mean) {
      max_death = mean;
      max_date = d.fulldate;
    }
    deathsTotal_mean += mean;
    r[keys.key_mean_cumulative] = deathsTotal_mean;

    deathsTotal_upper += upper;
    deathsTotal_lower += lower;

    r[keys.key_lower_cumulative] = deathsTotal_lower;
    r[keys.key_delta_cumulative] = deathsTotal_upper - deathsTotal_lower;

    r.fulldate = d.fulldate;
    r.name = d.name;

    return r;
  });
  return [data, max_date];
}

const GraphDeathProjectionRender = (props) => {
  let data = props.data;
  const max_date = props.max_date;
  const data_keys = props.data_keys;

  const cutoff = moment().subtract(30, 'days')
  const future = moment().add(30, 'days')
  data = data.filter(d => {
    let day = moment(d.fulldate, "MM/DD/YYYY");
    return day.isAfter(cutoff) && day.isBefore(future);
  });
  const formatYAxis = (tickItem) => {
    return myShortNumber(tickItem);
  }

  return <>
    <ResponsiveContainer height={300} >
      <ComposedChart data={data} margin={{ top: 5, right: 30, left: 5, bottom: 5 }} >
        <XAxis dataKey="name" />
        <YAxis yAxisId={0} tickFormatter={formatYAxis} />
        <ReferenceLine x={moment(max_date, "MM/DD/YYYY").format("M/D")} label={{ value: props.max_label, fill: '#a3a3a3' }} stroke="#e3e3e3" strokeWidth={3} />
        <CartesianGrid stroke="#d5d5d5" strokeDasharray="5 5" />

        <ReferenceLine key={`hreflineicu`} y={props.hospitals.bedsICU} stroke="#e3e3e3" strokeWidth={2} >
          <Label value="ICU Beds" position="insideRight" />
        </ReferenceLine>/>

                <ReferenceLine key={`hreflineavail`} y={props.hospitals.bedsAvail} stroke="#e3e3e3" strokeWidth={2} >
          <Label value="Avg Avail. Beds" position="insideRight" />
        </ReferenceLine>/>

                <ReferenceLine key={`hreflinetotal`} y={props.hospitals.beds} stroke="#e3e3e3" strokeWidth={2} >
          <Label value="Total Beds" position="insideRight" />
        </ReferenceLine>/>

                <Line type="monotone" dataKey={data_keys.key_mean} stroke="#000000" dot={{ r: 1 }} yAxisId={0} strokeWidth={3} />
        <Line type="monotone" dataKey={"hospitalized"} stroke="#00aeef" dot={{ r: 1 }} yAxisId={0} strokeWidth={3} />
        <Line type="monotone" dataKey={"inIcuCurrently"} stroke="#0000FF" dot={{ r: 1 }} yAxisId={0} strokeWidth={3} />
        <Line type="monotone" dataKey={"onVentilatorCurrently"} stroke="#FF0000" dot={{ r: 1 }} yAxisId={0} strokeWidth={3} />
        <Area type='monotone' dataKey={data_keys.key_lower} stackId="1" stroke='#8884d8' fill='#FFFFFF' />
        <Area type='monotone' dataKey={data_keys.key_delta} stackId="1" stroke='#82ca9d' fill='#82ca9d' />
        <Tooltip content={props.tooltip} />
        <Legend verticalAlign="top" payload={[
          { value: 'Projection', type: 'line', color: '#000000' },
          { value: 'Hospitalized Total', type: 'line', color: '#00aeef' },
          { value: 'In ICU', type: 'line', color: '#0000FF' },
          { value: 'On Ventilator', type: 'line', color: '#FF0000' },
        ]} />
      </ComposedChart>
    </ResponsiveContainer>
    <Typography variant="body2">
      Source: NPR, University of Washington, Census Bureau
                </Typography>
  </>
}

function maybeHospitalizationProjectionTabFor(source) {
  // Fuck this
  if (source instanceof Country) {
    return {
      id: 'peakhospitalization',
      label: 'Hosp.*',
      graph: (props) => <GraphAllBedProjectionUS />,
    };
  } else if (source instanceof State) {
    return {
      id: 'peakhospitalization',
      label: 'Hosp.*',
      graph: (props) => <GraphAllBedProjectionState state={props.source} />,
    };
  } else {
    return undefined;
  }
}

export {
  maybeHospitalizationProjectionTabFor,
  GraphAllBedProjectionState,
  GraphAllBedProjectionUS,
}
