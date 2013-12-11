var crypto = require('crypto');
var file = require('./file');

function md5sum (filename, expected) {
  var checksum = crypto.createHash('md5');
  var code = file.read(filename);
  checksum.update(code);
  var got = checksum.digest('hex');
  return expected ? expected === got : got;
}

module.exports = md5sum;