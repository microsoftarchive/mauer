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

function request (url, stream, callback) {

  // you can pass a stream to pipe the response to
  if (!callback && typeof stream === 'function') {
    callback = stream;
    stream = null;
  }

  // Only writable streams allowed
  if (!stream || !stream.pipe || !stream.write) {
    stream = null;
  }

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
  var checksum = crypto.createHash('md5');
  var req = type[protocol](options, function (response) {

    if (!stream) {
      response.on('data', function (chunk) {
        buffer += chunk;
        checksum.update(chunk);
      });
    } else {
      response.pipe(stream);
      response.pipe(checksum, {
        end: false
      });
    }

    response.on('end', function () {
      var args = [callback, null];
      if (!stream) {
        args.push(buffer);
      }
      args.push(checksum.digest('hex'));
      // give streams some time to settle down
      setTimeout(function() {
        setImmediate.apply(null, args);
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