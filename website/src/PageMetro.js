import React, { useContext } from 'react';
import { CountryContext } from "./CountryContext";
import { ListCountiesForMetro } from "./CountyListRender.js"
import { withHeader } from "./Header.js"
import { MyTabs } from "./MyTabs.js"
import { USInfoTopWidget } from './USInfoTopWidget.js'
import * as Util from "./Util"
import { GraphSection } from "./graphs/Graphs"
import { Title } from "./Title";

const PageMetro = withHeader((props) => {
    const country = useContext(CountryContext);
    const metro = country.metroForId(props.match.params.metro);
    const state = metro.state();
    const county = Util.getDefaultCountyForMetro(metro);

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
            <USInfoTopWidget county={county} selectedTab={"metro"} />
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
