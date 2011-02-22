var parse = require('url').parse,
  querystring = require('querystring');

/*
 * This is a connect handler for routing HTTP requests to apps.
 *
 * Here is an example of how to use this handler.
 *
 *    var connect = require('connect');
 *    var resource = require('resource-router');
 *
 *    // Write the app
 *    function main(app) {
 *      app.resource('/', {
 *        'get' : function(req, res) {
 *          res.writeHead(200, {
 *            'Content-Type': 'text/html'
 *          });
 *          res.end('Hello World', 'utf8');
 *        },
 *        'put' : function(req, res) {
 *          ...
 *        }
 *      });
 *    }
 *
 *    // Create the server.
 *    var server = connect.createServer(
 *     connect.logger({ buffer: true }),
 *     connect.gzip());
 *
 *   // Bind the app to the server and start
 *   server.use(resource(main));
 *   server.listen(3000);
 *
 */
module.exports = function resource(fn) {
  if (fn == undefined) {
    throw new Error('No handler provided!');
  }

  var paths = [];

  // Provide a function to the app to let it register resources and handlers to the
  // resource router.
  var app = {
    resource: function(path, obj) {
      obj._keys = [];
      obj._path = normalizePath(path, obj._keys);
      paths.push(obj);
    }
  };
  fn.call(this, app);

  // This is the function that the app passes onto the connect. Connect routes incoming
  // requests to this function for handling. This will then do path matching to route
  // the request to various resources.
  return function resource(req, res, next) {
    // Match to a resource
    var method = req.method.toLowerCase();
    var url = parse(req.url);
    var pathname = url.pathname;

    var i, name;

    // Special handling for OPTIONS /*
    if('options' == method && '/*' == req.url) {
      var supported = ['OPTIONS'];
      for(i = 0, len = paths.length; i < len; i++) {
        for (name in paths[i]) {
          // TODO: Hate using underscores. There should be a better way to hide these
          if (name.charAt(0) != '_' && paths[i].hasOwnProperty(name)) {
            collectHeaders(supported, name);
          }
        }
        if(paths[i]['get']) {
          if(supported.indexOf('HEAD') == -1) {
            supported.push('HEAD');
          }
        }
      }

      res.writeHead(204, {
        'Allow' : supported.join(',')
      });
      res.end();
      next();
      return;
    }

    for (i = 0, len = paths.length; i < len; i++) {
      var path = paths[i]._path;
      var keys = paths[i]._keys;
      var matches = path.exec(pathname);

      if (matches) {
        // There is a match. Match parameters
        req.params = [];
        for (var j = 1, len = matches.length; j < len; ++j) {
          var key = keys[j - 1],
            val = typeof matches[j] === 'string' ? querystring.unescape(matches[j]) : matches[j];
          if (key) {
            req.params[key] = val;
          }
          else {
            req.params.push(val);
          }
        }

        // Check if the method is supported
        if (paths[i][method]) {
          // Execute the handler
          return paths[i][method](req, res, next);
        }
        else {
          switch(method) {
            case 'head' :
              method = 'get';
              paths[i][method](req, res, next);
              break;
            case 'options' :
              // Find the supported methods
              var supported = ['OPTIONS'];
              for (name in paths[i]) {
                // TODO: Hate using underscores. There should be a better way to hide these
                if (name.charAt(0) != '_' && paths[i].hasOwnProperty(name)) {
                  collectHeaders(supported, name);
                }
              }
              if(paths[i]['get']) {
                collectHeaders(supported, 'HEAD');
              }

              res.writeHead(204, {
                'Allow' : supported.join(',')
              });
              res.end();
              break;
            default:
              // TODO: Should map to error handlers
              res.writeHead(405);
              res.end();
          }
        }
      }
    }
    next();
  };
};

function collectHeaders(headers, header) {
  if(headers.indexOf(header.toUpperCase()) == -1) {
    headers.push(header.toUpperCase());
  }
}

// The following function is duplicated from
// https://github.com/senchalabs/connect/blob/master/lib/connect/middleware/router.js
// and hence the following copyright is included from the connect project.
//
//  (The MIT License)
//
//  Copyright (c) 2010 Sencha Inc.
//
//  Permission is hereby granted, free of charge, to any person obtaining
//  a copy of this software and associated documentation files (the
//  'Software'), to deal in the Software without restriction, including
//  without limitation the rights to use, copy, modify, merge, publish,
//  distribute, sublicense, and/or sell copies of the Software, and to
//  permit persons to whom the Software is furnished to do so, subject to
//  the following conditions:
//
//  The above copyright notice and this permission notice shall be
//  included in all copies or substantial portions of the Software.
//
//  THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
//  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
//  MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
//  IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
//  CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
//  TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
//  SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
//
function normalizePath(path, keys) {
  path = path
    .concat('/?')
    .replace(/\/\(/g, '(?:/')
    .replace(/(\/)?(\.)?:(\w+)(?:(\(.*?\)))?(\?)?/g, function(_, slash, format, key, capture, optional){
      keys.push(key);
      slash = slash || '';
      return ''
        + (optional ? '' : slash)
        + '(?:'
        + (optional ? slash : '')
        + (format || '') + (capture || '([^/]+?)') + ')'
        + (optional || '');
    })
    .replace(/([\/.])/g, '\\$1')
    .replace(/\*/g, '(.+)');
  return new RegExp('^' + path + '$', 'i');
}

