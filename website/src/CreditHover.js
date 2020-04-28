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

    return (
      <Typography variant='caption' color='textSecondary' className={classes.typography}>
        {props.db.Sheet1.map(data => {
            console.log(data.Contributer)
            return (
                data.Contributer ? <>{data.Contributer}, </> : null
            )
        })}
      </Typography>
    );
}

CreditPopover.propTypes = {
  db: PropTypes.shape({
    Sheet1: PropTypes.arrayOf(PropTypes.object)
  })
};

export default withGoogleSheets('Sheet1')(CreditPopover);
