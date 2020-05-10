import React, {useContext} from 'react';
import {AutoSizer, List} from 'react-virtualized';
import {ClickAwayListener, InputBase, Link as MaterialLink, Paper, Typography} from '@material-ui/core';
import {Link as RouterLink} from 'react-router-dom';
import SearchIcon from '@material-ui/icons/Search';
import {fade, makeStyles} from '@material-ui/core/styles';

import {SEARCH_INDEX_PATH} from '../../models/Earth';
import {Path} from '../../models/Path';
import {SearchIndexComponent} from '../../models/SearchIndexComponent';
import {WorldContext} from '../../WorldContext';

const RESULT_HEIGHT = 28;
const RESULTS_MAX_HEIGHT = 150;

const useStyles = makeStyles(theme => ({
  root: {
    position: 'relative',
    borderRadius: theme.shape.borderRadius,
    backgroundColor: fade(theme.palette.common.white, 0.15),
    marginLeft: theme.spacing(4),
    '&:hover': {
      backgroundColor: fade(theme.palette.common.white, 0.25),
    },
    [theme.breakpoints.down('xs')]: {
      marginLeft: 0,
    },
  },
  searchIcon: {
    height: '100%',
    padding: theme.spacing(0, 1),
    pointerEvents: 'none',
    position: 'absolute',
  },
  input: {
    color: 'inherit',
    paddingLeft: `calc(1em + ${theme.spacing(2.5)}px)`,
    [theme.breakpoints.down('xs')]: {
      width: '20ch',
    },
  },
  resultsContainer: {
    borderRadius: '4px',
    color: theme.palette.text.primary,
    marginTop: '4px',
    maxHeight: '150px',
    maxWidth: '100vh',
    padding: '4px',
    position: 'absolute',
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

  const [results, setResults] = React.useState([]);

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
