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
    ]
    let graphlistSection = <MyTabs
        labels={["Cases"]}
        urlQueryKey="graph"
        urlQueryValues={['cases']}
        tabs={tabs}
        history={props.history}
    />;
    return graphlistSection;
});

const PageMetro = withHeader((props) => {
    const metro = props.match.params.metro;
    let county = Util.getDefaultCountyForMetro(metro);
    let metro_info = USCounty.getMetro(metro);
    const state = metro_info.StateName;
    console.log(metro_info);

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
                labels={[metro_info.Name]}
                urlQueryKey="table"
                urlQueryValues={['cases']}
                tabs={tabs}
                history={props.history}
            />
        </>
    );
});
export { PageMetro }
