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
  var helpers = require('grunt-contrib-lib').init(grunt);

  // ==========================================================================
  // TASKS
  // ==========================================================================

  grunt.registerTask('instrument', 'instruments a file or a directory tree',
      function(target) {
        this.requiresConfig('instrument.files');
        var files = grunt.config('instrument.files');
        var options = helpers.options(this, {
          basePath : 'build/instrument/',
          flatten : false
        });
        grunt.verbose.writeflags(options, 'Options');
        grunt.helper('instrument', grunt.helper('toFiles', files), options,
            this.async());
      });

  // ==========================================================================
  // HELPERS
  // ==========================================================================
  grunt.registerHelper('toFiles', function(files) {
    return grunt.file.expandFiles(files);
  });

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
