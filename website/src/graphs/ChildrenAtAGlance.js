import React from 'react'
import { Summary } from './Summary'
import { AdvancedGraph } from '../components/graphs/AdvancedGraph'
import { getRefLines } from "../Util"

const DailyConfirmedNew = (props) => {
  const [dataSeries, setDataSeries] = React.useState(null);
  React.useEffect(() => {
    props.source.confirmDataSeriesAsync().then(data => setDataSeries(data));
  }, [props.source])

  if (!dataSeries || dataSeries.length === 0) {
    return <div> Loading</div>;
  }

  const vKeyRefLines = getRefLines(props.source);

  return <AdvancedGraph
    serieses={
      [
        // {
        //   series: dataSeries,
        //   color: "#ff7300",
        //   covidspecial: true,
        // },
        {
          series: dataSeries.change().setLabel("New"),
          color: "#387908",
          // rightAxis: true,
          covidspecial: true,
          showMovingAverage: true,
        },
        // {
        //   series: dataSeries.trend().setLabel(`${doubling} Days to 2X (+${dailyGrowth}% Daily)`),
        //   color: "#ff7300",
        //   stipple: true,
        //   initial: 'off',
        // },
      ]
    }
    vRefLines={vKeyRefLines}
    showControls={false}
    title={props.source.name}
  />;
};

const ChildrenAtAGlance = (props) => {

  const children_sorted = props.source.children().sort((a, b) => {
    return b.summary().confirmed - a.summary().confirmed;
  });

  const display = children_sorted.map(child => {
    return <DailyConfirmedNew
      source={child}
    />;
  });

  return <div>
    <Summary source={props.source} />
    {display}
  </div >;
}

export { ChildrenAtAGlance };
