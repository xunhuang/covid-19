import React from 'react';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(theme => ({
    sectionHeader: {
        "border-left": `.1rem solid ${theme.palette.secondary.main}`,
        "border-bottom": ".1rem solid #f3f3f3",
        margin: 3,
        padding: 3,
    }
}));

const SectionHeader = (props) => {
    const classes = useStyles();
    return (
        <div className={classes.sectionHeader}>
            {props.children}
        </div>
    );
}


export { SectionHeader }
