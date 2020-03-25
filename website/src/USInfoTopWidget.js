import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import * as USCounty from "./USCountyInfo.js";
import { myShortNumber } from "./Util.js";
import { withRouter } from 'react-router-dom'
import { lookupCountyInfo } from "./USCountyInfo.js";
import { Typography } from '@material-ui/core';
import * as Util from "./Util.js";

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
    tag: {
        display: "inline-block",
        textAlign: "center",
        backgroundColor: "#f3f3f3",
        borderRadius: 10,
        flex: 1,
        margin: 3,
    },
    tagSelected: {
        display: "inline-block",
        textAlign: "center",
        color: "#FFFFFF",
        backgroundColor: "#00aeef",
        borderRadius: 10,
        flex: 1,
        margin: 3,
    },
    tagTitle: {
        marginTop: 5,
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
}));

const USInfoTopWidget = withRouter((props) => {
    const classes = useStyles();
    const state = props.state ? props.state : "CA";
    const county = props.county ? props.county : USCounty.countyDataForState(state)[0].County;

    let state_title = states.getStateNameByStateCode(state);
    let county_title = county;
    let US_title = "US";

    let countyInfo = lookupCountyInfo(state, county);
    if (!countyInfo) {
        countyInfo = {
            HospitalBeds: "N/A",
            Hospitals: "N/A",
        }
    }
    if (county === "New York City") {
        countyInfo = {
            HospitalBeds: 2397,
            Hospitals: 58,
        }
    }

    let state_summary = USCounty.casesForStateSummary(state);
    let county_summary = USCounty.casesForCountySummary(state, county);
    let us_summary = USCounty.casesForUSSummary();
    let state_hospitals = USCounty.hospitalsForState(state);

    return <div className={classes.tagSticky} >
        <div className={classes.tagContainer} >
            <Tag
                title={county_title}
                confirmed={county_summary.confirmed}
                newcases={county_summary.newcases}
                hospitals={countyInfo.Hospitals}
                beds={countyInfo.HospitalBeds}
                selected={props.selectedTab === "county"}
                callback={() => {
                    Util.browseTo(props.history, state, county);
                }}
            />
            <Tag title={state_title}
                confirmed={state_summary.confirmed}
                newcases={state_summary.newcases}
                hospitals={state_hospitals.hospitals}
                beds={state_hospitals.beds}
                selected={props.selectedTab === "state"}
                callback={() => {
                    Util.browseToState(props.history, state);
                }}
            />
            <Tag
                title={US_title}
                confirmed={us_summary.confirmed}
                newcases={us_summary.newcases}
                hospitals={6146}
                beds={924107}
                selected={props.selectedTab === "usa"}
                callback={() => {
                    Util.browseToUSPage(props.history);
                }}
            />
        </div>
    </div >;
});

const Tag = (props) => {
    const classes = useStyles();
    return <div className={props.selected ? classes.tagSelected : classes.tag}
        onClick={() => {
            if (props.callback) {
                props.callback();
            }
        }}
    >
        <div className={classes.tagTitle}> {props.title} </div>
        <div className={classes.row} >
            <section>
                <div className={classes.topTag}>
                    +{myShortNumber(props.newcases)}
                </div>
                <div className={classes.mainTag}>
                    {myShortNumber(props.confirmed)} </div>
                <div className={classes.smallTag}>
                    Confirmed </div>
            </section>
            <section>
                <Typography className={classes.topTag} variant="body2" noWrap >
                    {myShortNumber(props.beds)} Beds
          </Typography>
                <div className={classes.mainTag}>
                    {myShortNumber(props.hospitals)} </div>
                <div className={classes.smallTag}>
                    Hospitals </div>
            </section>
        </div>
    </div >;
};


export { USInfoTopWidget }
