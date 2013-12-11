var crypto = require('crypto');
var file = require('./file');

function md5sum (filename, expected) {
  var checksum = crypto.createHash('md5');
  var code = file.read(filename);
  checksum.update(code);
  return expected === checksum.digest('hex');
}

module.exports = md5sum;