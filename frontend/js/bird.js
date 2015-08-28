// render brd files to svg

bird = (function () {
    var exports = {};

    function getCentroid (mesh) {
        mesh.geometry.computeBoundingBox();
        boundingBox = mesh.geometry.boundingBox;

        var x0 = boundingBox.min.x;
        var x1 = boundingBox.max.x;
        var y0 = boundingBox.min.y;
        var y1 = boundingBox.max.y;
        var z0 = boundingBox.min.z;
        var z1 = boundingBox.max.z;


        var bWidth = ( x0 > x1 ) ? x0 - x1 : x1 - x0;
        var bHeight = ( y0 > y1 ) ? y0 - y1 : y1 - y0;
        var bDepth = ( z0 > z1 ) ? z0 - z1 : z1 - z0;

        var centroidX = x0 + ( bWidth / 2 ) + mesh.position.x;
        var centroidY = y0 + ( bHeight / 2 )+ mesh.position.y;
        var centroidZ = z0 + ( bDepth / 2 ) + mesh.position.z;

        return { x : centroidX, y : centroidY, z : centroidZ };

    }

    function extractRotation (node, name) {
        var rotstring = $(node).attr(name);

        if (rotstring === undefined) {
            return 0;
        } else {
            var parts = rotstring.match(/^M?R(\d\d?\d?)/);
        
            if (parts.length !== 2) {
                console.error("invalid rotation", rotstring, node);
            } else {
                var degrees = parseInt(parts[1]);
                return 2 * Math.PI * (degrees / 360.0);
            }
        }
    }

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

    function Text (node) {
        this.text = $(node).text();

        this.size = extractFloat(node, "size");

        this.position = {
            x: extractFloat(node, "x"),
            y: extractFloat(node, "y")
        }
    }

    Text.prototype = {
        render: function (ctx) {
            ctx.font = this.size + "px Arial";
            ctx.fillStyle = "rgba(255, 0, 0, 255)";
            ctx.fillText(this.text, this.position.x, this.position.y);
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
                case "text":
                    return new Text(node);
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

            var material = new THREE.MeshBasicMaterial({
                map: texture,
                side:THREE.DoubleSide,
                transparent: true,
                depthWrite: false,
                depthTest: false 
            });

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

        var packages = (function () {
            var groups = _.pluck($doc.find("packages"), "children");
            var packageList = _.flatten(
                _.map(groups, function (group) {
                    return _.map(group, function (node) {
                        return new Package(node);
                    })
                })
            );
            return _.object(_.pluck(packageList, "name"), packageList);
        })();

        var elements = (function () {
            var groups = _.pluck($doc.find("elements"), "children");

            var elements = _.flatten(
                _.map(groups, function (group) {
                    return _.map(group, function (node) {
                        var package = packages[$(node).attr("package")];
                        
                        if (package === undefined) {
                            console.log("unknown package", node);
                        } else {
                            var mesh = package.mesh.clone();

                            var scale = 4;
                            mesh.position.x = extractFloat(node, "x") / scale;
                            mesh.position.y = extractFloat(node, "y") / scale;

                            var explode = 2;
                            package.mesh.position.z = explode * Math.random() - explode / 2;

                            mesh.rotation.z = extractRotation(node, "rot");
                        }

                        return mesh;
                    })
                })
            );

            return _.filter(elements, function (el) { return el !== undefined && el !== null; });
        })();

        _.each(elements, function (el) {
            board.add(el);
        });

        // signals
        var signalMaterial = new THREE.LineBasicMaterial({
            color: 0x000000
        });

        _.each($doc.find("signal"), function (signal) {
            _.each($(signal).find("wire"), function (wireNode) {
                var wire = new Wire(wireNode);

                var scale = 0.25;
                var off = { x: -4.8, y: -2.6 };
                var geometry = new THREE.Geometry();
                geometry.vertices.push(new THREE.Vector3(off.x + scale * wire.start.x, off.y + scale * wire.start.y, 0));
                geometry.vertices.push(new THREE.Vector3(off.x + scale * wire.end.x, off.y + scale * wire.end.y, 0));

                var line = new THREE.Line(geometry, signalMaterial);

                scene.add(line);
            })
        });

        // center board
        var meshes = _.filter(board.children, function (child) {
            return child.geometry !== undefined;
        });

        var centroids = _.map(meshes, function (child) {
            return getCentroid(child);
        });

        var boardCentroid = _.reduce(centroids, function (memo, centroid) {
            memo.x += centroid.x / centroids.length;
            memo.y += centroid.y / centroids.length;
            memo.z += centroid.z / centroids.length;
            return memo;
        }, { x: 0, y: 0, z: 0});

        board.position.x -= boardCentroid.x / 2;
        board.position.y -= boardCentroid.y / 2;
        board.position.z -= boardCentroid.z / 2;

        return board;
    }

    return exports;
})();
