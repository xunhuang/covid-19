import PropTypes from 'prop-types';
import React from 'react';
import {Table, TableBody, TableCell, TableHead, TableRow, TableSortLabel} from '@material-ui/core';

export const SortableTable = (props) => {
  const {columns, rows, defaultSortColumn} = props;

  const [orderingBy, setOrderingBy] = React.useState(defaultSortColumn);
  const [direction, setDirection] = React.useState(orderingBy.defaultDirection);

  const sorted = [...rows].sort((a, b) =>
      direction === 'asc'
          ? compareStable(a, b, orderingBy.key, columns)
          : compareStable(b, a, orderingBy.key, columns));

  const createUpdateSort = (column) => () => {
    setOrderingBy(column);
    setDirection(
        orderingBy === column
            ? opposite(direction) : column.defaultDirection);
  };

  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          {columns.map((column) =>
            <TableCell key={column.key}>
              <TableSortLabel
                  active={orderingBy.key === column.key}
                  direction={
                    orderingBy === column ? direction : column.defaultDirection}
                  onClick={createUpdateSort(column)}
              >
                {column.label}
              </TableSortLabel>
            </TableCell>
          )}
        </TableRow>
      </TableHead>
      <TableBody>
        {sorted.map((row) =>
          <TableRow key={row.id}>
            {columns.map(({key}) =>
              <TableCell key={key}>{row[key]}</TableCell>
            )}
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};

const columnPropType =
    PropTypes.exact({
        key: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        defaultDirection: PropTypes.oneOf(['desc', 'asc']).isRequired,
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

function valueFor(row, key) {
  // First check if there even is a value
  if (row[key] === undefined) {
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

function compareOn(a, b, key) {
  let ak = valueFor(a, key);
  const bk = valueFor(b, key);

  if (ak < bk) {
    return -1;
  } else if (ak > bk) {
    return 1;
  } else {
    return 0;
  }
};

function compareStable(a, b, key, columns) {
  const preferred = compareOn(a, b, key);
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

