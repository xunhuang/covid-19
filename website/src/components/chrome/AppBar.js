import React, { useContext } from 'react';
import {fade, makeStyles, useTheme} from '@material-ui/core/styles';
import {useHistory} from 'react-router-dom'
import {AppBar as MaterialAppBar, Toolbar, Typography} from '@material-ui/core';

import {DonateLink} from './DonateLink';
import {SEARCH_INDEX_PATH} from '../../models/Earth';
import {SearchIndexComponent} from '../../models/SearchIndexComponent';
import {SearchInput} from './SearchInput';
import {SocialMediaButtons} from './SocialMediaButtons';
import {WorldContext} from '../../WorldContext';
import {fetchPrecisePoliticalLocation} from '../../GeoLocation'

const RELIEF_COLOR = '#fff';

const useStyles = makeStyles(theme => ({
  appBar: {
    color: RELIEF_COLOR,
    display: 'flex',
  },
  nameAndSearch: {
    display: 'flex',
    alignItems: 'center',
    [theme.breakpoints.down('xs')]: {
      display: 'initial',
    },
  },
  appName: {
    overflow: 'visible',
  },
  search: {
    marginLeft: theme.spacing(4),
  },
  donations: {
    background: RELIEF_COLOR,
    borderRadius: '8px',
    display: 'block',
    marginLeft: '16px',
    padding: '6px 8px',
    textAlign: 'center',
    '&:hover': {
      color: theme.palette.primary.light,
      filter: `drop-shadow(0 0 2px ${fade(RELIEF_COLOR, 0.95)})`,
      textDecoration: 'none',
      transform: 'translateY(-1px)',
    },
  },
  expander: {
    flexGrow: 1,
  },
  socialButtons: {
    fontSize: '1.5625em',
    lineHeight: '1em',
    whiteSpace: 'nowrap',
    '& > *': {
      marginLeft: '4px',
      verticalAlign: 'middle',
    }
  },
  socialButton: {
    '&:hover': {
      filter: `drop-shadow(0 0 2px ${fade(RELIEF_COLOR, 0.95)})`,
      transform: 'translateY(-1px)',
    },
  },
  actions: {
    alignItems: 'center',
    display: 'flex',
    flexWrap: 'wrap',
    flexShrink: 2,
    justifyContent: 'flex-end',
    textAlign: 'end',
  },
}));

export const AppBar = (props) => {
  const classes = useStyles();
  const theme = useTheme();

  return (
    <MaterialAppBar position="relative">
      <Toolbar className={classes.appBar}>
        <div className={classes.nameAndSearch}>
          <Typography noWrap className={classes.appName} variant="h6">
            COVID-19.direct
          </Typography>
          <NavigatingSearchInput className={`${classes.search} ${classes.expander}`} />
        </div>

        <div className={classes.expander} />

        <div className={classes.actions}>
          <SocialMediaButtons
            backgroundColor="#fff"
            buttonClassName={classes.socialButton}
            className={classes.socialButtons}
            iconColor={theme.palette.primary.main}
          />

          <DonateLink className={classes.donations} message="Buy us a coffee!" />
        </div>
      </Toolbar>
    </MaterialAppBar>
  );
};

const NavigatingSearchInput = (props) => {
  const history = useHistory();
  const world = useContext(WorldContext);

  const navigate = (path) => {
    history.push("/country" + path.string());
  };

  const locationLookup = async () => {
    const search = world.get(SEARCH_INDEX_PATH, SearchIndexComponent);
    const location = await fetchPrecisePoliticalLocation();
    if (!search) {
      return;
    }
    let terms = [];
    if (location.county && location.stateName) {
      terms.push(location.county, location.stateName);
    }
    terms.push(location.country)
    const allMatches = search.search(terms.join(", "));
    if (allMatches && allMatches.length > 0) {
      history.push("/country" + allMatches[0].path.string())
    }
  }

  return (
    <SearchInput
        onChoice={navigate}
        onGeolocate={locationLookup}
        {...props} />
  );
};
