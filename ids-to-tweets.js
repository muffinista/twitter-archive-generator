var Promise = require("bluebird");
var Twit = require('twit');
var fs = require('fs');
var _ = require('lodash');
var sleep = require('sleep');

var conf = JSON.parse(fs.readFileSync('conf.json'));

var T = new Twit(conf.twitter);

var mkdirp = require('mkdirp');

var handle = "realDonaldTrump";

var getTweet = function(y, m, id) {
  return T.get("statuses/show/:id", {id: id}).
    catch(function (err) { console.log('caught error', err.stack) }).
    then(function(data) {
      var dest = "data/" + handle + "/tweets/" + y + "/" + m + "/" + id + ".json";
      //console.log(data.data);
      fs.writeFile(dest, JSON.stringify(data.data), function() {
        sleep.sleep(2);
      });
    });
};

var queue = [];

fs.readdir("data/" + handle + "/ids", (err, files) => {
  files.forEach(file => {
    if ( ! file.match(/.json$/) ) {
      return;
    }
    //console.log(file);
    var y, m, etc;
    etc = file.split(/-/);

    y = etc[0];
    m = etc[1];

    //console.log(y, m);
    mkdirp.sync("data/" + handle + "/tweets/" + y + "/" + m);

    var ids = JSON.parse(fs.readFileSync("data/" + handle + "/ids/" + + y + "-" + m + "-01.json"));

    for ( var x = 0; x < ids.length; x++ ) {
      var id = ids[x];
      var dest = "data/" + handle + "/tweets/" + y + "/" + m + "/" + id + ".json";
      console.log("look for " + dest);
      if (! fs.existsSync(dest)) {
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

