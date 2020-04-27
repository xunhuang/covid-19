import React from 'react'
import { Summary } from './Summary'
import { BasicGraph } from "./GraphNewCases"
import { Country, State } from "../UnitedStates";
import { GraphDeathProjection } from "./GraphDeathProjection";
import { MapUS } from "../MapUS"
import { GraphAllBedProjectionState, GraphAllBedProjectionUS } from "./GraphHospitalizationProjection"

const AtAGlance = (props) => {
  const [USData, setUSdata] = React.useState(null);
  React.useEffect(() => {
    props.source.dataPointsAsync().then(data => setUSdata(data));
  }, [props.source])

  if (!USData || USData.length === 0) {
    return <div> Loading</div>;
  }

  const dailyConfirmed = <BasicGraph {...props}
    USData={USData}
    column="confirmed"
    labelTotal="Total Confirmed"
    labelNew="New (3d-avg)"
    colorTotal="#ff7300"
    colorNew="#387908"
  />

  const dailyDeath = <BasicGraph {...props}
    USData={USData}
    column="death"
    labelTotal="Total Deaths"
    labelNew="New (3d-avg)"
    colorTotal="black"
    colorNew="red"
  />

  if (props.source instanceof Country) {
    return <div>
      <Summary source={props.source} />
      {dailyConfirmed}
      <GraphDeathProjection source={props.source} />
      <MapUS source={props.source} />
      <GraphAllBedProjectionUS />
    </div >;
  }

  if (props.source instanceof State) {
    return <div>
      <Summary source={props.source} />
      {dailyConfirmed}
      <GraphDeathProjection source={props.source} />
      <MapUS source={props.source} />
      <GraphAllBedProjectionState state={props.source} />
    </div >;
  }

  return <div>
    <Summary source={props.source} />
    {dailyConfirmed}
    {dailyDeath}
  </div >;
}

export { AtAGlance };
