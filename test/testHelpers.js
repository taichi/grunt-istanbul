exports.throwOrDone = function(callback) {
  return function() {
    if (this.err) { throw this.err; }
    callback();
  };
};
exports.fixtures = function(base) {
  return function(name) {
    return 'test/fixtures/' + base + '/' + name;
  };
};
