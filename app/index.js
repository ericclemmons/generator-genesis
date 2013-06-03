'use strict';

var fs      = require('fs');
var util    = require('util');
var path    = require('path');
var yeoman  = require('yeoman-generator');


var GenesisGenerator = module.exports = function GenesisGenerator(args, options, config) {
  yeoman.generators.Base.apply(this, arguments);

  this.on('end', function () {
    this.installDependencies({ skipInstall: options['skip-install'] });
  });

  this.pkg = JSON.parse(this.readFileAsString(path.join(__dirname, '../package.json')));
};

util.inherits(GenesisGenerator, yeoman.generators.Base);

GenesisGenerator.prototype.askFor = function askFor() {
  var cb = this.async();

  // welcome message
  var welcome =
  "\n    .---------------------------------------." +
  "\n    |                                       |" +
  "\n    |    " + "G E N E S I S   S K E L E T O N".yellow.bold + "    |" +
  "\n    |                                       |" +
  "\n    |        " + "You're moments away from".red + "       |" +
  "\n    |          " + "your next great app!".red + "         |" +
  "\n    |                                       |" +
  "\n    '---------------------------------------'" +
  "\n";

  this.log.writeln(welcome);

  var prompts = [];

  try {
    var pkg = require(path.join(process.cwd(), 'package.json'));
  } catch (e) {}

  if (!pkg) {
    prompts.push({
      name:     'initNpm',
      message:  'Would you like to setup ' + 'package.json'.yellow + ' first?',
      default:  'Y/n'
    });
  }

  this.prompt(prompts, function (err, props) {
    if (err) {
      return this.emit('error', err);
    }

    for (var prop in props) {
      this[prop] = (/y/i).test(props[prop]);
    }

    cb();
  }.bind(this));
};

GenesisGenerator.prototype.npm = function npm() {
  var done = this.async();

  if (this.initNpm) {
    var cb = function(err) {
      this.log.ok('Initialized ' + 'package.json'.yellow);
      done(err);
    }.bind(this);

    this.spawnCommand('npm', ['init'], cb).on('exit', cb);
  } else {
    this.log.ok('Already initialized ' + 'package.json'.yellow);
    done();
  }
}

GenesisGenerator.prototype.clone = function clone() {
  var cb      = this.async();
  var branch  = this.options.branch || 'master';

  if (this.options.feature) {
    branch = 'feature/' + this.options.feature;
  }

  try {
    var originalPkg = require(path.join(process.cwd(), 'package.json'));
  } catch (e) {}

  this.remote('ericclemmons', 'genesis-skeleton', branch, function(err, remote) {
    this.log.ok('Downloaded latest Genesis Skeleton (' + branch.yellow + ')');

    if (originalPkg) {
      var remotePath  = path.join(remote.cachePath, 'package.json');
      var remotePkg   = JSON.parse(fs.readFileSync(remotePath));
      var props       = ['scripts', 'dependencies', 'peerDependencies'];


      for (var key in props) {
        var prop = props[key];

        if (!originalPkg[prop]) {
          originalPkg[prop] = {};
        }

        this._.extend(originalPkg[prop], remotePkg[prop] || {});
      }

      fs.writeFileSync(remotePath, JSON.stringify(originalPkg, null, 2) + "\n");

      this.log.ok('Merged Genesis Skeleton package into existing ' + 'package.json'.yellow);
    }

    remote.directory('.', '.');

    cb();
  }.bind(this), true);
};

GenesisGenerator.prototype.cleanup = function cleanup() {
  this.log.ok('Generated Genesis Skeleton');
};
