
// Use expresso to run this

var connect = require('connect'),
  assert = require('assert'),
  should = require('should'),
  resource = require('resource-router'),
  sys = require('sys');

module.exports = {
  'test methods': function() {
    var server = connect.createServer();

    function main(app) {
      app.resource('/', {
        'get' : function(req, res) {
          res.writeHead(200, {
            'Content-Type': 'text/html'
          });
          res.end('Hello world', 'utf8');
        },
        'put' : function(req, res) {
          res.writeHead(201, {
            'Content-Type': 'text/html',
            'Location': 'http://localhost:3000/1'
          });
          res.end('Created', 'utf8');
        },
        'delete' : function(req, res) {
          res.writeHead(200, {
            'Content-Type': 'text/html'
          });
          res.end('Deleted', 'utf8');
        }
      });
    }

    server.use(resource(main));

    assert.response(server,
    { url: '/' },
    { body: 'Hello world' });

    assert.response(server,
    { url: '/', method: 'PUT' },
    { status: 201,
      headers: {'Location' : 'http://localhost:3000/1'},
      body: 'Created' });

    assert.response(server,
    { url: '/', method: 'DELETE' },
    { body: 'Deleted' });

    assert.response(server,
    { url: '/', method: 'OPTIONS' },
    { status: 204,
      headers: {'Allow': 'OPTIONS,GET,PUT,DELETE,HEAD'}});
  },

  'test 405': function() {
    var server = connect.createServer();

    function main(app) {
      app.resource('/', {
        'get' : function(req, res) {
          res.writeHead(200, {
            'Content-Type': 'text/html'
          });
          res.end('Hello world', 'utf8');
        }
      });
    }

    server.use(resource(main));

    assert.response(server,
    { url: '/', method: 'PUT'},
    { status: 405});
  },

  'test routes' : function() {
    var server = connect.createServer();

    var users = [
      { name: 'tj' },
      { name: 'tim' }
    ];

    function user(app) {
      app.resource('/.:format?', {
        'get' : function(req, res, next) {
          switch (req.params.format) {
            case 'json':
              var body = JSON.stringify(users);
              res.writeHead(200, {
                'Content-Type': 'application/json',
                'Content-Length': body.length
              });
              res.end(body);
              break;
            default:
              var body = '<ul>'
                + users.map(
                           function(user) {
                             return '<li>' + user.name + '</li>';
                           }).join('\n')
                + '</ul>';
              res.writeHead(200, {
                'Content-Type': 'text/html',
                'Content-Length': body.length
              });
              res.end(body);
          }
        }
      });

      app.resource('/:id.:format', {
        'get' : function(req, res, next) {
          var user = users[req.params.id];
          if (user && req.params.format === 'json') {
            user = JSON.stringify(user);
            res.writeHead(200, {
              'Content-Type': 'application/json',
              'Content-Length': user.length
            });
            res.end(user);
          }
          else {
            next(true);
          }
        }
      })

      app.resource('/:id/:op?', {
        'get' : function(req, res) {
          if(users[req.params.id]) {
            var body = users[req.params.id]
              ? users[req.params.id].name
              : 'User ' + req.params.id + ' does not exist';
            body = (req.params.op || 'view') + 'ing ' + body;
            res.writeHead(200, {
              'Content-Type': 'text/html',
              'Content-Length': body.length
            });
            res.end(body, 'utf8');
          }
          else {
            res.writeHead(404);
            res.end('Not found', 'utf8');
          }
        }
      })
    }

    server.use('/users', resource(user));

    assert.response(server,
    { url: '/users', method: 'GET'},
    { status: 200,
      headers: {'Content-Type': 'text/html'}});

    assert.response(server,
    { url: '/users.json', method: 'GET'},
      function(res) {
        assert.equal(200, res.statusCode);
        assert.equal('application/json', res.headers['content-type']);
        assert.deepEqual(users, JSON.parse(res.body));
      });

    assert.response(server,
    { url: '/users/1.json', method: 'GET'},
    { status: 200,
      headers: {'Content-Type': 'application/json'}});

    assert.response(server,
    { url: '/users/blah', method: 'GET'},
    { status: 404});

  }
};