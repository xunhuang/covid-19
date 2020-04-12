import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Divider from '@material-ui/core/Divider';

const useStyles = makeStyles(theme => ({
    sectionHeader: {
      display: 'flex',
      justifyContent: 'center',
    }
}));

const SectionHeader = (props) => {
    const classes = useStyles();
    return <>
        <div className={classes.sectionHeader}>
            {props.children}
        </div>
    </>;
}


export { SectionHeader }
