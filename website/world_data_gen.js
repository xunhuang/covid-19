const moment = require("moment");
const fs = require('fs');
const csv = require('csvtojson')

const county_codes = require("../data/worlddata/country_regions.json");//.filter(region => !region.code.includes("US-"));

const KeyFields = [
  'Confirmed',
  'Deaths',
  'Recovered',
  'Active',
];

const RegionByCode = county_codes
  .reduce((m, a) => {
    m[a.code] = a;
    return m;
  }, {});

function regionAsExtended(key, region) {
  let name;
  if (EXPORT_NAME_OVERRIDE[key]) {
    name = EXPORT_NAME_OVERRIDE[key];
  } else {
    name = region.areaLabel;
  }

  return {
    name,
    population: parseInt(region.population),
    latitude: parseFloat(region.lat),
    longitude: parseFloat(region.lon),
  };
}

// If a component is prefixed by any of these, it will be dropped (but the
// numbers will still be attributed at a higher level.)
const COMPONENT_PREFIX_SKIP_SET = [
  "Channel Islands", // can't find the ISO 3166 for this in Wikidata...
  "Out of ",
  "MS Zaandam",
  "Recovered",
  "External territories",
  "Cruise Ship",
  "Diamond Princess",
  "From Diamond Princess",
  "Unassigned",
  "unassigned",
  "Grand Princess",
  "Grand Princess Cruise Ship",
  "None",
  "Wuhan Evacuee",
  "Others",
  "Unassigned Location (From Diamond Princess)",
];

// If a key is in this map, it will rewritten according to this. But the
// remaining components of the key will still be processed.
const KeyRewriteMap = {
  "America/Washington, D.C.": ["United States of America", "District of Columbia"],
  "Australia/Jervis Bay Territory": ["Australia"],
  "Bahamas": ["The Bahamas"],
  "Bahamas, The": ["The Bahamas"],
  "Burma": ["Myanmar"],
  "Cabo Verde": ["Cape Verde"],
  "China": ["People's Republic of China"],
  "Congo (Brazzaville)": ["Republic of the Congo"],
  "Congo (Kinshasa)": ["Democratic Republic of the Congo"],
  "Cote d'Ivoire": ["Ivory Coast"],
  "Curacao": ["Curaçao"],
  "Cyprus": ["Republic of Cyprus"],
  "Czechia": ["Czech Republic"],
  "Denmark/Faroe Islands": ["Faroe Islands"],
  "Denmark/Greenland": ["Greenland"],
  "France/Fench Guiana": ["French Guiana"],
  "France/French Guinea": ["French Guiana"],
  "France/Guadeloupe": ["Guadeloupe"],
  "France/Reunion": ["Réunion"],
  "France/Saint Barthelemy": ["Saint Barthélemy"],
  "France/St Martin": ["Saint Martin (French part)"],
  "French Guiana": ["France", "French Guiana"],
  "French Polynesia": ["France", "French Polynesia"],
  "Gambia": ["The Gambia"],
  "Gambia, The": ["The Gambia"],
  "Germany/Bavaria": ["Germany"],
  "Holy See": ["Vatican City"],
  "Hong Kong SAR": ["People's Republic of China", "Hong Kong"],
  "Hong Kong": ["People's Republic of China", "Hong Kong"],
  "Iran (Islamic Republic of)": ["Iran"],
  "Korea, South": ["South Korea"],
  "Macao SAR": ["People's Republic of China", "Macau"],
  "Macau SAR": ["People's Republic of China", "Macau"],
  "Macau": ["People's Republic of China", "Macau"],
  "Mainland China": ["People's Republic of China"],
  "Netherlands/Aruba": ["Aruba"],
  "Netherlands/Bonaire, Sint Eustatius and Saba": ["Bonaire"],
  "Netherlands/Curacao": ["Curaçao"],
  "Netherlands/Sint Maarten": ["Sint Maarten (Dutch part)"],
  "North Ireland": ["Northern Ireland"],
  "Palestine": ["State of Palestine"],
  "Palestinian territory": ["State of Palestine"],
  "People's Republic of China/Guangxi": ["People's Republic of China", "Guangxi Zhuang Autonomous Region"],
  "People's Republic of China/Ningxia": ["People's Republic of China", "Ningxia Hui Autonomous Region"],
  "People's Republic of China/Tibet": ["People's Republic of China", "Tibet Autonomous Region"],
  "Republic of Ireland": ["Ireland"],
  "Republic of Korea": ["North Korea"],
  "Republic of Moldova": ["Moldova"],
  "Reunion": ["France", "Réunion"],
  "Russian Federation": ["Russia"],
  "Saint Barthelemy": ["Saint Barthélemy"],
  "Saint Martin": ["Saint Martin (French part)"],
  "Sao Tome and Principe": ["São Tomé and Príncipe"],
  "St. Martin": ["Saint Martin (French part)"],
  "Taipei and environs": ["Taiwan"],
  "Taiwan*": ["Taiwan"],
  "Timor-Leste": ["East Timor"],
  "UK": ["United Kingdom"],
  "US": ["United States of America"],
  "United Kingdom/Anguilla": ["Anguilla"],
  "United Kingdom/Bermuda": ["Bermuda"],
  "United Kingdom/British Virgin Islands": ["British Virgin Islands"],
  "United Kingdom/Cayman Islands": ["Cayman Islands"],
  "United Kingdom/Falkland Islands (Islas Malvinas)": ["Falkland Islands"],
  "United Kingdom/Falkland Islands (Malvinas)": ["Falkland Islands"],
  "United Kingdom/Gibraltar": ["Gibraltar"],
  "United Kingdom/Isle of Man": ["Isle of Man"],
  "United Kingdom/Montserrat": ["Montserrat"],
  "United Kingdom/Turks and Caicos Islands": ["Turks and Caicos Islands"],
  "United Kingdom/UK": ["United Kingdom"],
  "United States of America/Chicago": ["United States of America", "Illinois", "Cook"],
  "United States of America/US": ["United States of America"],
  "United States of America/Virgin Islands": ["United States of America", "United States Virgin Islands"],
  "United States of America/Virgin Islands, U.S.": ["United States of America", "United States Virgin Islands"],
  "United States of America/Washington, D.C.": ["United States of America", "District of Columbia"],
  "Viet Nam": ["Vietnam"],
  "West Bank and Gaza": ["State of Palestine"],
  "Western Sahara": ["Sahrawi Arab Democratic Republic"],
  "occupied Palestinian territory": ["State of Palestine"],
};

