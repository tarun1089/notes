(function(){
	"use strict";
	var local = chrome.storage.local.bind(chrome.storage.local);
	var sync = chrome.storage.sync.bind(chrome.storage.sync);
	var array = Array.prototype;
	/**
	* Storage Prototype to get and set data 
	*/
	var Storage = {
		Sync: {

			_QUOTA_BYTES: 102400, 
			_quota: 0,

			setQuota: function(val){
				if (val < this._QUOTA_BYTES && val > 0) {
					this.quota = val;
				} else {
					return new Error ("Value must fall between 0 and "+this._QUOTA_BYTES);
				}
			},
			
			getAllValues: function(callback){
				sync.get({}, callback);
			},

			getValue: function(keys, callback){
				sync.get(keys, callback);
			},

			setKey: function(key, value, callback){
				var object = {
					key: value
				};

				sync.set(object, callback);
			},

			setKeys: function(object, callback){
				sync.set(object, callback);
			},

			removeKey: function(key, callback){
				sync.remove(key, callback);
			},

			removeKeys: function(keys, callback){
				sync.remove(keys, callback);
			},

			removeAllKeys: function(callback){
				sync.remove(callback);
			},

			getSpaceLeft: function(callback){

				this.getSpaceUsed(function(spaceUsed){
					var spaceLeft;
					spaceLeft = this._QUOTA_BYTES - spaceUsed;
					if (spaceLeft <= 0) {
						callback("NO SYNC SPACE LEFT: EXCEEDED by "+ spaceLeft);
					} else {
						return callback(spaceLeft);
					}
				});
			},

			getSpaceUsed: function(callback){
				sync.getBytesInUse(callback);
			}

		},
		Local : {
			_QUOTA_BYTES: 5242880, 
			_quota: 0,

			setQuota: function(val){
				if (val < this._QUOTA_BYTES && val > 0) {
					this.quota = val;
				} else {
					return new Error ("Value must fall between 0 and "+this._QUOTA_BYTES);
				}
			},
			
			getAllValues: function(callback){
				local.get({}, callback);
			},

			getValue: function(keys, callback){
				local.get(keys, callback);
			},

			setKey: function(key, value, callback){
				var object = {
					key: value
				};

				local.set(object, callback);
			},

			setKeys: function(object, callback){
				local.set(object, callback);
			},

			removeKey: function(key, callback){
				local.remove(key, callback);
			},

			removeKeys: function(keys, callback){
				local.remove(keys, callback);
			},

			removeAllKeys: function(callback){
				local.remove(callback);
			},

			getSpaceLeft: function(callback){

				this.getSpaceUsed(function(spaceUsed){
					var spaceLeft;
					spaceLeft = this._quota - spaceUsed;
					if (spaceLeft <= 0) {
						callback("NO SYNC SPACE LEFT: EXCEEDED by "+ spaceLeft);
					} else {
						return callback(spaceLeft);
					}
				});
			},

			getSpaceUsed: function(callback){
				local.getBytesInUse(callback);
			}
		}
	};
})();
