import { fitVirusCV19 } from "../math/FitVirusCV19";
import { ma } from 'moving-averages'
const moment = require('moment');
const { linearRegression } = require('simple-statistics');

const periods = {
  daily: {
    doublingLabel: 'Days to Double',
    smoothLabel: 'd',
    formatter: (moment) => moment.format('M/D'),
    intervalS: 24 * 60 * 60,
    converter: (data) =>
      data
        .map(([timestamp, value]) => [moment.unix(timestamp), value])
        .sort(([a,], [b,]) => a.diff(b)),
    pointConverter: ([timestamp, value]) => [moment.unix(timestamp), value],
  },
};

const REGRESSION_WINDOW_SIZE = 6;
const SMOOTH_WINDOW_SIZE = 3;

/**
 * A data series is a label with a collection of values at specific moments.
 */
export class DataSeries {

  static fromTimestamps(label, raw) {
    if (raw.length > 0) {
      return new DataSeries(label, raw, periods.daily);
    } else {
      return new EmptySeries(label, periods.daily);
    }
  }

  static fromOldDataSourceDataPoints(label, data, column) {
    let raw = [];
    for (const point of data) {
      let ts = moment(point.fulldate, "MM/DD/YYYY").unix();
      let value = point[column];
      raw.push([ts, value]);
    }
    return new DataSeries(label, raw, periods.daily);
  }

  static fromDateStr(label, data) {
    let raw = [];
    for (var key in data) {
      let ts = moment(key, "MM/DD/YYYY").unix();
      let value = data[key];
      raw.push([ts, value]);
    }
    return new DataSeries(label, raw, periods.daily);
  }

  static flatten(serieses) {
    const points = new Map();
    const formatters = new Set();

    for (const series of serieses) {
      if (!series) {
        continue;
      }
      formatters.add(series.formatter());

      if (!series.points()) {
        continue;
      }

      for (const [moment, value] of series.points()) {
        const key = moment.unix();
        if (!points.has(key)) {
          points.set(key, {});
        }

        points.get(key)[series.label()] = value;
      }
    }

    if (formatters.size > 1) {
      throw new Error('Multiple formatters are not allowed');
    } else if (formatters.size === 0) {
      throw new Error('No formatter found');
    }
    const formatter = formatters.values().next().value;

    return {
      data:
        [...points.entries()]
          .sort(([a,], [b,]) => a - b)
          .map(([timestamp, data]) => ({
            timestamp,
            ...data,
          })),
      timestampFormatter: (timestamp) => formatter(moment.unix(timestamp)),
    };
  }

  static alignT0(serieses) {
    const points = new Map();
    for (const series of serieses) {
      if (!series.points()) {
        continue;
      }

      for (const [moment, value] of series.points()) {
        let t0 = series.t0_;
        const key = moment.unix() - t0;
        if (key >= 0) {
          if (!points.has(key)) {
            points.set(key, {});
          }
          points.get(key)[series.label()] = value;
        }
      }
    }

    return {
      data:
        [...points.entries()]
          .sort(([a,], [b,]) => a - b)
          .map(([timestamp, data]) => ({
            timestamp,
            ...data,
          })),
      timestampFormatter: (timestamp) => timestamp / (24 * 60 * 60),
    };
  }

  constructor(label, raw, period) {
    this.label_ = label;
    this.raw_ = raw;
    this.period_ = period;
    this.points_ = undefined;
    this.lastPoint_ = undefined;
  }

  label() {
    return this.label_;
  }

  suffixLabel(suffix) {
    this.label_ = `${this.label_} ${suffix}`;
    return this;
  }

  setT0(t0) {
    this.t0_ = t0;
    return this;
  }

  formatter() {
    return this.period_.formatter;
  }

  setLabel(label) {
    this.label_ = label;
    return this;
  }

  points() {
    if (!this.points_ && this.raw_.length > 0) {
      this.points_ = this.period_.converter(this.raw_);
    }
    return this.points_;
  }

  pointLargerEqualThan(x) {
    for (const [m, v] of this.points_) {
      if (v >= x) {
        return [m, v];
      }
    }
    return null;
  }

  valueByUnixTimestamp(date) {
    if (!this.valueByUnixTimestamp_ && this.raw_.length > 0) {
      this.valueByUnixTimestamp_ = this.raw_.reduce(
        (m, a) => {
          const [ts, v] = a;
          m[ts] = v;
          return m;
        }, {});
    }
    const value = this.valueByUnixTimestamp_[date];
    return value;
  }

  lastPoint() {
    if (!this.lastPoint_ && this.raw_.length > 0) {
      this.lastPoint_ =
        this.period_.pointConverter(this.raw_[this.raw_.length - 1]);
    }
    return this.lastPoint_;
  }

  lastValue() {
    if (this.lastPoint()) {
      return this.lastPoint()[1];
    } else {
      return undefined;
    }
  }

