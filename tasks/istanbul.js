/*
 * grunt-istanbul
 * https://github.com/taichi/grunt-istanbul
 *
 * Copyright (c) 2012 taichi
 * Licensed under the MIT license.
 */
module.exports = function(grunt) {
  'use strict';

  var path = require('path');
  var helper = require('./helpers').init(grunt);

  grunt.registerMultiTask('instrument', 'instruments a file or a directory tree',
    function() {
      var options = this.options({
        basePath: 'build/instrument/',
        flatten: false
      });

      var files = this.data.files || this.filesSrc;

      if (files.length === 0) {
        grunt.log.write('No files to instrument...');
        grunt.log.ok();
        return;
      }

      var expandOptions = options.cwd ? {cwd: options.cwd} : {};

      var allFiles = grunt.file.expand(expandOptions, files).map(path.normalize);
      global['allFiles'] = (global['allFiles'] || []).concat(allFiles);

      helper.instrument(allFiles, options, this.async());
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
      if (options["include-all-sources"]) {
        helper.addUncoveredFiles(global[options.coverageVar], options, global['allFiles']);
      }
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
