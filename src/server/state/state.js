// State information persisted to etcd. This enables the netsblox
// server to query and interact with the global state of the rooms,
// sockets, etc

var Etcd = require('node-etcd'),
    Q = require('q'),
    etcd = new Etcd();  // using localhost for now

// TODO: Add a logger
var State = function(logger, path) {
    this.prefix = path.replace(/\/?$/, '/');
    this.logger = logger.fork('state');
    this.prepared = false;
    this.prepare();
    this.logger.trace('created');
};

State.prototype.prepare = function() {
    if (this.prepared) {
        return Q();
    }
    this.prepared = true;
    return Q.ninvoke(etcd, 'mkdir', this.prefix)
        .fail(err => {
            if (err.errorCode === 102) {
                this.logger.trace(`${this.prefix} directory exists`);
            }
            throw err;
        });
};

// Should be able to
State.prototype.set = function(id, value) {
    this.logger.info(`setting ${this.prefix + id}`);
    return Q.ninvoke(etcd, 'set', this.prefix + id, JSON.stringify(value));
};

State.prototype.get = function(id) {
    this.logger.info(`getting ${this.prefix + id}`);
    return Q.ninvoke(etcd, 'get', this.prefix + id)
        .then(result => JSON.parse(result[0].node.value))
        .fail(err => {
            if (err.errorCode === 100) {
                this.logger.trace(`${this.prefix + id} not found`)
                return null;  // not found
            }
            throw err;
        });
};

State.prototype.delete = function(id) {
    this.logger.info(`deleting ${this.prefix + id}`);
    return Q.ninvoke(etcd, 'del', this.prefix + id, {recursive: true});
};

module.exports = State;
