import React from 'react'
import { Summary } from './Summary'
import { County, Country, State } from "../UnitedStates";
import { MapUS } from "../MapUS"
import { GraphAllBedProjectionState, GraphAllBedProjectionUS } from "./GraphHospitalizationProjection"
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
  />;
};

const ChildrenAtAGlance = (props) => {

  const newconfirm = <DailyConfirmedNew
    source={props.source}
  />;

  const children = props.source.children().map(child => {
    return <div>
      <div>{child.name}</div>
      <DailyConfirmedNew
        source={child}
      />
    </div>;
  });

  return <div>
    <Summary source={props.source} />
    ChildrenAtAGlance
    {children}
    {/* {newconfirm}
    {newdeath} */}
  </div >;
}

export { ChildrenAtAGlance };
