define(['app'],function(App){
	this.mainView = new App();
	chrome.runtime.getBackgroundPage(function(page){
		console.log(page);
		addEventListener("unload", function (event) {
     			page.func("sdvfgsd kjvhdfgdfilu iuvfdgiugzfiud diliucsvls iufvtiuvdf l uivdstuisdiud  sdlfjgfu l  isdufisudfiuafHBFNMSBFS SGUKFTUITUOH VDNVBMB CAGFOFGIAUEBCMBBB jfgbdfbvbv v  fhgfgfgiug gfukgfuewiutf sbfmnbvsdgfeiudhbc ,fgsjkg ckhjgkfgf");
		}, true);
		// page.func("hello");
	});

	// var port = chrome.runtime.connect();
	// console.log(port);
	// port.onDisconnect

// 	setInterval(function() {
// 		appAPI.message.toBackground({}, {channel: 'heartbeat'});
// }, 500);
});