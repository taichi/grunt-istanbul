exports.init = function(grunt) {
  'use strict';

  var fs = require('fs');
  var path = require('path');

  var flow = require('nue').flow;
  var as = require('nue').as;

  var istanbul = require('istanbul');

  function flowEnd(err, done) {
    if (err) {
      grunt.fail.fatal(err);
    } else {
      grunt.log.ok();
    }
    done();
  }

  return {
    instrument : function(files, options, done) {
      var instFlow = flow(function readFile(file) {
        fs.readFile(file, 'utf8', this.async({
          name : file,
          code : as(1)
        }));
      }, function instrument(f) {
        grunt.verbose.writeln('instrument from ' + f.name);
        var instrumenter = new istanbul.Instrumenter(options);
        instrumenter.instrument(f.code, f.name, this.async({
          name : f.name,
          code : as(1)
        }));
      }, function write(result) {
        var out = path.join(options.basePath, options.flatten === true ? path
            .basename(result.name) : result.name);
        grunt.verbose.writeln('instrument to ' + out);
        grunt.file.mkdir(path.dirname(out));
        fs.writeFile(out, result.code, 'utf8', this.async(as(1)));
      }, function end() {
        flowEnd(this.err, this.next.bind(this));
      });
      flow(function(filelist) {
        this.asyncEach(filelist, function(file, group) {
          this.exec(instFlow, file, group.async(as(1)));
        });
      }, done)(files);
    },
    storeCoverage : function(coverage, options, done) {
      flow(function write_json(cov) {
        var json = path.resolve(options.dir, options.json);
        grunt.file.mkdir(path.dirname(json));
        fs.writeFile(json, JSON.stringify(cov), 'utf8', this.async(as(1)));
      }, function() {
        flowEnd(this.err, done);
      })(coverage);
    },
    makeReport : function(files, options, done) {
      flow(function(filelist) {
        this.asyncEach(filelist, function(file, group) {
          grunt.verbose.writeln('read from ' + file);
          fs.readFile(file, 'utf8', group.async(as(1)));
        });
      }, function report(list) {
        var collector = new istanbul.Collector();
        list.forEach(function(json) {
          collector.add(JSON.parse(json));
        });
        
        var reporters = options.reporters &&
          typeof options.reporters === 'object' ? options.reporters : {};
        var reporterTypes = Object.keys(reporters);
        var appendReporter = function(type) {
          if(!reporters[type]) {
            reporterTypes.push(type);
            reporters[type] = options;
          }
        };
        if (reporterTypes.length < 1) {
          appendReporter(options.type);
        }
        switch (options.print) {
          case 'none':
            // nothing.
            break;
          case 'detail':
            appendReporter('text');
            break;
          case 'both':
            appendReporter('text');
            appendReporter('text-summary');
            break;
          default :
            appendReporter('text-summary');
            break;
        }
        reporterTypes.forEach(function(type) {
          if (reporters[type]) {
            var reporter = istanbul.Report.create(type, reporters[type]);
            reporter.writeReport(collector, true);
          }
        });
        this.next();
      }, function() {
        flowEnd(this.err, done);
      })(files);
    }
  };
};
