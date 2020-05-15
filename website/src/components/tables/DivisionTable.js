import PropTypes from 'prop-types';
import React, {useContext} from 'react';
import {Link as MaterialLink} from '@material-ui/core';
import {Link as RouterLink} from 'react-router-dom';

import {BasicDataComponent} from '../../models/BasicDataComponent';
import {ChildrenComponent} from '../../models/ChildrenComponent';
import {NameComponent} from '../../models/NameComponent';
import {PopulationComponent} from '../../models/PopulationComponent';
import {Path} from '../../models/Path';
import {SortableTable} from './SortableTable';
import {WorldContext} from '../../WorldContext';
import { MyTabs } from "../../MyTabs.js"

/** A table for showing basic data about children of a division entity. */
export const DivisionTableMain = (props) => {
  const world = useContext(WorldContext);
  const children =
      world.get(props.parent, ChildrenComponent).children();

  const columns = [
    {key: 'name', label: 'Name', defaultDirection: 'asc'},
    { key: 'confirmed', label: 'Confirmed', defaultDirection: 'desc' },
    { key: 'confirmedNew', label: 'New', defaultDirection: 'desc' },
    { key: 'active', label: 'Active', defaultDirection: 'desc' },
    { key: 'recovered', label: 'Recovered', defaultDirection: 'desc' },
    {key: 'died', label: 'Died',  defaultDirection: 'desc'},
  ];
  const defaultSortColumn = columns[1];

  let picked;
  if (props.pickLowest) {
    const {count, quantifier} = props.pickLowest;
    picked =
        children.sort((a, b) => quantifier(a) - quantifier(b))
            .slice(0, count);
  } else {
    picked = children;
  }

  const rows = [];
  for (const child of picked) {
    if (props.filter && !props.filter(child)) {
      continue;
    }

    const [name, basic] =
        world.getMultiple(child, [NameComponent, BasicDataComponent]);
    if (!name || !basic) {
      continue;
    }

    const confirmed = basic.confirmed().lastValue();
    const active = basic.active().lastValue();
    const recovered = basic.recovered().lastValue();
    const newConfirmed = basic.confirmed().change().lastValue();
    const confirmedChange =
      !newConfirmed || newConfirmed === confirmed
        ? ''
        : Math.round(newConfirmed / confirmed * 1000) / 10 + '%';
    rows.push({
      id: child.string(),
      name: 
          <MaterialLink key={name.english()} component={RouterLink} to={'/country' + child.string()}>
            {name.english()}
          </MaterialLink>,
      confirmed: confirmed,
      confirmedNew: newConfirmed,
      confirmedChange, // unused for now
      active: active,
      recovered: recovered,
      died: basic.died().lastValue(),
    });
  }

  return (
    <div className={props.className}>
      {/* <Typography variant="h6">{props.plural}</Typography> */}
      <SortableTable
          columns={columns}
          rows={rows}
          defaultSortColumn={defaultSortColumn}
      />
    </div>
  );
};

DivisionTableMain.propTypes = {
  parent: PropTypes.instanceOf(Path).isRequired,
  plural: PropTypes.string.isRequired,
  className: PropTypes.string,
  filter: PropTypes.func,
  pickLowest: PropTypes.exact({
    count: PropTypes.number.isRequired,
    quantifier: PropTypes.func.isRequired,
  }),
};

