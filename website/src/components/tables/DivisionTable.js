import PropTypes from 'prop-types';
import React, {useContext} from 'react';
import {Link as MaterialLink, Typography} from '@material-ui/core';
import {Link as RouterLink} from 'react-router-dom';

import {BasicDataComponent} from '../../models/BasicDataComponent';
import {ChildrenComponent} from '../../models/ChildrenComponent';
import {NameComponent} from '../../models/NameComponent';
import {PopulationComponent} from '../../models/PopulationComponent';
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
    {key: 'confirmed', label: 'Confirmed', defaultDirection: 'desc', contextKey: 'confirmedChange'},
    {key: 'confirmedPerMillion', label: 'Confirmed/million', defaultDirection: 'desc'},
    {key: 'died', label: 'Died', defaultDirection: 'desc'},
    {key: 'doublingInterval', label: 'Days to double', shortLabel: 'Days 2x', defaultDirection: 'asc'},
  ];
  const defaultSortColumn = columns[1];

  const rows = [];
  for (const child of children) {
    const [name, basic, population] =
        world.getMultiple(child, [NameComponent, BasicDataComponent, PopulationComponent]);
    if (!name || !basic) {
      continue;
    }

    const confirmed = basic.confirmed().lastValue();
    const newConfirmed = basic.confirmed().change().today();
    const confirmedChange =
        !newConfirmed || newConfirmed === confirmed
            ? ''
            : Math.round(newConfirmed / confirmed * 1000) / 10 + '%';
    const confirmedPerMillion =
        population
            ? Math.round(confirmed / population.population() * 1000000)
            : '';

    rows.push({
      id: child.string(),
      name: 
          <MaterialLink key={name.english()} component={RouterLink} to={'/country' + child.string()}>
            {name.english()}
          </MaterialLink>,
      confirmed,
      confirmedChange,
      confirmedPerMillion,
      active: basic.active().today(),
      died: basic.died().lastValue(),
      doublingInterval: basic.doublingInterval().today(),
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
