var URL = require('url');
var crypto = require('crypto');

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

  var buffer;
  var checksum = crypto.createHash('md5');
  var req = type[protocol](options, function (response) {

    response.on('data', function (chunk) {
      buffer += chunk;
      checksum.update(chunk);
    });

    response.on('end', function () {
      callback(null, buffer, checksum.digest('hex'));
    });
  });

  req.on('error', function(e) {
    console.error(e);
    callback(e);
  });

  req.end();
}

module.exports = request;