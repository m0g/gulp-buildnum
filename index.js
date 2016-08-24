'use strict';

var path = require('path');
var pluginError = require('plugin-error');
var log = require('plugin-log');
var through = require('through2');
var semver = require('semver');

var PLUGIN_NAME = 'gulp-buildnum';

let bump = (opts, cb) => {
  var regex = opts.regex || new RegExp(
    '([\'|\"]?' + opts.key + '[\'|\"]?[ ]*:[ ]*[\'|\"]?)(\\d+)' +
    '(-[0-9A-Za-z\.-]+)?([\'|\"]?)', 'i');

  opts.str = opts.str.replace(regex, function(match, prefix, parsed, prerelease, suffix) {
    let version = parseInt(parsed);
    opts.prev = version;
    version++;
    opts.new = version;
    return prefix + version + (suffix || '');
  });

  return cb(null, opts);
};

module.exports = function(opts) {

  opts = opts || {};
  if (!opts.type || !semver.inc('0.0.1', opts.type)) {
    opts.type = 'patch';
  }

  return through.obj(function(file, enc, cb) {

    if (file.isNull()) {
      return cb(null, file);
    }
    if (file.isStream()) {
      return cb(new pluginError(PLUGIN_NAME, 'Streaming not supported'));
    }

    opts.str = String(file.contents);
    console.log('bump', opts);
    bump(opts, function(err, res) {
      if (err) {
        return cb(new pluginError(PLUGIN_NAME, err));
      }
      file.contents = new Buffer(res.str);

      if (!opts.quiet) {
      log('Bumped', log.colors.cyan(res.prev),
        'to', log.colors.magenta(res.new));
      }
      file.bumpData = res;
      cb(null, file);
    });
  });
};
