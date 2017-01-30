var Promise = require("bluebird");
var Twit = require('twit');
var fs = require('fs');
var _ = require('lodash');
var parseArgs = require('minimist');

var argv = require('minimist')(process.argv.slice(2));

module.exports = function(handle, cb) {
  console.log("Outputting data for " + handle);

  var srcDir = "data/" + handle + "/tweets";

  var data = [];

  var walk = require('walk');

  var tweets = [];

  var csv_columns = {
    "tweet_id": (t) => { return t.id_str; },
    "in_reply_to_status_id": (t) => { return t.in_reply_to_status_id_str; },
    "in_reply_to_user_id": (t) => { return t.in_reply_to_user_id; },
    "timestamp": (t) => { return t.created_at; },
    "source": (t) => { return t.source; },
    "text": (t) => { return t.text; },
    "retweeted_status_id": (t) => {
      if ( t.retweeted_status ) {
        return t.retweeted_status.id_str;
      }
      else {
        return "";
      }
    },
    "retweeted_status_user_id": (t) => {
      if ( t.retweeted_status ) {
        return t.retweeted_status.user.id_str;
      }
      else {
        return "";
      }
    },
    "retweeted_status_timestamp": (t) => {
      if ( t.retweeted_status ) {
        return t.retweeted_status.created_at;
      }
      else {
        return "";
      }
    },
    "expanded_urls": (t) => {
      if ( t.entities && t.entities.urls ) {
        var urls = _.map(t.entities.urls, function(x) { return x.expanded_url; });
        return urls.join(" ");
      }
      else {
        return "";
      }
    }
  };
  
  var csvWriter = require('csv-write-stream');

  console.log("loading tweets");
  var options = {};
  var walker = walk.walk(srcDir, options);

  walker.on("file", function (root, fileStats, next) {
    fs.readFile(root + "/" + fileStats.name, (err, data) => {
      if (err) throw err;
      var data = JSON.parse(data);
      tweets.push(data);
      next();
    });
  });

  walker.on("errors", function (root, nodeStatsArray, next) {
    next();
  });

  walker.on("end", function () {
    console.log("writing archives");

    var results = _.sortBy(tweets, [function(t) { return Date.parse(t.created_at); }]);
    
    var writer = csvWriter({ headers: Object.keys(csv_columns)})
    writer.pipe(fs.createWriteStream("data/" + handle + ".csv"))
  
    _.each(results, function(t) {
      var line = [];
      for (var key in csv_columns) {
        line.push(csv_columns[key](t));
      }
      writer.write(line);
    });
    
    writer.end();

    fs.writeFile("data/" + handle + ".json", JSON.stringify(results, null, 2), function() {
      cb(handle);
    });

  });
};

