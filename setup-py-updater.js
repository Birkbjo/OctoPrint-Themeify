// lookbehind for plugin_version =, capture anything between quotes
const regex = /(?<=plugin_version[\s]*=[\s]*["']).*(?=["'])/;

module.exports.readVersion = function(contents) {
  return contents.match(regex)[0];
};

module.exports.writeVersion = function(contents, version) {
  return newSetup;
};
