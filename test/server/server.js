/*globals describe,it,before,beforeEach,after*/
'use strict';

describe('Server Tests', function() {
    var supertest = require('supertest'),
        assert = require('assert'),
        port = 8493,
        options = {
            port: port,
            vantage: false
        },
        api,
        Server = require('../../src/server/server'),

        basicRoutes = require('../../src/server/routes/basic-routes'),
        userRoutes = require('../../src/server/routes/users'),

        username = 'test',
        server;

    before(function(done) {
        server = new Server(options);
        server.start(done);
        api = supertest('http://localhost:'+port+'/api');
    });

    after(function(done) {
        server.stop(done);
    });

    describe('SignUp tests', function() {
        // FIXME: Unauthorized stream readable error
    });

    it('should provide lang files', function(done) {
        api.get('/lang-hu.js')
            .expect(200)
            .expect(function(res) {
                assert.notEqual(res.body.length, 0);
            })
            .end(done);
    });

    describe('Examples API', function() {
        var expectedFields = [
            'projectName',
            'primaryRoleName',
            'thumbnail',
            'notes',
            'roleNames'
        ];
        it('should provide list of examples', function(done) {
            api.get('/Examples/EXAMPLES/?metadata=true')
                .expect('Content-Type', /json/)
                .expect(200)
                .expect(function(res) {
                    assert.notEqual(res.body.length, 0);
                })
                .end(done);
        });

        expectedFields.forEach(name => {
            it(`should provide ${name}`, function(done) {
                api.get('/Examples/EXAMPLES/?metadata=true')
                    .expect(function(res) {
                        assert.notEqual(res.body[0][name], undefined);
                    })
                    .end(done);
            });
        });
    });

    describe('Reset Password tests', function() {
    });

    describe('login tests', function() {
        it.skip('should return API details', function(done) {
            var key = process.env.SECRET_KEY || 'change this',
                hasher = require('crypto').createHmac('sha512', key);

            hasher.update('password');
            api.post('/')
                .set('__u', username)
                .set('__h', hasher.digest('hex'))
                .expect(function(res) {
                    assert(res.text.indexOf('Service') === 0);
                })
                .end(done);
        });
    });

    // Check that all routes exist
    var verifyExists = function(route) {
        var endpoint = '/'+route.URL,
            method = route.Method.toLowerCase();

        it('should have endpoint ' + endpoint, function(done) {
            // FIXME: :filename is not resolved in express w/ supertest...
            api[method](endpoint)
                .end(function(err, result) {
                    // Check that the 404 is due to missing socket - not page
                    assert.notEqual(result.status, 404, result.text);
                    done();
                });
        });
    };

    describe('Existence tests', function() {
        var routes = userRoutes.concat(basicRoutes),
            conversions = {
                'rpc/:filename': 'rpc/weather.xml',
                'Examples/:name': 'Examples/Dice',
                'Sounds/:filename': 'Sounds/Cat.mp3',
                'Costumes/:filename': 'Costumes/alonzo.png',
                'libraries/:filename': 'libraries/cases.xml',
                'help/:filename': 'help/hide.png',
                'Backgrounds/:filename': 'Backgrounds/pathway.jpg'
            };

        routes
            .map(route => {
                var url = route.URL;
                route.URL = (conversions[url] || url);
                return route;
            })
            .forEach(verifyExists);
    });

    describe('SignUp tests', function() {

        it('should require both username and password', function(done) {
            api.get('/SignUp?Username='+username)
                .end(function(result) {
                    assert(!result || (result.status === 400));
                    done();
                });
        });
    });

    describe('Static function tests', function() {
        it.skip('should return valid serialized API', function() {
        });
    });

    describe('RPC Manager Tests', function() {
        var uuid,
            WebSocket = require('ws'),  // jshint ignore:line
            ROOM_NAME = 'ttt-test-room',
            api;

        before(function() {
            api = supertest('http://localhost:'+port+'/rpc/simplehangman');
        });

        // Testing an example RPC
        describe('Basic tests', function() {
            it('should exist', function(done) {
                api.get('/guess?uuid='+uuid)
                    .expect(401)
                    .end(done);
            });
        });

        describe('RPC tests', function() {
            var socket,
                host = 'ws://localhost:'+port;

            // Connect a websocket
            before(function(done) {
                socket = new WebSocket(host);
                socket.on('open', function() {
                    socket.send(JSON.stringify({
                        namespace: 'netsblox',
                        type: 'request-uuid'
                    }));

                    socket.on('message', function(msg) {
                        console.log(msg);
                        msg = JSON.parse(msg);

                        if (msg.namespace === 'netsblox' && msg.type === 'uuid') {
                            uuid = msg.body;
                            // create a room
                            var res = {
                                namespace: 'netsblox',
                                type: 'create-room',
                                room: ROOM_NAME,
                                role: 's1'
                            };
                            socket.send(JSON.stringify(res));
                            done();
                        }
                    });
                });
            });

            afterEach(function(done) {
                api.get('/restart?uuid='+uuid)
                    .expect(200)
                    .end(done);
            });

            it('should return 400 if bad action', function(done) {
                api.get('/I_dont_exist?uuid='+uuid)
                    .expect(400)
                    .end(done);
            });

            it('should respond to queries', function(done) {
                api.get('/getWrongCount?uuid='+uuid)
                    .expect(function(res) {
                        assert(+res.text > -1, res.text + ' is not > -1');
                    })
                    .end(done);
            });

            it('should maintain state', function(done) {
                api.get('/guess?uuid='+uuid+'&letter=_')
                    .expect(200)
                    .end(function() {
                        api.get('/getWrongCount?uuid='+uuid)
                            .expect(function(res) {
                                assert.equal(+res.text, 1);
                            })
                            .end(done);
                    });
            });

            describe('Second connection', function() {
                var newSocket,
                    username2;  // This is an intentionally challenging name

                before(function(done) {
                    newSocket = new WebSocket(host);
                    newSocket.on('open', function() {
                        newSocket.send(JSON.stringify({
                            namespace: 'netsblox',
                            type: 'request-uuid'
                        }));
                        newSocket.on('message', function(msg) {
                            msg = JSON.parse(msg);

                            if (msg.namespace === 'netsblox' && msg.type === 'uuid') {
                                username2 = msg.body;

                                socket.send(JSON.stringify({
                                    namespace: 'netsblox',
                                    type: 'add-role',
                                    name: 's2'
                                }));
                                var res = {
                                    namespace: 'netsblox',
                                    type: 'join-room',
                                    room: ROOM_NAME,
                                    owner: uuid,
                                    role: 's2'
                                };
                                newSocket.send(JSON.stringify(res));
                                done();
                            }
                        });
                    });
                });

                beforeEach(function(done) {
                    api.get('/guess?uuid='+uuid+'&letter=_')
                        .expect(200)
                        .end(done);
                });

                afterEach(function(done) {
                    api.get('/restart?uuid='+uuid)
                        .expect(200)
                        .end(function() {
                            api.get('/restart?uuid='+username2)
                                .expect(200)
                                .end(done);
                        });
                });

                it('should share a game board', function(done) {

                    api.get('/getWrongCount?uuid='+uuid)
                        .expect(function(res) {
                            assert.equal(res.statusCode, 200);
                            assert.equal(+res.text, 1);
                        })
                        .end(done);
                });
            });
        });
    });
});
