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

function link (source, destination) {
  fs.symlinkSync(source, destination);
}

function exists (file) {
  return fs.existsSync(file);
}

module.exports = {
  'read': read,
  'write': write,
  'copy': copy,
  'link': link,
  'delete': unlink,
  'exists': exists
};