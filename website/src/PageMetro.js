import React, { useContext } from 'react';
import { CountryContext } from "./CountryContext";
import { ListCountiesForMetro } from "./CountyListRender.js"
import { withHeader } from "./Header.js"
import { MyTabs } from "./MyTabs.js"
import { USInfoTopWidget } from './USInfoTopWidget.js'
import * as Util from "./Util"
import { GraphSection } from "./graphs/Graphs"

const PageMetro = withHeader((props) => {
    const country = useContext(CountryContext);
    const metro = country.metroForId(props.match.params.metro);
    const county = Util.getDefaultCountyForMetro(metro);

    const tabs = [
        <ListCountiesForMetro metro={metro} />,
    ];


    return (
        <>
            <USInfoTopWidget
                county={county}
                metro={metro}
                state={county.state()}
                country={country}
                selectedTab={"metro"}
            />
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
