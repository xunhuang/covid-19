import React from 'react';
import Typography from '@material-ui/core/Typography'
import { makeStyles } from '@material-ui/core/styles';
import { MyTabs } from "./MyTabs.js"
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import { withRouter } from 'react-router-dom'
import Avatar from '@material-ui/core/Avatar';

const MentalHealthResources = require("./data/mentalhealth.json");

const useStyles = makeStyles(theme => ({
    inline: {
        display: 'inline',
        // fontWeight: "fontWeightBold",
    },
}));

const ResourceSectionOne = (props) => {
    const classes = useStyles();
    return <List>
        {props.tab.map((item, i) =>
            <ListItem onClick={() => { window.open(item.Url) }} key={i}>
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
const MentalHealthResourceSection = withRouter((props) => {
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
    />;
    return tabs;
});
export { MentalHealthResourceSection }
