'use strict';

var _ = require('underscore');
var fanin = require('./fanin');


var INFO = {
    type: 'proc',
    options: {}   // documented, non-deprecated options only
};

class split extends fanin {
    // the wickham 'melt' operation. now with array exploding!
    constructor(options, params, location, program) {
        super(options, params, location, program);
        var allowed_options = ['arrays', 'columns'];
        this.validate_options(allowed_options);

        this.splits = options.columns;
        if (this.splits && this.splits.indexOf('name') >= 0) {
            throw this.compile_error('SPLIT-NAME');
        }
        this.arrays = (options.arrays === undefined) ? true : Boolean(options.arrays);
    }
    procName() {
        return 'split';
    }
    process(points) {
        var out = [];
        var i, j, k, field;
        for (i=0 ; i < points.length ; i++) {
            var point = points[i];
            var split = this.splits ? _.pick(point, this.splits) : _.omit(point, 'time', 'name') ;
            var keep = _.omit(point, _.keys(split));
            var nsplits = this.splits ? this.splits.length : 0;
            for (j = 0 ; j < nsplits ; j++) {
                if (!_.has(point, this.splits[j])) {
                    this.trigger('warning', this.runtime_error('FIELD-NOT-FOUND', {
                        field: this.splits[j]
                    }));
                }
            }
            for (field in split) {
                var value = split[field];
                if (!this.arrays || !_.isArray(split[field])) {
                    value = [value] ; // singleton or non-exploding array
                }
                keep.name = field;
                for (k=0 ; k < value.length ; k++) {
                    keep.value = value[k];
                    out.push(_.clone(keep));
                }
            }
        }
        this.emit(out);
    }

    static get info() {
        return INFO;
    }
}

module.exports = split;
