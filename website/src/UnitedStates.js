import routes from "./Routes";
import { reverse } from 'named-urls';
import { trimLastDaysData, getDay2DoubleTimeSeries } from "./CovidAnalysis";
import { CountyInfo } from 'covidmodule';
import { fetchNPRProjectionData } from "./NPRProjection"
import { fetchTestingDataStates, fetchTestingDataUS } from "./TestingData"
import { fetchPublicCountyData } from "./PublicAllData"

const CovidData = require('./data/AllData.slim.json');
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
    this.longName = "United States";

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

  testData() {
    return {
      totalTests: this.covidRaw_.Summary.totalTests,
      totalTestPositive: this.covidRaw_.Summary.totalTestPositive,
      hospitalized: this.covidRaw_.Summary.hospitalized,
      hospitalizedIncreased: this.covidRaw_.Summary.hospitalizedIncreased,
    }
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

  allMetros() {
    return [...this.metrosById_.values()];
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

  async dataPointsAsync() {
    return datesToDataPoints(this.covidRaw_.Summary);
  }

  async deathsAsync() {
    return this.covidRaw_.Summary.Death;
  }

  hospitals() {
    return {
      count: this.covidRaw_.Summary.hospitals, // to be deprciated
      bedCount: this.covidRaw_.Summary.beds,   // to be deprciated
      bedsICU: this.covidRaw_.Summary.bedsICU,
      bedsAvail: this.covidRaw_.Summary.bedsAvail,
      hospitals: this.covidRaw_.Summary.hospitals,
      beds: this.covidRaw_.Summary.beds,
    };
  }

  async projectionsAsync() {
    let data = await fetchNPRProjectionData();
    return data.filter(d => d.location_name === "United States of America");
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

  async testingAsync() {
    return await fetchTestingDataUS();
  }
  async testingAllAsync() {
    let data = await fetchTestingDataStates();
    console.log(data);
    return data;
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
    this.longName = this.name;
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

    this.hospitals_ = {
      count: covidRaw_.Summary.hospitals, // to be deprciated
      bedCount: covidRaw_.Summary.beds,   // to be deprciated
      bedsICU: covidRaw_.Summary.bedsICU,
      bedsAvail: covidRaw_.Summary.bedsAvail,
      hospitals: covidRaw_.Summary.hospitals,
      beds: covidRaw_.Summary.beds,
    };

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

  parent() {
    return this.country();
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

  testData() {
    return {
      totalTests: this.covidRaw_.Summary.totalTests,
      totalTestPositive: this.covidRaw_.Summary.totalTestPositive,
      hospitalized: this.covidRaw_.Summary.hospitalized,
      hospitalizedIncreased: this.covidRaw_.Summary.hospitalizedIncreased,
    }
  }

  async dataPointsAsync() {
    return datesToDataPoints(this.covidRaw_.Summary);
  }

  async deathsAsync() {
    return this.covidRaw_.Summary.Death;
  }

  hospitals() {
    return this.hospitals_;
  }

  newCases() {
    return this.covidRaw_.Summary.LastConfirmedNew;
  }

  population() {
    return CountyInfo.getStatePopulation(this.twoLetterName);
  }

  async projectionsAsync() {
    let data = await fetchNPRProjectionData();
    return data.filter(d => d.location_name === this.name);
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
      deaths: this.covidRaw_.Summary.LastDeath,
      deathsNew: this.covidRaw_.Summary.LastDeathNew,
      newpercent: newcases / (confirmed - newcases),
      daysToDouble: this.covidRaw_.Summary.DaysToDouble,
      daysToDoubleDeath: this.covidRaw_.Summary.DaysToDoubleDeath,
      recovered: this.covidRaw_.Summary.LastRecovered,
      recoveredNew: this.covidRaw_.Summary.LastRecoveredNew,
    }
  }

  async testingAsync() {
    let data = await fetchTestingDataStates();
    return data.filter(d => d.state === this.twoLetterName)
      .sort((a, b) => a.date - b.date);
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
    this.longName = `${this.name}, ${this.state_.longName}`;
    this.counties_ = this.covidRaw_.Counties.map(id => {
      // not all counties in a metro belong to the same state
      // can't call state.countyForId() directly
      return country.countyForId(id);
    }).filter(c => c); // some county may not have data
    this.hospitals_ = {
      count: covidRaw_.Summary.hospitals, // to be deprciated
      bedCount: covidRaw_.Summary.beds,   // to be deprciated
      bedsICU: covidRaw_.Summary.bedsICU,
      bedsAvail: covidRaw_.Summary.bedsAvail,
      hospitals: covidRaw_.Summary.hospitals,
      beds: covidRaw_.Summary.beds,
    };
  }

  allCounties() {
    return this.counties_;
  }

  state() {
    return this.state_;
  }

  parent() {
    return this.state();
  }

  routeTo() {
    return reverse(routes.metro, { metro: this.id });
  }

  async dataPointsAsync() {
    return datesToDataPoints(this.covidRaw_.Summary);
  }
  async deathsAsync() {
    return this.covidRaw_.Summary.Death;
  }

  hospitals() {
    return this.hospitals_;
  }

  summary() {
    const raw = Object.assign({}, this.covidRaw_['Summary']);
    return Object.assign(raw, {
      confirmed: raw.LastConfirmed,
      newcases: raw.LastConfirmedNew,
      deaths: raw.LastDeath,
      deathsNew: raw.LastDeathNew,
      recovered: '-', // raw.recovered
    });
  }

  totalConfirmed() {
    if (!this.covidRaw_) {
      return 0;
    }

    return this.covidRaw_.Summary.LastConfirmed;
  }

  newCases() {
    return this.covidRaw_.Summary.LastConfirmedNew;
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
      this.hospitals_ = {
        count: covidRaw_.hospitals, // to be deprciated
        bedCount: covidRaw_.beds,   // to be deprciated
        bedsICU: covidRaw_.bedsICU,
        bedsAvail: covidRaw_.bedsAvail,
        hospitals: covidRaw_.hospitals,
        beds: covidRaw_.beds,
      };
      this.population_ = covidRaw_.Population;
    } else {
      this.name = UNKNOWN_COUNTY_NAME;
    }

    if (this.name === "New York City") {
      this.name = "New York";
    }

    this.state_ = state;
    this.longName = `${this.name}, ${this.state_.longName}`;

  }

  metro() {
    return this.state_.country().metroContainingCounty(this);
  }

  state() {
    return this.state_;
  }

  parent() {
    return this.state();
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

  async _fetchServerData() {
    let serverdata = await fetchPublicCountyData(this.state().fips(), this.id);
    if (serverdata) {
      this.covidRaw_ = serverdata;
    }
  }

  async dataPointsAsync() {
    if (!this.covidRaw_.Confirmed) {
      await this._fetchServerData();
    }
    return datesToDataPoints(this.covidRaw_);
  }
  async deathsAsync() {
    if (!this.covidRaw_.Death) {
      await this._fetchServerData();
    }
    return this.covidRaw_.Death;
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
      deaths: this.covidRaw_.LastDeath,
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

  newCases() {
    if (!this.covidRaw_) {
      return 0;
    }

    return this.covidRaw_.LastConfirmedNew;
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
