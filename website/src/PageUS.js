import React, { useContext } from 'react';
import { withRouter } from 'react-router-dom'
import { CountryContext } from "./CountryContext";
import { BasicGraphNewCases } from "./GraphNewCases.js"
import { BasicGraphRecoveryAndDeath } from "./GraphRecoveryAndDeath.js"
import { GraphUSTesting } from "./GraphTestingEffort"
import { withHeader } from "./Header.js"
import { MyTabs } from "./MyTabs.js"
import * as Util from "./Util.js"
import { USInfoTopWidget, USSummarySection } from './USInfoTopWidget.js'
import { GraphUSHospitalization } from './GraphHospitalization.js'
import {
    ListAllStates,
    ListAllStatesPerCapita,
    ListAllStatesTesting,
} from "./ListAllStates.js"

import { logger } from "./AppModule"

const GraphTabIndex = {
    "/US/Recovery": 1,
}

const GraphSectionUS = withRouter((props) => {
    const country = props.country;
    let graphdata = country.dataPoints();

    const tabs = [
        <BasicGraphNewCases data={graphdata} logScale={false} />,
        <BasicGraphRecoveryAndDeath data={graphdata} logScale={false} />,
        <GraphUSTesting />,
        <GraphUSHospitalization />,
    ]
    let graphlistSection = <MyTabs
        labels={["Cases", `Recovery & Death`, `Testing`, "Hospitalization"]}
        urlQueryKey="graph"
        urlQueryValues={['cases', 'recovery_death', 'testing', 'hospitalization']}
        tabs={tabs}
        history={props.history}
    />;
    return graphlistSection;
});

const PageUS = withHeader((props) => {
    const country = useContext(CountryContext);

    const default_county_info = Util.getDefaultCounty();
    const county =
        country
            .stateForTwoLetterName(default_county_info.state)
            .countyForName(default_county_info.county)
    logger.logEvent("PageUS");

    const tabs = [
        <ListAllStates country={country} />,
        <ListAllStatesTesting country={country} />,
        <ListAllStatesPerCapita country={country} />,
    ];
    return (
        <>
            <USInfoTopWidget county={county} selectedTab={"usa"} />
            <USSummarySection country={country} />
            <GraphSectionUS country={country} />
            <MyTabs
                labels={["States of USA", "Testing", "Capita"]}
                urlQueryKey="table"
                urlQueryValues={['cases', 'testing', 'capita']}
                tabs={tabs}
                history={props.history}
            />
        </>
    );
});

export { PageUS }
