import React, { useContext } from 'react';
import { withRouter } from 'react-router-dom'
import { CountryContext } from "./CountryContext";
import { ListCountiesForMetro } from "./CountyListRender.js"
import { BasicGraphNewCases } from "./GraphNewCases.js"
import { withHeader } from "./Header.js"
import { MyTabs } from "./MyTabs.js"
import { USInfoTopWidget, MetroSummarySection } from './USInfoTopWidget.js'
import * as Util from "./Util"

const GraphSectionMetro = withRouter((props) => {
    const tabs = [
        <BasicGraphNewCases
            data={props.metro.dataPoints()}
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
    const country = useContext(CountryContext);
    const metro = country.metroForId(props.match.params.metro);
    const county = Util.getDefaultCountyForMetro(metro);

    const tabs = [
        <ListCountiesForMetro metro={metro} />,
        // <CountyHospitalsWidget
        //     county={county}
        //     state={state}
        // >
        // </CountyHospitalsWidget >,
    ];

    return (
        <>
            <USInfoTopWidget county={county} selectedTab={"metro"} />
            <MetroSummarySection metro={metro} selectedTab={"metro"} />
            <GraphSectionMetro metro={metro} />
            <MyTabs
                labels={[metro.name]}
                urlQueryKey="table"
                urlQueryValues={['cases']}
                tabs={tabs}
                history={props.history}
            />
        </>
    );
});
export { PageMetro }
