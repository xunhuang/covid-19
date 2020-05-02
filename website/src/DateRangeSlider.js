import React from 'react';
import Slider from '@material-ui/core/Slider';
import { withStyles, makeStyles } from '@material-ui/core/styles';
import { isMobile } from 'react-device-detect'
import Grid from '@material-ui/core/Grid';
import PropTypes from 'prop-types';

const moment = require("moment");

const useStyles = makeStyles(theme => ({
    mobileDiv: {
    },
    webDiv: {
    },
    container: {
        height: 35
    }
}));

const DateRangeSlider = (props) => {

    const classes = useStyles();
    // takes a start date, and current date
    //
    // reports an offset from currentdate (eg. current - start - value)

    const startDate = moment(props.startDate);
    const currentDate = moment(props.currentDate);
    const daysBetween = currentDate.diff(startDate, 'days');
    let defaultValue = props.defaultValue ? (daysBetween - props.defaultValue) : daysBetween - 30
    defaultValue = (defaultValue > -1) ? defaultValue : daysBetween;
    const maxValue = (daysBetween > 13) ? daysBetween - 14 : daysBetween;

    const [value, setValue] = React.useState(defaultValue)

    const constLabelFormat = (value) => {
        return moment(startDate).add(value, 'days').format("MM/DD");
    }

    const valueSubmitted = (value) => {
        props.valueChanged(daysBetween - value);
    }

    const handleValueChange = (value) => setValue(value)

    const marks = [{ value: (daysBetween - 30 > -1) ? daysBetween - 30 : daysBetween }];

    const sliderPropsShared = {
        "aria-label":"Start Date",
        track: false,
        "aria-labelledby": "discrete-slider",
        valueLabelFormat: constLabelFormat,
        step: 1,
        marks: marks,
        min: 0,
        max: maxValue,
        value: value,
        onChangeCommitted: (event, value) => valueSubmitted(value),
        onChange: (event, val) => handleValueChange(val)
    }

    const sliderPropsMobile = {
        valueLabelDisplay:"off",
    }
    const sliderPropsWeb = {
        valueLabelDisplay:"auto",
    }

    const gridProps = {
        container: true,
        direction: "row",
        justify: "center",
        alignItems: "flex-end"
    }

    return (isMobile ?
        <Grid {...gridProps} className={`${classes.mobileDiv} ${classes.container}`}>
            <IOSSlider {...sliderPropsShared} {...sliderPropsMobile} />
        </Grid>
        :
        <Grid {...gridProps} className={`${classes.webDiv} ${classes.container}`}>
            <StyledSlider {...sliderPropsShared} {...sliderPropsWeb} />
        </Grid>);
}

DateRangeSlider.propTypes = {
    currentDate: PropTypes.any.isRequired,
    startDate: PropTypes.any.isRequired,
    valueChanged: PropTypes.any.isRequired,
}

const StyledSlider = withStyles({
    root: {
      color: '#00aeef',
      height: 2,
      padding: '15px 0',
    },
    valueLabel: {
        left: 'calc(-50% - 4px)',
    },
    thumb: {
        backgroundColor: '#3880ff',
    },
    mark: {
      backgroundColor: '#bfbfbf',
      height: 8,
      width: 1,
      marginTop: -3,
    },
})(Slider)

const iOSBoxShadow =
  '0 3px 1px rgba(0,0,0,0.1),0 4px 8px rgba(0,0,0,0.13),0 0 0 1px rgba(0,0,0,0.02)';

const IOSSlider = withStyles({
  root: {
    color: '#00aeef',
    height: 2,
    padding: '15px 0',
  },
  thumb: {
    height: 28,
    width: 28,
    backgroundColor: '#fff',
    boxShadow: iOSBoxShadow,
    marginTop: -14,
    marginLeft: -14,
    '&:focus, &:hover, &$active': {
      boxShadow: '0 3px 1px rgba(0,0,0,0.1),0 4px 8px rgba(0,0,0,0.3),0 0 0 1px rgba(0,0,0,0.02)',
      // Reset on touch devices, it doesn't add specificity
      '@media (hover: none)': {
        boxShadow: iOSBoxShadow,
      },
    },
  },
  active: {},
  valueLabel: {
    left: 'calc(-50% + 11px)',
    top: -22,
    '& *': {
      background: 'transparent',
      color: '#000',
    },
  },
  track: {
    height: 2,
  },
  rail: {
    height: 2,
    opacity: 0.5,
    backgroundColor: '#3880ff',
  },
  mark: {
    backgroundColor: '#bfbfbf',
    height: 8,
    width: 1,
    marginTop: -3,
  },
  markActive: {
    opacity: 1,
    backgroundColor: 'currentColor',
  },
})(Slider);

export { DateRangeSlider }
