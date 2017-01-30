var fs = require('fs');
var _ = require('lodash');
var Horseman = require('node-horseman');
var moment = require('moment');
var Promise = require("bluebird");
var mkdirp = require('mkdirp');

var conf = JSON.parse(fs.readFileSync('conf.json'));

var argv = require('minimist')(process.argv.slice(2));
var handle = argv['_'][0];
var month = argv['_'][1];

if ( handle === undefined ) {
  console.error("Please specify a handle!");
  process.exit(1);
}

if ( month === undefined ) {
  month = moment().format('YYYY-MM');
  console.log("Setting month to " + month);
}

month = moment(month).format('YYYY-MM-01');


var dest = "data/" + handle + "/ids";

mkdirp.sync(dest);

var agent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.71 Safari/537.36";
var horseman = new Horseman({
  phantomPath: conf.phantom,
  timeout: 50000
});

var ids = [];

var getIds = function() {
  console.log("getIds");
	return horseman.evaluate( function() {
		// This code is executed in the browser.
    var _ids = [];
		$("li[data-item-type='tweet']").each(function( item ){
      var id = "" + $(this).data("itemId");
			_ids.push(id);
		});
		return _ids;
	});
};


var scrape = function() {
  console.log("SCRAPE " + month + " " + ids.length);
  
	return new Promise( function( resolve, reject ){
		return getIds()
		.then(function(newIds){
			console.log(newIds);
      var oldLength = ids.length;
      ids = _.uniq(ids.concat(newIds));
      console.log(dest + "/" + month + ".json");
      fs.writeFileSync(dest + "/" + month + ".json", JSON.stringify(ids));

			if ( ids.length !== oldLength ){
        console.log("get more");
				return horseman
        .evaluate(function() {
          return $(document).height();
        })
        .then(function(h) {
          console.log("height: " + h);
          return horseman.scrollTo(h, 1)
                  .click(".try-again-after-whale")
						      .wait(3000)
							    .then( scrape );
			  })
      }
    })
		.then( resolve );
	});
};


var getTimespan = function() {
  var e = moment(month).add(1, 'months').format('YYYY-MM-DD');
  var s = moment(month).format('YYYY-MM-DD');

  console.log("TIMESPAN " + s + " -> " + e);
  
  var url = "https://twitter.com/search?f=tweets&vertical=default&q=from%3A" + handle +
            "%20since%3A" + s + "%20until%3A" + e + "&src=typd";
  console.log(url);
  
  return horseman
                   .userAgent(agent)
                   .viewport(1024, 800)
                   .open(url)
	                 .then( scrape )
	                 .finally(function(){
		                 console.log("Loaded " + ids.length + " tweets")
		                 horseman.close();
	                 });
  
};


getTimespan(month);
