import routes from "./Routes";
import { reverse } from 'named-urls';
import { trimLastDaysData, getDay2DoubleTimeSeries } from "./CovidAnalysis";
import { CountyInfo } from 'covidmodule';

const CovidData = require('./data/AllData.json');
const CountyGeoData = require('./data/county_gps.json');
const geolib = require('geolib');
const moment = require('moment');

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
    this.metrosByCountyId_ = new Map();
    this.statesById_ = new Map();
    this.statesByTwoLetterName_ = new Map();
    this.countiesById_ = new Map();
    this.name = "US";

    for (const [id, data] of Object.entries(this.covidRaw_)) {
      // Check if this looks like a state FIPS id
      if (isNaN(id)) {
        continue;
      }

      const state = new State(id, data, this);
      this.statesById_.set(id, state);
      this.statesByTwoLetterName_.set(state.twoLetterName, state);

      for (const county of state.allCounties()) {
        this.countiesById_.set(county.id, county)
      }
    }

    for (const [id, data] of Object.entries(this.covidRaw_.Metros)) {
      const state = this.statesById_.get(data.StateFIPS);
      state.addMetro(id, data, this);

      this.metrosById_.set(id, state.metroForId(id));
      let metro = state.metroForId(id);
      this.metrosById_.set(id, metro);
      for (const county of metro.allCounties()) {
        this.metrosByCountyId_.set(county.id, metro);
      }
    }

    for (const data of CountyGeoData) {
      const id = data.FIPS.padStart(5, '0');
      const stateId = id.substring(0, 2);
      this.statesById_.get(stateId).countyForId(id).update(data);
    }

    this.statesById_.forEach(state => state.reindex());
  }

  metroContainingCounty(county) {
    return this.metrosByCountyId_.get(county.id);
  }

  countyForId(id) {
    return this.countiesById_.get(id);
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
  daysToDoubleTimeSeries() {
    let confirmed = getDay2DoubleTimeSeries(
      trimLastDaysData(this.covidRaw_.Summary.Confirmed)
    );
    let death = getDay2DoubleTimeSeries(
      trimLastDaysData(this.covidRaw_.Summary.Death)
    );

    let result = [];
    for (let k in confirmed) {
      result.push({
        fulldate: k,
        confirmed: confirmed[k],
        death: death ? death[k] : null,
      });
    }
    return result;
  }
}

export class State {
  constructor(id, covidRaw_, country) {
    this.id = id;
    this.covidRaw_ = covidRaw_;
    this.country_ = country;
    this.name = CountyInfo.getStateNameFromFips(id);
    this.twoLetterName = Object.values(covidRaw_)[0]['StateName']
    if (!this.twoLetterName) {
      this.twoLetterName = CountyInfo.getStateAbbreviationFromFips(this.id);
      if (!this.twoLetterName) {
        console.log(this.name);
        console.log(id);
      }
    }
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

  fips() {
    return this.id;
  }

  country() {
    return this.country_;
  }

  addMetro(id, data, country) {
    this.metros_.set(id, new Metro(id, data, this, country));
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
    return CountyInfo.getStatePopulation(this.twoLetterName);
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
      newpercent: newcases / (confirmed - newcases),
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
  daysToDoubleTimeSeries() {
    let confirmed = getDay2DoubleTimeSeries(
      trimLastDaysData(this.covidRaw_.Summary.Confirmed)
    );
    let death = getDay2DoubleTimeSeries(
      trimLastDaysData(this.covidRaw_.Summary.Death)
    );

    let result = [];
    for (let k in confirmed) {
      result.push({
        fulldate: k,
        confirmed: confirmed[k],
        death: death ? death[k] : null,
      });
    }
    return result;
  }
}

export class Metro {
  constructor(id, covidRaw_, state, country) {
    this.id = id;
    this.covidRaw_ = covidRaw_;
    this.state_ = state;
    this.name = covidRaw_['Name'];
    this.counties_ = this.covidRaw_.Counties.map(id => {
      // not all counties in a metro belong to the same state
      // can't call state.countyForId() directly
      return country.countyForId(id);
    }).filter(c => c); // some county may not have data
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

  daysToDoubleTimeSeries() {
    let confirmed = getDay2DoubleTimeSeries(
      trimLastDaysData(this.covidRaw_.Summary.Confirmed)
    );
    let death = getDay2DoubleTimeSeries(
      trimLastDaysData(this.covidRaw_.Summary.Death)
    );

    let result = [];
    for (let k in confirmed) {
      result.push({
        fulldate: k,
        confirmed: confirmed[k],
        death: death ? death[k] : null,
      });
    }
    return result;
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
    return this.state_.country().metroContainingCounty(this);
  }

  state() {
    return this.state_;
  }

  fips() {
    return this.id;
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
    if (data['Population2010']) {
      this.population_ = parseInt(data['Population2010'].replace(/,/g, ''));
    }
  }
  daysToDoubleTimeSeries() {
    let confirmed = getDay2DoubleTimeSeries(
      trimLastDaysData(this.covidRaw_.Confirmed)
    );
    let death = getDay2DoubleTimeSeries(
      trimLastDaysData(this.covidRaw_.Death)
    );

    let result = [];
    for (let k in confirmed) {
      result.push({
        fulldate: k,
        confirmed: confirmed[k],
        death: death ? death[k] : null,
      });
    }
    return result;
  }
}
