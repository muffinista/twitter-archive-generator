module.exports = function(t, cb) {
  var moment = require('moment');
  var fs = require('fs');
  var mkdirp = require('mkdirp');
  var handle = t["user"]["screen_name"];
  var ts = moment(t["created_at"], 'dd MMM DD HH:mm:ss ZZ YYYY', 'en');
  var month = ts.format("MM");
  var year = ts.format("YYYY");
  var id = t["id_str"];


  var destDir = "data/" + handle + "/tweets/" + year + "/" + month;
  var dest = destDir + "/" + id + ".json";

  mkdirp(destDir, function(err) {
    if (err) {
      console.error(err);
    }
    else {
	fs.writeFile(dest, JSON.stringify(t), function(err) {
	    cb(t)
	});
    }
  });
};

