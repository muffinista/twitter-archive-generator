var Promise = require("bluebird");
var fs = require('fs');
var _ = require('lodash');

var conf = JSON.parse(fs.readFileSync('conf.json'));

var argv = require('minimist')(process.argv.slice(2));

var handle = argv['_'][0];

if ( handle === undefined ) {
  console.error("Please specify a handle!");
  process.exit(1);
}


var AWS = require('aws-sdk');
var ep = new AWS.Endpoint('s3.us.archive.org');

var s3 = new AWS.S3({
  endpoint: ep,
  accessKeyId: conf.s3.accessKeyId,
  secretAccessKey: conf.s3.secretAccessKey
});


//console.log(s3.service.endpoint.hostname);


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

s3.createBucket({Bucket: conf.bucket}, function(err, data) {

  // we pretty much assume the only possible error here
  // is that the bucket already exists. be careful!
  if (err && err.code !== "BucketAlreadyExists") {
    console.log(err);
  }
  else {
    uploadToArchive(handle, "json");
    uploadToArchive(handle, "csv");
  }

});

