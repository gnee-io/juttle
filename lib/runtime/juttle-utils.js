'use strict';

var _ = require('underscore');
var ops = require('./ops');
var values = require('./values');
var JuttleMoment = require('../moment').JuttleMoment;

function makeDate(time) {
    var number = Number(time);
    if (number === number) { // check for NaN
        time = number * 1000; // convert seconds to milliseconds for Date constructor
    }

    return new Date(time);
}

function toNative(records, epsilon) {
    _.each(records, function(record) {
        // check if we already called toNative on these points
        // that may happen if we have multiple live programs on the same points
        if (record.time !== undefined && !(record.time instanceof JuttleMoment)) {
            var date = makeDate(record.time);
            if (date.getTime() === date.getTime()) { // speedy check for invalid date, to make sure its getTime() isn't NaN
                record.time = new JuttleMoment({rawDate: date});
            } else {
                record.time = new JuttleMoment(record.time);
            }

            if (epsilon) {
                record.time.epsilon = epsilon;
            }
        }
    });

    return records;
}

function fromNative(records) {
    return _.map(records, values.toJSONCompatible, values);
}

function isInteger(x) {
    return (_.isFinite(x)) && (x % 1 === 0);
}

function pointSortFunc(field, direction) {
    // given a field name, return a function that can be passed to
    // Array.sort to order points by the field.
    // if optional direction === 'desc', sort in reverse order.
    return function(first, second) {
        var a = first[field];
        var b = second[field];
        var fieldCompare;

        if (a === undefined && b === undefined) {
            fieldCompare = 0;
        } else if (a === undefined && b !== undefined) {
            fieldCompare = 1;
        } else if (a !== undefined && b === undefined) {
            fieldCompare = -1;
        } else if (_.isString(a) && _.isString(b)) {
            fieldCompare = a.toLowerCase().localeCompare(b.toLowerCase());
        } else if (a instanceof JuttleMoment) {
            fieldCompare = JuttleMoment.subtract(a, b).milliseconds();
        } else if (values.isArray(a)) {
            fieldCompare = ops.gt(a, b) ? 1 : -1;
        } else {
            fieldCompare = a - b;
        }
        if (direction === 'desc') {
            fieldCompare *= -1;
        }
        return fieldCompare;
    };
}

module.exports = {
    isInteger: isInteger,
    toNative: toNative,
    fromNative: fromNative,
    pointSortFunc: pointSortFunc
};