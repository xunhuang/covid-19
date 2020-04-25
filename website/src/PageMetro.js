import React, { useContext } from 'react';
import { CountryContext } from "./CountryContext";
import { ListCountiesForMetro } from "./CountyListRender.js"
import { withHeader } from "./Header.js"
import { MyTabs } from "./MyTabs.js"
import { USInfoTopWidget } from './USInfoTopWidget.js'
import { getDefaultCounty } from "./Util"
import { GraphSection } from "./graphs/Graphs"
import { Title } from "./Title";

const PageMetro = withHeader((props) => {
    const country = useContext(CountryContext);
    const metroByStates = country.metroByStatesForId(props.match.params.metro);

    // The metro may span multiple states, so we have to see if the user's
    // preferred county is a county in the metro and then figure out which metro
    // object corresponds to the right state. Everything is awesome.
    const def = getDefaultCounty();
    // All the metro objects have all the counties, even if those counties are
    // across state lines.
    const any = metroByStates.values().next().value;
    let county;
    for (const candidate of any.allCounties()) {
        if (def.county === candidate.name
                && def.state === candidate.state().twoLetterName) {
            county = candidate;
            break;
        }
    }

    // Can't find the preferred county, just pick the best one.
    if (!county) {
        county =
            any
                .allCounties()
                .sort((a, b) => b.totalConfirmed() - a.totalConfirmed())[0];
    }

    const metro = county.metro();
    const state = metro.state();

    const tabs = [
        <ListCountiesForMetro metro={metro} />,
    ];

    return (
        <>
            <Title
                title={`${metro.name}, ${state.twoLetterName}`}
                desc={`${metro.name} COVID-19 30-day data visualized: `
                          + `confirmed cases, new cases & death curves, `
                          + `testing results & hospitalization numbers.`}
            />
            <USInfoTopWidget source={county} />
            <GraphSection source={metro} />
            <MyTabs
                labels={[metro.name]}
                urlQueryKey="table"
                urlQueryValues={['cases']}
                tabs={tabs}
            />
        </>
    );
});
export { PageMetro }
