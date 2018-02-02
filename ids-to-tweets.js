var Promise = require("bluebird");
var Twit = require('twit');
var fs = require('fs');
var _ = require('lodash');
var sleep = require('sleep');
var mkdirp = require('mkdirp');

var conf = JSON.parse(fs.readFileSync('conf.json'));

var argv = require('minimist')(process.argv.slice(2));

var handle = argv['_'][0];

var T = new Twit(conf.twitter);

var writeTweet = require('./writeTweet');

var chillOut = function() {
  sleep.sleep(2);
};

var getTweet = function(y, m, id) {
  return T.get("statuses/show/:id", {id: id}).
           catch(function (err) { console.log('caught error', err.stack) }).
           then(function(data) {
	           if ( data.data.user ) {
		           writeTweet(data.data, chillOut);
	           }
           });
};

var queue = [];

if ( handle === undefined ) {
  console.error("Please specify a handle!");
  process.exit(1);
}

console.log("Loading tweets for " + handle);


fs.readdir("data/" + handle + "/ids", (err, files) => {
  files.forEach(file => {
    if ( ! file.match(/.json$/) ) {
      return;
    }
    //console.log(file);
    var y, m, etc;
    etc = file.split(/[-.]/);

    y = etc[0];
    m = etc[1];

    //console.log(y, m);
    mkdirp.sync("data/" + handle + "/tweets/" + y + "/" + m);

    var ids = JSON.parse(fs.readFileSync("data/" + handle + "/ids/" + file));

    for ( var x = 0; x < ids.length; x++ ) {
      var id = ids[x];
      var dest = "data/" + handle + "/tweets/" + y + "/" + m + "/" + id + ".json";
      //console.log("look for " + dest);
	    if (! fs.existsSync(dest)) {
	      console.log("look for " + dest);
        console.log("LOAD " + y + " " + m + " " + id);
        queue.push({y:y, m:m, id:id});
      }

    }
  });
  console.log("yo");

});

Promise.map(queue, function(m) {
  console.log(m);
  return getTweet(m.y, m.m, m.id);
  
}, {concurrency: 1}).then(function() {
  console.log("done!");
});

