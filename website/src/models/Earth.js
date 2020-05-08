import {BasicDataComponent} from './BasicDataComponent';
import {ChildrenComponent} from './ChildrenComponent';
import {DataSeries} from './DataSeries';
import {DivisionTypesComponent} from './DivisionTypesComponent';
import {GeographyComponent} from './GeographyComponent';
import {NameComponent} from './NameComponent';
import {PopulationComponent} from './PopulationComponent';
import {World} from './World';

const earthBaseData = require('../data/WorldData.json');

export function createBasicEarth() {
  return new World(new BasicEarthSource(earthBaseData));
}

class BasicEarthSource {

  constructor(baseData) {
    this.baseData = baseData;
  }

  fetch(path) {
    let data;
    let division;
    if (path.matches('/')) {
      data = this.baseData;
      division = {
        id: '',
        singular: 'Country',
        plural: 'Countries',
      };
    } else if (path.matches('/US')) {
      data = this.baseData[path.components[0]];
      division = {
        id: 'state',
        singular: 'State',
        plural: 'States',
      };
    } else if (path.matches('/:country')) {
      data = this.baseData[path.components[0]];
      division = {
        id: 'province',
        singular: 'Province',
        plural: 'Provinces',
      };
    } else if (path.matches('/US/state/:state')) {
      data = this.baseData[path.components[0]][path.components[2]];
      division = {
        id: 'county',
        singular: 'County',
        plural: 'Counties',
      };
    } else if (path.matches('/US/state/:state/county/:county')) {
      data = this.baseData[path.components[0]][path.components[2]][path.components[4]];
      division = {
        id: 'source',
        singular: 'Source',
        plural: 'Sources',
      };
    } else if (path.matches('/:country/:division/:province')) {
      data = this.baseData[path.components[0]][path.components[2]];
      division = {
        id: 'city',
        singular: 'City',
        plural: 'Cities',
      };
    } else if (
        path.matches('/:country/:division')
            || path.matches('/:country/:division/:province/:division')
            || path.matches('/:country/:division/:province/:division/:city')) {
      // We don't know anything about ourselves, so just return
      return [];
    }

    const ourComponents = this.basicComponentsFor_(data['data']);

    const children =
        Object.entries(data).filter(([child,]) => child !== 'data');

    if (!division) {
      if (children.length > 0) {
        throw new Error(`Unknown division for ${path.string()}`);
      } else {
        return [[path, ourComponents]];
      }
    } else if (children.length === 0) {
      return [[path, ourComponents]];
    }

    ourComponents.push(new DivisionTypesComponent([division]));
    const divisionRoot = division.id ? path.child(division.id) : path;
    const childrenPaths = [];
    const childrenComponents = [];
    for (const [child, data] of children) {
      const childPath = divisionRoot.child(child);
      childrenPaths.push(childPath);
      childrenComponents.push([childPath, this.basicComponentsFor_(data['data'])]);
    }

    return [
      [path, ourComponents],
      [divisionRoot, [new ChildrenComponent(childrenPaths)]],
      ...childrenComponents,
    ];
  }

  basicComponentsFor_(data) {
    const components = [
      new NameComponent(data['name']),
      new BasicDataComponent(
          DataSeries.fromFormattedDates("Confirmed", data['Confirmed']),
          DataSeries.fromFormattedDates("Active", data['Active']),
          DataSeries.fromFormattedDates("Recovered", data['Recovered']),
          DataSeries.fromFormattedDates("Deaths", data['Deaths'])),
    ];
    if (data['latitude'] && data['longitude']) {
      components.push(new GeographyComponent(data['latitude'], data['longitude']));
    }
    if (data['population']) {
      components.push(new PopulationComponent(data['population']));
    }
    return components;
  }
}

