module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    clean : [ "build" ],
    test : {
      files : [ 'test/**/*_test.js' ]
    },
    lint : {
      src : 'tasks/**/*.js',
      grunt : 'grunt.js',
      test : '<config:test.files>'
    },
    watch : {
      files : [ '<config:lint.src>', '<config:test.files>' ],
      tasks : 'default'
    },
    jshint : {
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
        node : true,
        es5 : true
      },
      globals : {}
    },
    instrument : {
      files : '<config:lint.src>',
      options : {
        basePath : 'build/instrument/'
      }
    },
    reloadTasks : {
      rootPath : 'build/instrument/tasks'
    }
  });

  // Load local tasks.
  grunt.loadTasks('tasks');
  grunt.loadNpmTasks('grunt-contrib-clean');

  grunt.registerTask('default', 'lint test');
  grunt.registerTask('cover', 'clean instrument reloadTasks test coverreport');

};
