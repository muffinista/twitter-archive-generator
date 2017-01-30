var fs = require('fs');
var _ = require('lodash');
var Promise = require("bluebird");
var Twit = require('twit');


var conf = JSON.parse(fs.readFileSync('conf.json'));
const LIST_ID = conf.list_id;

var hasUpdates = {};

var writeTweet = require('./writeTweet');

var T = new Twit(conf.twitter);

var AWS = require('aws-sdk');
var ep = new AWS.Endpoint('s3.us.archive.org');

var s3 = new AWS.S3({
  endpoint: ep,
  accessKeyId: conf.s3.accessKeyId,
  secretAccessKey: conf.s3.secretAccessKey
});


var uploadToArchive = function(handle, ext) {
  var src = "data/" + handle + "." + ext;

  var fileStream = fs.createReadStream(src);
  var params = {
    Bucket: conf.bucket,
    Key: handle + "." + ext,
    Body: fileStream,
    Metadata: {
      "x-archive-meta-title": "Twitter archive for " + handle,
      "x-archive-meta-subject": handle
    }
  };
  
  s3.putObject(params, function(err, data) {
    if (err) {
      console.log("Error", err);
    }
    else if (data) {
      console.log("Upload Success", data.Location);
      console.log(data);
    }
  });

};

var uploadArchive = function(name) {
  s3.createBucket({Bucket: conf.bucket}, function(err, data) {

    // we pretty much assume the only possible error here
    // is that the bucket already exists. be careful!
    if (err && err.code !== "BucketAlreadyExists") {
      console.log(err);
    }
    else {
      uploadToArchive(name, "json");
      uploadToArchive(name, "csv");
    }
  });
};



var uploadChanges = function() {
  console.log("look for changes");
  Object.keys(hasUpdates).forEach(function(name) {
    uploadArchive(name);
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

