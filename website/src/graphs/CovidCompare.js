import React from 'react'
import { Summary } from './Summary'
import { County } from "../UnitedStates";
import { AdvancedGraph } from '../components/graphs/AdvancedGraph'
import { DataSeries } from '../models/DataSeries';
import { getRefLines } from "../Util"

const PerCapitaCompare = (props) => {
  const [USData, setUSdata] = React.useState(null);
  React.useEffect(() => {
    props.source.dataPointsAsync().then(data => setUSdata(data));
  }, [props.source])

  if (!USData || USData.length === 0) {
    return <div> Loading</div>;
  }

  let all = [props.source];
  let metro = props.source.metro();
  if (metro) {
    all.push(metro);
  }
  all.push(props.source.state())
  all.push(props.source.state().country());
  const colors = [
    "#387908",
    "#ff7300",
    "blue",
    "black",
  ]
  let color_index = 0;
  const serieses = all.map(s => {
    let data = (s === props.source) ? USData : s.dataPoints();
    let series = DataSeries
      .fromOldDataSourceDataPoints("data", data, props.dataColumn)
      .change()
      .nDayAverage(7)
      .capita(s.population() / 100000)
      .setLabel(s.name);
    return {
      series: series,
      color: colors[color_index++],
      stipple: s !== props.source,
    };
  })

  const vKeyRefLines = getRefLines(props.source);
  return <AdvancedGraph
    title={props.title}
    serieses={serieses}
    vRefLines={vKeyRefLines}
  />
};

const CovidCompare = (props) => {
  if (props.source instanceof County) {
    return <div>
      <Summary source={props.source} />
      <PerCapitaCompare
        title={"New Cases/100K (7-day average)"}
        source={props.source}
        dataColumn={"confirmed"}
      />
      <PerCapitaCompare
        title={"Deaths/100K (7-day average)"}
        source={props.source}
        dataColumn={"death"}
      />
    </div >;
  }

  return <div>
    Not Implemented
  </div >;
}

export { CovidCompare };
