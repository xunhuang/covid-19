const moment = require('moment');
const {linearRegression} = require('simple-statistics');

const datesToDays = (startDate, dates) => {
    const start = moment(startDate, "MM/DD");
    return dates.map(date => {
        return moment(date, "MM/DD").diff(start, 'days');
    });
}

const fitExponentialTrendingLine = (xs, ys) => {
    const results = fitLinearTrendingLine(xs, ys.map(y => Math.log(y)));
    if (results == null) {
        return null;
    }
    return {
        daysToDouble: 1 / results.slope * Math.log(2),
        fittedYs: results.fittedYs.map(y => Math.exp(y))
    };
};

const fitLinearTrendingLine = (xs, ys) => {
    if (xs.length < 8 || ys.length < 8) {
        return null;
    }
    const data = xs.map((x, idx) => [x, ys[idx]]).slice(-8,-1);
    if (data[0][1] <= 10) {
        return null;
    }
    const {m, b} = linearRegression(data);
    return {
        slope: m,
        fittedYs: xs.map(x => x * m + b)
    };
};

export {
    fitExponentialTrendingLine,
    datesToDays
}