  change() {
    const name = `New ${this.label_}`;
    this.points(); // To ensure lazy dataseries are loaded
    const entries = this.points_ || this.raw_;
    if (entries.length < 1) {
      return new EmptySeries(name, this.period_);
    }

    // We often only want to know the change between the last two values, so
    // pregenerate those.
    // Every* series has an implicit first value of 0, because places only show
    // up in the data when they have a case. So account for it.
    //
    // *except for projections
    const secondToLastValue =
      entries.length >= 2 ? entries[entries.length - 2][1] : 0;
    if (typeof entries[0][0] === 'number') {
      this.lastPoint_ = this.period_.pointConverter(entries[entries.length - 1]);
    } else {
      this.lastPoint_ = entries[entries.length - 1];
    }
    const lastChange = this.lastPoint_[1] - secondToLastValue;

    const generator = () => {
      const points = this.points();
      const deltaPoints = [];
      deltaPoints.push([points[0][0], points[0][1]]);
      for (let i = 1; i < points.length; ++i) {
        deltaPoints.push([
          points[i][0],
          Math.max(0, points[i][1] - points[i - 1][1]),
        ]);
      }
      return deltaPoints;
    };

    return new LazyDataSeries(
      name,
      generator,
      [this.lastPoint_[0], lastChange],
      this.period_);
  }

  daysTo2X() {
    let points = this.doublingInterval().points();
    if (points) {
      for (let i = points.length - 1; i >= 0; i--) {
        let v = points[i][1];
        if (!isNaN(v)) {
          return v;
        }
      }
    }
    return 9999;
  }

  dailyGrowthRate() {
    return Math.exp(Math.log(2) * (1 / this.daysTo2X())) - 1;
  }

  doublingInterval() {
    const name = `${this.label_} ${this.period_.doublingLabel}`;

    const entries = this.points_ || this.raw_;
    if (entries.length < REGRESSION_WINDOW_SIZE) {
      return new EmptySeries(name, this.period_);
    }

    const lastWindow = entries.slice(entries.length - REGRESSION_WINDOW_SIZE);
    const lastLogs =
      lastWindow
        .map(([timestamp, v]) => [timestamp, Math.log2(v)]);
    const { m } = linearRegression(lastLogs);
    const value = 1 / (m * this.period_.intervalS);
    const lastDoubleValue = !isNaN(value) && 0 < value && value <= 100 ? value : NaN;
    const lastDouble = [this.lastPoint()[0], lastDoubleValue];

    const generator = () => {
      const points = this.points();
      const log = points.map(([m, v]) => [m.unix(), Math.log2(v)]);
      const doublings = [];
      for (let i = REGRESSION_WINDOW_SIZE; i < points.length - 1; ++i) {
        const window = log.slice(i - REGRESSION_WINDOW_SIZE, i + 1);
        const { m } = linearRegression(window);
        const value = 1 / (m * this.period_.intervalS);
        doublings.push([
          points[i][0],
          !isNaN(value) && 0 < value && value <= 100 ? value : NaN,
        ]);
      }

      doublings.push(lastDouble);
      return doublings;
    };

    return new LazyDataSeries(name, generator, lastDouble, this.period_);
  }

  /**
   * Removes the first point from the series. This is useful for when taking the
   * change of a series that does not start from 0.
   */
  dropFirst() {
    const points = this.points();
    if (!points || points.length < 1) {
      return undefined;
    }

    const dropped = new DataSeries(this.label_, undefined, this.period_);
    dropped.points_ = points.slice(1);
    return dropped;
  }

  last2PointSeries() {
    const points = this.points();
    if (!points || points.length < 2) {
      return new EmptySeries("empty", this.period_);
    }
    const dropped = new DataSeries(this.label_, undefined, this.period_);
    dropped.points_ = [
      points[points.length - 2],
      points[points.length - 1],
    ];
    return dropped;
  }

  dropLastPoint() {
    const points = this.points();
    if (!points || points.length < 1) {
      return undefined;
    }
    const dropped = new DataSeries(this.label_, undefined, this.period_);
    dropped.points_ = points.slice(0, points.length - 1);

    return dropped;
  }

  divide(inputseries) {
    console.assert(this.points().length === inputseries.points().length);
    const points = this.points();
    const denominator = inputseries.points();

    const result = [];
    for (let i = 0; i < points.length; i++) {
      result.push([
        points[i][0],
        points[i][1] / denominator[i][1],
      ]);
    }

    const series = new DataSeries("division", undefined, this.period_);
    series.points_ = result;
    console.log(result);
    return series;
  }

  nDayAverage(MOVING_WIN_SIZE) {
    const name = `${this.label_} (${MOVING_WIN_SIZE}-${this.period_.smoothLabel} avg)`;
    let points = this.points();
    if (!points) {
      return new EmptySeries(name, this.period_);
    }

    const values = points.map(p => p[1]);
    let avg = ma(values, MOVING_WIN_SIZE);
    const smoothed = [];

    for (let i = 0; i < points.length; i++) {
      smoothed.push([
        points[i][0],
        avg[i],
      ]);
    }

    const series = new DataSeries(name, undefined, this.period_);
    series.points_ = smoothed;
    return series;
  }

