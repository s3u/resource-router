var sys = require('sys'),
  express = require('express'),
  hbs = require('hbs');
  resource = require('resource-router');

var app = express.createServer();
//app.set('views', __dirname + '/views');
app.set("view engine", "hbs");

// resource-router
function main(app) {
  app.resource('/', {
    'get' : function(req, res) {
      res.render('items.hbs', {
        locals: {
          title: 'Hello World',
          items: [
              { name: 'item1', description: 'This is item 1'},
              { name: 'item2', description: 'This is item 2' },
              { name: 'item3', email: 'This is item 3' }]
        }
      });
    }
  });
}

// Fire up the resource server
var server = express.createServer();
server.use(resource(main));
server.listen(3000);
console.log('Connect server listening on port 3000');