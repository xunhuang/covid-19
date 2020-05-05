import PropTypes from 'prop-types';
import React from 'react';
import {Link} from '@material-ui/core';

const DONATION_URL = "https://ko-fi.com/covid19direct";

export const DonateLink = (props) => {
  return (
    <Link target="_blank" href={DONATION_URL} className={props.className}>
      {props.message || 'Buy Us A Coffee'}
    </Link>
  );
}

DonateLink.propTypes = {
  className: PropTypes.string,
  message: PropTypes.string,
};
