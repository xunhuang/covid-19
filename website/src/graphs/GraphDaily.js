import React from 'react';
import { GraphDailyGeneric } from "./GraphDailyGeneric"
import { mergeDataSeries, makeDataSeriesFromTotal, exportColumnFromDataSeries } from "./DataSeries";

const GraphDaily = (props) => {
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
