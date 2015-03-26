'use strict';

var grunt = require('grunt');
var fs = require('fs');
var rimraf = require('rimraf');
var mkdirp = require('mkdirp');
var flow = require('nue').flow;
var as = require('nue').as;
var _h = require('./testHelpers');
var throwOrDone = _h.throwOrDone;
var output = _h.fixtures('output');
var istanbul = require('istanbul');
var helper = require('../tasks/helpers').init(grunt);
var isparta = require('isparta');

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
    helper.instrument([ fixtures('hello.js') ], {
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
  'customInstrument': function(test) {
    test.expect(3);
    var fixtures = _h.fixtures('instrument');
    helper.instrument([ fixtures('hello.es6') ], {
      basePath : output(),
      flatten : true,
      instrumenter: isparta.Instrumenter
    }, flow(function read() {
      fs.stat(fixtures('hello.es6'), this.async(as(1)));
      fs.stat(output('hello.es6'), this.async(as(1)));
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
    helper.storeCoverage(cov, {
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
    helper.makeReport([ fixtures('coverage.json') ], {
      type : 'lcov',
      dir : output(),
      print : 'none'
    }, flow(function read() {
      fs.readFile(output('lcov.info'), 'utf8', this.async(as(1)));
      fs.readFile(output('lcov-report/index.html'), 'utf8', this.async(as(1)));
    }, function assert(lcov, html) {
      test.ok(lcov);
      test.ok(html);
      this.next();
    }, throwOrDone(test.done.bind(test))));
  },
  'makeReport.reporters' : function(test) {
    test.expect(4);
    var fixtures = _h.fixtures('makeReport');

    var textNotWritten = true;
    var TextReport = istanbul.Report.create('text').constructor;
    var writeTextReport = TextReport.prototype.writeReport;
    TextReport.prototype.writeReport = function() {
      textNotWritten = false;
    };

    var textSummaryWritten = false;
    var TextSummaryReport = istanbul.Report.create('text-summary').constructor;
    var writeTextSummaryReport = TextSummaryReport.prototype.writeReport;
    TextSummaryReport.prototype.writeReport = function() {
      textSummaryWritten = true;
    };

    helper.makeReport([ fixtures('coverage.json') ], {
      reporters : {
        lcov : {dir : output()},
        text : false,
        'text-summary' : true
      },
      print : 'none'
    }, flow(function read() {
      fs.readFile(output('lcov.info'), 'utf8', this.async(as(1)));
      fs.readFile(output('lcov-report/index.html'), 'utf8', this.async(as(1)));
    }, function assert(lcov, html) {
      TextReport.prototype.writeReport = writeTextReport;
      TextSummaryReport.prototype.writeReport = writeTextSummaryReport;
      test.ok(lcov);
      test.ok(html);
      test.ok(textNotWritten);
      test.ok(textSummaryWritten);
      this.next();
    }, throwOrDone(test.done.bind(test))));
  }
};
