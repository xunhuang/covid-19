import routes from "./Routes";
import { reverse } from 'named-urls';

const CovidData = require('./data/AllData.json');
const CountyGeoData = require('./data/county_gps.json');
const geolib = require('geolib');
const moment = require('moment');

const STATE_FIPS_TO_NAME = {
  "10": "Delaware",
  "11": "District of Columbia",
  "12": "Florida",
  "13": "Georgia",
  "15": "Hawaii",
  "16": "Idaho",
  "17": "Illinois",
  "18": "Indiana",
  "19": "Iowa",
  "20": "Kansas",
  "21": "Kentucky",
  "22": "Louisiana",
  "23": "Maine",
  "24": "Maryland",
  "25": "Massachusetts",
  "26": "Michigan",
  "27": "Minnesota",
  "28": "Mississippi",
  "29": "Missouri",
  "30": "Montana",
  "31": "Nebraska",
  "32": "Nevada",
  "33": "New Hampshire",
  "34": "New Jersey",
  "35": "New Mexico",
  "36": "New York",
  "37": "North Carolina",
  "38": "North Dakota",
  "39": "Ohio",
  "40": "Oklahoma",
  "41": "Oregon",
  "42": "Pennsylvania",
  "44": "Rhode Island",
  "45": "South Carolina",
  "46": "South Dakota",
  "47": "Tennessee",
  "48": "Texas",
  "49": "Utah",
  "50": "Vermont",
  "51": "Virginia",
  "53": "Washington",
  "54": "West Virginia",
  "55": "Wisconsin",
  "56": "Wyoming",
  "01": "Alabama",
  "02": "Alaska",
  "04": "Arizona",
  "05": "Arkansas",
  "06": "California",
  "08": "Colorado",
  "09": "Connecticut",
  "72": "Puerto Rico",
  "66": "Guam",
  "78": "Virgin Islands",
  "60": "American Samoa"
};

const STATE_TWO_LETTER_TO_POPULATIONS = {
  "CA": 39937489,
  "TX": 29472295,
  "FL": 21992985,
  "NY": 19440469,
  "PA": 12820878,
  "IL": 12659682,
  "OH": 11747694,
  "GA": 10736059,
  "NC": 10611862,
  "MI": 10045029,
  "NJ": 8936574,
  "VA": 8626207,
  "WA": 7797095,
  "AZ": 7378494,
  "MA": 6976597,
  "TN": 6897576,
  "IN": 6745354,
  "MO": 6169270,
  "MD": 6083116,
  "WI": 5851754,
  "CO": 5845526,
  "MN": 5700671,
  "SC": 5210095,
  "AL": 4908621,
  "LA": 4645184,
  "KY": 4499692,
  "OR": 4301089,
  "OK": 3954821,
  "CT": 3563077,
  "UT": 3282115,
  "IA": 3179849,
  "NV": 3139658,
  "AR": 3038999,
  "PR": 3032165,
  "MS": 2989260,
  "KS": 2910357,
  "NM": 2096640,
  "NE": 1952570,
  "ID": 1826156,
  "WV": 1778070,
  "HI": 1412687,
  "NH": 1371246,
  "ME": 1345790,
  "MT": 1086759,
  "RI": 1056161,
  "DE": 982895,
  "SD": 903027,
  "ND": 761723,
  "AK": 734002,
  "DC": 720687,
  "VT": 628061,
  "WY": 567025,
};

const UNKNOWN_COUNTY_NAME = "Unknown";

function datesToDataPoints(raw) {
  const days = Object.keys(raw.Confirmed).sort(sortByDate);
  return days.map(day => {
    const entry = {};
    entry.confirmed = raw.Confirmed[day];
    entry.death = raw.Death[day];
    if (raw.Recovered) {
      entry.recovery = raw.Recovered[day];
    }
    entry.fulldate = day;
    return entry;
  });
}

function sortByDate(a, b) {
  return moment(a, 'MM/DD/YYYY').toDate() - moment(b, 'MM/DD/YYYY').toDate();
}

export class Country {

  constructor() {
    this.covidRaw_ = CovidData;
    this.metrosById_ = new Map();
    this.statesById_ = new Map();
    this.statesByTwoLetterName_ = new Map();
    this.name = "US";

    for (const [id, data] of Object.entries(this.covidRaw_)) {
      // Check if this looks like a state FIPS id
      if (isNaN(id)) {
        continue;
      }

      const state = new State(id, data, this);
      this.statesById_.set(id, state);
      this.statesByTwoLetterName_.set(state.twoLetterName, state);
    }

    for (const [id, data] of Object.entries(this.covidRaw_.Metros)) {
      const state = this.statesById_.get(data.StateFIPS);
      state.addMetro(id, data);
      this.metrosById_.set(id, state.metroForId(id));
    }

    for (const data of CountyGeoData) {
      const id = data.FIPS.padStart(5, '0');
      const stateId = id.substring(0, 2);
      this.statesById_.get(stateId).countyForId(id).update(data);
    }

    this.statesById_.forEach(state => state.reindex());
  }

