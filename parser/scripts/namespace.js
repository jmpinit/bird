if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define(function(require) {
    var exports = {};

    exports.join = function () {
        var parts = [];
        for (var i = 0; i < arguments.length; i++)
            parts[i] = arguments[i];

        return parts.join("/");
    }

    return exports;
});
