if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define(function(require) {
    var util = require("util");

    var exports = {};

    exports.Line = function (units, node) {
        this.type = "line";

        var wire = util.objectifyNode(node, ["x1", "y1", "x2", "y2"]);

        this.vertices = [
            { x: units.toMetric(wire.x1), y: units.toMetric(wire.y1)},
            { x: units.toMetric(wire.x2), y: units.toMetric(wire.y2)}
        ];
    }

    exports.Wire = function (units, node) {
        this.type = "wire";

        var wire = util.objectifyNode(node, ["x1", "y1", "x2", "y2"]);

        this.vertices = [
            { x: units.toMetric(wire.x1), y: units.toMetric(wire.y1)},
            { x: units.toMetric(wire.x2), y: units.toMetric(wire.y2)}
        ];
    }

    exports.Hole = function (units, node) {
        this.type = "hole";
    }

    exports.Circle = function (units, node) {
        this.type = "circle";

        var circle = util.objectifyNode(node, ["x", "y", "radius", "width"]);

        this.position = {
            x: units.toMetric(circle.x),
            y: units.toMetric(circle.y)
        };
        this.radius = units.toMetric(circle.radius);
        this.lineWidth = units.toMetric(circle.width);
    }

    exports.Rectangle = function (units, node) {
        this.type = "rectangle";

        var rectangle = util.objectifyNode(node, ["x1", "y1", "x2", "y2"]);
        var x2 = units.toMetric(rectangle.x2);
        var y2 = units.toMetric(rectangle.y2);

        this.position = {
            x: units.toMetric(rectangle.x1),
            y: units.toMetric(rectangle.y1)
        }

        this.width = x2 - this.position.x;
        this.height = y2 - this.position.y;
    }

    /*exports.Dimension = function (units, node) {
        this.type = "rectangle";

        var rectangle = util.objectifyNode(node, ["x1", "y1", "x2", "y2"]);
        var x2 = units.toMetric(rectangle.x2);
        var y2 = units.toMetric(rectangle.y2);

        this.position = {
            x: units.toMetric(rectangle.x1),
            y: units.toMetric(rectangle.y1)
        }

        this.width = x2 - this.position.x;
        this.height = y2 - this.position.y;
    }*/

    exports.Polygon = function (units, node) {
        this.type = "polygon";

        var poly = util.objectifyNode(node, ["width", "pour"]);

        this.lineWidth = units.toMetric(poly.width);
        this.pour = poly.pour;

        util.getTagsWithName(node, "vertex");
    }

    exports.Pad = function (units, node) {
        this.type = "pad";

        var pad = util.objectifyNode(node, ["x", "y", "drill", "shape", "rot"]);

        this.position = {
            x: units.toMetric(pad.x),
            y: units.toMetric(pad.y)
        };

        this.rotation = units.toRadians(pad.rot || "MR0");
        this.radius = units.toMetric(pad.drill);
        this.shape = pad.shape;
    }

    exports.Via = function (units, node) {
        this.type = "via";

        var via = util.objectifyNode(node, ["x", "y", "extent", "drill", "diameter", "shape"]);

        this.position = {
            x: units.toMetric(via.x),
            y: units.toMetric(via.y)
        };

        this.innerRadius = units.toMetric(via.drill) / 2;
        if (via.diameter) {
            this.outerRadius = units.toMetric(via.diameter) / 2;
        } else {
            this.outerRadius = this.innerRadius;
        }

        var endLayers = via.extent.match(/(\d)-(\d)/);
        if (endLayers.length === 3) {
            this.extent = {
                top: parseInt(endLayers[1]),
                bottom: parseInt(endLayers[2])
            }
        } else {
            throw "Invalid via extent \"" + via.extent + "\".";
        }
    }

    exports.Smd = function (units, node) {
        this.type = "smd";

        var smd = util.objectifyNode(node, ["x", "y", "dx", "dy", "roundness"]);

        this.width = units.toMetric(smd.dx);
        this.height = units.toMetric(smd.dy);

        this.position = {
            x: units.toMetric(smd.x) - this.width / 2,
            y: units.toMetric(smd.y) - this.height / 2
        }

        this.rotation = units.toRadians(smd.rot || "MR0");
    }

    exports.Text = function (units, node) {
        this.type = "text";
    }

    return exports;
});
