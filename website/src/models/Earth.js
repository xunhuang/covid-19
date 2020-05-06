import { BasicDataComponent } from './BasicDataComponent';
import { ChildrenComponent } from './ChildrenComponent';
import { DataSeries } from './DataSeries';
import { DivisionTypesComponent } from './DivisionTypesComponent';
import { Path } from './Path';
import { NameComponent } from './NameComponent';
import { World } from './World';

const baseData = require('../data/WorldData.json');

export function createBasicEarth() {
  const world = new World();
  populate(Path.root(), clean(baseData), world, 'Earth');
  return world;
}

function clean(baseData) {
  return baseData;
}

function populate(path, baseData, world, opt_forceName) {
  world.set(path, new NameComponent(opt_forceName || baseData.Summary.name));

  world.set(
      path,
      new BasicDataComponent(
          DataSeries.fromFormattedDates("Confirmed", baseData['Confirmed']),
          DataSeries.fromFormattedDates("Active", baseData['Active']),
          DataSeries.fromFormattedDates("Recovered", baseData['Recovered']),
          DataSeries.fromFormattedDates("Deaths", baseData['Deaths'])));

  const children =
      Object.entries(baseData)
          .filter(([child,]) => 
              ![
                'Active',
                'Confirmed',
                'Deaths',
                'Recovered',
                'Summary',
              ].includes(child));

  let division;
  if (path.matches('/')) {
    division = {
      id: '',
      singular: 'Country',
      plural: 'Countries',
    };
  } else if (path.matches('/US')) {
    division = {
      id: 'state',
      singular: 'State',
      plural: 'States',
    };
  } else if (path.matches('/:country')) {
    division = {
      id: 'province',
      singular: 'Province',
      plural: 'Provinces',
    };
  } else if (path.matches('/US/state/:state')) {
    division = {
      id: 'county',
      singular: 'County',
      plural: 'Counties',
    };
  } else if (path.matches('/:country/province/:province')) {
    division = {
      id: 'city',
      singular: 'City',
      plural: 'Cities',
    };
  } else if (children.length > 0) {
    throw new Error(`Unknown division for ${path.string()}`);
  } else {
    return;
  }

  if (children.length === 0) {
    return;
  }

  world.set(path, new DivisionTypesComponent([division]));
  const divisionRoot = division.id ? path.child(division.id) : path;

  const childrenPaths = [];
  for (const [child, data] of children) {
    const childPath = divisionRoot.child(child);
    childrenPaths.push(childPath);
    populate(childPath, data, world);
  }

  world.set(divisionRoot, new ChildrenComponent(childrenPaths));
}
