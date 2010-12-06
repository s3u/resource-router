
# resource-router

This is a [Connect](https://github.com/senchalabs/connect) compatible nodejs module for handling HTTP requests. This
means that all Connect features and Connect-based modules will work with the `resource-router`.

# Why Another Router?

Unlike the default `router` that is bundled in Connect, `resource-router` is 'resource-based'. Here is an example.

    // resource-router example
    function main(app) {
      app.resource('/', {
        'get' : function(req, res) {
          res.writeHead(200, {
            'Content-Type': 'text/html',
            'Content-Length': body.length
          });
          res.end('Hello world', 'utf8');
        }
      });
    }

    var connect = require('connect');
    var resource = require('resource-router');

    var server = connect.createServer();
    server.use(resource(main));
    server.listen(3000);
    console.log('Connect server listening on port 3000');

To implement a resource, invoke `app.resource` with the path of the resource, and then declare method support via
an object. You can define as many methods as necessary for each resource.


    // More methods
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

resource-router automatically adds support `HEAD` and `OPTIONS` methods.

    GET /somepath HTTP/1.1
    Host: localhost:3000

    204 No Content
    Allow: GET,HEAD

Contrast this to the default `router` in Connect.

    // This is the same example with Connect. Don't use with resource-router.
    function main(app){
      app.get('/', function(req, res) {
          res.writeHead(200, {
            'Content-Type': 'text/html',
            'Content-Length': body.length
          });
          res.end('Hello world', 'utf8');
      });
      app.put('/', function(req, res) {
         // implement PUT here
         ...
      });
      app.delete('/', function(req, res) {
         // implement PUT here
         ...
      });
    }

Though the differences seem syntactical, there is a fundamental difference here. The right programming model to
write HTTP applications is to implement various HTTP methods for each resource. That is, you must start with a
resource and then specify what methods you want to support for that resource. Connect's `router` module takes the
opposite (and wrong) approach. Use `resource-router` to get the right HTTP orientation.

# Installation

    npm install resource-router