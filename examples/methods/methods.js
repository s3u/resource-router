var connect = require('connect');
var resource = require('resource-router');

// Test methods
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

var server = connect.createServer();

server.use(resource(main));
server.listen(3000);
console.log('Connect server listening on port 3000');
