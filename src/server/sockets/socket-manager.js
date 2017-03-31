
'use strict';

var Socket = require('./netsblox-socket');

var SocketManager = function() {
    this.sockets = {};

    // Provide getter for sockets
    Socket.prototype.onClose = SocketManager.prototype.onClose.bind(this);
};

SocketManager.prototype.init = function(logger) {
    this._logger = logger.fork('socket-manager');
};

SocketManager.prototype.enable = function(wss) {
    this._logger.info('Socket management enabled!');

    wss.on('connection', rawSocket => {
        var socket = new Socket(this._logger, rawSocket);
        // TODO: issue
        this.sockets[socket.uuid] = socket;
    });
};

SocketManager.prototype.onClose = function(uuid) {
    delete this.sockets[uuid];
};

SocketManager.prototype.getSocket = function(uuid) {
    // TODO: get the socket with the given uuid
    return this.sockets[uuid];
};

SocketManager.prototype.getSocketIds = function() {
    // TODO: get the socket with the given uuid
    return Object.keys(this.sockets);
};

SocketManager.prototype.socketsFor = function(username) {
    var uuids = Object.keys(this.sockets),
        sockets = [],
        socket;

    // TODO: this one is kinda tricky...
    for (var i = uuids.length; i--;) {
        socket = this.sockets[uuids[i]];
        if (socket.username === username) {
            sockets.push(socket);
        }
    }
    return sockets;
};

module.exports = new SocketManager();
