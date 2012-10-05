/*
 * grunt-istanbul
 * https://github.com/taichi/grunt-istanbul
 *
 * Copyright (c) 2012 taichi
 * Licensed under the MIT license.
 */
module.exports = function(grunt) {
  'use strict';

  var fs = require('fs');
  var path = require('path');

  var flow = require('nue').flow;
  var as = require('nue').as;

  var istanbul = require('istanbul');
  var helpers = require('grunt-contrib-lib').init(grunt);

  // ==========================================================================
  // TASKS
  // ==========================================================================

  grunt.registerTask('instrument', 'instruments a file or a directory tree',
      function(target) {
        var key = 'instrument.files';
        this.requiresConfig(key);
        var files = grunt.config(key);
        var options = helpers.options(this, {
          basePath : 'build/instrument/',
          flatten : false
        });
        grunt.verbose.writeflags(options, 'Options');
        grunt.helper('instrument', grunt.file.expandFiles(files), options, this
            .async());
      });

  grunt.registerTask('reloadTasks', 'override instrumented tasks', function(
      target) {
    var key = 'reloadTasks.rootPath';
    this.requiresConfig(key);
    var path = grunt.config(key);
    grunt.verbose.writeln('Tasks from ' + path);
    grunt.loadTasks(path);
    grunt.log.ok();
  });

  grunt.registerTask('storeCoverage', 'store coverage from global', function(
      target) {
    var options = helpers.options(this, {
      dir : 'build/reports/',
      json : 'coverage.json',
      coverageVar : '__coverage__'
    });
    grunt.verbose.writeflags(options, 'Options');
    if (global[options.coverageVar]) {
      grunt.helper('storeCoverage', global[options.coverageVar], options, this
          .async());
    } else {
      grunt.fail.fatal('No coverage information was collected');
    }
  });

  grunt.registerTask('makeReport', 'make coverage report', function(target) {
    var key = 'makeReport.src';
    this.requiresConfig(key);
    var files = grunt.config(key);
    var options = helpers.options(this, {
      type : 'lcov',
      dir : 'build/reports/'
    });
    grunt.verbose.writeflags(options, 'Options');
    grunt.helper('makeReport', grunt.file.expandFiles(files), options, this
        .async());
  });

  // ==========================================================================
  // HELPERS
  // ==========================================================================
  function flowEnd(err, done) {
    if (err) {
      grunt.fail.fatal(err);
    } else {
      grunt.log.ok();
    }
    done();
  }

  grunt.registerHelper('instrument', function(files, options, done) {
    var instFlow = flow(function readFile(file) {
      fs.readFile(file, 'utf8', this.async({
        name : file,
        code : as(1)
      }));
    }, function instrument(f) {
      grunt.verbose.writeln('instrument from ' + f.name);
      var instrumenter = new istanbul.Instrumenter(options);
      instrumenter.instrument(f.code, f.name, this.async({
        name : f.name,
        code : as(1)
      }));
    }, function write(result) {
      var out = path.join(options.basePath, options.flatten === true ? path
          .basename(result.name) : result.name);
      grunt.verbose.writeln('instrument to ' + out);
      grunt.file.mkdir(path.dirname(out));
      fs.writeFile(out, result.code, 'utf8', this.async(as(1)));
    }, function end() {
      flowEnd(this.err, this.next.bind(this));
    });

    flow(function(filelist) {
      this.asyncEach(filelist, function(file, group) {
        this.exec(instFlow, file, group.async(as(1)));
      });
    }, done)(files);
  });

  grunt.registerHelper('storeCoverage', function(coverage, options, done) {
    flow(function write_json(cov) {
      var json = path.resolve(options.dir, options.json);
      grunt.file.mkdir(path.dirname(json));
      fs.writeFile(json, JSON.stringify(cov), 'utf8', this.async(as(1)));
    }, function() {
      flowEnd(this.err, done);
    })(coverage);
  });

  grunt.registerHelper('makeReport', function(files, options, done) {
    flow(function(filelist) {
      this.asyncEach(filelist, function(file, group) {
        grunt.verbose.writeln('read from ' + file);
        fs.readFile(file, 'utf8', group.async(as(1)));
      });
    }, function report(list) {
      var collector = new istanbul.Collector();
      list.forEach(function(json) {
        collector.add(JSON.parse(json));
      });
      var reporter = istanbul.Report.create(options.type, options);
      reporter.writeReport(collector, true);
      this.next();
    }, function() {
      flowEnd(this.err, done);
    })(files);
  });
};
