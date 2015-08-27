// render brd files to svg

bird = (function () {
    var exports = {};

    function extractInt (node, name) {
        return parseInt($(node).attr(name));
    }

    function extractFloat (node, name) {
        return parseFloat($(node).attr(name));
    }

    function Wire (node) {
        this.start = {
            x: extractFloat(node, "x1"),
            y: extractFloat(node, "y1")
        };

        this.end = {
            x: extractFloat(node, "x2"),
            y: extractFloat(node, "y2")
        };
    }

    Wire.prototype = {
        render: function (ctx) {
            ctx.strokeStyle = "rgb(0, 0, 0)";
            ctx.beginPath();
            ctx.moveTo(this.start.x, this.start.y);
            ctx.lineTo(this.end.x, this.end.y);
            ctx.stroke();
        }
    }

    function Hole (node) {
        this.position = {
            x: extractFloat(node, "x"),
            y: extractFloat(node, "y")
        };

        this.drill = extractFloat(node, "drill");
    }

    Hole.prototype = {
        render: function (ctx) {
            ctx.strokeStyle = "rgb(0, 0, 0)";
            ctx.beginPath();
            ctx.arc(100, 75, this.drill, 0, 2 * Math.PI);
            ctx.stroke();
        }
    }

    function Rectangle (node) {
        this.upperLeft = {
            x: extractFloat(node, "x1"),
            y: extractFloat(node, "y1")
        };

        this.lowerRight = {
            x: extractFloat(node, "x2"),
            y: extractFloat(node, "y2")
        };

        this.layer = extractInt(node, "layer");
    }

    Rectangle.prototype = {
        render: function (ctx) {
            ctx.strokeStyle = "rgb(128, 128, 128)";
            ctx.beginPath();
            ctx.moveTo(this.upperLeft.x, this.upperLeft.y);
            ctx.lineTo(this.lowerRight.x, this.upperLeft.y);
            ctx.lineTo(this.lowerRight.x, this.lowerRight.y);
            ctx.lineTo(this.upperLeft.x, this.lowerRight.y);
            ctx.lineTo(this.upperLeft.x, this.upperLeft.y);
            ctx.stroke();
        }
    }

    function Pad (node) {
        Hole.call(this, node);
        this.shape = $(node).attr("shape");
    }

    Pad.prototype = {
        render: function (ctx) {
            ctx.strokeStyle = "rgb(0, 0, 0)";
            ctx.beginPath();
            ctx.arc(100, 75, this.drill, 0, 2 * Math.PI);
            ctx.stroke();
        }
    }

    function SMD (node) {
        this.name = $(node).attr("name");

        this.position = {
            x: extractFloat(node, "x"),
            y: extractFloat(node, "y")
        }

        this.size = {
            x: extractFloat(node, "dx"),
            y: extractFloat(node, "dy")
        };
    }

    SMD.prototype = {
        render: function (ctx) {
            var upperLeft = {
                x: this.position.x - this.size.x / 2,
                y: this.position.y - this.size.y / 2
            };

            var lowerRight = {
                x: upperLeft.x + this.size.x,
                y: upperLeft.y + this.size.y
            };

            ctx.strokeStyle = "rgba(0, 0, 255, 255)";
            ctx.beginPath();
            ctx.moveTo(upperLeft.x, upperLeft.y);
            ctx.lineTo(lowerRight.x, upperLeft.y);
            ctx.lineTo(lowerRight.x, lowerRight.y);
            ctx.lineTo(upperLeft.x, lowerRight.y);
            ctx.lineTo(upperLeft.x, upperLeft.y);
            ctx.stroke();
        }
    }


    function Package (node) {
        this.name = $(node).attr("name");
        this.description = $(node).children("description").text();

        this.mesh = this.render(node);
    }

    Package.parse = function (node) {
        if (node !== undefined) {
            switch (node.tagName) {
                case "wire":
                    return new Wire(node);
                case "hole":
                    return new Hole(node);
                case "rectangle":
                    return new Rectangle(node);
                case "pad":
                    return new Pad(node);
                case "smd":
                    return new SMD(node);
                case "package":
                    return _.map($(node).children(), function(child) {
                        return Package.parse(child);
                    });
                default:
                    console.log("unknown element", node);
                    return [];
            }
        } else {
            return [];
        }
    };
    

    Package.prototype = {
        render: function (node) {
            var canvas = document.createElement('canvas');
            canvas.width = 512;
            canvas.height = 512;

            var ctx = canvas.getContext('2d');
            ctx.fillStyle = "rgba(255,255,255,0)";
            ctx.fillRect(0, 0, 512, 512);

            ctx.translate(256, 256);
            ctx.scale(10, 10);
            ctx.lineWidth = 0.4;

            function render(gnode) {
                if (gnode.length == 0) {
                    return;
                } else {
                    if (gnode.length > 0) {
                        _.each(gnode, function(child) { render(child); });
                    } else {
                        gnode.render(ctx);
                    }
                }
            }

            render(Package.parse(node));

            var texture = new THREE.Texture(canvas);
            texture.needsUpdate = true;

            var material = new THREE.MeshBasicMaterial( {map: texture, side:THREE.DoubleSide } );
            material.transparent = true;

            return new THREE.Mesh(
                new THREE.PlaneGeometry(10, 10),
                material
            );
        }
    };

    exports.render = function(brd) {
        var doc = $.parseXML(brd);
        var $doc = $(doc);

        var board = new THREE.Object3D();

        var groups = _.pluck($doc.find("packages"), "children");
        var packages = _.flatten(
            _.map(groups, function (group) {
                _.map(group, function (node) {
                    var package = new Package(node);

                    package.mesh.rotation.x = 2 * Math.PI * Math.random();
                    package.mesh.rotation.y = 2 * Math.PI * Math.random();
                    package.mesh.rotation.z = 2 * Math.PI * Math.random();

                    var d = 20;
                    package.mesh.position.x = d * Math.random() - d/2;
                    package.mesh.position.y = d * Math.random() - d/2;
                    package.mesh.position.z = d * Math.random() - d/2;

                    board.add(package.mesh);
                })
            })
        );

        return board;
    }

    return exports;
})();
