import React, { useContext } from 'react';
import { withRouter } from 'react-router-dom'
import { NearbyCounties } from "./CountyListRender.js"
import { BasicGraphNewCases } from "./GraphNewCases.js"
import { GraphStateTesting } from "./GraphTestingEffort"
import { withHeader } from "./Header.js"
import { MyTabs } from "./MyTabs.js"
import { CountryContext } from "./CountryContext";
import { USInfoTopWidget } from './USInfoTopWidget.js'
import { CountyHospitalsWidget } from "./Hospitals"
import * as Util from "./Util"

const moment = require('moment');

const GraphSectionCounty = withRouter((props) => {
    const county = props.county;
    const stayHomeOrder = county.stayHomeOrder();

    const tabs = [
        <BasicGraphNewCases
            data={county.dataPoints()}
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
        <GraphStateTesting state={county.state()} />,
    ]
    let graphlistSection = <MyTabs
        labels={["Cases", `${county.state().name} Testing`]}
        urlQueryKey="graph"
        urlQueryValues={['cases', 'testing']}
        tabs={tabs}
        history={props.history}
    />;
    return graphlistSection;
});

const PageCounty = withHeader((props) => {
    const country = useContext(CountryContext);
    const state = country.stateForTwoLetterName(props.match.params.state);
    const county = state.countyForName(props.match.params.county);

    Util.CookieSetLastCounty(state.twoLetterName, county.name);

    const tabs = [
        <NearbyCounties county={county} />,
        <CountyHospitalsWidget county={county} />,
    ];
    return (
        <>
            <USInfoTopWidget county={county} selectedTab={"county"} />
            <GraphSectionCounty county={county} />
            <MyTabs
                labels={["Nearby", "Hospitals"]}
                urlQueryKey="table"
                urlQueryValues={['nearby', 'hospitals']}
                tabs={tabs}
                history={props.history}
            />
        </>
    );
});
export { PageCounty }