  allStates() {
    return [...this.statesById_.values()];
  }

  metroForId(id) {
    return this.metrosById_.get(id);
  }

  stateForId(id) {
    return this.statesById_.get(id);
  }

  stateForTwoLetterName(id) {
    return this.statesByTwoLetterName_.get(id);
  }

  routeTo() {
    return routes.united_states;
  }

  dataPoints() {
    return datesToDataPoints(this.covidRaw_.Summary);
  }

  summary() {
    const confirmed = this.covidRaw_.Summary.LastConfirmed;
    const newcases = this.covidRaw_.Summary.LastConfirmedNew;
    const deaths = this.covidRaw_.Summary.LastDeath;
    const deathsNew = this.covidRaw_.Summary.LastDeathNew;
    const recovered = this.covidRaw_.Summary.LastRecovered;
    const recoveredNew = this.covidRaw_.Summary.LastRecoveredNew;
    const generatedTime = (new Date(this.covidRaw_.Summary.generated)).toString();
    return {
      confirmed: confirmed,
      newcases: newcases,
      deaths: deaths,
      deathsNew: deathsNew,
      recovered: recovered,
      recoveredNew: recoveredNew,
      newpercent: ((newcases / (confirmed - newcases)) * 100).toFixed(0),
      generatedTime: generatedTime,
    }
  }
}

export class State {
  constructor(id, covidRaw_, country) {
    this.id = id;
    this.covidRaw_ = covidRaw_;
    this.country_ = country;
    this.name = STATE_FIPS_TO_NAME[id];
    this.twoLetterName = Object.values(covidRaw_)[0]['StateName']
    this.counties_ = new Map();
    this.countiesByName_ = new Map();
    this.metros_ = new Map();
    this.metrosByCounty_ = new Map();

    // Force load counties so nearby works properly and we get "Statewide
    // Unallocated"s.
    for (const id of Object.keys(this.covidRaw_)) {
      // Check if this looks like a county FIPS id
      if (isNaN(id)) {
        continue;
      }

      this.countyForId(id);
    }
    this.reindex();
  }

  country() {
    return this.country_;
  }

  addMetro(id, data) {
    this.metros_.set(id, new Metro(id, data, this));
  }

  allCounties() {
    return [...this.counties_.values()];
  }

  countyForId(id) {
    if (!this.counties_.has(id)) {
      this.counties_.set(id, new County(id, this.covidRaw_[id], this));
    }
    return this.counties_.get(id);
  }

  countyForName(name) {
    return this.countiesByName_.get(name);
  }

  metroForId(id) {
    return this.metros_.get(id);
  }

  metroContainingCounty(county) {
    return this.metrosByCounty_.get(county);
  }

  routeTo() {
    return reverse(routes.state, { state: this.twoLetterName });
  }

  confirmed() {
    return this.covidRaw_.Summary.confirmed;
  }

  dataPoints() {
    return datesToDataPoints(this.covidRaw_.Summary);
  }

  hospitals() {
    const aggregate = {
      'bedCount': 0,
      'count': 0,
    }
    for (const county of this.counties_.values()) {
      const hospitals = county.hospitals()
      if (hospitals) {
        aggregate.bedCount += hospitals.bedCount || 0;
        aggregate.count += hospitals.count || 0;
      }
    }
    return aggregate;
  }

  newCases() {
    return this.covidRaw_.Summary.LastConfirmedNew;
  }

  population() {
    return STATE_TWO_LETTER_TO_POPULATIONS[this.twoLetterName];
  }

  stayHomeOrder() {
    return this.covidRaw_.Summary.StayHomeOrder;
  }

  summary() {
    const confirmed = this.covidRaw_.Summary.LastConfirmed;
    const newcases = this.covidRaw_.Summary.LastConfirmedNew;
    return {
      state: this.twoLetterName,
      confirmed: confirmed,
      newcases: newcases,
      death: this.covidRaw_.Summary.LastDeath,
      deathNew: this.covidRaw_.Summary.LastDeathNew,
      newpercent: ((newcases / (confirmed - newcases)) * 100).toFixed(0),
      daysToDouble: this.covidRaw_.Summary.DaysToDouble,
      daysToDoubleDeath: this.covidRaw_.Summary.DaysToDoubleDeath,
      lastRecovered: this.covidRaw_.Summary.LastRecovered,
      lastRecoveredNew: this.covidRaw_.Summary.LastRecoveredNew,
    }
  }

  totalConfirmed() {
    if (!this.covidRaw_) {
      return 0;
    }

    return this.covidRaw_.Summary.LastConfirmed;
  }

