import Disqus from "disqus-react"
import PropTypes from 'prop-types';
import React from 'react';
import {FacebookProvider, Comments as FacebookComments} from 'react-facebook';
import {Paper, Tab, Tabs, Toolbar, Typography} from '@material-ui/core';
import {makeStyles} from '@material-ui/core/styles';

const disqusConfig = {
  url: "https://covid-19.direct/country/",
  identifier: "world-frontpage",
  title: "world page"
};

// Facebook comments are lazily loaded, so we have to render it ahead of time
// even though it'd be better to not.
const useStyles = makeStyles(theme => ({
  'scrollPane': {
    overflow: 'scroll',
    maxHeight: '80vh',
  },
  'hide': {
    display: 'none',
  },
}));

export const Discussion = (props) => {
  const classes = useStyles();

  const sources = [{
    'label': 'Disqus comments',
    'content':
        <Disqus.DiscussionEmbed
            shortname={"covid19direct-world"}
            config={disqusConfig}
        />
  }, {
    'label': 'Facebook',
    'content':
      <FacebookProvider appId="201788627783795">
        <FacebookComments href="https://covid-19.direct/" />
      </FacebookProvider>,
  }];

  const [source, setSource] = React.useState(0);
  const change = (e, to) => {
    setSource(to);
  };

  return (
    <Paper className={props.className}>
      <Tabs value={source} onChange={change}>
        {sources.map(({label}, i) =>
          <Tab key={label} label={label} value={i} />
        )}
      </Tabs>

      <div className={classes.scrollPane}>
        {sources.map(({label, content}, i) =>
          <div key={label} className={source !== i ? classes.hide : ''}>
            {content}
          </div>
        )}
      </div>
    </Paper>
  );
};

Discussion.propTypes = {
  className: PropTypes.string,
};
