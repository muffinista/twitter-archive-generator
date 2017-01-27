var Twit = require('twit');
var fs = require('fs');
var conf = JSON.parse(fs.readFileSync('conf.json'));
var T = new Twit(conf.twitter);

T.get("application/rate_limit_status").
    catch(function (err) { console.log('caught error', err.stack) }).
    then(function(data) {
      console.log(data.data);
      var now = Math.floor(new Date() / 1000);
      console.log(data.data.resources.statuses['/statuses/show/:id']);
      var secs = data.data.resources.statuses['/statuses/show/:id'].reset - now;
      var remaining = data.data.resources.statuses['/statuses/show/:id'].remaining;
      console.log(remaining/secs);     
    });

