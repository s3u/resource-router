var sys = require('sys');
var parse = require('url').parse,
  querystring = require('querystring');

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

  // fn is the main app
  sys.log(sys.inspect(fn));
  fn.call(this, app);

  sys.log(sys.inspect(paths));

  return function resource(req, res, next) {
    // Match to a resource - i.e., match to each path regexp
    var method = req.method.toLowerCase();
    var url = parse(req.url);
    sys.log(sys.inspect(url));
    var pathname = url.pathname;
    for(var i = 0; i < paths.length; i++) {
      var path = paths[i].path;
      var keys = paths[i].keys;
      sys.log(path);
      var captures = path.exec(pathname);
      sys.log(sys.inspect(paths[i]));
      if(captures) {
        // There is a match. Execute the handler
        sys.log("match found");

        // Prepare params
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

        if(paths[i][method]) {
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

