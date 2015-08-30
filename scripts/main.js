require.config({
    shim: {
        underscore: {
            exports: '_'
        },
        svg: {
            exports: 'svg'
        }
    }
});

requirejs(["util", "parser", "to-svg"], function(util, parser, tosvg) {
    function renderToSVG (url) {
        util.getFile(url, function (err, boardText) {
            if (err) {
                console.error(err);
            } else {
                xmlParser = new DOMParser();
                var boardDOM = xmlParser.parseFromString(boardText, "text/xml");
                var brd = parser.parse(boardDOM);

                var svg = tosvg(brd.board, "/stylesheets/board.css");
                svg.setAttribute("width", "100%");
                svg.setAttribute("height", "100%");

                function updateViewPort(svg) {
                    var boardNode = svg.getElementsByClassName("board")[0];
                    bounds = svg.getBBox();

                    if (bounds.width > 0 || bounds.height > 0) {
                        var x = Math.floor(bounds.x);
                        var y = Math.floor(bounds.y );
                        var w = Math.ceil(bounds.width);
                        var h = Math.ceil(bounds.height);

                        var dims = [x, y, w, h];
                        svg.setAttribute("viewBox", dims.join(" "));
                    } else {
                        setTimeout(function () {
                            updateViewPort(svg);
                        }, 1000);
                    }
                }

                updateViewPort(svg);

                document.body.appendChild(svg);
            }
        });
    }

    util.getJSON("data/test-config.json", function (err, config) {
        if (err) {
            console.error(err);
        } else {
            console.log(config);
            renderToSVG(config.boards[0]);
        }
    });
});
