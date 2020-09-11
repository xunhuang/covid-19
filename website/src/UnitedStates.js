import routes from "./Routes";
import { reverse } from 'named-urls';
import { trimLastDaysData, getDay2DoubleTimeSeries, getGrowthRateTimeSeries } from "./CovidAnalysis";
import { CountyInfo } from 'covidmodule';
import { fetchNPRProjectionData } from "./NPRProjection"
import { fetchTestingDataStates, fetchTestingDataUS } from "./TestingData"
import { fetchPublicCountyData, fetchAllUSData } from "./PublicAllData"
import { mergeDataSeries, makeDataSeriesFromTotal } from "./graphs/DataSeries";
import { DataSeries } from './models/DataSeries';

const CovidData = require('./data/AllData.slim.json');
const CountyGeoData = require('./data/county_gps.json');
const geolib = require('geolib');
const moment = require('moment');
const stateBounds = require("./data/states-bounding.json");

const statemap = stateBounds.reduce((m, b) => {
  m[b.STATEFP] = b;
  return m;
}, {});

const UNKNOWN_COUNTY_NAME = "Unknown";

function datesToDataPoints(raw) {
  const days = Object.keys(raw.Confirmed).sort(sortByDate);
  let projection = null;
  if (raw.ProjectionMIT) {
    projection = makeDataSeriesFromTotal(raw.ProjectionMIT.Confirmed, "confirmed_projected", "confirmed_new_projected");
  }

  let data = days.map(day => {
    const entry = {};
    entry.confirmed = raw.Confirmed[day];
    entry.death = raw.Death[day];
    if (raw.Recovered) {
      entry.recovery = raw.Recovered[day];
    }
    entry.fulldate = day;
    return entry;
  });

  data = mergeDataSeries(data, projection);
  return data;
}

function sortByDate(a, b) {
  return moment(a, 'MM/DD/YYYY').toDate() - moment(b, 'MM/DD/YYYY').toDate();
}

export class CovidSummarizable {
  constructor(raw) {
    this.covidRaw_ = raw;
    if (this.covidRaw_) {
      if (this.covidRaw_.Summary) {
        this.normalizedRaw_ = this.covidRaw_.Summary;
      } else {
        this.normalizedRaw_ = this.covidRaw_;
      }
    }
  }

  hospitals() {
    if (!this.normalizedRaw_) {
      return {
        'bedCount': "N/A",
        'count': "N/A",
      };
    }

    return {
      count: this.normalizedRaw_.hospitals, // to be deprecated
      bedCount: this.normalizedRaw_.beds,   // to be deprecated
      bedsICU: this.normalizedRaw_.bedsICU,
      bedsAvail: this.normalizedRaw_.bedsAvail,
      hospitals: this.normalizedRaw_.hospitals,
      beds: this.normalizedRaw_.beds,
    };
  }

  summary() {
    if (!this.normalizedRaw_) {
      return {
        confirmed: 0,
        newcases: 0,
        deathsNew: 0,
        death: 0,
        newpercent: 0,
        daysToDouble: null,
        daysToDoubleDeath: null,
      };
    }

    const confirmed = this.normalizedRaw_.LastConfirmed;
    const newcases = this.normalizedRaw_.LastConfirmedNew;
    const summarized = {
      confirmed: confirmed,
      deaths: this.normalizedRaw_.LastDeath,
      deathsNew: this.normalizedRaw_.LastDeathNew,
      newcases: newcases,
      newpercent: newcases / (confirmed - newcases),
      recovered: this.normalizedRaw_.LastRecovered,
      recoveredNew: this.normalizedRaw_.LastRecoveredNew,
      tests: this.normalizedRaw_.totalTests,
    };

    if (this.normalizedRaw_.DaysToDouble) {
      summarized.daysToDouble = this.normalizedRaw_.DaysToDouble;
    }
    if (this.normalizedRaw_.DaysToDoubleDeath) {
      summarized.daysToDoubleDeath = this.normalizedRaw_.DaysToDoubleDeath;
    }
    if (this.normalizedRaw_.generated) {
      summarized.generatedTime =
        (new Date(this.normalizedRaw_.generated)).toString();
    }

    return summarized;
  }

  totalConfirmed() {
    return this.summary().confirmed;
  }

