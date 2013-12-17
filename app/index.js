'use strict';

var fs      = require('fs');
var util    = require('util');
var path    = require('path');
var yeoman  = require('yeoman-generator');
var chalk   = require('chalk');


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
  "\n    |    " + chalk.yellow.bold("G E N E S I S   S K E L E T O N") + "    |" +
  "\n    |                                       |" +
  "\n    |        " + chalk.red("You're moments away from") + "       |" +
  "\n    |          " + chalk.red("your next great app!") + "         |" +
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
      message:  'Would you like to setup ' + chalk.yellow('package.json') + ' first?',
      default:  'Y/n'
    });
  }

  this.prompt(prompts, function (props) {
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
      this.log.ok('Initialized ' + chalk.yellow('package.json'));
      done(err);
    }.bind(this);

    this.spawnCommand('npm', ['init'], cb).on('exit', cb);
  } else {
    this.log.ok('Already initialized ' + chalk.yellow('package.json'));
    done();
  }
}

GenesisGenerator.prototype.clone = function clone() {
  var cb      = this.async();
  var branch  = this.options.branch || 'master';

  if (this.options.variant) {
    branch = 'variant/' + this.options.variant;
  }

  try {
    var originalPkg = require(path.join(process.cwd(), 'package.json'));
  } catch (e) {}

  this.remote('ericclemmons', 'genesis-skeleton', branch, function(err, remote) {
    this.log.ok('Downloaded latest Genesis Skeleton (' + chalk.yellow(branch) + ')');

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

      this.log.ok('Merged Genesis Skeleton package into existing ' + chalk.yellow('package.json'));
    }

    remote.directory('.', '.');

    cb();
  }.bind(this), true);
};

GenesisGenerator.prototype.cleanup = function cleanup() {
  this.log.ok('Generated Genesis Skeleton');
};
