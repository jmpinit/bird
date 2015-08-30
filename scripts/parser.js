if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define(function(require) {
    var _ = require("underscore");
    var util = require("util");
    var namespace = require("namespace");
    var geo = require("geometry");

    function Units (gridNode) {
        var grid = util.objectifyNode(gridNode,
            ["distance", "unitdist",
            "altdistance", "altunitdist",
            "unit", "altunit"]);
            
        // unit and altunit are the units that get displayed
        // regardless of the underlying grid units

        var factors = { "mm": 1, "mil": 0.0254, "in": 25.4 };

        if (grid.unit in factors) {
            this.factor = factors[grid.unit];
        } else {
            throw "Unrecognized unit \"" + grid.unit + "\".";
        }
    }

    Units.prototype = {
        toRadians: function (rotstring) {
            var parts = rotstring.match(/^M?R(\d\d?\d?)/);

            if (parts.length !== 2) {
                throw "Invalid rotation string \"" + rotstring + "\".";
            } else {
                var degrees = parseInt(parts[1]);
                return 2 * Math.PI * (degrees / 360.0);
            }
        },

        toMetric: function (rawValue) {
            var value = parseFloat(rawValue);

            if (isNaN(value)) {
                throw new Error("invalid distance \"" + rawValue + "\".");
            } else {
                return value * this.factor;
            }
        }
    }

    function Board (brd) {
        var that = this;
        function nodeToGeometry (node, mode) {
            var mapping = {
                "wire": mode === "signal"? geo.Wire : geo.Line,
                "hole": geo.Hole,
                "circle": geo.Circle,
                "rectangle": geo.Rectangle,
                "dimension": geo.Dimension,
                "polygon": geo.Polygon,
                "pad": geo.Pad,
                "smd": geo.Smd,
                "text": geo.Text,
                "via": geo.Via
            };

            if (node.tagName in mapping) {
                return new mapping[node.tagName](that.units, node);
            } else {
                throw node;
            }
        }

        this.units = new Units(util.getTagWithName(brd, "grid"));

        this.packages = (function () {
            var libraries = util.filterNodesByRegex(util.getTagWithName(brd, "libraries").children, /library/);

            var packageList = _.flatten(_.map(libraries, function (libraryNode) {
                var library = util.objectifyNode(libraryNode, ["name"]);
                var packageNodes = util.getTagsWithName(brd, "package");

                return _.map(packageNodes, function (packageNode) {
                    var package = util.objectifyNode(packageNode, ["name"]);
                    package.name = namespace.join((library.name || ""), package.name);

                    var geometryNodes = _.toArray(packageNode.children);

                    package.geometry = _.reduce(geometryNodes, function (memo, geoNode) {
                        try {
                            var geometry = nodeToGeometry(geoNode, "package");
                            memo.push(geometry);
                        } catch (e) {
                            if (e.tagName !== undefined && e.tagName === "description") {
                                // TODO mark that we threw this out
                            } else {
                                console.log("unrecognized tag", e);
                            }
                        }

                        return memo;
                    }, []);

                    return package;
                });
            }));

            return _.object(_.pluck(packageList, "name"), packageList);
        })();

        this.elements = (function () {
            var elementNodes = util.filterNodesByRegex(util.getTagWithName(brd, "elements").children, /element/);

            return _.map(elementNodes, function (elementNode) {
                var proto = util.objectifyNode(elementNode,
                    ["name",  "value",
                    "library", "package",
                    "x", "y", "rot"]);

                var packageID = namespace.join(proto.library, proto.package);

                var element = {
                    "name": proto.name,
                    "package": packageID,
                    "value": proto.value,
                    "position": {
                        "x": that.units.toMetric(proto.x),
                        "y": that.units.toMetric(proto.y),
                    },
                    "rotation": that.units.toRadians(proto.rot || "MR0")
                }

                // attribute tags as attributes
                var attrNodes = util.getTagsWithName(elementNode, "attribute");
                _.each(attrNodes, function (attrNode) {
                    var attr = util.objectifyNode(attrNode, ["name"]);

                    if (attr.name in element) {
                        throw "Attribute tag \"" + attr.name + "\" conflicts.";
                    } else {
                        element[attr.name] = attrNode.textContent;
                    }
                });

                return element;
            });
        })();

        this.signals = (function () {
            var signalNodes = util.filterNodesByRegex(util.getTagWithName(brd, "signals").children, /signal/);

            var signalList = _.map(signalNodes, function (signalNode) {
                var signal = util.objectifyNode(signalNode, ["name"]);

                var geometryNodes = _.toArray(signalNode.children);

                signal.geometry = _.reduce(geometryNodes, function (memo, geoNode) {
                    try {
                        if (geoNode.tagName !== "contactref") {
                            var geometry = nodeToGeometry(geoNode, "signal");
                            memo.push(geometry);
                        } else {
                            // TODO
                        }
                    } catch (e) {
                        if (e.tagName !== undefined && e.tagName === "description") {
                            // TODO mark that we threw this out
                        } else {
                            console.log("unrecognized tag", e);
                        }
                    }

                    return memo;
                }, []);

                return signal;
            });

            return _.object(_.pluck(signalList, "name"), signalList);
        })();

        this.decorations = (function () {
            var decorationNodes = util.getTagWithName(brd, "plain").children;

            return _.filter(_.map(decorationNodes, function (decorationNode) {
                var decoration = util.objectifyNode(decorationNode, ["name"]);

                try {
                    if (decorationNode.tagName != "dimension") {
                        return nodeToGeometry(decorationNode, "decoration");
                    } else {
                        // TODO
                        return null;
                    }
                } catch (e) {
                    if (e.tagName !== undefined && e.tagName === "description") {
                        // TODO mark that we threw this out
                    } else {
                        console.log("unrecognized tag", e);
                    }
                }
            }), function (n) { return n !== null });
        })();

        //this.computeBoundingBox();

        this.validate();
    }

    Board.prototype = {
        computeBoundingBox: function() {
            var children = _.flatten([this.elements, this.signals]);
            this.boundingBox = geometry.computeBoundingBox(children);
        },

        validate: function () {
            _.each(this.elements, function (el) {
                if ((el.package in _.pluck(this.packages, "package"))) {
                    throw "Element \"" + el.name
                        + "\" references nonexistent package \"" + el.package + "\".";
                }
            });
        }
    };

    function BoardStyle (brd) {
        // TODO
        return {};
    }

    var exports = {
        parse: function (brd) {
            return {
                board: new Board(brd),
                styles: new BoardStyle(brd)
            };
        }
    }

    return exports;
});
