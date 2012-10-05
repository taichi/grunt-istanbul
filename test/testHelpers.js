function nvl(str) {
  return str ? str : '';
}
exports.throwOrDone = function(callback) {
  return function() {
    if (this.err) { throw this.err; }
    callback();
  };
};
exports.fixtures = function(base) {
  var b = nvl(base);
  return function(name) {
    return 'test/fixtures/' + b + '/' + nvl(name);
  };
};