export const DivisionTableCapita = (props) => {
  const world = useContext(WorldContext);
  const children =
      world.get(props.parent, ChildrenComponent).children();

  const columns = [
    {key: 'name', label: 'Name', defaultDirection: 'asc'},
    {key: 'confirmedPerMillion', label: 'Confirmed/mil', shortLabel: 'Conf. / mil', defaultDirection: 'desc'},
    {key: 'deathsPerMillion', label: 'Deaths/mil', shortLabel: 'D/m', defaultDirection: 'desc'},
    {key: 'activePerMillion', label: 'Active/mil', shortLabel: 'A/m', defaultDirection: 'desc'},
    {key: 'recoveredPerMillion', label: 'Recovered/mil', shortLabel: 'R/m', defaultDirection: 'desc'},
    { key: 'population', label: 'Population', shortLabel: 'Pop.', defaultDirection: 'desc', renderShortNumber:true},
  ];
  const defaultSortColumn = columns[1];

  let picked;
  if (props.pickLowest) {
    const {count, quantifier} = props.pickLowest;
    picked =
        children.sort((a, b) => quantifier(a) - quantifier(b))
            .slice(0, count);
  } else {
    picked = children;
  }

  const rows = [];
  for (const child of picked) {
    if (props.filter && !props.filter(child)) {
      continue;
    }

    const [name, basic, population] =
        world.getMultiple(child, [NameComponent, BasicDataComponent, PopulationComponent]);
    if (!name || !basic) {
      continue;
    }

    const pop = population.population();
    const confirmed = basic.confirmed().lastValue();
    const confirmedPerMillion =
        population
            ? Math.round(confirmed /pop  * 1000000)
            : '';

    const deaths = basic.died().lastValue();
    const deathsPerMillion =
        population
            ? Math.round(deaths / pop * 1000000)
            : '';
    const active = basic.active().lastValue();
    const activePerMillion =
        population
            ? Math.round(active / pop * 1000000)
            : '';
    const recovered = basic.recovered().lastValue();
    const recoveredPerMillion =
        population
            ? Math.round(recovered / pop * 1000000)
            : '';

    rows.push({
      id: child.string(),
      name: 
          <MaterialLink key={name.english()} component={RouterLink} to={'/country' + child.string()}>
            {name.english()}
          </MaterialLink>,
      confirmedPerMillion,
      deathsPerMillion,
      activePerMillion,
      recoveredPerMillion,
      population: pop,
    });
  }

  return (
    <div className={props.className}>
      {/* <Typography variant="h6">{props.plural}</Typography> */}
      <SortableTable
          columns={columns}
          rows={rows}
          defaultSortColumn={defaultSortColumn}
      />
    </div>
  );
};

DivisionTableCapita.propTypes = DivisionTableMain.propTypes;

export const DivisionTableDaysToDouble = (props) => {
  const world = useContext(WorldContext);
  const children =
      world.get(props.parent, ChildrenComponent).children();

  const columns = [
    {key: 'name', label: 'Name', defaultDirection: 'asc'},
    {key: 'confirmedDoublingInterval', label: 'Confirmed', shortLabel: 'Conf.', defaultDirection: 'asc'},
    {key: 'deathsDoublingInterval', label: 'Deaths',  defaultDirection: 'asc'},
    {key: 'recoveredDoublingInterval', label: 'Recovered',  defaultDirection: 'asc'},
  ];
  const defaultSortColumn = columns[1];

  let picked;
  if (props.pickLowest) {
    const {count, quantifier} = props.pickLowest;
    picked =
        children.sort((a, b) => quantifier(a) - quantifier(b))
            .slice(0, count);
  } else {
    picked = children;
  }

  const rows = [];
  for (const child of picked) {
    if (props.filter && !props.filter(child)) {
      continue;
    }

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
      confirmedDoublingInterval: basic.confirmed().doublingInterval().lastValue(),
      deathsDoublingInterval: basic.died().doublingInterval().lastValue(),
      recoveredDoublingInterval: basic.recovered().doublingInterval().lastValue(),
    });
  }

DivisionTableDaysToDouble.propTypes = DivisionTableMain.propTypes;

  return (
    <div className={props.className}>
      {/* <Typography variant="h6">{props.plural}</Typography> */}
      <SortableTable
          columns={columns}
          rows={rows}
          defaultSortColumn={defaultSortColumn}
      />
    </div>
  );
};

export const DivisionTab = (props) => {
  const tabs = [
    <DivisionTableMain {...props} />,
    <DivisionTableCapita {...props} />,
    <DivisionTableDaysToDouble {...props} />,
  ];

  return (
    <MyTabs
    labels={[props.plural, "Capita", "Days to 2x"]}
    urlQueryKey="table"
    urlQueryValues={['main', 'capita', "daysto2x"]}
    tabs={tabs}
  />);
}