import PropTypes from 'prop-types';
import React, {useContext} from 'react';
import {Link as MaterialLink, Typography} from '@material-ui/core';
import {Link as RouterLink} from 'react-router-dom';

import {BasicDataComponent} from '../../models/BasicDataComponent';
import {ChildrenComponent} from '../../models/ChildrenComponent';
import {NameComponent} from '../../models/NameComponent';
import {Path} from '../../models/Path';
import {SortableTable} from './SortableTable';
import {WorldContext} from '../../WorldContext';

/** A table for showing basic data about children of a division entity. */
export const DivisionTable = (props) => {
  const world = useContext(WorldContext);
  const children =
      world.get(
              props.id ? props.parent.child(props.id) : props.parent,
              ChildrenComponent)
          .children();

  const columns = [
    {key: 'name', label: 'Name', defaultDirection: 'asc'},
    {key: 'confirmed', label: 'Confirmed', defaultDirection: 'desc'},
    {key: 'new', label: 'New', defaultDirection: 'desc'},
    {key: 'active', label: 'Active', defaultDirection: 'desc'},
    {key: 'recovered', label: 'Recovered', defaultDirection: 'desc'},
    {key: 'died', label: 'Died', defaultDirection: 'desc'},
  ];
  const defaultSortColumn = columns[1];

  const rows = [];
  for (const child of children) {
    const [name, basic] =
        world.getMultiple(child, [NameComponent, BasicDataComponent]);
    if (!name || !basic) {
      continue;
    }

    rows.push({
      id: child.string(),
      name: 
          <MaterialLink key={name.english()} component={RouterLink} to={'/country' + child.string()}>
            {name.english()}
          </MaterialLink>,
      confirmed: basic.confirmed().lastValue(),
      new: basic.confirmed().change().today(),
      active: basic.active().lastValue(),
      recovered: basic.recovered().lastValue(),
      died: basic.died().lastValue(),
    });
  }

  return (
    <div className={props.className}>
      <Typography variant="h6">{props.plural}</Typography>
      <SortableTable
          columns={columns}
          rows={rows}
          defaultSortColumn={defaultSortColumn}
      />
    </div>
  );
};

DivisionTable.propTypes = {
  id: PropTypes.string.isRequired,
  plural: PropTypes.string.isRequired,
  parent: PropTypes.instanceOf(Path).isRequired,
  className: PropTypes.string,
};