// A map from parent key to rules for pulling components out of a child key.
const CHILD_REGEX_RULES = {
  "Canada": [
    // Drop the city from these since the data disappears
    [/^(?<City>[^,]+), (?<Province>..)$/, ['Province']],
    [/^(?<City>[^,]+), (?<Province>[^,(]+)$/, ['Province']],
  ],
  "United States of America": [
    // Grab the ship just for fun, but ignore it (for now?)
    // Check for County first, since we use a greedy match
    [/^(?<County>[^,]+?)(?: [Cc]ounty)?, (?<State>..)(?: \((?:From )?(?<Ship>[\w ]+\))(?: cruise)?(?: ship)?)?$/, ['State', 'County']],
  ],
};

// A map from code to names to force on export
const EXPORT_NAME_OVERRIDE = {
  "CN": "China",
  "CZ": "Czechia",
  "CY": "Cyprus",
  "EH": "Western Sahara",
  "PS": "Palestine",
};

class DefaultAbsorberMap {

  constructor() {
    this.timestampsByKey = new Map();
    this.extendedData = new Map();
  }

  set(key, name, extended, timestamp, values) {
    if (key === '') {
      extended.name = 'Earth';
      extended.population = 7782760616;
    }

    const currentName = (this.extendedData.get(key) || {}).name;
    extended.name = extended.name || name;

    if (!this.timestampsByKey.has(key)) {
      this.timestampsByKey.set(key, new Map());
      this.extendedData.set(key, extended);
    } else if (!currentName || currentName.length <= 2) {
      // The previous name is likely an ID, so just replace all our data
      this.extendedData.set(key, extended);
    } else if (currentName != extended.name && extended.name.length > 2) {
      // Check if it's longer than two since it's likely just a garbage ID
      console.error(this.extendedData.get(key));
      console.error(extended.name);
      throw new Error('Name mismatch for ' + key);
    }

    const existing = this.timestampsByKey.get(key);
    if (existing.has(timestamp)) {
      this.mergeInto_(existing.get(timestamp), values);
    } else {
      existing.set(timestamp, values);
    }
  }

  mergeInto_(a, b) {
    for (const [key, value] of Object.entries(b)) {
      if (isNaN(value)) {
        throw new Error(`Bad value ${value}`);
      }

      if (a[key]) {
        a[key] += value;
      } else {
        a[key] = value;
      }
    }
  }

  /**
   * Returns a hierarchical object where the data has been rolled up starting
   * from the leaves. Modifies this object.
   */
  rollupInPlace() {
    // console.log([...this.timestampsByKey.keys()].sort());

    // Create entries for any middle nodes that don't exist
    for (const key of this.timestampsByKey.keys()) {
      const split = key.split('/');
      // We go to >= 0, because that allows us to check for '' (Earth.)
      for (let i = split.length - 1; i >= 0; --i) {
        const ancestor = split.slice(0, i).join('/');
        if (!this.timestampsByKey.has(ancestor)) {
          this.timestampsByKey.set(ancestor, new Map());
        }
        if (!this.extendedData.has(ancestor)) {
          const predictedCode = split.slice(0, i).join('-');
          const region = RegionByCode[predictedCode];
          if (region) {
            this.extendedData.set(ancestor, regionAsExtended(ancestor, region));
          } else {
            throw new Error(`Missing ${ancestor} from ${key}`);
          }
        }
      }
    }

    // Sort so that deeper nodes are processed first. We sort entries in the
    // same level backwards so that '' is processed after everything else.
    const sorted = [...this.timestampsByKey.keys()].sort((a, b) => {
      const aD = a.replace(/[^/]/g, '').length;
      const bD = b.replace(/[^/]/g, '').length;
      if (aD !== bD) {
        return bD - aD;
      } else if (a < b) {
        return 1;
      } else if (a > b) {
        return -1;
      } else {
        return 0;
      }
    });

    for (const key of sorted) {
      const split = key.split('/');
      if (split.length === 0) {
        // We're done!
      } else {
        const parentKey = split.slice(0, split.length - 1).join('/');
        const parentTimestamps = this.timestampsByKey.get(parentKey);

        for (const [timestamp, values] of this.timestampsByKey.get(key)) {
          if (!parentTimestamps.has(timestamp)) {
            parentTimestamps.set(timestamp, {});
          }
          this.mergeInto_(parentTimestamps.get(timestamp), values);
        }
      }
    }

    const result = {};
    sorted.reverse();
    for (const key of sorted) {
      let cursor = result;
      if (key !== '') {
        const split = key.split('/');
        for (const component of split.slice(0, -1)) {
          cursor = cursor[component];
        }
        cursor[split[split.length - 1]] = {};
        cursor = cursor[split[split.length - 1]];
      }

      cursor['data'] = Object.fromEntries(KeyFields.map(k => [k, []]));
      Object.entries(this.extendedData.get(key)).forEach(([k, v]) => {
        if (v) {
          cursor['data'][k] = v;
        }
      });

      const sortedData =
        [...this.timestampsByKey.get(key)]
          .sort(([a,], [b,]) => a - b);
      for (const [timestamp, values] of sortedData) {
        for (const [field, value] of Object.entries(values)) {
          if (isNaN(value)) {
            throw new Error(`Why is there a null in ${key}`);
          }
          cursor['data'][field].push([timestamp, value]);
        }
      }
    }

    return result;
  }
}

function get_key(line) {
  const sources = [
    ['Country_Region', 'Country/Region'],
    ['Province_State', 'Province/State'],
    ['Admin2'],
  ];

  let components = [];
  for (let i = 0; i < sources.length; ++i) {
    let overridden = false;
    for (const candidate of sources[i]) {
      let part = line[candidate] && line[candidate].trim();

      if (!part) {
        continue;
      }

      if (COMPONENT_PREFIX_SKIP_SET.find(k => part.startsWith(k))) {
        return components;
      }

      if (components.length < i) {
        // Why do we have a province but not a country??
        console.error(line);
        throw new Error('Bad key');
      }

      if (i === 1 && components.length > 1 && components[1] === part) {
        // If we have something like Hong Kong/Hong Kong and on processing the
        // first term we push ['China', 'Hong Kong'], then protect against the
        // second bonus term. We could catch it later, but there might be
        // legitimate cases and it's sketchier here.
        continue;
      } else if (i === 2) {
        part = part.replace(/ [Cc]ounty$/, '');
      }

      const prefix = components.join('/');
      const prefixed = components.concat([part]).join('/');

      if (KeyRewriteMap[prefixed]) {
        components = [...KeyRewriteMap[prefixed]];
        continue;
      }

      if (CHILD_REGEX_RULES[prefix]) {
        for (const [rule, groups] of CHILD_REGEX_RULES[prefix]) {
          const match = part.match(rule);
          if (match) {
            overridden = true;
            for (const g of groups) {
              if (match.groups[g]) {
                components.push(match.groups[g]);
              }
            }
            break;
          }
        }
      }
      if (!overridden) {
        components.push(part);
      }
      break;
    }

    if (overridden) {
      break;
    }
  }
  return components;
}

function resolve_key(key) {
  let prefix = '';
  const resolved = [];
  let extended = {};
  for (let i = 0; i < key.length; ++i) {
    const name = key[i];

    if (i === 0 || i === 1) {
      let byName = county_codes.find(
        e => e.areaLabel === name && e.code.startsWith(prefix));
      let byCode = RegionByCode[prefix + name];
      let either = byName || byCode;
      if (either) {
        resolved.push(either.code.replace(RegExp(`^${prefix}`), ''));
        prefix += either.code + '-';
        extended =
          regionAsExtended(key.slice(0, i + 1).join('/'), either);
      } else if (i === 1 && key[0] === key[1]) {
        // We get stuff like France/France, so just leave it at France
      } else {
        throw new Error(`Unknown key ${key.join('/')}`);
      }
    } else {
      // Clear extended data since we don't know anything about this thing
      extended = {};
      resolved.push(name);
    }
  }

  return { resolved, extended };
}

function process_one_JHU_file(json, timestamp, map) {
  for (const line of json) {
    const key = get_key(line);
    // Note: key may be [] coming out of this, to indicate that the numbers
    // should be attributed to the entire world.
    const { resolved, extended } = resolve_key(key);
    const Combined_Key = resolved.join('/');

    const values =
      Object.fromEntries(
        KeyFields.map(k => [k, parseInt(line[k])])
          .filter(([k, v]) => !isNaN(v)))
    map.set(Combined_Key, key[key.length - 1], extended, timestamp, values);
  }
}

async function process_all_JHU_files(map) {
  for (let d = moment("01/22/2020", "MM/DD/YYYY"); d.isBefore(moment()); d = d.add(1, "days")) {
    let file = `../COVID-19/csse_covid_19_data/csse_covid_19_daily_reports/${d.format("MM-DD-YYYY")}.csv`;
    if (fs.existsSync(file)) {
      const json = await csv().fromFile(file);
      await process_one_JHU_file(json, d.unix(), map)
    } else {
      console.log(`Data file ${file} is missing`)
    }
  }
}

class DefaultMap {
  constructor(defaultFn) {
    this.defaultFn_ = defaultFn;
    this.inner_ = new Map();
  }

  entries() {
    return this.inner_.entries();
  }

  get(key) {
    if (!this.inner_.has(key)) {
      this.inner_.set(key, this.defaultFn_());
    }
    return this.inner_.get(key);
  }
}

async function get_projection_data() {
  const file = "../data/projections/MIT-05-07-2020.csv";
  const json = await csv().fromFile(file);

  const timestampsByProjectionsByPath =
      new DefaultMap(() => new DefaultMap(() => []));

  for (const line of json) {
    const components = [];

    const country = line.Country;
    if (country !== "None") {
      if (KeyRewriteMap[country]) {
        components.push(KeyRewriteMap[country][0]);
      } else {
        components.push(country);
      }
    }

    if (line.Province !== "None") {
      components.push(line.Province)
    }

    const {resolved} = resolve_key(components);
    const path = resolved.join('/');

    const projections = timestampsByProjectionsByPath.get(path);
    const timestamp = moment(line.Day, "YYYY/MM/DD").unix();

    const confirmed = projections.get('Confirmed');
    confirmed.push([timestamp, parseInt(line['Total Detected'])]);
  }

  return timestampsByProjectionsByPath;
}

function populate_projections(hierarchical, timestampsByProjectionsByPath) {
  for (const [path, projections] of timestampsByProjectionsByPath.entries()) {
    const split = path ? path.split('/') : [];
    let cursor = hierarchical;
    for (const component of split) {
      if (!cursor) {
        break;
      }
      cursor = cursor[component];
    }

    if (!cursor) {
      throw new Error(`Unable to store projections for ${path}`);
    }

    const projections_output = cursor.data.projections = {};
    for (const [type, data] of projections.entries()) {
      projections_output[type] = data.sort(([a, ], [b, ]) => a - b);
    }
  }
}

async function main() {
  const map = new DefaultAbsorberMap();
  await process_all_JHU_files(map);
  const hierarchical = map.rollupInPlace();
  populate_projections(hierarchical, await get_projection_data());
  return hierarchical;
}

main().then((hierarchical) => {
  const content = JSON.stringify(hierarchical, null, 2);
  fs.writeFileSync("./src/data/WorldData.json", content);
});