  reindex() {
    this.countiesByName_.clear();
    this.counties_.forEach(county => {
      if (county.name !== UNKNOWN_COUNTY_NAME) {
        this.countiesByName_.set(county.name, county);
      }
    });

    this.metrosByCounty_.clear();
    this.metros_.forEach(metro => {
      metro.counties_.forEach(county => {
        this.metrosByCounty_.set(county, metro);
      });
    });
  }
}

export class Metro {
  constructor(id, covidRaw_, state) {
    this.id = id;
    this.covidRaw_ = covidRaw_;
    this.state_ = state;
    this.name = covidRaw_['Name'];
    this.counties_ = this.covidRaw_.Counties.map(id => state.countyForId(id));
  }

  allCounties() {
    return this.counties_;
  }

  state() {
    return this.state_;
  }

  routeTo() {
    return reverse(routes.metro, { metro: this.id });
  }

  dataPoints() {
    return datesToDataPoints(this.covidRaw_.Summary);
  }

  hospitals() {
    return {
      'bedCount': this.covidRaw_.HospitalBeds,
      'count': this.covidRaw_.Hospitals,
    };
  }

  summary() {
    return this.covidRaw_['Summary'];
  }
}

export class County {
  constructor(id, covidRaw_, state) {
    this.id = id;

    if (covidRaw_) {
      this.covidRaw_ = covidRaw_;
      this.name = covidRaw_['CountyName'];
    } else {
      this.name = UNKNOWN_COUNTY_NAME;
    }

    if (this.name === "New York City") {
      this.name = "New York";
    }

    this.state_ = state;
  }

  metro() {
    return this.state_.metroContainingCounty(this);
  }

  state() {
    return this.state_;
  }

  nearby() {
    if (!this.center_) {
      return undefined;
    }

    const candidates = [];
    for (const state of this.state_.country().allStates()) {
      for (const candidate of state.allCounties()) {
        // Shouldn't we check to make sure we aren't counting ourselves as
        // nearby too?
        if (!candidate.center_) {
          continue;
        }

        if (Math.abs(this.center_.lat - candidate.center_.lat) < 1.5
          && Math.abs(this.center_.lng - candidate.center_.lng) < 1.5) {
          candidates.push(candidate);
        }
      }
    }

    return candidates.sort((a, b) => {
      const da =
        geolib.getDistance({
          latitude: this.center_.lat,
          longitude: this.center_.lng,
        }, {
          latitude: a.center_.lat,
          longitude: a.center_.lng,
        });
      const db =
        geolib.getDistance({
          latitude: this.center_.lat,
          longitude: this.center_.lng,
        }, {
          latitude: b.center_.lat,
          longitude: b.center_.lng,
        });
      return da - db;
    });
  }

  routeTo() {
    return reverse(routes.county, {
      county: this.name,
      state: this.state_.twoLetterName,
    });
  }

  dataPoints() {
    return datesToDataPoints(this.covidRaw_);
  }

  hospitals() {
    return this.hospitals_;
  }

  population() {
    return this.population_;
  }

  stayHomeOrder() {
    return this.covidRaw_.StayHomeOrder;
  }

  summary() {
    if (!this.covidRaw_) {
      return {
        confirmed: 0,
        newcases: 0,
        death: 0,
        newpercent: 0,
        daysToDouble: null,
        daysToDoubleDeath: null,
      }
    }

    const today = this.covidRaw_.LastConfirmed;
    const newcase = this.covidRaw_.LastConfirmedNew;
    return {
      confirmed: today,
      newcases: newcase,
      death: this.covidRaw_.LastDeath,
      newpercent: (newcase) / (today - newcase),
      daysToDouble: this.covidRaw_.DaysToDouble,
      daysToDoubleDeath: this.covidRaw_.DaysToDoubleDeath,
    }
  }

  totalConfirmed() {
    if (!this.covidRaw_) {
      return 0;
    }

    return this.covidRaw_.LastConfirmed;
  }

  update(data) {
    if (data['County']) {
      this.name = data['County'];
    }

    this.center_ = {};
    if (data['Latitude']) {
      this.center_['lat'] = parseFloat(data['Latitude']);
    }
    if (data['Longitude']) {
      this.center_['lng'] = parseFloat(data['Longitude']);
    }

    this.hospitals_ = {};
    if (data['Hospitals']) {
      this.hospitals_['count'] = data['Hospitals'];
    }
    if (data['HospitalBeds']) {
      this.hospitals_['bedCount'] = data['HospitalBeds'];
    }
    if (this.state_.twoLetterName === "NY" && this.name === "New York") {
      this.hospitals_['bedCount'] = 23639;
      this.hospitals_['count'] = 58;
    }

    if (data['Population2010']) {
      this.population_ = parseInt(data['Population2010'].replace(/,/g, ''));
    }
    // hard coding a special here for NYC because
    // all 5 boroughs are lumped together. terrible hack
    if (this.state_.twoLetterName === "NY" && this.name === "New York") {
      this.population_ = 8500000;
    }
  }
}
