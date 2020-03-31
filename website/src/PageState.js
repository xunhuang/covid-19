import React from 'react';
import * as USCounty from "./USCountyInfo.js";
import * as Util from "./Util"
import { GraphStateTesting } from "./GraphTestingEffort"
import { withHeader } from "./Header.js"
import { MyTabs } from "./MyTabs.js"
import { USInfoTopWidget } from './USInfoTopWidget.js'
import { withRouter } from 'react-router-dom'
import { CountiesForStateWidget } from "./CountyListRender.js"
import { GraphStateHospitalization } from './GraphHospitalization.js'
import { BasicGraphNewCases } from "./GraphNewCases.js"

const moment = require("moment");
const states = require('us-state-codes');

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
        < GraphStateTesting state={state} />,
        <GraphStateHospitalization state={state} />,
    ]
    let graphlistSection = <MyTabs
        labels={["Cases", `${state_title} Testing`, "Hospitalization"]}
        tabs={tabs}
    />;
    return graphlistSection;
});

const PageState = withHeader((props) => {
    const state = props.match.params.state;
    const county = Util.getDefaultCountyForState(
        props.match.params.state,
        props.match.params.county);

    const tabs = [
        <CountiesForStateWidget
            county={county}
            state={state}
            callback={(newcounty, newstate) => {
                Util.browseTo(props.history, newstate, newcounty);
            }}
        />,
    ];

    return (
        <>
            <USInfoTopWidget
                county={county}
                state={state}
                selectedTab={"state"}
                callback={(newcounty, newstate) => {
                    Util.browseTo(props.history, newstate, newcounty);
                }}
            />
            <GraphSectionState
                state={state}
                callback={(newcounty, newstate) => {
                    Util.browseTo(props.history, newstate, newcounty);
                }}
            />
            <MyTabs
                labels={[`Counties of ${states.getStateNameByStateCode(state)} `]}
                tabs={tabs}
            />
        </>);
});

export { PageState }