import React from 'react';
import moment from 'moment';
import { makeStyles } from '@material-ui/core/styles';
import * as USCounty from "./USCountyInfo.js";
import { myShortNumber } from "./Util.js";
import { withRouter } from 'react-router-dom'
import { lookupCountyInfo } from "./USCountyInfo.js";
import { Typography } from '@material-ui/core';
import { Link } from 'react-router-dom';
import { reverse } from 'named-urls';
import routes from "./Routes.js";
import { useScrollPosition } from '@n8tb1t/use-scroll-position';
import { isMobile } from 'react-device-detect';

const states = require('us-state-codes');

const useStyles = makeStyles(theme => ({
    tagSticky: {
        backgroundColor: "#FFFFFF",
        position: "sticky",
        top: 0,
        left: 0,
        zIndex: "1",
    },
    tagContainer: {
        padding: theme.spacing(1, 1),
        justifyContent: "space-between",
        display: "flex",
        flexWrap: "wrap",
    },
    row: {
        padding: theme.spacing(1, 1),
        justifyContent: "space-between",
        display: "flex",
    },
    rowNoBeds: {
        justifyContent: "center",
    },
    tag: {
        display: "flex",
        justifyContent: "space-between",
        flexDirection: "column",
        textAlign: "center",
        backgroundColor: "#f3f3f3",
        borderRadius: 10,
        flexGrow: "1",
        margin: 3,
        color: "black",
        textDecoration: "none",
    },
    tagSelected: {
        color: "#FFFFFF",
        backgroundColor: "#00aeef",
    },
    tagTitle: {
        marginTop: 5,
    },
    tagSection: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        alignContent: "flex-end",
    },
    topTag: {
        fontSize: "0.5rem",
    },
    smallTag: {
        fontSize: "0.5rem",
    },
    mainTag: {
        fontSize: "1.0rem",
    },
    grow: {
        flexGrow: 1,
    },
    table: {
        width: "100%"
    },
    timestamp: {
        // fontWeight: "bold",
        padding: theme.spacing(0, 1),
        textAlign: "left",
    },
}));

const USInfoTopWidget = withRouter((props) => {
    const [showBeds, setShowBedsOnScroll] = React.useState(true)
    const [showDeaths, setShowDeaths] = React.useState(true)
    const [showRecovered, setShowRecovered] = React.useState(true)
    if (isMobile) {
        useScrollPosition(({ prevPos, currPos }) => {
            const isShow = currPos.y > -100;
            if (isShow !== showBeds) {
                setShowBedsOnScroll(isShow)
                setShowDeaths(isShow)
                setShowRecovered(isShow)
            }
        }, [showBeds, showDeaths, showRecovered]);
    }

    const classes = useStyles();
    const state = props.state ? props.state : "CA";
    const county = props.county ? props.county : USCounty.countyDataForState(state)[0].County;

    let state_title = showBeds ? states.getStateNameByStateCode(state) : state;
    let county_title = county;
    let US_title = "US";

    let countyInfo = lookupCountyInfo(state, county);
    if (!countyInfo) {
        countyInfo = {
            HospitalBeds: "N/A",
            Hospitals: "N/A",
        }
    }
    if (county === "New York City" || county === "New York") {
        countyInfo = {
            HospitalBeds: 23639,
            Hospitals: 58,
        }
    }

    let state_summary = USCounty.casesForStateSummary(state);
    let county_summary = USCounty.casesForCountySummary(state, county);
    let us_summary = USCounty.casesForUSSummary();
    let state_hospitals = USCounty.hospitalsForState(state);
    const metro = props.metro;
    let metro_info = USCounty.getMetro(metro);

    return <div className={classes.tagSticky} >
        <div className={classes.tagContainer} >
            <Tag
                title={county_title}
                confirmed={county_summary.confirmed}
                newcases={county_summary.newcases}
                hospitals={countyInfo.Hospitals}
                beds={countyInfo.HospitalBeds}
                selected={props.selectedTab === "county"}
                to={reverse(routes.county, { state, county })}
                showBeds={showBeds}
            />
            {metro &&
                <Tag
                    title={metro_info.Name}
                    confirmed={metro_info.Summary.LastConfirmed}
                    newcases={metro_info.Summary.LastConfirmedNew}
                    selected={props.selectedTab === "metro"}
                    to={reverse(routes.metro, { metro })}
                    /* hardcoded to bay area */
                    hospitals={69}
                    beds={16408}
                    showBeds={showBeds}
                />
            }
            <Tag title={state_title}
                confirmed={state_summary.confirmed}
                newcases={state_summary.newcases}
                deaths={state_summary.death}
                deathsNew={state_summary.deathNew}
                recovered={state_summary.lastRecovered}
                recoveredNew={state_summary.lastRecoveredNew}
                hospitals={state_hospitals.hospitals}
                beds={state_hospitals.beds}
                selected={props.selectedTab === "state"}
                to={reverse(routes.state, { state })}
                showBeds={showBeds}
                // showRecovered={showRecovered}
                // showDeaths={showDeaths}
                showRecovered={false}
                showDeaths={false}
            />
            <Tag
                title={US_title}
                confirmed={us_summary.confirmed}
                newcases={us_summary.newcases}
                deaths={us_summary.deaths}
                deathsNew={us_summary.deathsNew}
                recovered={us_summary.recovered}
                recoveredNew={us_summary.recoveredNew}
                hospitals={6146}
                beds={924107}
                selected={props.selectedTab === "usa"}
                to={routes.united_states}
                showBeds={showBeds}
                showRecovered={showRecovered}
                showDeaths={showDeaths}
            />
        </div>
        <div className={classes.timestamp}>
            <Typography variant="body2" >
                Updated: {moment(us_summary.generatedTime).format('lll')}
            </Typography>
        </div>
    </div >;
});

const Tag = (props) => {
    const classes = useStyles();
    return <Link className={`${classes.tag} ${props.selected ? classes.tagSelected : ''}`} to={props.to}>
        <div className={classes.tagTitle}> {props.title} </div>
        <div className={`${classes.row} ${props.showBeds ? '' : classes.rowNoBeds}`} >
            <section className={classes.tagSection}>
                <div className={classes.topTag}>
                    +{myShortNumber(props.newcases)}
                </div>
                <div className={classes.mainTag}>
                    {myShortNumber(props.confirmed)} </div>
                <div className={classes.smallTag}>
                    Confirmed </div>
            </section>

            {props.showRecovered &&
                <section className={classes.tagSection}>
                    <Typography className={classes.topTag} variant="body2" noWrap >
                        +{myShortNumber(props.recoveredNew)}
                    </Typography>
                    <div className={classes.mainTag}>
                        {myShortNumber(props.recovered)}</div>
                    <div className={classes.smallTag}>
                        Recovered
                    </div>
                </section>
            }

            {props.showDeaths &&
                <section className={classes.tagSection}>
                    <Typography className={classes.topTag} variant="body2" noWrap >
                        +{myShortNumber(props.deathsNew)}
                    </Typography>
                    <div className={classes.mainTag}>
                        {myShortNumber(props.deaths)}</div>
                    <div className={classes.smallTag}>
                        Deaths
                    </div>
                </section>
            }

            {props.showBeds && <section className={classes.tagSection}>
                <Typography className={classes.topTag} variant="body2" noWrap >
                    {myShortNumber(props.hospitals)} Hosp.
          </Typography>
                <div className={classes.mainTag}>
                    {myShortNumber(props.beds)}</div>
                <div className={classes.smallTag}>
                    Beds
                    </div>
            </section>}
        </div>
    </Link>;
};


export { USInfoTopWidget, Tag }
