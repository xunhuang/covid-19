import React from 'react';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import { myShortNumber } from "./Util.js";
import { withRouter } from 'react-router-dom'
import { Typography } from '@material-ui/core';
import { Link } from 'react-router-dom';
import useMediaQuery from '@material-ui/core/useMediaQuery';

const useStyles = makeStyles(theme => ({
    tagSticky: {
        backgroundColor: "#FFFFFF",
        position: "sticky",
        top: 0,
        left: 0,
        zIndex: "1",
    },
    tagContainer: {
        padding: theme.spacing(1, 1, 0, 1),
        justifyContent: "space-between",
        display: "flex",
        flexWrap: "wrap",
        // margin: '24px 0',
    },
    tagContainerNoBeds: {
        flexWrap: "nowrap",
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
    summary_section: {
        display: "flex",
        justifyContent: "space-between",
        flexDirection: "column",
        textAlign: "center",
        backgroundColor: "#f3f3f3",
        // borderRadius: 10,
        flexGrow: "1",
        margin: 0,
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
    sectionHeader: {
        "border-left": ".1rem solid #f50057",
        margin: 3,
        padding: 3,
    }
}));


const USInfoTopWidget = (props) => {
    const classes = useStyles();
    const theme = useTheme();
    const squish = useMediaQuery(theme.breakpoints.down('xs'));

    const tags = [];
    let cursor = props.source;
    while (cursor) {
        tags.push(cursor);
        cursor = cursor.parent();
    }

    const showBeds = tags.length < 4 && !squish;

    return <div className={classes.tagSticky} >
        <div className={`${classes.tagContainer} ${showBeds ? '' : classes.tagContainerNoBeds}`}>
            {tags.map(source => 
                <Tag
                    key={source.routeTo()}
                    source={source}
                    squish={squish}
                    showBeds={showBeds}
                />
            )}
        </div>
    </div>;
};

const Tag = withRouter((props) => {
    const {source, history, match} = props;

    let title;
    if (!props.squish || !source.shortName) {
      title = source.name;
    } else {
      title = source.shortName;
    }

    const routeTo = source.routeTo();
    const selected = match.url === routeTo;
    const summary = source.summary();
    const hospitals = source.hospitals();

    const params = new URLSearchParams(history.location.search);
    const to = routeTo + "?" + params.toString();
    const classes = useStyles();
    return <Link className={`${classes.tag} ${selected ? classes.tagSelected : ''}`} to={to}>
        <div className={classes.tagTitle}> {title} </div>
        <div className={`${classes.row} ${props.showBeds ? '' : classes.rowNoBeds}`} >
            <section className={classes.tagSection}>
                <div className={classes.topTag}>
                    +{myShortNumber(summary.newcases)}
                </div>
                <div className={classes.mainTag}>
                    {myShortNumber(summary.confirmed)} </div>
                <div className={classes.smallTag}>
                    Confirmed </div>
            </section>

            {props.showBeds && <section className={classes.tagSection}>
                <Typography className={classes.topTag} variant="body2" noWrap >
                    {myShortNumber(hospitals.count)} Hosp.
                </Typography>
                <div className={classes.mainTag}>
                    {myShortNumber(hospitals.bedCount)}</div>
                <div className={classes.smallTag}>
                    Beds
                </div>
            </section>}
        </div>
    </Link>;
});

export {
    USInfoTopWidget,
    Tag,
}
