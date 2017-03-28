// State information persisted to etcd. This enables the netsblox
// server to query and interact with the global state of the rooms,
// sockets, etc

var Etcd = require('node-etcd'),
    Q = require('q'),
    etcd = new Etcd();  // using localhost for now

var State = function(path) {
    this.prefix = path;
    this.prepared = false;
    this.prepare();
};

State.prototype.prepare = function() {
    return Q.ninvoke(etcd, 'mkdir', this.prefix)
        .then(() => {
        })
        .fail(err => {
            if (err.errorCode === 100) {
            }
        });
};

// Should be able to
State.prototype.set = function() {
};

State.prototype.get = function() {
};

module.exports = State;
