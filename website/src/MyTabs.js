import React from 'react';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import PropTypes from 'prop-types';
import { withStyles } from "@material-ui/core/styles";

function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <Typography
            component="div"
            role="tabpanel"
            hidden={value !== index}
            id={`nav-tabpanel-${index}`}
            aria-labelledby={`nav-tab-${index}`}
            {...other}
        >
            {value === index && <Box p={1}>{children}</Box>}
        </Typography>
    );
}

TabPanel.propTypes = {
    children: PropTypes.node,
    index: PropTypes.any.isRequired,
    value: PropTypes.any.isRequired,
};

function a11yProps(index) {
    return {
        textTransform: 'none',
        id: `nav-tab-${index}`,
        'aria-controls': `nav-tabpanel-${index}`,
    };
}

const LinkTab = withStyles((theme) => ({
    root: {
        textTransform: 'none',
        // color: '#fff',
        fontWeight: theme.typography.fontWeightBold,
        // fontSize: theme.typography.pxToRem(15),
        // marginRight: theme.spacing(1),
        '&:focus': {
            opacity: 1,
        },
    },
}))((props) => {
    return (
        <Tab
            component="a"
            onClick={event => {
                event.preventDefault();
            }}
            {...props}
        />
    );
});

const MyTabs = (props) => {
    const tabs = props.tabs;
    const labels = props.labels;
    let selectedTabIdx = 0;
    if (("history" in props) && ("location" in props.history)) {
        // e.g. {'graph': 'cases', 'table': 'testing'}
        let searchParams = new URLSearchParams(props.history.location.search);
        // e.g. 'testing'
        let selectedTabName = searchParams.get(props.urlQueryKey);
        selectedTabIdx = props.urlQueryValues.findIndex(name => name === selectedTabName);
        if (selectedTabIdx === -1) {
            // The active tab is not specified in the url query
            selectedTabIdx = 0;
        }
    }

    const [tabvalue, setTabvalue] = React.useState(selectedTabIdx);

    const handleChange = (event, newValue) => {
        setTabvalue(newValue);
        // Change url without reloading the page
        let searchParams = new URLSearchParams(props.history.location.search);
        searchParams.set(props.urlQueryKey, props.urlQueryValues[newValue]);
        props.history.location.search = searchParams.toString();
        props.history.push(props.history.location)
    }
    let c = 0;
    let labelcomp = labels.map(l =>
        <LinkTab label={l} key={c} {...a11yProps(c++)} />
    )
    let d = 0;
    let tabscomp = tabs.map(tab =>
        <TabPanel value={tabvalue} index={d} key={d}>
            {tabs[d++]}
        </TabPanel>
    )
    return <>
        <Tabs
            value={tabvalue}
            onChange={handleChange}
            aria-label=""
        >
            {labelcomp}
        </Tabs>
        {tabscomp}
    </>;
}

export { MyTabs }
