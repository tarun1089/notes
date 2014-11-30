define(['app'],function(App){
	this.mainView = new App();
	

	chrome.storage.sync.set({"key": "value"}, function(val){console.log(val)});
});