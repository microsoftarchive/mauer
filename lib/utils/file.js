var fs = require('fs');

var encodingOptions = { 'encoding': 'utf8' };

function read (file) {
  return fs.readFileSync(file, encodingOptions);
}

function write (file, content) {
  fs.writeFileSync(file, content, encodingOptions);
}

function copy (source, destination) {
  write(destination, read(source));
}

function unlink (file) {
  fs.unlinkSync(file);
}

module.exports = {
  'read': read,
  'write': write,
  'copy': copy,
  'delete': unlink
};