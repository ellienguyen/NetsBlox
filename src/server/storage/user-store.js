'use strict';

var randomString = require('just.randomstring'),
    hash = require('../../common/sha512').hex_sha512,
    DataWrapper = require('./data'),
    Rooms = require('./room-store'),
    utils = require('../server-utils'),
    Q = require('q'),
    mailer = require('../mailer');

class UserStore {
    constructor (logger, db) {
        this._logger = logger.fork('users');
        this._users = db.collection('users');
    }

    get (username, callback) {
        // Retrieve the user
        this._users.findOne({username}, (e, data) => {
            callback(e, data ? new User(this._logger, this._users, data) : null);
        });
    }

    names () {
        return this._users.find().toArray()
            .then(users => users.map(user => user.username))
            .catch(e => this._logger.error('Could not get the user names!', e));
    }

    new(username, email) {
        var createdAt = Date.now();

        return new User(this._logger, this._users, {
            username,
            email,
            createdAt
        });
    }
}

class User extends DataWrapper {

    constructor(logger, db, data) {
        // Load rooms from room database
        data.rooms = data.rooms || data.tables || [];
        delete data.tables;
        // Update seats => roles
        data.rooms
            .forEach(room => {
                room.roles = room.roles || room.seats;
                delete room.seats;
            });

        super(db, data);
        this._logger = logger.fork(data.username);

        this._loadRooms();
    }

    _loadRooms() {
        // TODO: load the rooms from the room database
        // Not the most efficient but the easiest to hack in right now
        this.projectIds = this.projectIds || [];
        return Q.all(this.projectIds.map(uuid => Rooms.get(uuid)))
            .then(projects => this.rooms = projects);
    }

    pretty() {
        var prettyUser = this._saveable();
        prettyUser.hash = '<omitted>';
        return prettyUser;
    }

    prepare() {
        // If no password, assign tmp
        if (!this.hash) {
            let password = this.password || randomString(8);

            this._emailTmpPassword(password);
            this.hash = hash(password);
        }
        delete this.password;
        this.rooms = this.rooms || this.tables || [];
        this.projectIds = this.rooms.map(room => room.uuid ||
            utils.uuid(this.username, room.name));
    }

    recordLogin() {
        this.lastLoginAt = Date.now();
        this.save();
    }

    getNewName(name) {
        var nameExists = {},
            i = 2,
            basename;

        this.rooms.forEach(room => nameExists[room.name] = true);

        name = name || 'untitled';
        basename = name;
        while (nameExists[name]) {
            name = `${basename} (${i++})`;
        }

        return name;
    }

    _emailTmpPassword(password) {
        mailer.sendMail({
            from: 'no-reply@netsblox.com',
            to: this.email,
            subject: 'Temporary Password',
            markdown: 'Hello '+this.username+',\nYour NetsBlox password has been '+
                'temporarily set to '+password+'. Please change it after '+
                'logging in.'
        });
    }

}

User.prototype.IGNORE_KEYS = DataWrapper.prototype.IGNORE_KEYS.concat(['rooms']);

module.exports = UserStore;
