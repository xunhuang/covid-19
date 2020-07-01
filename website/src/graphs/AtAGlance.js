import React from 'react'
import { Summary } from './Summary'
import { BasicGraph } from "./GraphNewCases"
import { Country, State } from "../UnitedStates";
import { GraphDeathProjection } from "./GraphDeathProjection";
import { MapUS } from "../MapUS"
import { GraphAllBedProjectionState, GraphAllBedProjectionUS } from "./GraphHospitalizationProjection"
import moment from 'moment';
import { AdvancedGraph } from '../components/graphs/AdvancedGraph'
import { CovidAdvancedGraph } from '../components/graphs/CovidAdvancedGraph'
import { DataSeries } from '../models/DataSeries';


const AtAGlance = (props) => {
  const [USData, setUSdata] = React.useState(null);
  React.useEffect(() => {
    props.source.dataPointsAsync().then(data => setUSdata(data));
  }, [props.source])

  if (!USData || USData.length === 0) {
    return <div> Loading</div>;
  }

  const vRefLines = [
    {
      date: "05/25/2020",
      label: "Memorial",
    }, {
      date: "07/04/2020",
      label: "July 4th",
    }
  ];
  let stayhome;
  if (props.source.stayHomeOrder) {
    stayhome = props.source.stayHomeOrder();
  }
  if (stayhome) {
    if (stayhome.StartDate) {
      vRefLines.push({
        date: moment(stayhome.StartDate).format("MM/DD/YYYY"),
        label: "Stay-Home-Order",
      });
    }
    if (stayhome.EndDate) {
      vRefLines.push({
        date: moment(stayhome.EndDate).format("MM/DD/YYYY"),
        label: "Re-Opens",
      });
    }
  }

  const dailyConfirmed = <BasicGraph {...props}
    USData={USData}
    column="confirmed"
    project="confirmed_projected"
    labelTotal="Total Confirmed"
    labelNew="New (7d-avg)"
    colorTotal="#ff7300"
    colorNew="#387908"
    vRefLines={vRefLines}
  />

  const dailyDeath = <BasicGraph {...props}
    USData={USData}
    column="death"
    labelTotal="Total Deaths"
    labelNew="New (7d-avg)"
    colorTotal="black"
    colorNew="red"
    vRefLines={vRefLines}
  />

  let confirmed_series = DataSeries.fromOldDataSourceDataPoints("Confirmed", USData, "confirmed");
  let doubling = Math.round(confirmed_series.daysTo2X());
  let dailyGrowth = Math.round(confirmed_series.dailyGrowthRate() * 100);

  const vKeyRefLines = [
    {
      date: moment("05/25/2020", "MM/DD/YYYY").unix(),
      label: "Memorial",
    }, {
      date: moment("07/04/2020", "MM/DD/YYYY").unix(),
      label: "July 4th",
    }
  ]

  if (stayhome) {
    if (stayhome.StartDate) {
      vKeyRefLines.push({
        date: moment(moment(stayhome.StartDate).format("MM/DD/YYYY"), "MM/DD/YYYY").unix(),
        label: "Stay-Home-Order",
      });
    }
    if (stayhome.EndDate) {
      vKeyRefLines.push({
        date: moment(moment(stayhome.EndDate).format("MM/DD/YYYY"), "MM/DD/YYYY").unix(),
        label: "Re-Opens",
      });
    }
  }

  let newconfirm =
    <AdvancedGraph
      serieses={
        [
          {
            series: confirmed_series,
            color: "#ff7300",
            covidspecial: true,
          },
          {
            series: confirmed_series.change().setLabel("New"),
            color: "#387908",
            rightAxis: true,
            covidspecial: true,
            showMovingAverage: true,
          },
          {
            series: confirmed_series.trend().setLabel(`${doubling} Days to 2X (+${dailyGrowth}% Daily)`),
            color: "#ff7300",
            stipple: true,
            // initial: 'off',
          },
        ]
      }
      vRefLines={vKeyRefLines}
    />;

  // newconfirm = null;

  if (props.source instanceof Country) {
    return <div>
      <Summary source={props.source} />
      {newconfirm}
      {dailyConfirmed}
      {dailyDeath}
      <MapUS source={props.source} />
      <GraphAllBedProjectionUS />
    </div >;
  }

  if (props.source instanceof State) {
    return <div>
      <Summary source={props.source} />
      {newconfirm}
      {dailyConfirmed}
      {dailyDeath}
      <MapUS source={props.source} />
      <GraphAllBedProjectionState state={props.source} />
    </div >;
  }

  return <div>
    <Summary source={props.source} />
    {newconfirm}
    {dailyConfirmed}
    {dailyDeath}
  </div >;
}

export { AtAGlance };
