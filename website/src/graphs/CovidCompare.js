import React from 'react'
import { Summary } from './Summary'
import { County } from "../UnitedStates";
import { AdvancedGraph } from '../components/graphs/AdvancedGraph'
import { DataSeries } from '../models/DataSeries';
import { getRefLines } from "../Util"
import { SectionHeader } from "../CovidUI"
import Typography from '@material-ui/core/Typography'

const DailyConfirmedNew = (props) => {
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
    console.log(s);
    let series = DataSeries
      .fromOldDataSourceDataPoints("Confirmed", data, "confirmed")
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
  return <div>       <SectionHeader>
    <Typography variant="h5" noWrap>
      Comparing New Cases Per 100K People
                    </Typography>
  </SectionHeader><AdvancedGraph
      serieses={serieses}
      vRefLines={vKeyRefLines}
    /></div>;
};

const CovidCompare = (props) => {
  const newconfirm = <DailyConfirmedNew
    source={props.source}
  />;

  if (props.source instanceof County) {
    return <div>
      <Summary source={props.source} />
      {newconfirm}
    </div >;
  }

  return <div>
    Not Implemented
  </div >;
}

export { CovidCompare };
