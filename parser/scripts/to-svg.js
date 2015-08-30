if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define(function(require) {
    var _ = require("underscore");

    var xmlns = "http://www.w3.org/2000/svg";
    var xlinkns = "http://www.w3.org/1999/xlink";

    function translate (element, x, y) {
        var prev = element.getAttribute("transform") || "";
        var translation = "translate(" + x + "," + y + ")";
        element.setAttribute("transform", prev + " " + translation);
    }

    function rotate (element, degrees) {
        var radians = 360 * degrees / (2 * Math.PI);
        var prev = element.getAttribute("transform") || "";
        var rotation = "rotate(" + radians + ")";
        element.setAttribute("transform", prev + " " + rotation);
    }

    function cssify(name) {
        var newName = name.replace(/\/| /g, "_");

        if (/-?[_a-zA-Z]+[_a-zA-Z0-9-]*/.test(newName)) {
            return newName;
        } else {
            throw "bad name " + newName;
        }
    }


    function addClass (node, newClass) {
        var classes = node.getAttribute("class");
        if (classes === null) {
            node.setAttribute("class", newClass);
        } else {
            node.setAttribute("class", classes + " " + newClass);
        }
    }

    function nodeFromEntity (entity, norotate) {
        var el = null;

        switch (entity.type) {
            case "line":
                var pts = entity.vertices;

                if (pts.length > 1) {
                    el = document.createElementNS(xmlns, 'line');

                    el.setAttribute("x1", pts[0].x);
                    el.setAttribute("y1", pts[0].y);
                    el.setAttribute("x2", pts[1].x);
                    el.setAttribute("y2", pts[1].y);
                }
                break;
            case "wire":
                var pts = entity.vertices;

                if (pts.length > 1) {
                    el = document.createElementNS(xmlns, 'line');

                    el.setAttribute("x1", pts[0].x);
                    el.setAttribute("y1", pts[0].y);
                    el.setAttribute("x2", pts[1].x);
                    el.setAttribute("y2", pts[1].y);
                }
                break;
            case "hole":
                break;
            case "circle":
                el = document.createElementNS(xmlns, 'circle');

                el.setAttribute("cx", entity.position.x);
                el.setAttribute("cy", entity.position.y);
                el.setAttribute("r", entity.radius);

                break;
            case "rectangle":
                el = document.createElementNS(xmlns, 'rect');

                el.setAttribute("x", entity.position.x);
                el.setAttribute("y", entity.position.y);
                el.setAttribute("width", entity.width);
                el.setAttribute("height", entity.height);

                break;
            case "polygon":
                el = document.createElementNS(xmlns, 'polygon');

                var points = "";
                for (var i = 0; i < entity.vertices; i++) {
                    var pt = entity.vertices[i];
                    points += pt.x + "," + pt.y + " ";
                }

                el.setAttribute("points", points);

                break;
            case "pad":
                el = document.createElementNS(xmlns, 'circle');

                el.setAttribute("cx", entity.position.x);
                el.setAttribute("cy", entity.position.y);

                el.setAttribute("r", entity.radius);

                break;
            case "smd":
                el = document.createElementNS(xmlns, 'rect');

                el.setAttribute("x", entity.position.x);
                el.setAttribute("y", entity.position.y);
                el.setAttribute("width", entity.width);
                el.setAttribute("height", entity.height);

                // TODO
                //el.setAttribute("rx", entity.roundness);
                //el.setAttribute("ry", entity.roundness);

                break;
            case "text":
                //el = document.createElementNS(xmlns, 'text');
                break;
        }

        if (el !== null) {
            if (entity.rotation && !norotate)
                rotate(el, entity.rotation);

            addClass(el, entity.type);
        }

        return el;
    }

    return function (board, stylesheetURL) {
        var svg = document.createElementNS(xmlns, "svg");
        svg.setAttribute("xmlns", xmlns);
        svg.setAttribute("version", "1.1");

        // packages in def section
        var defs = document.createElementNS(xmlns, "defs");
        svg.appendChild(defs);

        // TODO desc tag

        // add packages

        for (name in board.packages) {
            var package = board.packages[name];
            var group = document.createElementNS(xmlns, "g");
            group.setAttribute("id", cssify(name));

            _.each(package.geometry, function (entity) {
                var el = nodeFromEntity(entity, "true");
                if (el) group.appendChild(el);
            });

            defs.appendChild(group);
        }

        // construct board
        var boardGroup = document.createElementNS(xmlns, "g");
        boardGroup.setAttribute("transform", "scale(1, -1)");
        addClass(boardGroup, "board");
        svg.appendChild(boardGroup);

        // add elements

        var elementsGroup = document.createElementNS(xmlns, "g");
        addClass(elementsGroup, "element");
        boardGroup.appendChild(elementsGroup);

        _.each(board.elements, function (entity) {
            var use = document.createElementNS(xmlns, "use");

            translate(use, entity.position.x, entity.position.y);

            if (entity.rotation) {
                rotate(use, entity.rotation);
            }

            use.setAttributeNS(xlinkns, "href", "#" + cssify(entity.package));
            elementsGroup.appendChild(use);
        });

        // add signals

        var signalsGroup = document.createElementNS(xmlns, "g");
        addClass(signalsGroup, "signal");
        boardGroup.appendChild(signalsGroup);

        _.each(board.signals, function (signal) {
            _.each(signal.geometry, function (entity) {
                var el = nodeFromEntity(entity);
                if (el) {
                    signalsGroup.appendChild(el);
                }
            })
        });

        // add decoration

        /*var decorationGroup = document.createElementNS(xmlns, "g");
        addClass(decorationGroup, "decoration");
        boardGroup.appendChild(decorationGroup);

        _.each(board.decorations, function (decoration) {
            var el = nodeFromEntity(decoration);

            if (el) {
                if (decoration.rotation) {
                    rotate(use, decoration.rotation);
                }

                signalsGroup.appendChild(el);
            }
        });*/

        // styles
        var style = document.createElementNS(xmlns, "style");
        if (stylesheetURL) {
            style.textContent = "@import url(" + stylesheetURL + ")";
        } else {
            // basic default style
            style.textContent = ".wire { stroke: black; stroke-width: 0.1; stroke-linecap: round }";
        }

        svg.appendChild(style);

        return svg;
    };
});
