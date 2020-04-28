import React from 'react';
import { withGoogleSheets } from 'react-db-google-sheets';
import PropTypes from 'prop-types';
import Typography from '@material-ui/core/Typography'
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(theme => ({
    typography: {
        display: 'block',
        maxWidth: '45vh',
        padding: '1vh'
    }
}));

const CreditPopover = props => {
    const classes = useStyles();

    const list = props.db.Sheet1.filter(data => {
        return data.Contributer ? true : false
    }).map(data => {
        return (
            (data.Contributer) ? (" " + data.Contributer.toString()) : null
        )
    });

    return (
      <Typography variant='caption' color='textSecondary' className={classes.typography}>
        {list.toString().substring(1, list.toString().length - 1)}
      </Typography>
    );
}

CreditPopover.propTypes = {
  db: PropTypes.shape({
    Sheet1: PropTypes.arrayOf(PropTypes.object)
  })
};

export default withGoogleSheets('Sheet1')(CreditPopover);
