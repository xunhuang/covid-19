import PropTypes from 'prop-types';
import React from 'react';
import {Table, TableBody, TableCell, TableHead, TableRow, TableSortLabel, useMediaQuery} from '@material-ui/core';
import {makeStyles, useTheme} from '@material-ui/core/styles';

const useStyles = makeStyles(theme => ({
  squishText: {
    hyphens: 'auto',
  },
}));

/** A table that is sortable by its columns. */
export const SortableTable = (props) => {
  const classes = useStyles();
  const theme = useTheme();
  const squish = useMediaQuery(theme.breakpoints.down('xs'));
  const {columns, rows, defaultSortColumn} = props;

  const [orderingBy, setOrderingBy] = React.useState(defaultSortColumn);
  const [direction, setDirection] = React.useState(orderingBy.defaultDirection);

  const sortFn = (a, b) =>
      compareStable(
          a, b, orderingBy.key, columns, direction === orderingBy.defaultDirection);
  const sorted = [...rows].sort((a, b) =>
      direction === 'asc' ? sortFn(a, b) : sortFn(b, a));

  const createUpdateSort = (column) => () => {
    setOrderingBy(column);
    setDirection(
        orderingBy === column
            ? opposite(direction) : column.defaultDirection);
  };

  return (
    <Table size="small" className={squish ? classes.squishText : ''}>
      <TableHead>
        <TableRow>
          {columns.map((column) =>
            <TableCell key={column.key}>
              <TableSortLabel
                  active={orderingBy.key === column.key}
                  direction={
                    orderingBy === column ? direction : column.defaultDirection}
                  hideSortIcon={squish}
                  onClick={createUpdateSort(column)}
              >
                {squish ? column.shortLabel || column.label : column.label}
              </TableSortLabel>
            </TableCell>
          )}
        </TableRow>
      </TableHead>
      <TableBody>
        {sorted.map((row) =>
          <TableRow key={row.id}>
            {columns.map(({key, contextKey}) =>
              <TableCell key={key}>
                {render(row[key])}
                {row[contextKey] && ` (${row[contextKey]})`}
              </TableCell>
            )}
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};

const columnPropType =
    PropTypes.exact({
        // The attribute in the object to lookup
        key: PropTypes.string.isRequired,
        // The label of the column
        label: PropTypes.string.isRequired,
        // The label to show when on a small screen
        shortLabel: PropTypes.string,
        // The default sort direction for the column
        defaultDirection: PropTypes.oneOf(['desc', 'asc']).isRequired,
        // An optional key of something to show inside parenthesis next to the
        // main value, as context
        contextKey: PropTypes.string,
    });

SortableTable.propTypes = {
  columns: PropTypes.arrayOf(columnPropType).isRequired,
  rows: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
  })).isRequired,
  defaultSortColumn: columnPropType.isRequired,
};

function opposite(direction) {
  return direction === 'desc' ? 'asc' : 'desc';
}

function render(value) {
  if (typeof value === 'number') {
    return isNaN(value) ? '' : value.toFixed(1).replace(/\.?0*$/, '');
  } else {
    return value || '';
  }
}

function valueFor(row, key) {
  // First check if there even is a value
  if (row[key] === undefined || row[key] === null) {
    return undefined;
  }

  // Check if the value itself has a key object, this lets us compare React
  // components.
  if (row[key].key) {
    return row[key].key;
  } else {
    return row[key];
  }
};

function compareOn(a, b, key, emptyLast) {
  const ak = valueFor(a, key);
  const bk = valueFor(b, key);

  if (isNaN(ak) && !isNaN(bk)) {
    return emptyLast ? 1 : -1;
  } else if (!isNaN(ak) && isNaN(bk)) {
    return emptyLast ? -1 : 1;
  } else if (ak < bk) {
    return -1;
  } else if (ak > bk) {
    return 1;
  } else {
    return 0;
  }
};

function compareStable(a, b, key, columns, emptyLast) {
  const preferred = compareOn(a, b, key, emptyLast);
  if (preferred !== 0) {
    return preferred;
  }

  // The preferred key exactly matched, so find a differentiating column
  for (const column of columns) {
    const attempt = compareOn(a, b, column.key);
    if (attempt !== 0) {
      return attempt;
    }
  }

  return compareOn(a, b, 'id');
};

