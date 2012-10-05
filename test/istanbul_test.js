var grunt = require('grunt');
var fs = require('fs');
var rimraf = require('rimraf');
var mkdirp = require('mkdirp');
var flow = require('nue').flow;
var as = require('nue').as;
var _h = require('./testHelpers');
var throwOrDone = _h.throwOrDone;
var output = _h.fixtures('output');

/*
 * ======== A Handy Little Nodeunit Reference ========
 * https://github.com/caolan/nodeunit
 */
exports['istanbul'] = {
  setUp : function(done) {
    flow(function() {
      mkdirp(output(), this.async(as(1)));
    }, throwOrDone(done))();
  },
  tearDown : function(done) {
    rimraf(output(), done);
  },
  'instrument' : function(test) {
    test.expect(3);
    var fixtures = _h.fixtures('instrument');
    grunt.helper('instrument', [ fixtures('hello.js') ], {
      basePath : output(),
      flatten : true
    }, flow(function read() {
      fs.stat(fixtures('hello.js'), this.async(as(1)));
      fs.stat(output('hello.js'), this.async(as(1)));
    }, function(src, dest) {
      test.equal(true, src.isFile());
      test.equal(src.isFile(), dest.isFile());
      test.equal(true, src.size < dest.size);
      this.next();
    }, throwOrDone(test.done.bind(test))));
  },
  'storeCoverage' : function(test) {
    test.expect(1);
    var fixtures = _h.fixtures('storeCoverage');
    var cov = JSON.parse('{ "aaa":1, "bbb":2, "ccc":3 }');
    grunt.helper('storeCoverage', cov, {
      dir : output(),
      json : 'coverage.json'
    }, flow(function read() {
      fs.readFile(output('coverage.json'), 'utf8', this.async(as(1)));
    }, function assert(txt) {
      test.deepEqual(cov, JSON.parse(txt));
      this.next();
    }, throwOrDone(test.done.bind(test))));
  },
  'makeReport' : function(test) {
    test.expect(2);
    var fixtures = _h.fixtures('makeReport');
    grunt.helper('makeReport', [ fixtures('coverage.json') ], {
      type : 'lcov',
      dir : output()
    }, flow(function read() {
      fs.readFile(output('lcov.info'), 'utf8', this.async(as(1)));
      fs.readFile(output('lcov-report/index.html'), 'utf8', this.async(as(1)));
    }, function assert(lcov, html) {
      test.ok(lcov);
      test.ok(html);
      this.next();
    }, throwOrDone(test.done.bind(test))));
  }
};
