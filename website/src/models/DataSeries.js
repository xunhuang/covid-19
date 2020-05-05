const moment = require('moment');
const {linearRegression} = require('simple-statistics');

const periods = {
  daily: {
    label: 'Daily',
    doublingLabel: 'Days to Double',
    formatter: (moment) => moment.format('MM/DD'),
    intervalS: 24 * 60 * 60,
    converter: (data) =>
        Object.entries(data)
            .filter(([, value]) => value !== null)
            .map(([date, value]) => [moment(date, 'MM/DD/YYYY'), value])
            .sort(([a,], [b,]) => a.diff(b)),
    pointConverter: (date, value) => [moment(date, 'MM/DD/YYYY'), value],
  },
};

const REGRESSION_WINDOW_SIZE = 7;

export class DataSeries {

  static fromFormattedDates(label, raw) {
    const lastPointGenerator = () => lastPointOf(raw, periods.daily);
    const generator = () => periods.daily.converter(raw);
    return new LazyDataSeries(
        label, raw, generator, lastPointGenerator, periods.daily);
  }

  static flatten(serieses) {
    const points = new Map();
    const formatters = new Set();

    for (const series of serieses) {
      formatters.add(series.formatter());

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

  constructor(label, raw, period) {
		this.label_ = label;
    this.raw_ = raw;
    this.period_ = period;
    this.points_ = undefined;
  }

  label() {
    return this.label_;
  }

  formatter() {
    return this.period_.formatter;
  }

  points() {
    if (!this.points_) {
      this.points_ = this.period_.converter(this.raw_);
    }
    return this.points_;
  }

  lastPoint() {
    if (!this.lastPoint_) {
      const points = this.points();
      this.lastPoint_ = points[points.length - 1];
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

    // We often only want to know the change between the last two values, so if
    // we can avoid generating all the points we should try.
    if (this.raw_) {
      const lastPoint = lastChangeOf(this.raw_, this.period_);
      if (!lastPoint) {
        return new EmptySeries(name, this.period_);
      }
      
      const generator = () => {
        const points = this.points();
        const deltaPoints = [];
        for (let i = 1; i < points.length; ++i) {
          deltaPoints.push([
            points[i][0],
            Math.max(0, points[i][1] - points[i - 1][1]),
          ]);
        }
        return deltaPoints;
      };

      return new LazyDataSeries(
          name, undefined, generator, () => lastPoint, this.period_);
    } else {
      const points = this.points();
      const deltaPoints = [];
      for (let i = 1; i < points.length; ++i) {
        deltaPoints.push([
          points[i][0],
          Math.max(0, points[i][1] - points[i - 1][1]),
        ]);
      }

      const delta = new DataSeries(name, undefined, this.period_);
      delta.points_ = deltaPoints;
      return delta;
    }
  }

  doublingInterval() {
    // TODO: if we want to show this in the table view we'll need to accelerate
    // this. It's easily doable, just ugly.
    const points = this.points();
    const log = points.map(([m, v]) => [m.unix(), Math.log2(v)]);
    const doublings = [];
    for (let i = REGRESSION_WINDOW_SIZE - 1; i < points.length; ++i) {
      const window = log.slice(i - REGRESSION_WINDOW_SIZE, i + 1);
      const {m} = linearRegression(window);
      doublings.push([
        points[i][0],
        1 / (m * this.period_.intervalS),
      ]);
    }

    const doubling =
        new DataSeries(
            `${this.label_} ${this.period_.doublingLabel}`,
            undefined,
            this.period_);
    doubling.points_ = doublings;
    return doubling;
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
    if (points.length < 8) {
      return undefined;
    }

    const {m, b} =
        linearRegression(
            points.slice(-1 - REGRESSION_WINDOW_SIZE, -1)
                .map(([moment, v]) => [moment.unix(), v]));
    const trend =
        new DataSeries(`${this.label_} (Trend)`, undefined, this.period_);
    trend.points_ =
        points.map(([moment, ]) =>
            [moment, Math.max(0, m * moment.unix() + b)]);
    return trend;
  }

  today() {
    const last = this.lastPoint();
    if (!last) {
      return undefined;
    }

    return moment().isSame(last[0], 'day') ? last[1] : undefined;
  }
}

function lastPointOf(raw, period) {
  const all = Object.entries(raw);
  const lastTime = all[all.length - 1][0];
  const lastValue = all[all.length - 1][1];
  return period.pointConverter(lastTime, lastValue);
}

function lastChangeOf(raw, period) {
  const all = Object.entries(raw);
  if (all.length < 2) {
    return undefined;
  }

  const lastTime = all[all.length - 1][0];
  const lastValue = all[all.length - 1][1] - all[all.length - 2][1];
  return period.pointConverter(lastTime, Math.max(0, lastValue));
}

class EmptySeries extends DataSeries {

  constructor(label, period) {
    super(label, {}, period);
  }
}

class LazyDataSeries extends DataSeries {

  constructor(label, raw, generator, lastPointGenerator, period) {
    super(label, raw, period);
    this.generator_ = generator;
    this.lastPointGenerator_ = lastPointGenerator;
  }

  lastPoint() {
    if (!this.lastPoint_) {
      this.lastPoint_ = this.lastPointGenerator_();
    }
    return this.lastPoint_;
  }

  points() {
    if (!this.points_) {
      this.points_ = this.generator_();
    }
    return this.points_;
  }
}
