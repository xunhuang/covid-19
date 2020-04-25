import React, { useContext } from 'react';
import { CountryContext } from "./CountryContext";
import * as Util from "./Util"
import { withHeader } from "./Header.js"
import { MyTabs } from "./MyTabs.js"
import { USInfoTopWidget } from './USInfoTopWidget.js'
import { CountiesForStateWidget, ListStateCountiesCapita } from "./CountyListRender.js"
import { GraphSection } from './graphs/Graphs';
import { Title } from './Title';

const PageState = withHeader((props) => {
    const country = useContext(CountryContext);
    const state = country.stateForTwoLetterName(props.match.params.state);
    const county = Util.getDefaultCountyForState(state);

    Util.CookieSetLastCounty(state.twoLetterName, county ? county.name : null);

    const tabs = [
        <CountiesForStateWidget state={state} />,
        <ListStateCountiesCapita state={state} />,
    ];

    return (
        <>
            <Title
                title={`${state.name}`}
                desc={`${state.name} COVID-19 30-day data visualized: `
                          + `confirmed cases, new cases & death curves, `
                          + `testing results & hospitalization numbers.`}
            />
            <USInfoTopWidget source={county || state} />
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
