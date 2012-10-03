var grunt = require('grunt');
var fs = require('fs');
var rimraf = require('rimraf');
var mkdirp = require('mkdirp');
var flow = require('nue').flow;
var as = require('nue').as;
var _h = require('./testHelpers');
var throwOrDone = _h.throwOrDone;
var fixtures = _h.fixtures('toFiles');

/*
 * ======== A Handy Little Nodeunit Reference ========
 * https://github.com/caolan/nodeunit
 */
exports.toFiles = {
  // leaning testCases
  setUp : function(done) {
    flow(function() {
      mkdirp(fixtures('aaa'), this.async(as(1)));
    }, function() {
      fs.writeFile(fixtures('bbb.js'), 'bbb', 'utf8', this.async(as(1)));
      fs.writeFile(fixtures('ccc.js'), 'ccc', 'utf8', this.async(as(1)));
      fs.writeFile(fixtures('ddd.html'), 'ddd', 'utf8', this.async(as(1)));
      fs.writeFile(fixtures('aaa/eee.js'), 'eee', 'utf8', this.async(as(1)));
      fs.writeFile(fixtures('aaa/fff.js'), 'fff', 'utf8', this.async(as(1)));
    }, throwOrDone(done))();
  },
  tearDown : function(done) {
    rimraf(fixtures(''), done);
  },
  'string' : function(test) {
    test.expect(1);
    var files = grunt.helper('toFiles', fixtures('*.js'));
    test.deepEqual(files, [ fixtures('bbb.js'), fixtures('ccc.js') ]);
    test.done();
  },
  'array' : function(test) {
    test.expect(1);
    var files = grunt.helper('toFiles', [ fixtures('aaa/*.js'),
        fixtures('ccc.js') ]);
    test.deepEqual(files, [ fixtures('aaa/eee.js'), fixtures('aaa/fff.js'),
        fixtures('ccc.js') ]);
    test.done();
  }
};
