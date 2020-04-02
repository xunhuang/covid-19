import React from 'react';
import * as USCounty from "./USCountyInfo.js";
import * as Util from "./Util"
import { GraphStateTesting } from "./GraphTestingEffort"
import { withHeader } from "./Header.js"
import { MyTabs } from "./MyTabs.js"
import { USInfoTopWidget } from './USInfoTopWidget.js'
import { withRouter } from 'react-router-dom'
import { CountiesForStateWidget, ListStateCountiesCapita } from "./CountyListRender.js"
import { GraphStateHospitalization } from './GraphHospitalization.js'
import { BasicGraphNewCases } from "./GraphNewCases.js"
import Typography from '@material-ui/core/Typography'
import { BasicGraphRecoveryAndDeath } from "./GraphRecoveryAndDeath.js"
import { Redirect } from 'react-router-dom'

const moment = require("moment");
const states = require('us-state-codes');

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
    let state_title = states.getStateNameByStateCode(state);
    let graphdata = USCounty.getStateDataForGrapth(state);
    let stateSummary = USCounty.casesForStateSummary(state);
    let stayHomeOrder = stateSummary.stayHomeOrder;

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
        <StateGraphCaveat stateSummary={stateSummary} data={graphdata} logScale={false} />,
        < GraphStateTesting state={state} />,
        <GraphStateHospitalization state={state} />,
    ]
    let graphlistSection = <MyTabs
        labels={["Cases",
            `${state} State Recovery`,
            `${state} Test`,
            "Hospitalization"]}
        tabs={tabs}
    />;
    return graphlistSection;
});

const PageState = withHeader((props) => {
    const state = props.match.params.state;
    // Validate state name
    const stateFullName = states.getStateNameByStateCode(state);
    if (stateFullName === null) {
        return <Redirect to={'/page-not-found'} />;
    }

    const county = Util.getDefaultCountyForState(
        props.match.params.state,
        props.match.params.county);

    const tabs = [
        <CountiesForStateWidget
            county={county}
            state={state}
        />,
        <ListStateCountiesCapita
            county={county}
            state={state}
        />,
    ];

    return (
        <>
            <USInfoTopWidget
                county={county}
                state={state}
                selectedTab={"state"}
            />
            <GraphSectionState
                state={state}
            />
            <MyTabs
                labels={[`Counties of ${states.getStateNameByStateCode(state)} `, "Per Capita"]}
                tabs={tabs}
            />
        </>);
});

export { PageState }
