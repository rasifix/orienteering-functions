function pad(value) {
    return value < 10 ? '0' + value : value;
};
  
var regex = /(-)?[0-9]?[0-9]:[0-9][0-9](:[0-9][0-9])?/;
  
/**
 * Parses a time string that must satisfy the following regex:
 * 
 * /(-)?[0-9]?[0-9]:[0-9][0-9](:[0-9][0-9])?/
 * 
 * @param str input string
 * @returns the number of seconds in the given input string or null if input is not parseable
 */
module.exports.parseTime = function(str) {
    if (!str) {
        return null;
    } else if (typeof str !== 'string') {
        return null;
    } else if (!regex.test(str)) {
        return null;
    }
  
    var split = str.split(":");
    var result = null;
    if (split.length === 2) {
        var negative = split[0][0] === '-';
        var minutes = parseInt(split[0], 10);
        result = (negative ? -1 : 1) * (Math.abs(minutes) * 60 + parseInt(split[1], 10));
    } else if (split.length === 3) {
        result = parseInt(split[0], 10) * 3600 + parseInt(split[1], 10) * 60 + parseInt(split[2], 10);
    }
    
    return isNaN(result) ? null : result;
}
  
module.exports.formatTime = function(seconds) {
    const sign = seconds < 0 ? '-' : '';
    const value = Math.abs(seconds);
    if (value >= 3600) {
        return sign + Math.floor(value / 3600) + ":" + pad(Math.floor(value / 60) % 60) + ":" + pad(value % 60);
    } else {
        return Math.floor(value / 60) + ":" + pad(value % 60);
    }
}