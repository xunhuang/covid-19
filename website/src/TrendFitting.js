const moment = require('moment');
const {linearRegression} = require('simple-statistics');

const datesToDays = (startDate, dates) => {
    const start = moment(startDate, "MM/DD/YYYY");
    return dates.map(date => {
        return moment(date, "MM/DD/YYYY").diff(start, 'days');
    });
}

const daysToDates = (startDate, days) => {
    if (days.length < 1) {
        return [];
    }
}

const fitExponentialTrendingLine = (xs, ys) => {
    const {slope, fittedYs} = fitLinearTrendingLine(xs, ys.map(y => Math.log(y)));
    return {
        daysToDouble: 1 / slope * Math.log(2),
        fittedYs: fittedYs.map(y => Math.exp(y))
    };
};

const fitLinearTrendingLine = (xs, ys) => {
    const data = xs.map((x, idx) => [x, ys[idx]]).slice(-8,-1);
    const {m, b} = linearRegression(data);
    return {
        slope: m,
        fittedYs: xs.map(x => x * m + b)
    };
};

export {
    fitExponentialTrendingLine,
    datesToDays,
    daysToDates,
}
