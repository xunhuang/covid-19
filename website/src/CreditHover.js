import React from 'react';
import Typography from '@material-ui/core/Typography'
import { makeStyles } from '@material-ui/core/styles';
import contributers from './data/contributors.json'

const useStyles = makeStyles(theme => ({
    typography: {
        display: 'block',
        maxWidth: '45vh',
        padding: '1vh'
    }
}));

const CreditPopover = (props) => {
    const classes = useStyles();

    const list = contributers.map(element => {
        return " " + element.name
    });

    return (
      <Typography variant='caption' color='textSecondary' className={classes.typography}>
        {list.toString().substring(1, list.toString().length - 1)}
      </Typography>
    );
}

export default CreditPopover;
