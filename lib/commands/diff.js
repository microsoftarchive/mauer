var logger = require('npmlog');
var difftool = require('diff');

var path = require('path');

var file = require('../utils/file');

var modulesDir = path.resolve(process.cwd(), '.mauer');

function createDiff (name) {
  // TODO: validate package name
  logger.info('diff', name);
  var destDir = path.resolve(modulesDir, name);
  var source = file.read(path.join(destDir, 'source'));
  var patched = file.read(path.join(destDir, 'patched'));
  var changes = difftool.createPatch('patch', source, patched);
  process.stdout.write(changes);
}

function diff () {
  var packages = [].slice.call(arguments);
  packages.forEach(createDiff);
}

module.exports = diff;