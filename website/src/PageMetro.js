import React, { useContext } from 'react';
import { withRouter } from 'react-router-dom'
import { CountryContext } from "./CountryContext";
import { ListCountiesForMetro } from "./CountyListRender.js"
import { BasicGraphNewCases } from "./GraphNewCases.js"
import { withHeader } from "./Header.js"
import { MyTabs } from "./MyTabs.js"
import { USInfoTopWidget, MetroSummarySection } from './USInfoTopWidget.js'
import * as Util from "./Util"
import { GraphDaysToDoubleOverTime } from "./GraphDaysToDoubleOverTime"

const GraphSectionMetro = withRouter((props) => {
    const tabs = [
        <BasicGraphNewCases
            data={props.metro.dataPoints()}
            logScale={false}
        />,
        <GraphDaysToDoubleOverTime data={props.metro.daysToDoubleTimeSeries()} />
    ]
    let graphlistSection = <MyTabs
        labels={["Cases", "Days to 2x"]}
        urlQueryKey="graph"
        urlQueryValues={['cases', 'days2x']}
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
