const { linearRegression } = require('simple-statistics');

const moment = require('moment');
const log2 = (a) => Math.log(a) / Math.log(2);

/* this includes the last day */
function getDoubleDays7DayLinearRegression(data, fips) {
    let keys = Object.keys(data).sort((a, b) => moment(a, "MM/DD/YYYY").toDate() - moment(b, "MM/DD/YYYY").toDate());
    if (keys.length < 7) {
        return null;
    }
    const key7days = keys.slice(-7);
    const firstday = moment(key7days[0], "MM/DD/YYYY");

    const prepared_data = key7days.map(k => {
        let delta = moment(k, "MM/DD/YYYY").diff(firstday, "days");
        return [delta, log2(data[k])];
    })
    if (prepared_data[0][1] <= log2(10)) { // number too small tomake predictions
        return null;
    }
    const { m, } = linearRegression(prepared_data);
    return 1 / m;
}

function getDay2DoubleTimeSeries(data) {
    let keys = getKeysSortedByDate(data);
    if (keys.length < 7) {
        return null;
    }
    let result = {};
    for (let i = 0; i < keys.length - 6; i++) {
        let set = keys.slice(i, i + 7);
        let window = set.reduce((m, k) => {
            m[k] = data[k];
            return m;
        }, {});
        let daysToDouble = getDoubleDays7DayLinearRegression(window);
        result[set[set.length - 1]] = daysToDouble;
    }
    return result;
}

function getKeysSortedByDate(data) {
    return Object.keys(data)
        .sort((a, b) => moment(a, "MM/DD/YYYY").toDate() - moment(b, "MM/DD/YYYY").toDate());
}

function trimLastDaysData(data) {
    let keys = getKeysSortedByDate(data).slice(0, -1);
    let window = keys.reduce((m, k) => {
        m[k] = data[k];
        return m;
    }, {});
    return window;
}

export { trimLastDaysData, getDay2DoubleTimeSeries }