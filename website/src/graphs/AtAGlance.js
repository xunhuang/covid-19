import React from 'react'
import { Summary } from './Summary'
import { BasicGraph } from "./GraphNewCases"
import { County, Country, State } from "../UnitedStates";
import { MapUS } from "../MapUS"
import { GraphAllBedProjectionState, GraphAllBedProjectionUS } from "./GraphHospitalizationProjection"
import moment from 'moment';
import { AdvancedGraph } from '../components/graphs/AdvancedGraph'
import { DataSeries } from '../models/DataSeries';
import { getRefLines } from "../Util"
import { GraphCountyHospitalization } from "./GraphCountyHospitalization"

const DailyConfirmedNew = (props) => {
  let confirmed_series = DataSeries.fromOldDataSourceDataPoints("Confirmed", props.USData, "confirmed");
  let doubling = Math.round(confirmed_series.daysTo2X());
  let dailyGrowth = Math.round(confirmed_series.dailyGrowthRate() * 100);

  const vKeyRefLines = getRefLines(props.source);

  return <AdvancedGraph
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
          initial: 'off',
        },
      ]
    }
    vRefLines={vKeyRefLines}
  />;
};

const DailyDeathNew = (props) => {
  let confirmed_series = DataSeries.fromOldDataSourceDataPoints("Death", props.USData, "death");
  let doubling = Math.round(confirmed_series.daysTo2X());
  let dailyGrowth = Math.round(confirmed_series.dailyGrowthRate() * 100);
  const vKeyRefLines = getRefLines(props.source);
  return <AdvancedGraph
    serieses={
      [
        {
          series: confirmed_series,
          color: "black",
          covidspecial: true,
        },
        {
          series: confirmed_series.change().setLabel("New"),
          color: "red",
          rightAxis: true,
          covidspecial: true,
          showMovingAverage: true,
        },
        {
          series: confirmed_series.trend().setLabel(`${doubling} Days to 2X (+${dailyGrowth}% Daily)`),
          color: "black",
          stipple: true,
          initial: 'off',
        },
      ]
    }
    vRefLines={vKeyRefLines}
  />;
};

const AtAGlance = (props) => {
  const [USData, setUSdata] = React.useState(null);
  React.useEffect(() => {
    props.source.dataPointsAsync().then(data => setUSdata(data));
  }, [props.source])

  if (!USData || USData.length === 0) {
    return <div> Loading</div>;
  }

  const newconfirm = <DailyConfirmedNew
    USData={USData}
    source={props.source}
  />;
  const newdeath = <DailyDeathNew
    USData={USData}
    source={props.source}
  />;

  if (props.source instanceof Country) {
    return <div>
      <Summary source={props.source} />
      {newconfirm}
      {newdeath}
      <MapUS source={props.source} />
      <GraphAllBedProjectionUS />
    </div >;
  }

  if (props.source instanceof State) {
    return <div>
      <Summary source={props.source} />
      {newconfirm}
      {newdeath}
      <MapUS source={props.source} />
      <GraphAllBedProjectionState state={props.source} />
    </div >;
  }

  if (props.source instanceof County) {
    return <div>
      <Summary source={props.source} />
      {newconfirm}
      {newdeath}
      {props.source.hospitalization() &&
        <GraphCountyHospitalization
          hospitalization={props.source.hospitalization()}
          source={props.source}
        />
      }
    </div >;
  }

  return <div>
    <Summary source={props.source} />
    {newconfirm}
    {newdeath}
  </div >;
}

export { AtAGlance };
