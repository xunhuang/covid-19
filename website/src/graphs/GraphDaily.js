import React from 'react';
import { getRefLines } from "../Util"
import { AdvancedGraph } from '../components/graphs/AdvancedGraph'

const GraphDaily = (props) => {
  const [confirmedSeries, setConfimedSeries] = React.useState(null);
  const [deathSeries, setDeathSeries] = React.useState(null);
  const [hosptializationCurrentlySeries, setHospitalizationCurrentSeries] = React.useState(null);

  React.useEffect(() => {
    props.source.confirmDataSeriesAsync().then(data => setConfimedSeries(data));
    props.source.deathDataSeriesAsync().then(data => setDeathSeries(data));
    if (props.source.hospitalizationCurrentlyAsync) {
      props.source.hospitalizationCurrentlyAsync().then(data => setHospitalizationCurrentSeries(data));
    }
  }, [props.source])

  if (
    !confirmedSeries || confirmedSeries.length === 0 ||
    (props.source.testingAsync && (!hosptializationCurrentlySeries || hosptializationCurrentlySeries.length === 0)) ||
    !deathSeries || deathSeries.length === 0
  ) {
    return <div> Loading</div>;
  }

  console.log(hosptializationCurrentlySeries);

  // end of init
  const vKeyRefLines = getRefLines(props.source);

  const series =
    [
      {
        series: confirmedSeries
          .change()
          // .nDayAverage(7)
          .setLabel("New Confirm"),
        color: "#387908",
        covidspecial: true,
        showMovingAverage: true,
      },
      {
        series: deathSeries
          .change()
          // .nDayAverage(7)
          .setLabel("New Death"),
        color: "red",
        rightAxis: true,
        covidspecial: true,
        showMovingAverage: true,
      },
    ]
  if (props.source.hospitalizationCurrentlyAsync) {
    series.push(
      {
        series: hosptializationCurrentlySeries.setLabel("Hospitalized (left axis)"),
        color: "blue",
        covidspecial: true,
        // showMovingAverage: true,
      }
    );
  }

  return <AdvancedGraph
    serieses={series}
    vRefLines={vKeyRefLines}
  />;
};

function maybeDailyTabFor(source) {
  return {
    id: 'daily',
    label: 'Daily',
    graph: GraphDaily
  };
}

export { maybeDailyTabFor };