  smooth() {
    const name = `${this.label_} (${SMOOTH_WINDOW_SIZE} ${this.period_.smoothLabel} avg)`;

    const points = this.points();
    if (points.length < SMOOTH_WINDOW_SIZE) {
      return new EmptySeries(name, this.period_);
    }

    const smoothed = [];
    for (let i = SMOOTH_WINDOW_SIZE - 1; i < points.length; ++i) {
      const window = points.slice(i - SMOOTH_WINDOW_SIZE + 1, i + 1)
      const sum = window.reduce((sum, [, v]) => Math.max(v, 0) + sum, 0);
      smoothed.push([
        points[i][0],
        sum / SMOOTH_WINDOW_SIZE,
      ]);
    }

    const series = new DataSeries(name, undefined, this.period_);
    series.points_ = smoothed;
    return series;
  }

  capita(population) {
    const name = `${this.label_}`;

    const points = this.points();
    const capita = [];
    for (let i = 0; i < points.length; ++i) {
      capita.push([
        points[i][0],
        points[i][1] / population,
      ]);
    }

    const series = new DataSeries(name, undefined, this.period_);
    series.points_ = capita;
    return series;
  }

  sum() {
    let sum = 0;
    for (const [, value] of this.points()) {
      sum += value;
    }
    return sum;
  }

  trend() {
    const points = this.points();
    if (!points || points.length < 8) {
      return undefined;
    }

    const linear = trendFit(this.label_, points, this.period_, (v) => v, (p) => p);
    const log =
      trendFit(
        this.label_,
        points,
        this.period_,
        (v) => Math.log2(v),
        (p) => Math.exp(p * Math.log(2)));

    if (linear.error < log.error) {
      return linear.series;
    } else {
      return log.series;
    }
  }

  fitVirusCV19Prediction() {
    const name = `Prediction for ${this.label_}`;

    const generator = () => {
      try {
        const points = this.points();
        if (points.length < 1) {
          return new EmptySeries(name, this.period_);
        }
        const startdate = points[0][0].unix();
        const C = points.map((p) => p[1]);
        const [Ca, newstartdate] = fitVirusCV19(C, startdate);
        return Ca.map((v, i) => [moment.unix(newstartdate.unix()).add(i, 'days'), v]);
      } catch {
        return new EmptySeries(name, this.period_);
      }
    };

    return new LazyDataSeries(name, generator, this.lastPoint(), this.period_);
  }

  today() {
    const last = this.lastPoint();
    if (!last) {
      return undefined;
    }

    return moment().isSame(last[0], 'day') ? last[1] : undefined;
  }

  // if ts is in the future, return the last valid datapoint
  dateOrLastValue(ts) {
    const [mdate, v] = this.lastPoint();
    if (mdate.unix() < ts) {
      return v;
    } else {
      return this.valueByUnixTimestamp(ts);
    }
  }

  // if ts is in the future, return the last valid datapoint
  dateOrLastValueNew(ts) {
    const [mdate] = this.lastPoint();
    let t0 = (mdate.unix() < ts) ? mdate.unix() : ts;
    // let tminus1 = moment(t0).subtract(1, "days").unix();
    let tminus1 = t0 - 24 * 60 * 60;
    let v0 = this.valueByUnixTimestamp(t0);
    let v1 = this.valueByUnixTimestamp(tminus1);
    return v0 - v1;
  }
}

class EmptySeries extends DataSeries {

  constructor(label, period) {
    super(label, [], period);
  }
}

class LazyDataSeries extends DataSeries {

  constructor(label, generator, lastPoint, period) {
    super(label, undefined, period);
    this.generator_ = generator;
    this.lastPoint_ = lastPoint;
  }

  points() {
    if (!this.points_) {
      this.points_ = this.generator_();
    }
    return this.points_;
  }
}

function positiveOrNothing(value) {
  return value >= 0 ? value : NaN;
}

function trendFit(label, points, period, valueMapper, predictionMapper) {
  const { m, b } =
    linearRegression(
      points.slice(-1 - REGRESSION_WINDOW_SIZE, -1)
        .map(([moment, v]) => [moment.unix(), valueMapper(v)]));
  if (isNaN(m) || isNaN(b)) {
    return { series: undefined, error: 9999999999 };
  }

  const trend =
    new DataSeries(`${label} (Trend)`, undefined, period);
  trend.points_ =
    points.map(([moment,]) =>
      [moment, predictionMapper(positiveOrNothing(m * moment.unix() + b))]);

  let error = 0;
  for (let i = 0; i < points.length; ++i) {
    const difference = points[i][1] - (trend.points_[i][1] || 0);
    error += difference * difference;
  }

  return { series: trend, error };
}
