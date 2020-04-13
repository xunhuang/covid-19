import React, { useContext } from 'react';
import { NearbyCounties } from "./CountyListRender.js"
import { withHeader } from "./Header.js"
import { MyTabs } from "./MyTabs.js"
import { CountryContext } from "./CountryContext";
import { USInfoTopWidget, CountySummarySection } from './USInfoTopWidget.js'
import { CountyHospitalsWidget } from "./Hospitals"
import * as Util from "./Util"
import { GraphSection } from './graphs/Graphs';

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
            <USInfoTopWidget
                county={county}
                metro={county.metro()}
                state={county.state()}
                country={country}
                selectedTab={"county"}
            />
            <CountySummarySection county={county} />
            <GraphSection source={county} />
            <MyTabs
                labels={["Nearby", "Hospitals"]}
                urlQueryKey="table"
                urlQueryValues={['nearby', 'hospitals']}
                tabs={tabs}
            />
        </>
    );
});
export { PageCounty }
