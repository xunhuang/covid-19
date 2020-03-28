import React from 'react';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import PropTypes from 'prop-types';

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

function LinkTab(props) {
    return (
        <Tab
            component="a"
            onClick={event => {
                event.preventDefault();
            }}
            {...props}
        />
    );
}

const MyTabs = (props) => {
    const tabs = props.tabs;
    const labels = props.labels;

    const [tabvalue, setTabvalue] = React.useState(0);
    const handleChange = (event, newValue) => {
        setTabvalue(newValue);
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