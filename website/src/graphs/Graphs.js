import React from 'react';
import { MyTabs } from "../MyTabs.js"
import { daysToDoubleTab } from './GraphDaysToDoubleOverTime'
import { maybeDeathProjectionTabFor } from './GraphDeathProjection.js'
import { maybeHospitalizationProjectionTabFor } from './GraphHospitalizationProjection';
import { maybeMapTabFor } from '../Map';
import { maybeRecoveryAndDeathTabFor } from './GraphRecoveryAndDeath.js'
import { maybeTestingTabFor } from './GraphTestingEffort'
import { newCasesTab } from './GraphNewCases.js'

export const GraphSection = (props) => {
    const source = props.source;

    const graphs = [
        newCasesTab,
        daysToDoubleTab,
        maybeDeathProjectionTabFor,
        maybeHospitalizationProjectionTabFor,
        maybeRecoveryAndDeathTabFor,
        maybeMapTabFor,
        maybeTestingTabFor,
    ].map(factory => {
        return factory(source);
    }).filter(config => config);

    return <MyTabs
        labels={graphs.map(desc => desc.label)}
        urlQueryKey='graph'
        urlQueryValues={graphs.map(desc => desc.id)}
        tabs={graphs.map(desc => {
            const Graph = desc.graph;
            return <Graph key={desc.id} source={source} />;
        })}
    />;
    //let graphlistSection = <MyTabs
    //    labels={['Cases',
    //        'Days to 2x',
    //        'Peak Death',
    //        // 'Peak Hospitalization',
    //        'Recovery',
    //        'Map',
    //        'Tests',
    //        'Hospitalization',
    //    ]}
    //    urlQueryKey='graph'
    //    urlQueryValues={['cases', 'days2x', 'peakdeath',
    //        // 'peakhospital', 
    //        'recovery', 'map', 'testing', 'hospitalization']}
    //    tabs={tabs}
    //    history={props.history}
    ///>;
  //
    //let graphlistSection = <MyTabs
    //    labels={["Cases", "Days to 2x",
    //        `${county.state().name} Testing`]}
    //    urlQueryKey="graph"
    //    urlQueryValues={['cases', 'days2x', 'testing']}
    //    tabs={tabs}
    //    history={props.history}
    ///>;
  //
    //let graphlistSection = <MyTabs
    //    labels={["Cases", "Peak Death",
    //        // "Peak Hospitalization", 
    //        "Recovery", "Days to 2x", "Tests", "Hospitalization"]}
    //    urlQueryKey="graph"
    //    urlQueryValues={['cases', "peakdeath",
    //        // "peakhospital", 
    //        'recovery_death', "days2x", 'testing', 'hospitalization']}
    //    tabs={tabs}
    //    history={props.history}
    ///>;
};

