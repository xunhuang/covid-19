import React, { useContext } from 'react';
import { CountryContext } from "./CountryContext";
import * as Util from "./Util"
import { GraphStateTesting } from "./GraphTestingEffort"
import { makeStyles } from '@material-ui/core/styles';
import { withHeader } from "./Header.js"
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import Paper from '@material-ui/core/Paper';
import { MyTabs } from "./MyTabs.js"
import { USInfoTopWidget, StateSummarySection } from './USInfoTopWidget.js'
import { withRouter } from 'react-router-dom'
import { CountiesForStateWidget, ListStateCountiesCapita } from "./CountyListRender.js"
import { GraphStateHospitalization } from './GraphHospitalization.js'
import { BasicGraphNewCases } from "./GraphNewCases.js"
import Typography from '@material-ui/core/Typography'
import { BasicGraphRecoveryAndDeath } from "./GraphRecoveryAndDeath.js"
import { Redirect } from 'react-router-dom'
import { MapState } from "./Map";
import { GraphDaysToDoubleOverTime } from "./GraphDaysToDoubleOverTime"
import { GraphDeathProjectionState, GraphAllBedProjectionState } from "./GraphDeathProjection.js"
import { AdvancedGraph } from './AdvancedGraph';

const moment = require("moment");

const useStyles = makeStyles(theme => ({
    content: {
      margin: '0 8px 16px 8px',
    },
    tabContent: {
        padding: '8px',
    }
}));

const StateGraphCaveat = (props) => {
    return <div>
        <Typography variant="body2">
            Recovery data collection started on 4/2.
        {props.stateSummary.lastRecovered > 0 ||
                " No recovery data for this state yet."
            }
        </Typography>

        <BasicGraphRecoveryAndDeath {...props} />
    </div>;
}

const GraphSectionState = withRouter((props) => {
    const state = props.state;
    let graphdata = state.dataPoints();
    let stateSummary = state.summary();
    let stayHomeOrder = state.stayHomeOrder();

    const classes = useStyles();

    const tabs = new Map([
            ['glance', {
                'label': `At a glance`,
                'content': <>
                      <StateSummarySection state={state} />
                      <BasicGraphNewCases
                          data={graphdata}
                          logScale={true}
                          vRefLines={
                              stayHomeOrder ?
                                  [{
                                      date: moment(stayHomeOrder.StartDate
                                      ).format("M/D"),
                                      label: "Stay-At-Home Order",
                                  }] : []
                          } />
                </>,
            }],
            ['detailed', {
                'label': "Detailed",
                'content': <AdvancedGraph target={state} />,
            }],
            ['doubling', {
                'label': "Doubling",
                'content': <GraphDaysToDoubleOverTime data={state.daysToDoubleTimeSeries()} />,
            }],
            ['children', {
                'label': "Counties",
                'content': <CountiesForStateWidget state={state} />,
            }],
            ['map', {
                'label': "Map",
                'content': <MapState state={state} />,
            }],
    ]);
    const headings = [...tabs.keys()];

    const [viewing, setViewing] = React.useState(headings[0]);
    const switchTo = (e, index) => setViewing(headings[index]);
    return (
        <div className={classes.content}>
            <Typography variant="h2">{state.name}</Typography>
            <Tabs
                value={headings.indexOf(viewing)}
                onChange={switchTo}>
                {[...tabs.values()].map((tab, i) =>
                    <Tab label={tab.label} key={i} />
                )}
            </Tabs>
            <Paper className={classes.tabContent}>
              {tabs.get(viewing).content}
            </Paper>
        </div>
    );

    //const tabs = [
    //    <GraphDaysToDoubleOverTime data={props.state.daysToDoubleTimeSeries()} />,
    //    <GraphDeathProjectionState state={state} />,
    //    // <GraphAllBedProjectionState state={state} />,
    //    <StateGraphCaveat stateSummary={stateSummary} data={graphdata} logScale={false} />,
    //    <GraphStateTesting state={state} />,
    //    <GraphStateHospitalization state={state} />,
    //]
    //let graphlistSection = <MyTabs
    //    labels={["Cases",
    //        "Days to 2x",
    //        "Peak Death",
    //        // "Peak Hospitalization",
    //        "Recovery",
    //        "Map",
    //        "Tests",
    //        "Hospitalization",
    //    ]}
    //    urlQueryKey="graph"
    //    urlQueryValues={['cases', 'days2x', 'peakdeath',
    //        // 'peakhospital', 
    //        'recovery', 'map', 'testing', 'hospitalization']}
    //    tabs={tabs}
    //    history={props.history}
    ///>;
    //return graphlistSection;
});

const PageState = withHeader((props) => {
    const country = useContext(CountryContext);
    const state = country.stateForTwoLetterName(props.match.params.state);
    if (!state) {
        return <Redirect to={'/page-not-found'} />;
    }

    const county = Util.getDefaultCountyForState(state);

    Util.CookieSetLastCounty(state.twoLetterName, county ? county.name : null);

    const tabs = [
        <ListStateCountiesCapita state={state} />,
    ];

    return (
        <>
            <USInfoTopWidget
                county={county}
                metro={county ? county.metro() : null}
                state={state}
                country={country}
                selectedTab={"state"}
            />
            <GraphSectionState state={state} />
        </>);
});

export { PageState }
