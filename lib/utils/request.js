'use strict';

var URL = require('url');
var zlib = require('zlib');

var type = {
  'http': require('http').request,
  'https': require('https').request
};

var ports = {
  'http': 80,
  'https': 443
};

function request (url, callback) {

  var parsed = URL.parse(url);
  var protocol = parsed.protocol.replace(/[^a-z]/, '');

  var options = {
    'method': 'GET',
    'hostname': parsed.hostname,
    'path': parsed.path,
    'port': parsed.port || ports[protocol],
    'auth': parsed.auth
  };

  var buffer = '';
  var req = type[protocol](options, function (response) {

    var stream = response;
    if (response.headers['content-encoding'] === 'gzip') {
      stream = response.pipe(zlib.createGunzip());
    }

    stream.on('data', function (chunk) {
      buffer += chunk.toString('utf8').replace(/(\r\n)|(\r\n)/g, '\n');
    });

    stream.on('end', function () {
      // give streams some time to settle down
      setTimeout(function() {
        setImmediate(callback, null, buffer);
      }, 100);
    });
  });

  req.on('error', function(e) {
    console.error(e);
    callback(e);
  });

  req.end();
}

module.exports = request;