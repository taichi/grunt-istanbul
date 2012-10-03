var grunt = require('grunt');
var fs = require('fs');
var rimraf = require('rimraf');
var mkdirp = require('mkdirp');
var flow = require('nue').flow;
var as = require('nue').as;
var _h = require('./testHelpers');
var throwOrDone = _h.throwOrDone;
var fixtures = _h.fixtures('instrument');
var output = fixtures('output');

/*
 * ======== A Handy Little Nodeunit Reference ========
 * https://github.com/caolan/nodeunit
 */
exports['istanbul'] = {
  setUp : function(done) {
    flow(function() {
      mkdirp(output, this.async(as(1)));
    }, throwOrDone(done))();
  },
  tearDown : function(done) {
    rimraf(output, done);
  },
  'instrument' : function(test) {
    test.expect(3);
    grunt.helper('instrument', [ fixtures('hello.js') ], {
      basePath : output,
      flatten : true
    }, function() {
      flow(function() {
        fs.stat(fixtures('hello.js'), this.async(as(1)));
        fs.stat(fixtures('output/hello.js'), this.async(as(1)));
      }, function(src, dest) {
        test.equal(true, src.isFile());
        test.equal(src.isFile(), dest.isFile());
        test.equal(true, src.size < dest.size);
        this.next();
      }, throwOrDone(function() {
        test.done();
      }))();
    });
  }
};