  serverityIndex() {
    if (!this.population()) {
      return 0;
    }
    return this.normalizedRaw_.Last2WeeksConfirmedDelta / this.population();
  }
}

export class Country extends CovidSummarizable {

  constructor() {
    super(CovidData);
    this.fetchedAllData = false;

    // Metros span state lines, but we have a notion of a hierarchy in
    // header:
    // county -> metro (maybe) -> state -> country
    //
    // To make this work, we make a Metro object for every state a metro
    // intersects. metroByStatesByIds_ is a
    // Map<metro id, Map<state two letter code, Metro>>
    this.metroByStatesByIds_ = new Map();
    this.statesById_ = new Map();
    this.statesByTwoLetterName_ = new Map();
    this.countiesById_ = new Map();
    this.name = "United States";
    this.shortName = "US";

    for (const [id, data] of Object.entries(this.covidRaw_)) {
      // Check if this looks like a state FIPS id
      if (isNaN(id)) {
        continue;
      }

      const state = new State(id, data, this);
      this.statesById_.set(id, state);
      this.statesByTwoLetterName_.set(state.twoLetterName, state);
    }

    for (const data of CountyGeoData) {
      const id = data.FIPS.padStart(5, '0');
      const stateId = id.substring(0, 2);
      this.statesById_.get(stateId).countyForId(id).update(data);
    }

    for (const state of this.statesById_.values()) {
      for (const county of state.allCounties()) {
        this.countiesById_.set(county.id, county);
      }
    }

    for (const [id, data] of Object.entries(this.covidRaw_.Metros)) {
      const metroByStates = new Map();
      this.metroByStatesByIds_.set(id, metroByStates);

      const states = new Set();
      for (const county of data.Counties) {
        states.add(this.countiesById_.get(county).state());
      }
      states.forEach(state => {
        state.addMetro(id, data, this);
        metroByStates.set(state.id, state.metroForId(id));
      });
    }

    this.statesById_.forEach(state => state.reindex());
  }

  async fetchAllUSCountyData() {
    if (this.fetchedAllData) {
      return;
    }
    let countydata = await fetchAllUSData();
    for (const [id, stateraw] of Object.entries(countydata)) {
      // Check if this looks like a state FIPS id
      if (isNaN(id)) {
        continue;
      }

      for (const [fips, countyraw] of Object.entries(stateraw)) {
        if (isNaN(fips)) {
          continue;
        }
        const county = this.countiesById_.get(fips);
        county.covidRaw_ = countyraw;
      }
    }
    this.fetchedAllData = true;
  }

  parent() {
    return undefined;
  }

  children() {
    return this.allStates();
  }

  testData() {
    return {
      totalTests: this.covidRaw_.Summary.totalTests,
      totalTestPositive: this.covidRaw_.Summary.totalTestPositive,
      hospitalized: this.covidRaw_.Summary.hospitalized,
      hospitalizedIncreased: this.covidRaw_.Summary.hospitalizedIncreased,
    }
  }

  countyForId(id) {
    return this.countiesById_.get(id);
  }

  allStates() {
    return [...this.statesById_.values()];
  }

  allCounties() {
    return [...this.countiesById_.values()];
  }

  metroByStatesForId(id) {
    return this.metroByStatesByIds_.get(id);
  }

