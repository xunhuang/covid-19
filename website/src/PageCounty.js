import React from 'react';
import { withRouter } from 'react-router-dom'
import * as USCounty from "./USCountyInfo.js";
import { NearbyCounties } from "./CountyListRender.js"
import { BasicGraphNewCases } from "./GraphNewCases.js"
import { GraphStateTesting } from "./GraphTestingEffort"
import { withHeader } from "./Header.js"
import { MyTabs } from "./MyTabs.js"
import { USInfoTopWidget } from './USInfoTopWidget.js'
import { CountyHospitalsWidget } from "./Hospitals"
import * as Util from "./Util"

const moment = require("moment");
const states = require('us-state-codes');

const GraphSectionCounty = withRouter((props) => {
    const state = props.state;
    const county = props.county;
    let state_title = states.getStateNameByStateCode(state);

    let graphdata = USCounty.getCountyDataForGrapth(state, county);
    let countySummary = USCounty.casesForCountySummary(state, county);
    let stayHomeOrder = countySummary.stayHomeOrder;

    const tabs = [
        <BasicGraphNewCases
            data={graphdata}
            logScale={false}
            vRefLines={
                stayHomeOrder ?
                    [{
                        date: moment(stayHomeOrder.StartDate
                        ).format("M/D"),
                        label: "Stay-At-Home Order",
                    }] : []
            }
        />,
        <GraphStateTesting state={state} />,
    ]
    let graphlistSection = <MyTabs
        labels={["Confirmed Cases", `${state_title} Testing`]}
        tabs={tabs}
    />;
    return graphlistSection;
});

const PageCounty = withHeader((props) => {
    const state = props.match.params.state;
    const county = props.match.params.county;

    Util.CookieSetLastCounty(state, county);

    const tabs = [
        <NearbyCounties
            county={county}
            state={state}
            callback={(newcounty, newstate) => {
                Util.browseTo(props.history, newstate, newcounty);
            }}
        />,
        <CountyHospitalsWidget
            county={county}
            state={state}
        >
        </CountyHospitalsWidget >,
    ];
    return (
        <>
            <USInfoTopWidget
                county={county}
                state={state}
                selectedTab={"county"}
                callback={(newcounty, newstate) => {
                    Util.browseTo(props.history, newstate, newcounty);
                }}
            />
            <GraphSectionCounty
                county={county}
                state={state}
                callback={(newcounty, newstate) => {
                    Util.browseTo(props.history, newstate, newcounty);
                }}
            />
            <MyTabs
                labels={["Nearby", "Hospitals"]}
                tabs={tabs}
            />
        </>
    );
});
export { PageCounty }
