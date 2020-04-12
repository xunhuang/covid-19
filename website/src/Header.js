import React, { useContext } from 'react';
import { CountryContext } from "./CountryContext";
import Select from 'react-select';
import Disqus from "disqus-react"
import Typography from '@material-ui/core/Typography'
import { makeStyles } from '@material-ui/core/styles';
import { FacebookProvider, CommentsCount } from 'react-facebook';
import { useHistory } from "react-router-dom";
import { MyTabs } from "./MyTabs.js"
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import { Link as MaterialLink } from '@material-ui/core';
import ListItemText from '@material-ui/core/ListItemText';
import { Grid } from '@material-ui/core';
import { SectionHeader } from "./CovidUI"
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import { withRouter } from 'react-router-dom'
import Avatar from '@material-ui/core/Avatar';
import Link from '@material-ui/core/Link';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import {
    EmailShareButton,
    FacebookShareButton,
    PinterestShareButton,
    TwitterShareButton,
    RedditShareButton,
    EmailIcon,
    RedditIcon,
    FacebookIcon,
    PinterestIcon,
    TwitterIcon,
} from "react-share";

const Cookies = require("js-cookie");
const MentalHealthResources = require("./data/mentalhealth.json");
const moment = require("moment");

const useStyles = makeStyles(theme => ({
    SocialMediaRow: {
        display: 'flex',
        alignItems: 'baseline',
        padding: 5,
    },
    topContainer: {
        display: 'flex',
        alignItems: 'baseline',
    },
    title: {
        display: 'block',
        padding: 2,
        paddingRight: 10,
        margin: 2,
    },
    tagline: {
        display: 'block',
        padding: 0,
        paddingTop: 10,
        paddingRight: 10,
        margin: 0,
        alignSelf: "flex-start",
    },
    keepclam: {
        display: 'block',
        color: '#FFFFFF',
        background: '#00aeef',
        borderRadius: 0,
        padding: 2,
        margin: 2,
    },
    searchContainer: {
        paddingLeft: 10,
        paddingRight: 10,
    },
    qpContainer: {
        display: 'none',
        background: '#e3e3e3',
        borderWidth: "1px",
        padding: 15,
        margin: 15,
    },
    qpBox: {
        display: 'flex',
        justifyContent: "space-between",
        width: "100%",
    },
    grow: {
        flex: 1,
    },
    supportUs: {
        padding: 2,
        margin: 2,
    },
    buyUsACoffee: {
        padding: 2,
        margin: 2,
        background: '#00aeef',
        borderRadius: 15,
        justifyContent: "center",
        display: "flex",
        color: "white",
    },
    inline: {
        display: 'inline',
        // fontWeight: "fontWeightBold",
    },
}));

const ResourceSectionOne = (props) => {
    const classes = useStyles();
    return <List>
        {props.tab.map(item =>
            <ListItem onClick={() => { window.open(item.Url) }} >
                <ListItemAvatar>
                    <Avatar variant="rounded" src={item.ThumbnailURL} />
                </ListItemAvatar>
                <ListItemText
                    primary={item.Title}
                    secondary={
                        <React.Fragment>
                            <Typography
                                component="span"
                                variant="body2"
                                className={classes.inline}
                                color="textPrimary"
                            >
                                {item.Subtitle}
                            </Typography>
                        </React.Fragment>
                    }
                />
            </ListItem>
        )}
    </List >;

};

const ResourceSection = withRouter((props) => {
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
    ]
    let tabs = <MyTabs
        labels={["Meditation", `Stress Mgmt`, `Education/Kids`]}
        urlQueryKey="resources"
        urlQueryValues={['medication', 'stressmgmt', 'kids']}
        tabs={tablist}
        history={props.history}
    />;
    return tabs;
});

const SearchBox = (props) => {
    const country = useContext(CountryContext);
    const counties =
        country.allStates().flatMap(s => s.allCounties()).map(county => {
            return {
                display_name: `${county.name}, ${county.state().name}`,
                county: county,
                total: county.totalConfirmed(),
            };
        });
    const states = country.allStates().map(
        state => {
            return {
                display_name: `${state.name} (${state.twoLetterName})`,
                state: state,
                total: state.totalConfirmed() + state.newCases(),
            }
        });
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
                    route = param.value.county.routeTo();
                } else {
                    route = param.value.state.routeTo();
                }
                history.push(route);
            }
        }}
    />;
}
const DonateButton = (props) => {
    const classes = useStyles();
    const donationPageUrl = "https://ko-fi.com/covid19direct";
    return (
        <Typography noWrap variant="body2" className={classes.buyUsACoffee}>
            <MaterialLink target="_blank" href={donationPageUrl} className={classes.buyUsACoffee}>
                Buy Us A Coffee
            </MaterialLink>
        </Typography>);
}

