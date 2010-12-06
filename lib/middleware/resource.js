var parse = require('url').parse,
  querystring = require('querystring');

//
// TODO
//
module.exports = function resource(fn) {
  var routes, self = this;
  var paths;

  if (fn == undefined) {
    throw new Error('No handler provider requires a callback function');
  }

  paths = [];

  var app = {
    resource: function(path, obj) {
      obj.keys = [];
      obj.path = normalizePath(path, obj.keys);
      paths.push(obj);
    }
  }
  fn.call(this, app);

  return function resource(req, res, next) {
    // Match to a resource
    var method = req.method.toLowerCase();
    var url = parse(req.url);
    var pathname = url.pathname;
    for(var i = 0; i < paths.length; i++) {
      var path = paths[i].path;
      var keys = paths[i].keys;
      var captures = path.exec(pathname);

      if(captures) {
        // There is a match. Match parameters
        var params = [];
        for(var j = 1, len = captures.length; j < len; ++j) {
          var key = keys[j - 1],
            val = typeof captures[j] === 'string'
              ? querystring.unescape(captures[j])
              : captures[j];
          if (key) {
            params[key] = val;
          } else {
            params.push(val);
          }
        }
        req.params = params;

        // Check if the method is supported
        if(paths[i][method]) {
          // Execute the handler
          return paths[i][method](req, res, next);
        }
        else {
          res.writeHead(405);
          res.end();
        }
      }
    }
    next();
  };
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

