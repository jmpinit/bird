if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define(function(require) {
    var exports = {};

    exports.filterNodesByRegex = function (nodes, regex) {
        return _.filter(nodes, function (n) {
            return n.tagName !== undefined && n.tagName.match(regex);
        });
    };

    exports.getTagsWithName = function (root, name) {
        return root.getElementsByTagName(name);
    };

    exports.getTagWithName = function (root, name) {
        return exports.getTagsWithName(root, name)[0];
    };

    exports.objectifyNode = function (node, attributes) {
        return _.reduce(attributes, function (memo, attr) {
            var attrNode = node.getAttributeNode(attr);

            if (attrNode) {
                memo[attr] = attrNode.value;
            }

            return memo;
        }, {});
    };

    exports.getFile = function (url, callback) {
        var xmlhttp = new XMLHttpRequest();

        xmlhttp.onreadystatechange = function() {
            if (xmlhttp.readyState == XMLHttpRequest.DONE) {
                if (xmlhttp.status == 200){
                    callback(null, xmlhttp.responseText);
                } else {
                    callback(new Error(xmlhttp.status));
                }
            }
        }

        xmlhttp.open("GET", url, true);
        xmlhttp.send();
    }

    return exports;
});
