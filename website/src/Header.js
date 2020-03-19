import React from 'react';
import * as USCounty from "./USCountyInfo.js";
import { DataCreditWidget } from "./DataCredit.js"
import Select from 'react-select';

function browseTo(history, state, county) {
    history.push(
        "/county/" + encodeURIComponent(state) + "/" + encodeURIComponent(county),
        history.search,
    );
}

const SearchBox = (props) => {

    let summary = USCounty.getCountySummary(props.casesData);
    let counties = summary.sort((a, b) => b.total - a.total)
        .map(c => {
            return {
                label: `${c.county} , ${c.state_name} (${c.total})`,
                value: c,
            };
        });
    return <Select
        className="basic-single"
        classNamePrefix="select"
        defaultValue={""}
        placeholder={"Search for a County"}
        isDisabled={false}
        isLoading={false}
        isClearable={true}
        isRtl={false}
        isSearchable={true}
        name="county_selection"
        options={counties}
        onChange={param => {
            console.log(param);
            if (props.callback) {
                props.callback(param.value.county, param.value.state_name);
            }

        }}
    />;
}

const withHeader = (comp, props) => {
    return (props) => {
        let casesData = USCounty.casesForUS();
        let header = <header className="App-header">
            <h2>COVID-19.direct: US Counties</h2>
            <SearchBox
                casesData={casesData}
                callback={(newcounty, newstate) => {
                    browseTo(props.history, newstate, newcounty);
                }}
            />
        </header>

        let footer = <DataCreditWidget />;

        let component = comp({
            // add addition things here
            ...props,
        });
        return (
            <div>
                {header}
                {component}
                {footer}
            </div >);
    }
};


export { withHeader }
