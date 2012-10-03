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

  // TODO: ditch this when grunt v0.4 is released
  grunt.util = grunt.util || grunt.utils;

  var Instrumenter = require('istanbul').Instrumenter;
  var Collector = require('istanbul').Collector;
  var Report = require('istanbul').Report;
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
    grunt.loadTasks(path);
  });

  grunt.registerTask('coverreport', 'make coverage report', function(target) {
    var options = helpers.options(this, {
      type : 'html',
      dir : 'build/reports/',
      coverageVar : '__coverage__'
    });
    if (global[options.coverageVar]) {
      var collector = new Collector();
      collector.add(global[options.coverageVar]);
      var reporter = Report.create(options.type, options);
      reporter.writeReport(collector, true);
      grunt.log.ok();
    } else {
      grunt.fail.fatal('No coverage information was collected');
    }
  });

  // ==========================================================================
  // HELPERS
  // ==========================================================================
  grunt.registerHelper('instrument', function(files, options, done) {
    var instFlow = flow(function readFile(file) {
      fs.readFile(file, 'utf8', this.async({
        name : file,
        code : as(1)
      }));
    }, function instrument(f) {
      grunt.verbose.writeln('instrument from ' + f.name);
      var instrumenter = new Instrumenter(options);
      instrumenter.instrument(f.code, f.name, this.async({
        name : f.name,
        err : as(0),
        code : as(1)
      }));
    }, function write(result) {
      if (result.err) {
        this.endWith(result.err);
      } else {
        var out = path.join(options.basePath, options.flatten === true ? path
            .basename(result.name) : result.name);
        grunt.verbose.writeln('instrument to ' + out);
        grunt.file.mkdir(path.dirname(out));
        fs.writeFile(out, result.code, 'utf8', this.async(as(1)));
      }
    }, function end() {
      if (this.err) {
        grunt.fail.fatal(this.err);
      }
      this.next();
    });

    flow(function(filelist) {
      this.asyncEach(filelist, function(file, group) {
        this.exec(instFlow, file, group.async(as(1)));
      });
    }, done)(files);
  });

};
