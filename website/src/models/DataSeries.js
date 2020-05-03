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
    return new DataSeries(label, raw, periods.daily);
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

  change() {
    const points = this.points();
    const deltaPoints = [];
    for (let i = 1; i < points.length; ++i) {
      deltaPoints.push([
        points[i][0],
        Math.max(0, points[i][1] - points[i - 1][1]),
      ]);
    }

    const delta = new DataSeries(`New ${this.label_}`, undefined, this.period_);
    delta.points_ = deltaPoints;
    return delta;
  }

  lastValue() {
    const points = this.points();
    if (points.length === 0) {
      return undefined;
    } else {
      return points[points.length - 1][1];
    }
  }

  sum() {
    let sum = 0;
    for (const value of Object.values(this.raw_)) {
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
    const points = this.points();
    if (points.length === 0) {
      return undefined;
    }

    const last = points[points.length - 1];
    return moment().isSame(last[0], 'day') ? last[1] : undefined;
  }
}

