const moment = require('moment');
const {linearRegression} = require('simple-statistics');

const periods = {
  daily: {
    converter: (data) =>
        Object.entries(data)
            .filter(([, value]) => value !== null)
            .map(([date, value]) => [moment(date, 'MM/DD/YYYY'), value])
            .sort(([a,], [b,]) => a.diff(b)),
    formatter: (moment) => moment.format('MM/DD'),
    label: 'Daily',
  },
};

export class DataSeries {

  static fromFormattedDates(label, raw) {
    const lastPoint = lastPointOf(raw, periods.daily);
    const converter = () => periods.daily.converter(raw);
    return new LazyDataSeries(label, raw, converter, lastPoint, periods.daily);
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

      return new LazyDataSeries(name, undefined, generator, lastPoint, this.period_);
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

  lastValue() {
    if (this.lastPoint()) {
      return this.lastPoint()[1];
    } else {
      return undefined;
    }
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
        linearRegression(points.slice(-8, -1).map(([moment, v]) => [moment.unix(), v]));
    const trend = new DataSeries(`${this.label_} (Trend)`, undefined, this.period_);
    trend.points_ =
        points.map(([moment, ]) =>
            [moment, Math.max(0, Math.round(m * moment.unix() + b))]);
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
  return period.converter(Object.fromEntries([[lastTime, lastValue]]))[0];
}

function lastChangeOf(raw, period) {
  const all = Object.entries(raw);
  if (all.length < 2) {
    return undefined;
  }

  const lastTime = all[all.length - 1][0];
  const lastValue = all[all.length - 1][1] - all[all.length - 2][1];
  return period.converter(Object.fromEntries([[lastTime, lastValue]]))[0];
}

class EmptySeries extends DataSeries {

  constructor(label, period) {
    super(label, {}, period);
  }
}

class LazyDataSeries extends DataSeries {

  constructor(label, raw, generator, lastPoint, period) {
    super(label, raw, period);
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
