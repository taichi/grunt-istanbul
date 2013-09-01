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

  function makeReporters(options) {
    var result = [];
    var reporters = options.reporters &&
      typeof options.reporters === 'object' ? options.reporters : {};
    Object.keys(reporters).forEach(function(n) {
      if(reporters[n]) {
        result.push({ type : n, options : reporters[n] });
      }
    });

    var append = function(t) {
      if(t && !reporters[t]) {
        result.push({ type : t, options : options});
        reporters[t] = true;
      }
    };

    append(options.type);

    var mapping = {
      'none' : [],
      'detail': ['text'],
      'both' : ['text', 'text-summary']
    };
    var a = mapping[options.print];
    if(a) {
      a.forEach(append);
    } else {
      append('text-summary');
    }
    return result;
  }

  return {
    instrument : function(files, options, done) {
      var outFile = function(file) {
        return path.join(options.basePath, options.flatten === true ? path.basename(file) : file);
      };

      var instFlow = flow(function readFile(f) {
          fs.readFile(f.name, 'utf8', this.async({
            name : f.name,
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
          var out = outFile(result.name);
          grunt.verbose.writeln('instrument to ' + out);
          grunt.file.mkdir(path.dirname(out));
          fs.writeFile(out, result.code, 'utf8', this.async(as(1)));
        }, function end() {
          flowEnd(this.err, this.next.bind(this));
        });

      var dateCheckFlow = flow(function checkDestExists(f) {
          grunt.verbose.writeln('checking destination exists ' + f.name);
          fs.exists(outFile(f.name), this.async({ name : f.name, exists : as(0) }));
        },
        function readStat(f) {
          if (f.exists) {
            grunt.verbose.writeln('reading stat for ' + f.name);
            fs.stat(f.name, this.async({ name : f.name, stat : as(1) }));
            fs.stat(outFile(f.name), this.async({ name : f.name, stat : as(1) }));
          } else {
            grunt.verbose.writeln('instrumented file does not exist ' + f.name);
            this.end({ name : f.name, instrument : true });
          }
        }, function decision(i, o) {
          var reinstrument = i.stat.mtime.getTime() > o.stat.mtime.getTime();
          grunt.verbose.writeln('make a decision about instrumenting ' + i.name + ': ' + reinstrument);
          this.end({ name: i.name, instrument: reinstrument });
        }, function end(f) {
          if (f.instrument) {
            this.exec(instFlow, { name : f.name }, this.async());
          } else {
            flowEnd(this.err, this.next.bind(this));
          }
        });

      flow(function(filelist) {
        this.asyncEach(filelist, function(file, group) {
          this.exec((options.lazy ? dateCheckFlow : instFlow), { name : file }, group.async(as(1)));
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
        makeReporters(options).forEach(function(repoDef) {
            var reporter = istanbul.Report.create(repoDef.type, repoDef.options);
            reporter.writeReport(collector, true);
        });
        this.next();
      }, function() {
        flowEnd(this.err, done);
      })(files);
    }
  };
};