  allMetros() {
    return Array.from(this.metroByStatesByIds_.values())
      .map(
        metroByStates =>
          // Only grab one state if it spans state lines
          metroByStates.values().next().value);
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

  dataPoints() {
    return datesToDataPoints(this.covidRaw_.Summary);
  }

  async confirmDataSeriesAsync() {
    const data = await this.dataPointsAsync();
    return DataSeries
      .fromOldDataSourceDataPoints("Confirmed", data, "confirmed");
  }

  async deathDataSeriesAsync() {
    const data = await this.dataPointsAsync();
    return DataSeries
      .fromOldDataSourceDataPoints("Death", data, "death");
  }

  async deathsAsync() {
    return this.covidRaw_.Summary.Death;
  }

  async projectionsAsync() {
    let data = await fetchNPRProjectionData();
    return data.filter(d => d.location_name === "United States of America");
  }

  async testingAsync() {
    return await fetchTestingDataUS();
  }

  async testingAllAsync() {
    let data = await fetchTestingDataStates();
    return data;
  }

  async hospitalizationCurrentlyAsync() {
    const data = await fetchTestingDataUS();
    return DataSeries
      .fromOldDataSourceDataPoints(
        "Hospitalized Currently",
        data,
        "hospitalizedCurrently"
      );
  }

  async daysToDoubleTimeSeries() {
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

  population() {
    return 331002651;
  }

  async growthRateTimeSeries() {
    let confirmed = getGrowthRateTimeSeries(
      trimLastDaysData(this.covidRaw_.Summary.Confirmed)
    );
    let death = getGrowthRateTimeSeries(
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

  countyMapConfig() {
    return {
      geoUrl: "https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json",
      projection: {
        projection: "geoAlbersUsa",
      }
    }
  }
}

export class State extends CovidSummarizable {
  constructor(id, covidRaw, country) {
    super(covidRaw);

    this.id = id;
    this.country_ = country;
    this.name = CountyInfo.getStateNameFromFips(id);
    this.twoLetterName = Object.values(covidRaw)[0]['StateName']
    this.shortName = this.twoLetterName;

    if (!this.twoLetterName) {
      this.twoLetterName = CountyInfo.getStateAbbreviationFromFips(this.id);
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

  parent() {
    return this.country();
  }

  children() {
    return this.allCounties();
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
  dataPoints() {
    return datesToDataPoints(this.covidRaw_.Summary);
  }

  async confirmDataSeriesAsync() {
    const data = await this.dataPointsAsync();
    return DataSeries
      .fromOldDataSourceDataPoints("Confirmed", data, "confirmed");
  }

  async deathDataSeriesAsync() {
    const data = await this.dataPointsAsync();
    return DataSeries
      .fromOldDataSourceDataPoints("Death", data, "death");
  }

  async deathsAsync() {
    return this.covidRaw_.Summary.Death;
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

  async testingAsync() {
    let data = await fetchTestingDataStates();
    return data.filter(d => d.state === this.twoLetterName)
      .sort((a, b) => a.date - b.date);
  }

  async hospitalizationCurrentlyAsync() {
    const data = await this.testingAsync();
    return DataSeries
      .fromOldDataSourceDataPoints(
        "Hospitalized Currently",
        data,
        "hospitalizedCurrently"
      );
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
  async daysToDoubleTimeSeries() {
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

  async growthRateTimeSeries() {
    let confirmed = getGrowthRateTimeSeries(
      trimLastDaysData(this.covidRaw_.Summary.Confirmed)
    );
    let death = getGrowthRateTimeSeries(
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

  getProjectionConfig_(state_fips) {
    let state1 = statemap[state_fips];
    let x = (parseFloat(state1.xmin) + parseFloat(state1.xmax)) / 2;
    let y = (parseFloat(state1.ymin) + parseFloat(state1.ymax)) / 2;
    let xscale =
      (800 * 180) / (parseFloat(state1.xmax) - parseFloat(state1.xmin));
    let yscale =
      (600 * 180) / (parseFloat(state1.ymax) - parseFloat(state1.ymin));
    let scale = xscale > yscale ? yscale : xscale;
    scale = scale * 0.3;

    // manually tune some state that doens't show up well.
    if (state_fips === "02") {
      return {
        scale: 2000,
        rotate: [149.4937, -64.2008, 0]
      };
    }
    if (state_fips === "15") {
      return {
        scale: 5836,
        rotate: [157.57, -19.65624, 0]
      };
    }
    return {
      scale: scale,
      rotate: [-x, -y, 0]
    };
  }

  countyMapConfig() {
    const fips = this.fips();
    if (fips === "88" || fips === "99" || fips === "97" || fips === "98" || fips === "96") {
      return null;
    }
    return {
      geoUrl: process.env.PUBLIC_URL + `/topojson/us-states/${this.twoLetterName}-${this.fips()}-${this.name.toLowerCase().replace(" ", "-")}-counties.json`,
      projection: {
        projection: "geoMercator",
        config: this.getProjectionConfig_(this.fips()),
      }
    }
  }
}

export class Metro extends CovidSummarizable {
  constructor(id, covidRaw, state, country) {
    super(covidRaw);

    this.id = id;
    this.state_ = state;
    this.name = covidRaw['Name'];
    this.counties_ = this.covidRaw_.Counties.map(id => {
      // not all counties in a metro belong to the same state
      // can't call state.countyForId() directly
      return country.countyForId(id);
    }).filter(c => c); // some county may not have data
  }

  children() {
    return this.allCounties();
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

  population() {
    let p = 0;
    for (let c of this.counties_) {
      p = p + c.population();
    }
    return p;

  }

  routeTo() {
    return reverse(routes.metro, { metro: this.id });
  }

  async dataPointsAsync() {
    return datesToDataPoints(this.covidRaw_.Summary);
  }
  dataPoints() {
    return datesToDataPoints(this.covidRaw_.Summary);
  }
  async confirmDataSeriesAsync() {
    const data = await this.dataPointsAsync();
    return DataSeries
      .fromOldDataSourceDataPoints("Confirmed", data, "confirmed");
  }

  async deathDataSeriesAsync() {
    const data = await this.dataPointsAsync();
    return DataSeries
      .fromOldDataSourceDataPoints("Death", data, "death");
  }
  async deathsAsync() {
    return this.covidRaw_.Summary.Death;
  }

  newCases() {
    return this.covidRaw_.Summary.LastConfirmedNew;
  }

  async daysToDoubleTimeSeries() {
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

  async growthRateTimeSeries() {
    let confirmed = getGrowthRateTimeSeries(
      trimLastDaysData(this.covidRaw_.Summary.Confirmed)
    );
    let death = getGrowthRateTimeSeries(
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

export class County extends CovidSummarizable {
  constructor(id, covidRaw, state) {
    super(covidRaw);

    this.id = id;

    if (covidRaw) {
      this.name = covidRaw['CountyName'];
      this.population_ = covidRaw.Population;
      this.hospitalization_ = covidRaw.hospitalization;
      this.ca_county_status = covidRaw.ca_county_status;

    } else {
      this.name = UNKNOWN_COUNTY_NAME;
    }

    if (this.name === "New York City") {
      this.name = "New York";
    }

    this.state_ = state;
  }

  ca_status() {
    return this.ca_county_status;
  }

  metro() {
    return this.state_.metroContainingCounty(this);
  }

  state() {
    return this.state_;
  }

  parent() {
    return this.metro() || this.state();
  }

  children() {
    return null;
  }

  fips() {
    return this.id;
  }

  hospitalization() {
    return this.hospitalization_;
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
  dataPoints() {
    return datesToDataPoints(this.covidRaw_.Summary);
  }
  async confirmDataSeriesAsync() {
    const data = await this.dataPointsAsync();
    return DataSeries
      .fromOldDataSourceDataPoints("Confirmed", data, "confirmed");
  }

  async deathDataSeriesAsync() {
    const data = await this.dataPointsAsync();
    return DataSeries
      .fromOldDataSourceDataPoints("Death", data, "death");
  }

  getConfirmedByDate(date) {
    if (!date || !this.covidRaw_) {
      return this.summary().confirmed;
    }
    const confirmed = this.covidRaw_.Confirmed;
    if (confirmed) {
      return confirmed[date];
    }
    return undefined;
  }

  getDeathsByDate(date) {
    if (!date || !this.covidRaw_) {
      return this.summary().deaths;
    }
    const death = this.covidRaw_.Death;
    if (death) {
      return death[date];
    }
    return undefined;
  }

  getConfirmedNewByDate(date) {
    if (!date || !this.covidRaw_) {
      return this.summary().newcases;
    }
    const d1 = this.getConfirmedByDate(date);
    const d2 = this.getConfirmedByDate(moment(date, "MM/DD/YYYY").subtract(1, "days").format("MM/DD/YYYY"));
    if (!d1) {
      return 0;
    }
    if (!d2) {
      return d1
    }
    return d1 - d2;
  }

  async deathsAsync() {
    if (!this.covidRaw_.Death) {
      await this._fetchServerData();
    }
    return this.covidRaw_.Death;
  }

  population() {
    return this.population_;
  }

  stayHomeOrder() {
    return this.covidRaw_.StayHomeOrder;
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

  async daysToDoubleTimeSeries() {
    if (!this.covidRaw_.Confirmed) {
      await this._fetchServerData();
    }

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

  async growthRateTimeSeries() {
    if (!this.covidRaw_.Confirmed) {
      await this._fetchServerData();
    }

    let confirmed = getGrowthRateTimeSeries(
      trimLastDaysData(this.covidRaw_.Confirmed)
    );
    let death = getGrowthRateTimeSeries(
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
