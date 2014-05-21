module.exports = function(grunt) {
  'use strict';

  var dateFormat = require('dateformat');

  var tests = 'test/**/*_test.js';
  var tasks = 'tasks/**/*.js';
  var reportDir = 'build/reports/' + dateFormat(new Date(), 'yyyymmdd-HHMMss');

  grunt.initConfig({
    clean : [ 'build' ],
    nodeunit : {
      files : [ tests ]
    },
    watch : {
      files : [ tasks, tests ],
      tasks : 'default'
    },
    jshint : {
      files : [ 'Gruntfile.js', tasks, tests ],
      options : {
        curly : true,
        eqeqeq : true,
        immed : true,
        latedef : true,
        newcap : true,
        noarg : true,
        sub : true,
        undef : true,
        boss : true,
        eqnull : true,
        node : true
      },
      globals : {}
    },
    instrument : {
      files : tasks,
      options : {
        lazy : true,
        basePath : 'build/instrument/'
      }
    },
    reloadTasks : {
      rootPath : 'build/instrument/tasks'
    },
    storeCoverage : {
      options : {
        dir : reportDir
      }
    },
    makeReport : {
      src : 'build/reports/**/*.json',
      options : {
        type : ['lcov', 'html'],
        dir : reportDir,
        print : 'detail'
      }
    }
  });

  // Load local tasks.
  grunt.loadTasks('tasks');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-nodeunit');

  grunt.registerTask('test', 'nodeunit');
  grunt.registerTask('default', [ 'jshint', 'test' ]);
  grunt.registerTask('cover', [ 'clean', 'instrument', 'reloadTasks', 'test',
      'storeCoverage', 'makeReport' ]);

};
