var fs = require('fs');
var uploadArchive = require('./uploadArchive');
var writeArchives = require('./output-data');

var conf = JSON.parse(fs.readFileSync('conf.json'));
var argv = require('minimist')(process.argv.slice(2));

var handle = argv['_'][0];

if ( handle === undefined ) {
  console.error("Please specify a handle!");
  process.exit(1);
}

writeArchives(handle, function() {
  uploadArchive(conf, handle);
});
