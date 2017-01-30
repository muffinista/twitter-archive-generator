var fs = require('fs');
var _ = require('lodash');
var Promise = require("bluebird");
var Twit = require('twit');


var conf = JSON.parse(fs.readFileSync('conf.json'));
const LIST_ID = conf.list_id;


var writeTweet = require('./writeTweet');

var T = new Twit(conf.twitter);

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
  stream.on('tweet', function (tweet) {
    if ( _.includes(list, tweet.user.id_str) ) {
      console.log(tweet);

      // Tweets created by the user.
      // Tweets which are retweeted by the user.
      // Replies to any Tweet created by the user.
      // Retweets of any Tweet created by the user.
      // Manual replies, created without pressing a reply button (e.g. “@twitterapi I agree”).
      writeTweet(tweet, console.log);
    }
    else {

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

