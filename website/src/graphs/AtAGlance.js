import React from 'react'
import { Summary } from './Summary'
import { County, Country, State } from "../UnitedStates";
import { MapUS } from "../MapUS"
import { GraphAllBedProjectionState, GraphAllBedProjectionUS, GraphVaccinationState } from "./GraphHospitalizationProjection"
import { AdvancedGraph } from '../components/graphs/AdvancedGraph'
import { getRefLines } from "../Util"
import { GraphCountyHospitalization } from "./GraphCountyHospitalization"

const DailyConfirmedNew = (props) => {
  const [dataSeries, setDataSeries] = React.useState(null);
  React.useEffect(() => {
    props.source.confirmDataSeriesAsync().then(data => setDataSeries(data));
  }, [props.source])

  if (!dataSeries || dataSeries.length === 0) {
    return <div> Loading</div>;
  }

  // end of init
  let doubling = Math.round(dataSeries.daysTo2X());
  let dailyGrowth = Math.round(dataSeries.dailyGrowthRate() * 100);

  const vKeyRefLines = getRefLines(props.source);

  return <AdvancedGraph
    serieses={
      [
        {
          series: dataSeries,
          color: "#ff7300",
          covidspecial: true,
        },
        {
          series: dataSeries.change().setLabel("New"),
          color: "#387908",
          rightAxis: true,
          covidspecial: true,
          showMovingAverage: true,
        },
        {
          series: dataSeries.trend().setLabel(`${doubling} Days to 2X (+${dailyGrowth}% Daily)`),
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
  const [dataSeries, setDataSeries] = React.useState(null);
  React.useEffect(() => {
    props.source.deathDataSeriesAsync().then(data => setDataSeries(data));
  }, [props.source])

  if (!dataSeries || dataSeries.length === 0) {
    return <div> Loading</div>;
  }

  let doubling = Math.round(dataSeries.daysTo2X());
  let dailyGrowth = Math.round(dataSeries.dailyGrowthRate() * 100);
  const vKeyRefLines = getRefLines(props.source);
  return <AdvancedGraph
    serieses={
      [
        {
          series: dataSeries,
          color: "black",
          covidspecial: true,
        },
        {
          series: dataSeries.change().setLabel("New"),
          color: "red",
          rightAxis: true,
          covidspecial: true,
          showMovingAverage: true,
        },
        {
          series: dataSeries.trend().setLabel(`${doubling} Days to 2X (+${dailyGrowth}% Daily)`),
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

  const newconfirm = <DailyConfirmedNew
    source={props.source}
  />;
  const newdeath = <DailyDeathNew
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
      <GraphVaccinationState state={props.source} />
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
