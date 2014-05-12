var logger = require('npmlog');
var semver = require('semver');
var mkdirp = require('mkdirp');
var difftool = require('diff');

var path = require('path');

var file = require('../utils/file');
var md5sum = require('../utils/md5sum');
var request = require('../utils/request');

var dataDir = path.resolve(__dirname, '../../data');

var cwd = process.cwd();
var baseDir = (process.env.HOME || '/tmp/');
var cacheDir = path.resolve(baseDir, '.mauer/cache');
var modulesDir = path.resolve(cwd, '.mauer');

var config = {
  'dependencyDir': 'public/vendor',
  'patchesDir': 'patches'
};

mkdirp.sync(cacheDir);
mkdirp.sync(modulesDir);

function installPackage (package) {

  var tokens = package.split('@');

  // allow only valid package names
  if (tokens.length > 2) {
    logger.error('', 'Invalid package "%s"', package);
    return;
  }

  var name = tokens[0];
  var packageFile = path.join(dataDir, name + '.json');
  if (!file.exists(packageFile)) {
    logger.error('', 'Unrecognised package "%s"', package);
    return;
  }

  var version = latestVersion(name, tokens[1]);
  if (version) {
    logger.verbose('installing', name, version);
    getPackage(name, version, function (err, cache) {
      if (err) {
        throw err;
      }
      setupPackage(name, version, cache);
      logger.info('done', name);
    });
  }
}

function latestVersion (name, version) {

  if (version && version !== 'latest') {
    var parsed = semver.parse(version);
    if (parsed) {
      version = parsed.splice(1,3).join('.');
    } else {
      logger.error('', 'Unsupported "%s@%s"', name, version);
      return;
    }
  }

  var packageFile = path.join(dataDir, name + '.json');
  var packageInfo = require(packageFile);
  var versions = Object.keys(packageInfo.versions);

  // If no version is passed, fallback to the latest version
  if (!version || version === 'latest') {
    version = versions.sort(semver.rcompare)[0];
  } else if (versions.indexOf(version) < 0) {
    logger.error('', 'Unsupported "%s@%s"', name, version);
    return;
  }

  return version;
}

function getPackage (name, version, callback) {
  var packageFile = path.join(dataDir, name + '.json');
  var packageInfo = require(packageFile);
  var versionData = packageInfo.versions[version];

  var expectedSum = versionData.md5sum;
  var urls = versionData.urls;

  // create the cache directory, if it doesn't exist
  var cachedFile = path.join(cacheDir, name, version);
  mkdirp.sync(path.join(cacheDir, name));

  // if the cached file exists
  // and if the md5 sum of the cached file matches
  if (file.exists(cachedFile) && md5sum(cachedFile, expectedSum)) {
    logger.verbose('using', 'cached file for %s@%s', name, version);
    callback(null, cachedFile);
  }
  // otherwise download the file again
  else {
    logger.verbose('downloading', '%s@%s', name, version);
    urls = urls.split(/[\r\n]/g);

    // TODO: try a random url every time
    var url = urls[0];
    downloadPackage(url, cachedFile, expectedSum, callback);
  }
}

function downloadPackage (url, cachedFile, expectedSum, callback) {
  request(url, function (err, data) {
    logger.verbose('downloaded', url);
    file.write(cachedFile, data);
    var md5 = md5sum(cachedFile);
    if (md5 === expectedSum) {
      logger.verbose('checksum verfied', md5);
      callback(null, cachedFile);
    } else {
      logger.error('checksum failed', 'expected %s, got %s',
        expectedSum, md5);
      file.delete(cachedFile);
      callback(new Error('checksum failed'));
    }
  });
}

function setupPackage (name, version, cache) {
  var destDir = path.resolve(modulesDir, name);
  mkdirp.sync(destDir);

  // copy over the cached file
  var source = path.join(destDir, 'source');
  logger.verbose('setting up', name);
  file.copy(cache, source);

  // patch, if needed
  patchPackage(name, version);

  // finalize
  deployPackage(name, version);
}


function patchPackage (name, version) {
  var destDir = path.resolve(modulesDir, name);
  var original = file.read(path.join(destDir, 'source'));
  var patchName = [name, version].join('@');
  var patchFile = path.resolve(cwd, config.patchesDir, patchName);

  var content = original;
  if (file.exists(patchFile)) {
    logger.verbose('patching', patchName);
    var patch = file.read(patchFile);
    content = difftool.applyPatch(original, patch);
    if (content === false) {
      logger.error('\nfailed to patch', patchName);
      process.exit(-1);
    }
  }

  var dest = path.join(destDir, 'patched');
  file.write(dest, content);
}

function deployPackage (name, version) {
  var destDir = path.resolve(modulesDir, name);
  logger.verbose('linking', name, version);

  // delete current copy & move over the patched version
  var patched = path.join(destDir, 'patched');
  // TODO: use mauer.json for the path mappings to symlink the files
  var lib = path.resolve(cwd, config.dependencyDir, name + '.js');
  if (file.exists(lib)) {
    file.delete(lib);
  }
  file.link(patched, lib);
}

function installAll (mauerFile) {
  // TODO: handle malformed config
  var mauerConfig = require(mauerFile);
  var dependencies = mauerConfig.dependencies;

  config.patchesDir = mauerConfig.patchesDir || 'patches';
  config.dependencyDir = mauerConfig.dependencyDir;

  // ensure that the destination directory exists
  mkdirp.sync(config.dependencyDir);

  var name, version;
  for (name in dependencies) {
    version = dependencies[name];
    installPackage([name, version].join('@'));
  }
}

function install () {
  var packages = [].slice.call(arguments);

  // if specific package installation was asked for
  if (packages.length > 0) {
    packages.forEach(installPackage);
  }
  // otherwise install everything on mauer.json
  else {
    var mauerFile = path.join(cwd, 'mauer.json');
    if (!file.exists(mauerFile)) {
      logger.error('config', 'mauer.json not found');
      return;
    } else {
      installAll (mauerFile);
    }
  }
}

module.exports = install;
