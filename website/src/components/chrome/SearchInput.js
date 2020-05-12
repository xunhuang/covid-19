import PropTypes from 'prop-types';
import React, {useContext} from 'react';
import {AutoSizer, List} from 'react-virtualized';
import {ClickAwayListener, InputBase, Link as MaterialLink, Paper } from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';
import LocationSearchingIcon from '@material-ui/icons/LocationSearching';
import Divider from '@material-ui/core/Divider';
import IconButton from '@material-ui/core/IconButton';
import {fade, makeStyles} from '@material-ui/core/styles';

import {SEARCH_INDEX_PATH} from '../../models/Earth';
import {Path} from '../../models/Path';
import {SearchIndexComponent} from '../../models/SearchIndexComponent';
import {WorldContext} from '../../WorldContext';

const RESULT_HEIGHT = 28;
const RESULTS_MAX_HEIGHT = 150;

const useStyles = makeStyles(theme => ({
  root: {
    alignItems: 'center',
    backgroundColor: fade(theme.palette.common.white, 0.15),
    borderRadius: theme.shape.borderRadius,
    display: 'flex',
    height: '2em',
    position: 'relative',
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
    color: 'inherit',
    flexGrow: 1,
    paddingLeft: `calc(1em + ${theme.spacing(2.5)}px)`,
    position: 'relative',
    [theme.breakpoints.down('xs')]: {
      maxWidth: '20ch',
    },
  },
  divider: {
    backgroundColor: `rgba(255, 255, 255, 0.7)`,
    height: '70%',
    marginLeft: theme.spacing(1),
    position: 'relative',
    width: '1px',
  },
  iconButton: {
    color: theme.palette.common.white,
    height: '100%',
    padding: theme.spacing(0, 1),
    position: 'relative',
    "&:hover": {
      backgroundColor: "transparent",
    },
  },
  resultsContainer: {
    alignSelf: 'flex-start',
    borderRadius: '4px',
    color: theme.palette.text.primary,
    marginTop: '4px',
    maxHeight: '150px',
    maxWidth: '100vh',
    padding: '4px',
    position: 'absolute',
    top: '100%',
    userSelect: 'none',
    width: '350px',
    zIndex: 9999,
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
    lineHeight: RESULT_HEIGHT + 'px',
    overflow: 'hidden',
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

  const onChoice = (e, path) => {
    e.preventDefault();
    setResults([]);
    props.onChoice(path);
  };

  const resultRenderer = ({index, key, style}) => {
    const {name, path} = results[index];

    return (
      <div key={key} style={style} className={classes.result}>
        <MaterialLink href="#" onClick={(e) => onChoice(e, path)}>
          {name}
        </MaterialLink>
      </div>
    );
  };

  return (
    <ClickAwayListener onClickAway={onClose}>
      <div className={`${classes.root} ${props.className || ''}`}>
        <SearchIcon className={classes.searchIcon} />
        <InputBase
            className={classes.input}
            onChange={onChange}
            placerholder="Search..." />
        {props.onGeolocate &&
            <Divider className={classes.divider} />
        }
        {props.onGeolocate &&
            <IconButton
                size="small"
                className={classes.iconButton}
                onClick={props.onGeolocate}>
              <LocationSearchingIcon />
            </IconButton>
        }
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
SearchInput.propTypes = {
  className: PropTypes.string,
  onChoice: PropTypes.func.isRequired,
  onGeolocate: PropTypes.func,
};
