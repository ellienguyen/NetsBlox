if (typeof Map === 'undefined') {
    var Map = function() {
        this._content = {};
        this.size = 0;
    };

    Map.prototype.set = function(key, value) {
        if (!this._content.hasOwnProperty(key)) {
            this.size++;
        }
        this._content[key] = value;
    };

    Map.prototype.get = function(key) {
        return this._content[key];
    };

    Map.prototype.delete = function(key) {
        if (this._content.hasOwnProperty(key)) {
            this.size--;
        }
        delete this._content[key];
    };
}
