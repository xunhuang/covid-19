import PropTypes from 'prop-types';
import React from 'react';
import {makeStyles} from '@material-ui/core/styles';
import {useLocation} from 'react-router-dom'
import {
  EmailShareButton,
  FacebookShareButton,
  TwitterShareButton,
  RedditShareButton,
  WhatsappShareButton,
  EmailIcon,
  RedditIcon,
  FacebookIcon,
  TwitterIcon,
  WhatsappIcon,
} from "react-share";

const QUOTE = "Best real-time county-level COVID-19 dashboard. Get the latest trends about cases, recovery, testing and hospitalization as well as resources for mental health and well-being.";

const useStyles = makeStyles(theme => ({
  row: {
    display: 'flex',
    alignItems: 'baseline',
    padding: 5,
  },
}));

export const SocialMediaButtons = (props) => {
  const classes = useStyles();
  const location = useLocation();

  let url;
  if (props.url) {
    url = props.url;
  } else {
    url = 'https://covid-19.direct' + location.pathname;
  }

  const bgStyle = {};
  if (props.backgroundColor) {
    bgStyle.fill = props.backgroundColor;
  }

  return (
    <div className={props.className}>
      {[
        [FacebookShareButton, FacebookIcon],
        [TwitterShareButton, TwitterIcon],
        [RedditShareButton, RedditIcon],
        [WhatsappShareButton, WhatsappIcon],
        [EmailShareButton, EmailIcon],
      ].map(([Button, Icon], i) => (
        <Button url={url} quote={QUOTE} key={i}>
          <Icon
              size={props.size || '1em'}
              round={true}
              bgStyle={bgStyle}
              iconFillColor={props.iconColor}
          />
        </Button>
      ))}
    </div>
  );
};

SocialMediaButtons.propTypes = {
  backgroundColor: PropTypes.string,
  className: PropTypes.string,
  iconColor: PropTypes.string,
  quote: PropTypes.string,
  size: PropTypes.any,
  url: PropTypes.string,
};
