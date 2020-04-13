import React from 'react';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router-dom'
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
        id: `nav-tab-${index}`,
        'aria-controls': `nav-tabpanel-${index}`,
    };
}

const LinkTab = withStyles((theme) => ({
    root: {
        textTransform: 'none',
        // minWidth: 72,
        fontWeight: theme.typography.fontWeightRegular,
        // marginRight: theme.spacing(4),
        background: "#c3c3c3",
        borderRadius: 25,
        margin: 2,
        minHeight: 0,
        fontFamily: [
            '-apple-system',
            'BlinkMacSystemFont',
            '"Segoe UI"',
            'Roboto',
            '"Helvetica Neue"',
            'Arial',
            'sans-serif',
            '"Apple Color Emoji"',
            '"Segoe UI Emoji"',
            '"Segoe UI Symbol"',
        ].join(','),
        '&:hover': {
            color: '#40a9ff',
            opacity: 1,
        },
        '&$selected': {
            color: '#0090ff',
            background: "#ffffff",
            fontWeight: theme.typography.fontWeightBold,
        },
        '&:focus': {
            color: '#00a9ff',
        },
    },
    selected: {},
}))((props) => <Tab disableRipple {...props} />);


const MyTabs = (props) => {
    const history = useHistory();

    const tabs = props.tabs;
    const labels = props.labels;
    let selectedTabIdx = 0;
    if (history) {
        // e.g. {'graph': 'cases', 'table': 'testing'}
        let searchParams = new URLSearchParams(history.location.search);
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
        let searchParams = new URLSearchParams(history.location.search);
        searchParams.set(props.urlQueryKey, props.urlQueryValues[newValue]);
        history.location.search = searchParams.toString();
        history.push(history.location)
    }
    const labelcomp = labels.map((l, c) =>
        <LinkTab label={l} key={c} {...a11yProps(c)} />
    );
    const tabscomp = tabs.map((tab, d) =>
        <TabPanel value={tabvalue} index={d} key={d}>
            {tab}
        </TabPanel>
    );
    return <>
        <Tabs
            variant="scrollable"
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
