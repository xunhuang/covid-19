import React, {useContext} from 'react';
import {useHistory} from 'react-router-dom'
import {AutoSizer, List} from 'react-virtualized';
import {ClickAwayListener, InputBase, Link as MaterialLink, Paper } from '@material-ui/core';
import {Link as RouterLink} from 'react-router-dom';
import SearchIcon from '@material-ui/icons/Search';
import LocationSearchingIcon from '@material-ui/icons/LocationSearching';
import Divider from '@material-ui/core/Divider';
import IconButton from '@material-ui/core/IconButton';
import {fade, makeStyles} from '@material-ui/core/styles';

import {SEARCH_INDEX_PATH} from '../../models/Earth';
import {Path} from '../../models/Path';
import {SearchIndexComponent} from '../../models/SearchIndexComponent';
import {WorldContext} from '../../WorldContext';
import {fetchPrecisePoliticalLocation} from '../../GeoLocation'

const RESULT_HEIGHT = 28;
const RESULTS_MAX_HEIGHT = 150;

const useStyles = makeStyles(theme => ({
  root: {
    height: '2em',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    borderRadius: theme.shape.borderRadius,
    backgroundColor: fade(theme.palette.common.white, 0.15),
    marginLeft: theme.spacing(4),
    '&:hover': {
      backgroundColor: fade(theme.palette.common.white, 0.25),
    },
    [theme.breakpoints.down('xs')]: {
      marginLeft: 0,
      marginBottom: theme.spacing(1),
    },
  },
  searchIcon: {
    height: '100%',
    padding: theme.spacing(0, 1),
    pointerEvents: 'none',
    position: 'absolute',
  },
  input: {
    flexGrow: 1,
    position: 'relative',
    color: 'inherit',
    paddingLeft: `calc(1em + ${theme.spacing(2.5)}px)`,
    [theme.breakpoints.down('xs')]: {
      maxWidth: '20ch',
    },
  },
  divider: {
    height: '70%',
    width: '1px',
    position: 'relative',
    marginLeft: theme.spacing(1),
    backgroundColor: `rgba(255, 255, 255, 0.7)`,
  },
  iconButton: {
    height: '100%',
    position: 'relative',
    padding: theme.spacing(0, 1),
    color: theme.palette.common.white,
    "&:hover": {
      backgroundColor: "transparent"
    }
  },
  resultsContainer: {
    borderRadius: '4px',
    color: theme.palette.text.primary,
    marginTop: '4px',
    maxHeight: '150px',
    maxWidth: '100vh',
    padding: '4px',
    position: 'absolute',
    top: '100%',
    alignSelf: 'flex-start',
    width: '350px',
    userSelect: 'none',
    '&.hide': {
      display: 'none',
    },
  },
  resultsList: {
    '&:focus': {
      outline: 'none',
    },
  },
  result: {
    background: '#fff',
    overflow: 'hidden',
    lineHeight: RESULT_HEIGHT + 'px',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
}));

export const SearchInput = (props) => {
  const classes = useStyles();
  const world = useContext(WorldContext);
  const history = useHistory();

  const [results, setResults] = React.useState([]);

  const locationLookup = async (history) => {
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

  // Force the search index to lazy load
  React.useEffect(() => {
    world.get(Path.root(), SearchIndexComponent);
  });

  const onClose = () => {
    setResults([]);
  };

  const onChange = (e) => {
    const search = world.get(SEARCH_INDEX_PATH, SearchIndexComponent);
    if (!search) {
      return;
    }

    setResults(search.search(e.target.value));
  };

  const onRequestNavigate = (path) => {
    setResults([]);
  };

  const resultRenderer = ({index, key, style}) => {
    const {name, path} = results[index];

    return (
      <div key={key} style={style} className={classes.result}>
        <MaterialLink
            component={RouterLink}
            onClick={onRequestNavigate}
            to={'/country' + path.string()}
        >
          {name}
        </MaterialLink>
      </div>
    );
  };

  return (
    <ClickAwayListener onClickAway={onClose}>
      <div className={classes.root}>
        <SearchIcon className={classes.searchIcon} />
        <InputBase
            className={classes.input}
            onChange={onChange}
            placerholder="Search..." />
        <Divider className={classes.divider} />
        <IconButton
            size="small"
            className={classes.iconButton}
            onClick={() => locationLookup(history)}>
          <LocationSearchingIcon/>
        </IconButton>
        <Paper
            className={
              `${classes.resultsContainer} `
                  + (results.length === 0 ? 'hide' : '')
            }
            elevation={3}>
          <AutoSizer disableHeight>
            {({width}) => (
              <List
                  className={classes.resultsList}
                  rowCount={results.length}
                  rowHeight={RESULT_HEIGHT}
                  rowRenderer={resultRenderer}
                  width={width}
                  height={Math.min(RESULTS_MAX_HEIGHT, RESULT_HEIGHT * results.length)}
              />
            )}
          </AutoSizer>
        </Paper>
      </div>
    </ClickAwayListener>
  );
};