const SocialMediaButtons = (props) => {
    const classes = useStyles();

    return (
        <div className={classes.SocialMediaRow}>
            {[
                [FacebookShareButton, FacebookIcon],
                [TwitterShareButton, TwitterIcon],
                [RedditShareButton, RedditIcon],
                [PinterestShareButton, PinterestIcon],
                [EmailShareButton, EmailIcon],
            ].map(([Button, Icon]) => (
                <Button url={props.url} quote={props.quote}>
                  <Icon size={32} round={true} />
                </Button>
            ))}
        </div>
    );
}

const quote = "Best real-time county-level COVID-19 dashboard. Get the latest trends about cases, recovery, testing and hospitalization as well as resources for mental health and well-being.";

const Banner = withRouter((props) => {
    const classes = useStyles();
    const country = useContext(CountryContext);
    let us_summary = country.summary();
    let url_shared =
        "https://covid-19.direct" +
        props.match.url +
        props.history.location.search;
    return (
        <div className={classes.topContainer}>
            <span className={classes.title}>
                <Typography variant="h6" >
                    COVID-19.direct
            </Typography>
                <SocialMediaButtons
                    url={url_shared}
                    quote={quote}
                />
                <Typography variant="body2" noWrap>
                    Updated: {moment(us_summary.generatedTime).format('lll')}
                </Typography>
            </span>
            <span className={classes.grow}></span>
            {/* <span className={classes.keepclam}> Keep Clam, #StayHome</span> */}
            <span className={classes.tagline}>
                <Typography variant="body1" >
                    {/* #StayHome #StayInformed */}
                        this too shall pass
            </Typography>
                <DonateButton />
            </span>
        </div >);
});

const QPArea = (props) => {
    const QPID = "qpid_metro3";
    const classes = useStyles();
    const [open, setOpen] = React.useState(Cookies.get(QPID) === undefined);

    const handleClose = (qpid) => {
        Cookies.set(qpid, 1, 10000);
        setOpen(false);
    }

    if (!open) {
        return null;
    }

    return <div className={classes.qpContainer}>
        <div className={classes.qpBox} >
            <div>
                We added NYC and Bay Area as a "Metro" area with multiple counties. What new metro areas
                should we include?
                    <Link href="#discussion">
                    Make a suggestion here.
                    </Link>
            </div>
            <IconButton size="small" aria-label="close" color="inherit" onClick={() => { handleClose(QPID) }}>
                <CloseIcon fontSize="small" />
            </IconButton>
        </div>
    </div>
}

const withHeader = (comp, props) => {

    const disqusShortname = "covid19direct";
    const disqusConfig = {
        url: "https://covid-19.direct",
        identifier: "article-id",
        title: "main page"
    };
    const donationPageUrl = "https://www.gofundme.com/f/covid19direct-operating-cost";

    return (props) => {
        const classes = useStyles();
        let component = comp({
            // add addition things here
            ...props,
        });
        let footer = <div>
            <SectionHeader>
                <Typography variant="h5" noWrap>
                    Resources
                    </Typography>
            </SectionHeader>
            <ResourceSection />
            <SectionHeader id="discussion">
                <Grid container alignItems="center" justifyContent="center">
                    <Grid item>
                        <Typography variant="h5" noWrap id="discussion">
                            Discussions
                    </Typography>
                    </Grid>
                    <Grid xs />
                    <Grid item>
                        <Typography noWrap variant="body2" className={classes.supportUs}>
                            <MaterialLink target="_blank" href={donationPageUrl}>
                                Like our site? Support us!
                        </MaterialLink>
                        </Typography>
                    </Grid>
                </Grid>
            </SectionHeader>
            <Disqus.DiscussionEmbed
                shortname={disqusShortname}
                config={disqusConfig}
            />
        </div>;
        let fbcomment =
            <FacebookProvider appId="201788627783795">
                <CommentsCount href="http://www.facebook.com" />
            </FacebookProvider>;


        let header = <header className="App-header">
            <Banner history={props.history}></Banner>
            <QPArea />
            <div className={classes.searchContainer}>
                <SearchBox />
            </div>

            {component}
            {footer}
            {fbcomment}
        </header >

        return header;
    }
};


export { withHeader }
