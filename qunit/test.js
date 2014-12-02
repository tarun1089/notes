 
 QUnit.asyncTest( "Local Storage test", function( assert ) {
 	Storage.Local.removeAllKeys();
 	Storage.Local.setKey("a", 100);
 	Storage.Local.setKey("b", 200);
 	Storage.Local.setKeys({c:300});
 	Storage.Local.setKeys({e:400, f:500});

 	async.series([
	    function(callback){
	        Storage.Local.getValue("a", function(val){
	        	callback(null, val);
		 	});
	    },
	    function(callback){
	    	Storage.Local.getValue("b", function(val){
		 		callback(null, val);
		 	});
	    },
	    function(callback){
	    	Storage.Local.getValues(["b","c"], function(val){
		 		callback(null, val);
		 	});
	    },
	    function(callback){
	    	Storage.Local.getValues({"b": 0, "e":400}, function(val){
		 		callback(null, val);
		 	});
	    },
	    function(callback){
	    	Storage.Local.getSpaceUsed(function(val){
		 		callback(null, val);
		 	});
	    },
	    function(callback){
	    	Storage.Local.getSpaceUsed(function(val){
		 		callback(null, val);
		 	});
	    }

	],
	function(err, results){
	    assert.deepEqual( results[0], {a: 100});
		assert.deepEqual( results[1], {b: 200});
		assert.deepEqual( results[2], {b: 200, c: 300});
		assert.deepEqual( results[3], {b: 200, e: 400});
		assert.ok(results[4] > 0 && results[4] <1000000);
		// assert.equal(results[5] == );
		QUnit.start();
	});

 });

 QUnit.asyncTest( "Sync Storage : Remove All Keys", function( assert ) {
 	Storage.Sync.removeAllKeys(function(val){
 		Storage.Sync.getAllValues(function(val){
 			assert.deepEqual(val,{});
 			QUnit.start();
 		});
	});
 });

 QUnit.asyncTest( "Sync Storage: setKey: string", function( assert ) {
 	Storage.Sync.setKey("a", 100,function(){
 		Storage.Sync.getValue("a", function(val){
 			assert.deepEqual(val,{a: 100});
 			QUnit.start();
 		});
	});
 });
 QUnit.asyncTest( "Sync Storage: setKeys: object", function( assert ) {
 	Storage.Sync.setKeys({b:200},function(){
 		Storage.Sync.getValue("b", function(val){
 			assert.deepEqual(val,{b: 200});
 			QUnit.start();
 		});
	});
 });
 QUnit.asyncTest( "Sync Storage: setKeys: array", function( assert ) {
 	Storage.Sync.setKeys({c: 300,d:400},function(){
 		Storage.Sync.getValues(["c","d"], function(val){
 			assert.deepEqual(val,{c: 300,d:400});
 			QUnit.start();
 		});
	});
 });

  QUnit.asyncTest( "Sync Storage: setKeys: More than Quota: 0", function( assert ) {
  	var str = '';
 	for (var i = 0 ; i < 10000; ++i ){str += '0';}

 	Storage.Sync.setKey("str",str,function(){
 		Storage.Sync.getValue("str", function(val){
 			assert.deepEqual(val,{str:str});
 			QUnit.start();
 		});
	});
 });

  QUnit.asyncTest( "Sync Storage: setKeys: More than Quota: a", function( assert ) {
  	var str2 = '';
 	for (var i = 0 ; i < 20000; ++i ){str2 += 'a';}

 	Storage.Sync.setKey("str2",str2,function(){
 		Storage.Sync.getValue("str2", function(val){
 			assert.deepEqual(val,{str2:str2});
 			QUnit.start();
 		});
	});
 });

  QUnit.asyncTest( "Sync Storage: getValues:[m,str3]", function( assert ) {
  	var str3 = '';
 	for (var i = 0 ; i < 10000; ++i ){str3 += 'M';}
 	Storage.Sync.setKey("m",100);
 	Storage.Sync.setKey("str3",str3,function(){
 		Storage.Sync.getValues(["m","str3"], function(val){
 			assert.deepEqual(val,{m: 100,str3:str3});
 			QUnit.start();
 		});
	});
 });

  QUnit.asyncTest( "Sync Storage: getValues:[m,str3,str4]", function( assert ) {
  	var str5 = '';
  	var str4 = '';
 	for (var i = 0 ; i < 10000; ++i ){str5 += 'P';str4 += 'K';}
 	Storage.Sync.setKey("str4",str4,function(){
 		Storage.Sync.setKey("str5",str5,function(){
	 		Storage.Sync.getValues(["m","str5","str4"], function(val){
	 			assert.deepEqual(val,{m: 100,str5:str5,str4:str4});
	 			QUnit.start();
	 		});
		});
	});
 	
 });

  QUnit.asyncTest( "Sync Storage: getValues:{'str6'}", function( assert ) {
  	var str6 = '';
  	var str7 = '';
 	for (var i = 0 ; i < 10000; ++i ){str6 += 'G';str7 += 'F';}
 	Storage.Sync.setKeys({'str6': str6, 'str7': str7},function(){
 		Storage.Sync.getValues(['str6', 'str7'], function(val){
 			assert.deepEqual(val,{str6: str6, str7:str7});
 			QUnit.start();
 		});
	});
 	
 });

  QUnit.asyncTest( "Sync Storage: getValues:{'key1': {'key2': 'value'}}", function( assert ) {
  	
 	Storage.Sync.setKeys({'key1': {'key2': 'value'}},function(){
 		Storage.Sync.getValues("key1", function(val){
 			assert.deepEqual(val,{'key1': {'key2': 'value'}});
 			QUnit.start();
 		});
	});
 	
 });

  QUnit.asyncTest( "Sync Storage: getValues:{'key3': {'key4': 'value'}}", function( assert ) {
  	
 	Storage.Sync.setKeys({'key3': {'key4': 'value'}},function(){
 		Storage.Sync.getValues(["key3"], function(val){
 			assert.deepEqual(val,{'key3': {'key4': 'value'}});
 			QUnit.start();
 		});
	});
 	
 });

 QUnit.asyncTest( "Global: setKeys in limit", function( assert ) {
 	var key3 = '';
  	var key4= '';
 	for (var i = 0 ; i < 10000; ++i ){key3 += 'P';key4 += 'K';}
  	Storage.removeAllKeys(function(){
  		Storage.setKeys({'key3': key3, 'key4': key4},function(){
	 		Storage.getValues(["key3", "key4"], function(val){
	 			assert.deepEqual(val,{'key3': key3, 'key4': key4});
	 			QUnit.start();
	 		});
		});
  	});
 });

 QUnit.asyncTest( "Global: setKeys out of limit1", function( assert ) {
 	var key3 = '';
  	var key4= '';
 	for (var i = 0 ; i < 60000; ++i ){key3 += 'P';key4 += 'K';}
  	Storage.removeAllKeys(function(){
  		Storage.syncOn(function(status){
			if (status.saved === 'Ok'){
				Storage.setKeys({'key3': key3, 'key4': key4},function(val){
		 			assert.deepEqual(val.saved,'Error');
		 			QUnit.start();
				});
			}
  		});
  	});
 });

 QUnit.asyncTest( "Global: complex structure", function( assert ) {
 	var key3 = '';
  	var key4= '';
 	for (var i = 0 ; i < 20000; ++i ){key3 += 'P';key4 += 'K';}
 	var object = {
 		key3: key3,
 		a: 100
 	};
  	Storage.removeAllKeys(function(){
  		Storage.setKeys(object,function(){
  			Storage.syncOn(function(status){
					if (status.saved === 'Ok'){
						Storage.getValues(["key3", "a"], function(val){
				 			assert.deepEqual(val,object);
				 			QUnit.start();
			 		});
				}
			});
		});
  	});
 });

  QUnit.asyncTest( "Global: setKeys out of limit2", function( assert ) {
 	var key3 = '';
  	var key4= '';
 	for (var i = 0 ; i < 60000; ++i ){key3 += 'P';key4 += 'K';}
  	Storage.removeAllKeys(function(){
 		Storage.syncOff();
  		Storage.setKeys({'key3': key3, 'key4': key4},function(){
	 		Storage.getValues(["key3", "key4"], function(val){
	 			assert.deepEqual(val,{'key3': key3, 'key4': key4});
	 			QUnit.start();
	 		});
		});
  	});
 });

  



 	// Storage.Sync.removeAllKeys();
 	// Storage.Sync.setKey("a", 100);
 	// Storage.Sync.setKey("b", 200);
 	// Storage.Sync.setKeys({c:300});
 	// Storage.Sync.setKeys({e:400, f:500});

 	// var str = '';
 	// for (i = 0 ; i < 17000; ++i ){str += '0';}
 	// Storage.Sync.setKey("str",str);

 	// async.series([
 	// 	function(callback){
	 //        Storage.Sync.removeAllKeys(function(val){
	 //        	callback(null, true);
	 //        });
	 //    },
 		// function(callback){
	  //       Storage.Sync.setKey("a", function(val){
	  //       	callback(null, true);
		 // 	});
	  //   },
	  //   function(callback){
	  //       Storage.Sync.setKey("b", function(val){
	  //       	callback(null, true);
		 // 	});
	  //   },
	  //   function(callback){
	  //       Storage.Sync.setKey({c:300}, function(val){
	  //       	callback(null, true);
		 // 	});
	  //   },
	  //   function(callback){
	  //       Storage.Sync.setKey({e:400, f:500}, function(val){
	  //       	callback(null, true);
		 // 	});
	  //   },
	  //   function(callback){
	  //       Storage.Sync.getValue("a", function(val){
	  //       	callback(null, val);
		 // 	});
	  //   },
	  //   function(callback){
	  //   	Storage.Sync.getValue("b", function(val){
		 // 		callback(null, val);
		 // 	});
	  //   },
	  //   function(callback){
	  //   	Storage.Sync.getValues(["b","c"], function(val){
		 // 		callback(null, val);
		 // 	});
	  //   },
	  //   function(callback){
	  //   	Storage.Sync.getValues({"b": 0, "e":400}, function(val){
		 // 		callback(null, val);
		 // 	});
	  //   },
	    // function(callback){
	    // 	Storage.Sync.getValue("str",function(val){
	    // 		callback(null, val);
	    // 	});
	    // }
	// ],
	// function(err, results){
	// 	assert.ok(results[0],"ok");
	// 	// assert.ok(results[1],"ok");
	// 	// assert.ok(results[2],"ok");
	// 	// assert.ok(results[3],"ok");
	// 	// assert.ok(results[4],"ok");
	// 	// assert.deepEqual( results[5], {a: 100});
	//  //    assert.deepEqual( results[6], {a: 100});
	// 	// assert.deepEqual( results[7], {b: 200});
	// 	// assert.deepEqual( results[8], {b: 200, c: 300});
	// 	// assert.deepEqual( results[9], {b: 200, e: 400});
	// 	// assert.equal( results[4], str);
	// 	QUnit.start();
		
	// });

 // });