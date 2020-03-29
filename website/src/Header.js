import React from 'react';
import * as USCounty from "./USCountyInfo.js";
import Select from 'react-select';
import Disqus from "disqus-react"
import Typography from '@material-ui/core/Typography'
import { makeStyles } from '@material-ui/core/styles';

function browseTo(history, state, county) {
    history.push(
        county == null ?
            "/state/" + encodeURIComponent(state) :
            "/county/" + encodeURIComponent(state) + "/" + encodeURIComponent(county),
        history.search,
    );
}

const useStyles = makeStyles(theme => ({
    topContainer: {
        display: 'flex',
        alignItems: 'baseline',
    },
    title: {
        display: 'block',
        padding: 2,
        margin: 2,
    },
    keepclam: {
        display: 'block',
        color: '#FFFFFF',
        background: '#00aeef',
        borderRadius: 0,
        padding: 2,
        margin: 2,
    },
    qpContainer: {
        display: 'none',
        // color: '#FFFFFF',
        background: '#e3e3e3',
        borderWidth: "1px",
        padding: 15,
        margin: 15,
        // borderRadius: 20,
    },
    grow: {
        flex: 1,
    }
}));

const SearchBox = (props) => {
    const counties = USCounty.getCountySummary1().map(
        county => {
            return {
                display_name: `${county.county}, ${county.state_name}`,
                county: county.county,
                state: county.state_name,
                total: county.total,
            }
        }
    );
    const states = USCounty.getAllStatesSummary().map(
        state => {
            return {
                display_name: `${state.full_name} (${state.state})`,
                county: null,
                state: state.state,
                total: state.confirmed + state.newcases
            }
        }
    );
    const search_list = counties.concat(states)
    let search_list_sorted = search_list.sort((a, b) => {
        let x = a.total;
        let y = b.total;
        if (!x) x = 0;
        if (!y) y = 0;

        return y - x;
    });
    let search_list_final = search_list_sorted
        .map(c => {
            return {
                label: `${c.display_name} (${c.total})`,
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
        placeholder={"Search for a County or a State"}
        isDisabled={false}
        isLoading={false}
        isClearable={true}
        isRtl={false}
        isSearchable={true}
        name="county_or_state_selection"
        options={search_list_final}
        onChange={param => {
            if (props.callback) {
                if (param && param.value) {
                    props.callback(param.value.county, param.value.state);
                }
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
        const classes = useStyles();
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
            <div className={classes.topContainer}>
                <span className={classes.title}>
                    <Typography variant="h6" >
                        COVID-19.direct
            </Typography>
                </span>
                <span className={classes.grow}></span>
                {/* <span className={classes.keepclam}> Keep Clam, #StayHome</span> */}
                <span className={classes.title}>
                    <Typography variant="body2" >
                        #StayHome #StayInformed
            </Typography>
                </span>
            </div>
            <SearchBox
                callback={(newcounty, newstate) => {
                    browseTo(props.history, newstate, newcounty);
                }}
            />
            <div className={classes.qpContainer}>
                <Typography variant="body1" >
                    Some problem with new number calculation. Total is correct but New is not.
                    investigating.
            </Typography>

            </div>

            {component}
            {footer}
        </header >

        return header;
    }
};


export { withHeader }
