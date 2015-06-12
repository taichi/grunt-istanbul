/*
 * grunt-istanbul
 * https://github.com/taichi/grunt-istanbul
 *
 * Copyright (c) 2012 taichi
 * Licensed under the MIT license.
 */
module.exports = function(grunt) {
  'use strict';

  var helper = require('./helpers').init(grunt);
  grunt
      .registerTask('instrument', 'instruments a file or a directory tree',
          function(target) {
            var key = 'instrument.files';
            this.requiresConfig(key);
            var files = grunt.config(key);
            var options = this.options({
              basePath : 'build/instrument/',
              flatten : false
            });

            var expandOptions = options.cwd ? {cwd: options.cwd} : {};

            helper.instrument(grunt.file.expand(expandOptions, files), options, this
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
    var options = this.options({
      dir : 'build/reports/',
      json : 'coverage.json',
      coverageVar : '__coverage__'
    });
    if (global[options.coverageVar]) {
      helper.storeCoverage(global[options.coverageVar], options, this.async());
    } else {
      grunt.fail.fatal('No coverage information was collected');
    }
  });

  grunt.registerTask('makeReport', 'make coverage report', function(target) {
    var key = 'makeReport.src';
    this.requiresConfig(key);
    var files = grunt.config(key);
    var options = this.options({
      reporters : {},
      type : 'lcov',
      dir : 'build/reports/',
      print : 'none'
    });
    helper.makeReport(grunt.file.expand(files), options, this.async());
  });
};
