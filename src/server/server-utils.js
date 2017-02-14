// These are utils for server specific tasks
'use strict';

var R = require('ramda'),
    assert = require('assert'),
    debug = require('debug'),
    info = debug('netsblox:api:utils:info'),
    trace = debug('netsblox:api:utils:trace'),
    error = debug('netsblox:api:utils:error');

var uuid = function(owner, name) {
    return owner + '/' + name;
};

// Helpers for routes
var serializeArray = function(content) {
    assert(content instanceof Array);
    return content.map(serialize).join(' ');
};

var serialize = function(service) {
    var pairs = R.toPairs(service);
    return encodeURI(pairs.map(R.join('=')).join('&'));
};

var serializeRole = (project, roomName) => {
    var src;
    src = project.SourceCode ? 
        `<snapdata>+${encodeURIComponent(project.SourceCode + project.Media)}</snapdata>` :
        '';
    return `RoomName=${encodeURIComponent(roomName)}&${serialize(R.omit(['SourceCode', 'Media'],
        project))}&SourceCode=${src}`;
};

var joinActiveProject = function(userId, room, res) {
    var serialized,
        openRole,
        createdNewRole = false,
        role;

    openRole = Object.keys(room.roles)
        .filter(role => !room.roles[role])  // not occupied
        .shift();

    trace(`room "${room.name}" is already active`);
    if (openRole && room.cachedProjects[openRole]) {  // Send an open role and add the user
        trace(`adding ${userId} to open role "${openRole}" at "${room.name}"`);
        role = room.cachedProjects[openRole];
    } else {  // If no open role w/ cache -> make a new role
        let i = 2,
            base;

        if (!openRole) {
            openRole = base = 'new role';
            while (room.hasOwnProperty(openRole)) {
                openRole = `${base} (${i++})`;
            }
            trace(`creating new role "${openRole}" at "${room.name}" ` +
                `for ${userId}`);
        } else {
            error(`Found open role "${openRole}" but it is not cached! May have lost data!!!`);
        }

        info(`adding ${userId} to new role "${openRole}" at ` +
            `"${room.name}"`);

        room.createRole(openRole);
        createdNewRole = true;
        role = {
            ProjectName: openRole,
            SourceCode: null,
            SourceSize: 0
        };
        room.cachedProjects[openRole] = role;
    }
    serialized = serializeRole(role, room.name);
    return res.send(`OwnerId=${room.owner.username}&NewRole=${createdNewRole}&${serialized}`);
};

// Function helpers
var FN_ARGS = /^(function)?\s*[^\(]*\(\s*([^\)]*)\)/m,
    FN_ARG_SPLIT = /,/,
    STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;

var getArgumentsFor = function(fn) {
    var fnText,
        args;

    if (fn.args) {
        return fn.args;
    }

    fnText = fn.toString().replace(STRIP_COMMENTS, '');
    args = fnText.match(FN_ARGS)[2].split(FN_ARG_SPLIT);
    return args
        .map(arg => arg.replace(/\s+/g, ''))
        .filter(arg => !!arg);
};

var path = require('path'),
    MEDIA_ROOT = process.env.MEDIA_ROOT || path.join(__dirname, '..', '..', 'media');

var getMediaPath = (username, role) => {
    console.log('username:', username );
    console.log('role:', role );
    return path.join(
        MEDIA_ROOT,
        username,
        role.ProjectUuid,
        role.ProjectName
    );
};

module.exports = {
    serialize: serialize,
    serializeArray: serializeArray,
    serializeRole: serializeRole,
    joinActiveProject: joinActiveProject,
    uuid: uuid,

    getMediaPath: getMediaPath,

    getArgumentsFor: getArgumentsFor

};
