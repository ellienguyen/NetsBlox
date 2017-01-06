// Dictionary of all middleware functions for netsblox routes.
var server,
    sessionSecret = process.env.SESSION_SECRET || 'DoNotUseThisInProduction',
    COOKIE_ID = 'netsblox-cookie',
    jwt = require('jsonwebtoken'),
    nop = function(){},
    logger;

var hasSocket = function(req, res, next) {
    var socketId = (req.body && req.body.socketId) ||
        (req.params && req.params.socketId) ||
        (req.query && req.query.socketId);

    if (socketId) {
        if (server.sockets[socketId]) {
            return next();
        }
        logger.error(`No socket found for ${socketId} (${req.get('User-Agent')})`);
        return res.status(400)
            .send('ERROR: Not fully connected to server. Please refresh or try a different browser');
    }
    logger.error(`No socketId found! (${req.get('User-Agent')})`);
    res.status(400).send('ERROR: Bad Request: missing socket id');  // FIXME: better error message
};

var noCache = function(req, res, next) {
    res.set('Cache-Control', 'no-cache')
    return next();
};

var setUserAndSocket = function(req, res, next) {
    var afterLogin = function(req, res) {
        var socketId = (req.body && req.body.socketId) ||
            (req.params && req.params.socketId) ||
            (req.query && req.query.socketId);

        if (socketId && server.sockets[socketId]) {
            req.session.socket = server.sockets[socketId];
        } else {
            hasSocket(req, res, next);
        }
    };

    return setUser(req, res, afterLogin, true);
};

var hasRoom = function(req, res, next) {
    setUserAndSocket(req, res, function(req, res) {
        var socket = req.session.socket;
        if (socket._room) {
            next();
        } else {
            logger.error(`No room found for ${socket.uuid} - ${socket.username} (${req.get('User-Agent')})`);
            return res.status(400)
                .send('ERROR: Could not find connected room.');
        }
    });
};

// Access control and auth
var tryLogIn = function(req, res, cb, skipRefresh) {
    var cookie = req.cookies[COOKIE_ID];

    req.session = req.session || new Session(res);
    if (cookie) {
        // verify the cookie is valid
        logger.trace(`validating cookie`);
        jwt.verify(cookie, sessionSecret, (err, token) => {
            if (err) {
                logger.error(`Error verifying jwt: ${err}`);
                return cb(err);
            }

            req.session.username = token.username;
            if (!skipRefresh) {
                refreshCookie(res, token);
            }
            return cb(null, true);
        });
    } else {
        logger.error(`User is not logged in! (${req.get('User-Agent')})`);
        return cb(null, false);
    }
};

var isLoggedIn = function(req, res, next) {
    logger.trace(`checking if logged in ${Object.keys(req.cookies)}`);
    tryLogIn(req, res, (err, success) => {
        if (err) {
            return next(err);
        }

        if (success) {
            return next();
        } else {
            logger.error(`User is not logged in! (${req.get('User-Agent')})`);
            return res.status(400)
                .send('ERROR: You must be logged in to use this feature');
        }
    });
};

var saveLogin = function(res, user, remember) {
    var cookie = {  // TODO: Add an id
        id: user.id || user._id,
        username: user.username,
        email: user.email,
    };
    if (typeof remember === 'boolean') {
        cookie.remember = remember;
    }
	refreshCookie(res, cookie);
};

var refreshCookie = function(res, cookie) {
    var token = jwt.sign(cookie, sessionSecret),
        options = {
            httpOnly: true
        },
        date;

    if (cookie.remember) {
        date = new Date();
        date.setDate(date.getDate() + 14);  // valid for 2 weeks
        logger.trace(`cookie expires: ${date}`);
        options.expires = date;
    }

    logger.trace(`Saving cookie ${JSON.stringify(cookie)}`);
	res.cookie(COOKIE_ID, token, options);
};

var Session = function(res) {
    this._res = res;
};

Session.prototype.destroy = function() {
    // TODO: Change this to a blacklist
    this._res.clearCookie(COOKIE_ID);
};

// Helpers
var loadUser = function(username, res, next) {
    // Load the user and handle errors
    server.storage.users.get(username, function(e, user) {
        if (e) {
            logger.error(`Could not retrieve "${username}": ${e}`);
            return res.status(500).send('ERROR: ' + e);
        }

        if (!user) {
            logger.error(`user not found: "${username}"`);
            return res.status(400).send('ERROR: user not found');
        }
        next(user);
    });
};

var setUser = function(req, res, next) {
    var afterLogin = function(req, res) {
        loadUser(req.session.username, res, user => {
            req.session.user = user;
            next();
        });
    };

    if (!req.session || !req.session.username) {
        tryLogIn(req, res, afterLogin, true);
    } else {
        afterLogin(req, res);
    }
};

var setUsername = function(req, res, cb) {
    return tryLogIn(req, res, cb, true);
};

module.exports = {
    hasSocket,
    noCache,
    isLoggedIn,
    tryLogIn,
    hasRoom,
    saveLogin,
    loadUser,
    setUser,
    setUserAndSocket,
    setUsername,

    // additional
    init: _server => {
        server = _server;
        logger = server._logger.fork('middleware');
    },
    COOKIE_ID
};
