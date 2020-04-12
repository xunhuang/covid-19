import React, { useContext } from 'react';
import { CountryContext } from "./CountryContext";
import * as Util from "./Util"
import { GraphStateTesting } from "./GraphTestingEffort"
import { withHeader } from "./Header.js"
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

const moment = require("moment");

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

    const tabs = [
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
            } />,
        <GraphDaysToDoubleOverTime data={props.state.daysToDoubleTimeSeries()} />,
        <GraphDeathProjectionState state={state} />,
        // <GraphAllBedProjectionState state={state} />,
        <StateGraphCaveat stateSummary={stateSummary} data={graphdata} logScale={false} />,
        <MapState state={state} />,
        <GraphStateTesting state={state} />,
        <GraphStateHospitalization state={state} />,
    ]
    let graphlistSection = <MyTabs
        labels={["Cases",
            "Days to 2x",
            "Peak Death",
            // "Peak Hospitalization",
            "Recovery",
            "Map",
            "Tests",
            "Hospitalization",
        ]}
        urlQueryKey="graph"
        urlQueryValues={['cases', 'days2x', 'peakdeath',
            // 'peakhospital', 
            'recovery', 'map', 'testing', 'hospitalization']}
        tabs={tabs}
        history={props.history}
    />;
    return graphlistSection;
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
        <CountiesForStateWidget state={state} />,
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
            <StateSummarySection state={state} />
            <GraphSectionState state={state} />
            <MyTabs
                labels={[`Counties of ${state.name} `, "Per Capita"]}
                urlQueryKey="table"
                urlQueryValues={['cases', 'capita']}
                tabs={tabs}
                history={props.history}
            />
        </>);
});

export { PageState }
