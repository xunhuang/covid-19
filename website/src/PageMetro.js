import React from 'react';
import { withRouter } from 'react-router-dom'
import * as USCounty from "./USCountyInfo.js";
import { ListCountiesForMetro } from "./CountyListRender.js"
import { BasicGraphNewCases } from "./GraphNewCases.js"
import { withHeader } from "./Header.js"
import { MyTabs } from "./MyTabs.js"
import { USInfoTopWidget } from './USInfoTopWidget.js'
import * as Util from "./Util"

const GraphSectionMetro = withRouter((props) => {
    let graphdata = USCounty.getMetroDataForGrapth(props.metro);

    const tabs = [
        <BasicGraphNewCases
            data={graphdata}
            logScale={false}
        />,
        // <GraphStateTesting state={state} />,
    ]
    let graphlistSection = <MyTabs
        labels={["Confirmed Cases"]}
        // labels={["Confirmed Cases", `${state_title} Testing`]}
        tabs={tabs}
    />;
    return graphlistSection;
});

const PageMetro = withHeader((props) => {
    const state = props.match.params.state;
    const county = props.match.params.county;

    Util.CookieSetLastCounty(state, county);
    let metro = "BayArea"

    const tabs = [
        <ListCountiesForMetro
            metro={metro}
        />,
        // <CountyHospitalsWidget
        //     county={county}
        //     state={state}
        // >
        // </CountyHospitalsWidget >,
    ];

    return (
        <>
            <USInfoTopWidget
                county={county}
                state={state}
                metro={metro}
                selectedTab={"metro"}
            />
            <GraphSectionMetro
                metro={metro}
            />
            <MyTabs
                labels={["Nearby", "Hospitals"]}
                tabs={tabs}
            />
        </>
    );
});
export { PageMetro }
