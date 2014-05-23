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
  if (source === patched) {
    logger.warn('No changes found for the package "'+ name + '"');
  } else {
    var changes = difftool.createPatch('patch', source, patched);
    // TODO: save the patch to the patches directory
    process.stdout.write(changes);
  }
}

function diff () {
  var packages = [].slice.call(arguments);
  if (packages.length) {
    packages.forEach(createDiff);
  } else {
    logger.warn('What package do you want a diff on?');
  }
}

module.exports = diff;