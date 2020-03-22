import React from 'react';
import * as USCounty from "./USCountyInfo.js";
import Select from 'react-select';
import Disqus from "disqus-react"
import Typography from '@material-ui/core/Typography'

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
        styles={{
            menu: provided => ({ ...provided, zIndex: 9999 })
        }}
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

    const disqusShortname = "covid19direct";
    const disqusConfig = {
        url: "https://covid-19.direct",
        identifier: "article-id",
        title: "main page"
    };

    return (props) => {
        let casesData = USCounty.casesForUS();

        let component = comp({
            // add addition things here
            ...props,
        });

        let footer = <div>
            <Typography variant="h5" noWrap>
                Discussions
                    </Typography>
            <Disqus.DiscussionEmbed
                shortname={disqusShortname}
                config={disqusConfig}
            />
        </div>;

        let header = <header className="App-header">
            <Typography variant="h5" >
                COVID-19.direct
                    </Typography>
            <SearchBox
                casesData={casesData}
                callback={(newcounty, newstate) => {
                    browseTo(props.history, newstate, newcounty);
                }}
            />
            {component}
            {footer}
        </header>

        return header;
    }
};


export { withHeader }
