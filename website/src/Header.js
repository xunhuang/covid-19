import React from 'react';
import * as USCounty from "./USCountyInfo.js";
import Select from 'react-select';
import Disqus from "disqus-react"
import Typography from '@material-ui/core/Typography'
import { makeStyles } from '@material-ui/core/styles';
import { FacebookProvider, CommentsCount } from 'react-facebook';
import routes from './Routes';
import { reverse } from 'named-urls';
import { useHistory } from "react-router-dom";
import { MyTabs } from "./MyTabs.js"
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import { Link as MaterialLink } from '@material-ui/core';
import ListItemText from '@material-ui/core/ListItemText';

const MentalHealthResources = require("./data/mentalhealth.json");
const moment = require("moment");

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

const ResourceSectionOne = (props) => {
    return <List>
        {props.tab.map(item =>
            <ListItem>
                <MaterialLink href={item.Url}>
                    <ListItemText
                        primary={item.Title}
                    // secondary={secondary ? 'Secondary text' : null}
                    >
                    </ListItemText>
                </MaterialLink>
            </ListItem>
        )}
    </List>;

};

const ResourceSection = (props) => {
    const resmap = MentalHealthResources.reduce((m, item) => {
        let section = m[item.Tab];
        if (!section) {
            section = [];
        }
        section.push(item);
        m[item.Tab] = section;
        return m;
    }, {})
    const tablist = [
        <ResourceSectionOne tab={resmap[1]} />,
        <ResourceSectionOne tab={resmap[2]} />,
        <ResourceSectionOne tab={resmap[3]} />,
        <ResourceSectionOne tab={resmap[4]} />,
    ]
    let tabs = <MyTabs
        labels={["Meditation", `Stress Mgmt`, `Education`, "Kido Talks"]}
        tabs={tablist}
    />;
    return tabs;
};

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
    const history = useHistory();
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
            if (param && param.value) {
                let route;
                if (param.value.county) {
                    route = reverse(
                        routes.county,
                        { county: param.value.county, state: param.value.state });
                } else {
                    route = reverse(routes.state, { state: param.value.state });
                }
                history.push(route);
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
            {false && <ResourceSection />}
            <Typography variant="h5" noWrap>
                Discussions
                    </Typography>
            <Disqus.DiscussionEmbed
                shortname={disqusShortname}
                config={disqusConfig}
            />
        </div>;
        let fbcomment =
            <FacebookProvider appId="201788627783795">
                <CommentsCount href="http://www.facebook.com" />
            </FacebookProvider>;

        let us_summary = USCounty.casesForUSSummary();

        let header = <header className="App-header">
            <div className={classes.topContainer}>
                <span className={classes.title}>
                    <Typography variant="h6" >
                        COVID-19.direct
            </Typography>
                    <Typography variant="body2" >
                        Updated: {moment(us_summary.generatedTime).format('lll')}
                    </Typography>
                </span>
                <span className={classes.grow}></span>
                {/* <span className={classes.keepclam}> Keep Clam, #StayHome</span> */}
                <span className={classes.title}>
                    <Typography variant="body1" >
                        #StayHome #StayInformed
            </Typography>
                </span>
            </div>
            <SearchBox />
            <div className={classes.qpContainer}>
                <Typography variant="body1" >
                    Some problem with new number calculation. Total is correct but New is not.
                    investigating.
            </Typography>

            </div>

            {component}
            {footer}
            {fbcomment}
        </header >

        return header;
    }
};


export { withHeader }
