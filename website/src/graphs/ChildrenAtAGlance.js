import React from 'react'
import { Summary } from './Summary'
import { AdvancedGraph } from '../components/graphs/AdvancedGraph'
import { getRefLines } from "../Util"
import { makeStyles } from '@material-ui/core/styles';

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
        {
          series: dataSeries.change().setLabel("New"),
          color: "#387908",
          covidspecial: true,
          showMovingAverage: true,
        },
      ]
    }
    vRefLines={vKeyRefLines}
    showControls={false}
    title={props.source.name}
    subtitle={`Avg ${Math.round(props.source.serverityIndex() * 100000 / 14)}/100K/day past 2 weeks`}
  />;
}

const useStyles = makeStyles(theme => ({
  container: {
    display: "flex",
    flexWrap: "wrap",
  },
  graph: {
    // maxWidth: 400,
    minWidth: 350,
  }
}));

const ChildrenAtAGlance = (props) => {
  const classes = useStyles();

  const children_sorted = props.source.children().sort((a, b) => {
    // return b.summary().confirmed - a.summary().confirmed;
    return b.serverityIndex() - a.serverityIndex();
  });

  const display = children_sorted.map(child => {
    return <div className={classes.graph}>
      <DailyConfirmedNew
        source={child}
      />
    </div>
  });

  return <div>
    <Summary source={props.source} />
    <div className={classes.container}>
      {display}
    </div>
  </div >;
}

export { ChildrenAtAGlance };
