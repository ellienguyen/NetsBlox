var debug = require('debug'),
    _ = require('lodash'),
    log = debug('netsblox:public-role-manager:log'),
    trace = debug('netsblox:public-role-manager:trace'),
    error = debug('netsblox:public-role-manager:error'),
    ID_LENGTH = 5;

var PublicRoleManager = function() {
    // TODO: Update this to use the dht
    this.publicIds = {};
    this.socketToId = new Map();
};

PublicRoleManager.prototype.reset = function() {
    this.publicIds = {};
    this.socketToId = new Map();
};

PublicRoleManager.prototype._situation = function(socket) {
    if (!socket.hasRoom()) {
        error(`Socket does not have a room! ${socket.uuid}`);
        return null;
    }

    return {
        room: {
            owner: socket._room.owner.username,
            name: socket._room.name
        },
        role: socket.roleId
    };
};

// TODO: update this to use dht
PublicRoleManager.prototype.unregister = function(socket) {
    var id = this.socketToId.get(socket);

    this.socketToId.delete(socket);
    if (id) {
        delete this.publicIds[id];
        return true;
    }
    return false;
};

// TODO: update this to use dht
PublicRoleManager.prototype.register = function(socket) {
    var len = ID_LENGTH,
        id = Math.floor(Math.random()*Math.pow(10, len)).toString();

    while (this.publicIds[id]) {
        id = Math.floor(Math.random()*Math.pow(10, len)).toString();
        len++;
    }
    this.unregister(socket);  // only one id per user

    this.publicIds[id] = {
        socket,
        situation: this._situation(socket)
    };
    this.socketToId.set(socket, id);

    trace(`${socket.username} has requested public id ${id}`);
    socket.onclose.push(this.unregister.bind(this, socket));
    return id;
};

// TODO: update this to use dht
PublicRoleManager.prototype.lookUp = function(id) {
    var entry = this.publicIds[id];

    // TODO: check if the given entry is connected to this server
    // Check if the socket is still in the given situation...
    // TODO
    // If so, send the message!
    // TODO
    if (entry) {
        // Check that the socket is still in the room that it registered in
        if (_.isEqual(entry.situation, this._situation(entry.socket))) {
            return entry.socket;
        } else {
            log(`Found socket for ${id} but it is no longer in the given situation...`);
            return null;
        }
    }
    return null;
};

module.exports = new PublicRoleManager();
