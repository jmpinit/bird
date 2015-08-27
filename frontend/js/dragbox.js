dragbox = (function () {
    var exports = {};

    exports.source = function(box) {
        var box = document.getElementById('holder');

        if (typeof window.FileReader === 'undefined') {
            alert("File API not available!");
        }

        box.ondragover = function() {
            this.className = 'hover';
            return false;
        };

        box.ondragend = function() {
            this.className = '';
            return false;
        };

        box.ondrop = function(e) {
            this.className = '';
            e.preventDefault();

            var file = e.dataTransfer.files[0],
            reader = new FileReader();

            reader.onload = function(event) {
                if (typeof exports.ondata === "function") {
                    exports.ondata(event.target.result);
                }
            };

            reader.readAsText(file);

            return false;
        };
    }

    return exports;
})();
