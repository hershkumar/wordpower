String.prototype.format = function() { // from https://stackoverflow.com/questions/610406/javascript-equivalent-to-printf-string-format
    var args = arguments;
    return this.replace(/{(\d+)}/g, function (match, number) {
        return typeof args[number] !== 'undefined' ? args[number] : match;
    });
};

const zip = (a, b) => {
    return a.map((e, i) => {
        return [e, b[i]];
    });
};

