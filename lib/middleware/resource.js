var parse = require('url').parse,
  querystring = require('querystring');

/*
 * This is a connect handler for routing HTTP requests to apps.
 */
module.exports = function resource(fn) {
  var routes, self = this;
  var paths;

  if (fn == undefined) {
    throw new Error('No handler provider requires a callback function');
  }

  paths = [];

  var app = {
    resource: function(path, obj) {
      obj._keys = [];
      obj._path = normalizePath(path, obj._keys);
      paths.push(obj);
    }
  };
  fn.call(this, app);

  return function resource(req, res, next) {
    // Match to a resource
    var method = req.method.toLowerCase();
    var url = parse(req.url);
    var pathname = url.pathname;
    for (var i = 0; i < paths.length; i++) {
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
              // TODO: Special handling for *

              // Find the supported methods
              var str = '';
              var supported = [];
              for (var name in paths[i]) {
                // TODO: Hate using underscores. There should be a better way to hide these
                if (name.charAt(0) != '_' && paths[i].hasOwnProperty(name)) {
                  str += name.toUpperCase() + ',';
                }
              }
              if(paths[i]['get']) {
                str += 'HEAD';
              }
              if(str.charAt(str.length - 1) == ',') {
                str = str.substring(0, str.length - 1);
              }

              res.writeHead(204, {
                'Allow' : str
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
    .replace(/(\/)?(\.)?:(\w+)(\?)?/g, function(_, slash, format, key, optional) {
    keys.push(key);
    slash = slash || '';
    return ''
      + (optional ? '' : slash)
      + '(?:'
      + (optional ? slash : '')
      + (format || '') + '([^/.]+))'
      + (optional || '');
  })
    .replace(/([\/.])/g, '\\$1')
    .replace(/\*/g, '(.+)');
  return new RegExp('^' + path + '$', 'i');
}

