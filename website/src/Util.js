
var shortNumber = require('short-number');

function myShortNumber(n) {
    if (!n) {
        return "0";
    }
    if (isNaN(n)) {
        n = n.replace(/,/g, '');
        n = Number(n);
    }
    console.log(n);
    return shortNumber(n);
}

function myToNumber(n) {
    if (!n) {
        return 0;
    }
    if (isNaN(n)) {
        n = n.replace(/,/g, '');
        n = Number(n);
    }
    return n;
}

function browseTo(history, state, county) {
    history.push(
        "/county/" + encodeURIComponent(state) + "/" + encodeURIComponent(county),
        history.search,
    );
}

function browseToState(history, state) {
    history.push(
        "/state/" + encodeURIComponent(state),
        history.search,
    );
}

function browseToUSPage(history) {
    history.push(
        "/US",
        history.search,
    );
}

export {
    myShortNumber,
    myToNumber,
    browseTo,
    browseToState,
    browseToUSPage
}
