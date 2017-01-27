var fs = require('fs');
var _ = require('lodash');
var Horseman = require('node-horseman');
var moment = require('moment');
var Promise = require("bluebird");
var mkdirp = require('mkdirp');

var conf = JSON.parse(fs.readFileSync('conf.json'));
var handle = "realDonaldTrump";

var dest = "data/" + handle + "/ids";

mkdirp.sync(dest);

var agent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.71 Safari/537.36";
var horseman = new Horseman({
  phantomPath: conf.phantom,
  timeout: 50000
});

var ids = [];
var month = process.argv[2];

var getIds = function() {
  console.log("getIds");
	return horseman.evaluate( function() {
		// This code is executed in the browser.
    var _ids = [];
		$("li[data-item-type='tweet']").each(function( item ){
      var id = $(this).data("itemId");
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
  var s = month;

  console.log("TIMESPAN " + s);
  
  var url = "https://twitter.com/search?f=tweets&vertical=default&q=from%3A" + handle +
            "%20since%3A" + s + "%20until%3A" + e + "&src=typd";
  console.log(url);
  
  return horseman
                   .userAgent(agent)
                   .viewport(1024, 800)
                   .open(url)
                   .waitFor(function noAjax() {
                     return $.active == 0
                   },  true)
	                 .then( scrape )
	       .finally(function(){
		       console.log("HERE" + ids.length)
		       horseman.close();
	       });

};



//var a = moment('2009-03-01');
//var a = moment('2009-05-01');
//var b = moment('2017-01-01');

//var tmp = moment(a);
//console.log(tmp.format('YYYY-MM-DD'));
//ids[tmp.format('YYYY-MM-DD')] = [];


getTimespan(month);

/*
for (var m = moment(a); m.isBefore(b); m.add(1, 'months')) {
  var tmp = moment(m);
  console.log(tmp.format('YYYY-MM-DD'));
  ids[tmp.format('YYYY-MM-DD')] = [];
  //queue.push(getTimespan(tmp));
  queue.push(tmp);
}

   Promise.map(queue, function(m) {
   console.log(m);
   //return m();
   return Promise.join(getTimespan(m));
   //return m;
   // *Now* we call the function. Since it returns a promise, the next iteration will not run until it resolves.
   //  return queue_item();
   }, {concurrency: 1}).then(function() {
   console.log("done!");
   });

*/
