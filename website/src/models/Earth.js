import { BasicDataComponent } from './BasicDataComponent';
import { ChildrenComponent } from './ChildrenComponent';
import { DataSeries } from './DataSeries';
import { DivisionTypesComponent } from './DivisionTypesComponent';
import { GeographyComponent } from './GeographyComponent';
import { NameComponent } from './NameComponent';
import { Path } from './Path';
import { PopulationComponent } from './PopulationComponent';
import { ProjectionsComponent } from './ProjectionsComponent';
import { SearchIndexComponent } from './SearchIndexComponent';
import { World } from './World';
import { fetchWorldData } from "../PublicAllData"

// const earthBaseData = require('../data/WorldData.json');
const dataKeys = ['data'];
var cachedData = null;

export const SEARCH_INDEX_PATH = Path.parse('/_search_index');

// export function createBasicEarth() {
//   return new World(new BasicEarthSource(earthBaseData));
// }

export async function createBasicEarthAsync() {
  if (!cachedData) {
    cachedData = await fetchWorldData();
  }
  console.log(cachedData);
  return new World(new BasicEarthSource(cachedData));
}

class BasicEarthSource {

  constructor(baseData) {
    this.baseData = baseData;
  }

  fetch(path, have) {
    if (SEARCH_INDEX_PATH.equals(path)) {
      return [[path, [this.buildSearchIndex_()]]];
    } else if (path.matches('/:country/:division')
      || path.matches('/:country/:division/:province/:division')) {
      // We don't know anything about ourselves, so just return
      return [];
    }

    const ourComponents = [];

    const data = resolve(path, this.baseData);
    if (!have.has(BasicDataComponent)) {
      ourComponents.push(...this.basicComponentsFor_(data['data']));
    }
    if (!have.has(ProjectionsComponent)) {
      ourComponents.push(
        ...this.projectionsComponentsFor_(data['data']['projections']));
    }

    if (have.has(DivisionTypesComponent)) {
      return [[path, ourComponents]];
    }

    const children =
      Object.entries(data).filter(([child,]) => !dataKeys.includes(child));
    const division = divisionUnder(path);
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
        DataSeries.fromTimestamps("Confirmed", data['Confirmed']),
        DataSeries.fromTimestamps("Active", data['Active']),
        DataSeries.fromTimestamps("Recovered", data['Recovered']),
        DataSeries.fromTimestamps("Deaths", data['Deaths'])),
    ];
    if (data['latitude'] && data['longitude']) {
      components.push(new GeographyComponent(data['latitude'], data['longitude']));
    }
    if (data['population']) {
      components.push(new PopulationComponent(data['population']));
    }
    return components;
  }

  projectionsComponentsFor_(projections) {
    if (!projections) {
      return [];
    }

    return [
      new ProjectionsComponent(
        DataSeries.fromTimestamps(
          "Confirmed (Projected)", projections['Confirmed'])),
    ];
  }

  buildSearchIndex_() {
    const termsToNames = new Map();
    const namesToPath = new Map();

    const frontier = [[Path.root(), [], this.baseData]];
    while (frontier.length > 0) {
      const [path, ancestorTerms, data] = frontier.pop();

      const name = data.data.name;
      if (!termsToNames.has(name)) {
        termsToNames.set(name, []);
      }

      const terms = [name].concat(ancestorTerms);
      const fullName = terms.join(', ');
      namesToPath.set(fullName, path);

      for (const term of terms) {
        termsToNames.get(term).push(fullName);
      }

      const division = divisionUnder(path);
      const divisionPath =
        division && division.id ? path.child(division.id) : path;
      let passTerms;
      if (path.matches('/')) {
        passTerms = [];
      } else {
        passTerms = terms;
      }

      for (const key in data) {
        if (dataKeys.includes(key)) {
          continue;
        }

        frontier.push([divisionPath.child(key), passTerms, data[key]]);
      }
    }

    return new SearchIndexComponent(termsToNames, namesToPath);
  }
}

function resolve(path, baseData) {
  if (path.matches('/')) {
    return baseData;
  } else if (path.matches('/:country')) {
    return baseData[path.components[0]];
  } else if (path.matches('/:country/:division/:province')) {
    return baseData[path.components[0]][path.components[2]];
  } else if (path.matches('/:country/:division/:province/:division/:county')) {
    return baseData[path.components[0]][path.components[2]][path.components[4]];
  } else {
    return undefined;
  }
}

function divisionUnder(path) {
  if (path.matches('/')) {
    return {
      id: '',
      singular: 'Country',
      plural: 'Countries',
    };
  } else if (path.matches('/US')) {
    return {
      id: 'state',
      singular: 'State',
      plural: 'States',
    };
  } else if (path.matches('/:country')) {
    return {
      id: 'province',
      singular: 'Province',
      plural: 'Provinces',
    };
  } else if (path.matches('/US/state/:state')) {
    return {
      id: 'county',
      singular: 'County',
      plural: 'Counties',
    };
  } else if (path.matches('/US/state/:state/county/:county')) {
    return {
      id: 'source',
      singular: 'Source',
      plural: 'Sources',
    };
  } else if (path.matches('/:country/:division/:province')) {
    return {
      id: 'city',
      singular: 'City',
      plural: 'Cities',
    };
  } else {
    return undefined;
  }
}
