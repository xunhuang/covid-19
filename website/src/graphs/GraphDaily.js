import React from 'react';
import { GraphDailyGeneric } from "./GraphDailyGeneric"
import { mergeDataSeries, makeDataSeriesFromTotal, exportColumnFromDataSeries } from "./DataSeries";
import { getRefLines } from "../Util"
import { AdvancedGraph } from '../components/graphs/AdvancedGraph'

const GraphDaily = (props) => {
  const [confirmedSeries, setConfimedSeries] = React.useState(null);
  const [deathSeries, setDeathSeries] = React.useState(null);
  const [hosptializationCurrentlySeries, setHospitalizationCurrentSeries] = React.useState(null);

  React.useEffect(() => {
    props.source.confirmDataSeriesAsync().then(data => setConfimedSeries(data));
    props.source.deathDataSeriesAsync().then(data => setDeathSeries(data));
    props.source.hospitalizationCurrentlyAsync().then(data => setHospitalizationCurrentSeries(data));
  }, [props.source])

  if (
    !confirmedSeries || confirmedSeries.length === 0 ||
    !hosptializationCurrentlySeries || hosptializationCurrentlySeries.length === 0 ||
    !deathSeries || deathSeries.length === 0
  ) {
    return <div> Loading</div>;
  }

  // end of init
  const vKeyRefLines = getRefLines(props.source);

  return <AdvancedGraph
    serieses={
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
        {
          series: hosptializationCurrentlySeries.setLabel("Hospitalized (left axis)"),
          color: "blue",
          covidspecial: true,
          // showMovingAverage: true,
        },
      ]
    }
    vRefLines={vKeyRefLines}
  />;
};

const GraphDailyOld = (props) => {
  const [sourceData, setSourceData] = React.useState(null);
  const [caseData, setCaseData] = React.useState(null);

  // fitVirusCV19();

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

  let dataDescr = [
    {
      legendName: "Death Daily",
      dataKey: "deathsDaily",
      color: "#000000",
    },
    {
      legendName: "Confirmed Daily",
      dataKey: "confirmedDaily",
      color: "#0000FF",
    }
  ];

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
    let total = makeDataSeriesFromTotal(testTotalArray, "total", "testsThatDay");
    let hosptializationArray = exportColumnFromDataSeries(data, "combinedHosptializaiton");
    let hospitizlation = makeDataSeriesFromTotal(hosptializationArray, "hospTotal", "hospDaily");
    data = mergeDataSeries(data, total);
    data = mergeDataSeries(data, hospitizlation);
    // {
    //     legendName: "Testing Daily",
    //     dataKey: "testsThatDay",
    //     color: "#387908",
    // },
    dataDescr.push({
      legendName: "Hospitalization Daily",
      dataKey: "hospDaily",
      color: "#00aeef",
    });
  }

  let deathsTotalArray = exportColumnFromDataSeries(caseData, "death");
  let deaths = makeDataSeriesFromTotal(deathsTotalArray, "deathsTotal", "deathsDaily");

  let confirmedTotalArray = exportColumnFromDataSeries(caseData, "confirmed");
  let confirmed = makeDataSeriesFromTotal(confirmedTotalArray, "confirmedTotal", "confirmedDaily");

  data = mergeDataSeries(data, deaths);
  data = mergeDataSeries(data, confirmed);

  return <GraphDailyGeneric data={data} dataDescr={dataDescr} />
}


function maybeDailyTabFor(source) {
  return {
    id: 'daily',
    label: 'Daily',
    graph: GraphDaily
  };
}

export { maybeDailyTabFor };
