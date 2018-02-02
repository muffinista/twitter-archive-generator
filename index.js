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

        // upload an archive?
        if ( conf.s3 && conf.s3.accessKeyId ) {
          uploadArchive(conf, name);
        }

        hasUpdates[name] = 0;
      });
    }
  });
};

setInterval(uploadChanges, 1000*60*5);

/**
 * use the streaming api to watch for tweets from a list of users
 */
var watch = function(list) {
  console.log("WATCH", follow);
  var stream = T.stream('statuses/filter', {
    follow: list,                                           
    stringify_friend_ids: true
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
    // make sure the tweet is actually from a user we are following
    // this filters out RTs, replies, etc
    if ( _.includes(list, tweet.user.id_str) ) {
      console.log(tweet);

      // write the tweet to our archive
      // @todo request a copy at archive.is too?
      writeTweet(tweet, function() {
        hasUpdates[tweet.user.screen_name] = 1;
      });
    }
  });
};

/**
 * query the twitter list, get a list of user ids, and then follow them
 */
T.get('lists/members', { list_id: LIST_ID }).
  catch(function (err) { console.log('caught error', err.stack) }).
  then(function(result) {
    follow = _.map(result.data.users, function(u) {
      return u.id_str;
    });

    watch(follow);
  });

