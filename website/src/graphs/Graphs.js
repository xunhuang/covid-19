import React from 'react';
import Paper from '@material-ui/core/Paper';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import Badge from '@material-ui/core/Badge';
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import { makeStyles, withStyles } from '@material-ui/core/styles';
import { useHistory } from 'react-router-dom'
import { BasicGraphNewCases } from './GraphNewCases.js'
import { GraphDaysToDoubleOverTime } from './GraphDaysToDoubleOverTime'
import { maybeDeathProjectionTabFor } from './GraphDeathProjection.js'
import { maybeHospitalizationProjectionTabFor } from './GraphHospitalizationProjection';
import { maybeMapTabFor } from '../Map';
import { maybeRecoveryAndDeathTabFor } from './GraphRecoveryAndDeath.js'
import { maybeTestingTabFor } from './GraphTestingEffort'

const useStyles = makeStyles(theme => ({
    content: {
        margin: '0 2px 2px 2px',
    },
    location: {
        margin: '2px 0',
    },
    detailedToggles: {
        margin: '12px 0',
    },
    tabContent: {
        padding: '2px',
    }
}));

const RibbonBadge = withStyles({
    badge: {
        borderRadius: '0px',
        fontSize: '0.3rem',
        transform: 'rotate(15deg)',
        height: '10px',
        minWidth: '10px',
        right: '-15px',
    }
})(Badge);

export const GraphSection = (props) => {
    const classes = useStyles();
    const history = useHistory();
    const source = props.source;

    const tabs = new Map();

    tabs.set('glance', {
        label: "At a glance",
        content: BasicGraphNewCases,
    });

    [maybeDeathProjectionTabFor, maybeHospitalizationProjectionTabFor]
        .map(factory => factory(source))
        .filter(tab => tab)
        .forEach(tab =>
            tabs.set(tab.id, {
                label: tab.label,
                content: tab.graph,
                showRibbon: true,  // TO SHOW THE RIBBON ADD A LINE LIKE THIS
            }));

    tabs.set('days2x', {
        label: "Doubling",
        content: GraphDaysToDoubleOverTime,
    });

    const maybeMap = maybeMapTabFor(source);
    if (maybeMap) {
        tabs.set(maybeMap.id, {
            label: maybeMap.label,
            content: maybeMap.content,
        });
    }

    tabs.set('detailed', {
        label: "Detailed",
        content: DetailedGraphs,
    });

    const headings = [...tabs.keys()];
    const [viewing, setViewing] =
        React.useState(getOrDefaultFrom(history, 'tab', headings));
    const switchTo = (e, index) => {
        const desire = headings[index];
        setViewing(desire);
        pushChangeTo(history, 'tab', desire);
    };
    const TabContent = tabs.get(viewing).content;

    return (
        <div className={classes.content}>
            {/* <Typography variant="h6" className={classes.location}>
                {source.longName}
            </Typography> */}
            <Tabs
                value={headings.indexOf(viewing)}
                onChange={switchTo}
                variant="scrollable"
                scrollButtons="auto">
                {[...tabs.values()].map(tab => {
                    const label = tab.showRibbon ? <RibbonBadge badgeContent='New' color="error">{tab.label}</RibbonBadge> : tab.label;
                    return <Tab label={label} key={tab.label} />;
                })}
            </Tabs>
            <Paper className={classes.tabContent}>
                <TabContent source={source} />
            </Paper>
        </div>
    );
};

const DetailedGraphs = (props) => {
    const classes = useStyles();
    const history = useHistory();
    const source = props.source;

    const graphs = new Map([
        maybeRecoveryAndDeathTabFor,
        maybeTestingTabFor,
    ].map(factory => {
        return factory(source);
    }).filter(desc => {
        return desc !== undefined;
    }).map(desc => [desc.label, desc]));

    const [viewing, setViewing] =
        React.useState(
            getOrDefaultFrom(history, 'detailed', [...graphs.keys()]));
    const switchTo = (e, desire) => {
        // Having a strange problem where if only one ToggleButton desire is
        // null
        if (!desire) {
            return;
        }
        setViewing(desire);
        pushChangeTo(history, 'detailed', desire);
    };
    const Graph = graphs.get(viewing).graph;

    return (
        <div>
            <ToggleButtonGroup
                className={classes.detailedToggles}
                exclusive
                onChange={switchTo}
                value={viewing}
                aria-label="Detailed graph"
                size="small">
                {[...graphs.keys()].map(label =>
                    <ToggleButton
                        key={label}
                        value={label}
                        aria-label={label}
                        size="small">
                        {label}
                    </ToggleButton>
                )}
            </ToggleButtonGroup>
            <Graph source={source} />
        </div>
    );
};

function getOrDefaultFrom(history, key, all) {
    const params = new URLSearchParams(history.location.search);
    if (params.has(key)) {
        const desire = params.get(key);
        if (all.includes(desire)) {
            return desire;
        }
    }

    return all[0];
}

function pushChangeTo(history, key, value) {
    const params = new URLSearchParams(history.location.search);
    params.set(key, value);
    history.location.search = params.toString();
    history.push(history.location)
}
