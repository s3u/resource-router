
/**
 * Module dependencies.
 */

var connect = require('connect'),
  assert = require('assert'),
  should = require('should'),
  resource = require('resource-router'),
  sys = require('sys');

module.exports = {
  'test methods': function(){
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
  }
};