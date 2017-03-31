var Logger = require('./logger'),
    logger = new Logger('netsblox:public-role-manager'),
    State = require('./state/state'),
    RoomManager = require('./rooms/room-manager'),
    ID_LENGTH = 5;

var PublicRoleManager = function() {
    this.state = new State(logger, 'public-addresses');
};

PublicRoleManager.prototype.unregister = function(socket) {
    var situation = this.getSituation(socket),
        address = RoomManager.getPublicAddresses(situation);

    return this.state.delete(address);
};

PublicRoleManager.prototype._searchForUnique = function(len) {
    var id = Math.floor(Math.random()*Math.pow(10, len)).toString();
    return this.state.get(id).then(result => {
        if (result) {
            return this._searchForUnique(len+1);
        }
        logger.trace(`found unique id: ${id}`);
        return id;
    });

};

PublicRoleManager.prototype.getSituation = function(socket) {
    // TODO: _room is null?
    return {
        room: socket._room.uuid,
        role: socket.roleId
    };
};

PublicRoleManager.prototype.register = function(socket) {
    var situation = this.getSituation(socket);
    logger.trace(`registering socket ${socket.uuid}`);

    return this._searchForUnique(ID_LENGTH)
        .then(id => this.state.set(id, situation)
                .then(() => RoomManager.addPublicAddress(situation, id))
                .then(() => id)
        )
        .fail(err => {
            logger.error(`could not register ${situation.room} in ${situation.role}: ${err}`);
            throw err;
        });
};

PublicRoleManager.prototype.lookUp = function(id) {
    // look up the given public address for the room-uuid and role
    logger.trace(`looking up ${id}`);
    return this.state.get(id).then(target => {
        var room = RoomManager.getRoomByUuid(target.room),
            socket = room && room.roles[target.role];

        console.log('room is', room);
        // Return the socket at the given location
        return socket;
    });
};

module.exports = new PublicRoleManager();
