var fs = require('fs');
var _ = require('lodash');
var Promise = require("bluebird");
var Twit = require('twit');

var writeTweet = require('./writeTweet');
var uploadArchive = require('./uploadArchive');
var writeArchives = require('./output-data');


var conf = JSON.parse(fs.readFileSync('conf.json'));
const LIST_ID = conf.list_id;

var hasUpdates = {};
var T = new Twit(conf.twitter);

var uploadChanges = function() {
  console.log("look for changes");
  Object.keys(hasUpdates).forEach(function(name) {
    if ( hasUpdates[name] === 1 ) {
      console.log("update " + name);
      writeArchives(name, function() {
        uploadArchive(conf, name);
        hasUpdates[name] = 0;
      });
    }
  });
};

setInterval(uploadChanges, 1000*60*5);

var watch = function(list) {
  console.log("WATCH", follow);
  var stream = T.stream('statuses/filter', {
    follow: list,                                           
    stringify_friend_ids: true
  });
  stream.on('friends', function (friendsMsg) {
    console.log("i have friends!");
  });
  stream.on('connected', function (response) {
    console.log("connected!");
  });

  // NOTE: including this callback means that if there is an error,
  // twit will restart the stream for us
  stream.on('error', function (err) {
    console.log("ERROR");
    console.log(err);
  });

  stream.on('tweet', function (tweet) {
    // Tweets created by the user.
    // Tweets which are retweeted by the user.
    // Replies to any Tweet created by the user.
    // Retweets of any Tweet created by the user.
    // Manual replies, created without pressing a reply button (e.g. “@twitterapi I agree”).
    if ( _.includes(list, tweet.user.id_str) ) {
      console.log(tweet);
      writeTweet(tweet, function() {
        hasUpdates[tweet.user.screen_name] = 1;
      });
    }
  });
};

T.get('lists/members', { list_id: LIST_ID }).
  catch(function (err) { console.log('caught error', err.stack) }).
  then(function(result) {
    follow = _.map(result.data.users, function(u) {
      return u.id_str;
    });

    watch(follow);
  });

