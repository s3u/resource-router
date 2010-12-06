var connect = require('connect');
var resource = require('resource-router');

// Test methods
function main(app) {
  app.resource('/', {
    'get' : function(req, res) {
      res.writeHead(200, {
        'Content-Type': 'text/html',
        'Content-Length': body.length
      });
      res.end('Hello world', 'utf8');
    },
    'put' : function(req, res) {
      // implement PUT here
    },
    'delete' : function(req, res) {
      // implement DELETE here
    }
  });
}

var server = connect.createServer(
    connect.logger({ buffer: true }),
    connect.cache(),
    connect.gzip()
  );

server.use('/users', resource(user));
server.use(resource(main));
server.listen(3000);
console.log('Connect server listening on port 3000');
