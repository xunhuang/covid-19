import React, { useContext } from 'react';
import { CountryContext } from "./CountryContext";
import * as Util from "./Util"
import { withHeader } from "./Header.js"
import { MyTabs } from "./MyTabs.js"
import { USInfoTopWidget } from './USInfoTopWidget.js'
import { CountiesForStateWidget, ListStateCountiesCapita } from "./CountyListRender.js"
import { Redirect } from 'react-router-dom'
import { GraphSection } from './graphs/Graphs';

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
            <GraphSection source={state} />
            <MyTabs
                labels={[`Counties of ${state.name} `, "Per Capita"]}
                urlQueryKey="table"
                urlQueryValues={['cases', 'capita']}
                tabs={tabs}
            />
        </>);
});

export { PageState }
