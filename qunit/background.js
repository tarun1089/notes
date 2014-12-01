var Storage = (function(){
	"use strict";
	var local = chrome.storage.local;
	var sync = chrome.storage.sync;
	var array = Array.prototype;
	var stringify = JSON.stringify;
	var toString = Object.prototype.toString;

	var Util = {
		isString: function(str){
			if (toString.call(str).indexOf('String') !== -1){
				return true;
			}
			return false;
		},

		removeValueFromArray: function(arr, val){
			var index = arr.indexOf(val);
			var reduced_arr = [];
			var i,length;
			if (index !== -1){
				for (i = 0, length = arr.length ; i < length; ++i){
					if (i !== index){
						reduced_arr.push(arr[i]);
					}
				}
			}
			if ( i === length){
				return reduced_arr
			} else {
				return arr;
			}
		}
	};

	/**
	* Storage Prototype to get and set data 
	*/
	var Storage = {
		Sync: {

			_QUOTA_BYTES: 102400, 
			_QUOTA_ITEM: 8192,
			_quota: 0,
			_FRAGMENT_SIZE: 8000,
			_fragment_key: "_fragmentedKeys",

			setQuota: function(val){
				if (val < this._QUOTA_BYTES && val > 0) {
					this.quota = val;
				} else {
					return new Error ("Value must fall between 0 and "+this._QUOTA_BYTES);
				}
			},
			
			getAllValues: function(callback){				
				sync.get(null, callback);
			},

			getValues: function(keys, callback){
				var self = this;
				sync.get(this._fragment_key, function(objVal){
					var val = objVal[self._fragment_key];
					var parts = 0;
					var i, length;
					var keys_arr = Array.prototype.slice.call(keys,0);
					var small_subset_of_keys = Array.prototype.slice.call(keys,0);
					var results = {};
					var func_arr = [];
					if (Array.isArray(val) && val.length > 0 ){
						for(i = 0 , length = val.length; i < length; ++i){
							if (keys_arr.indexOf(val[i].key ) != -1){
								(function(key){
									func_arr.push(function(async_callback){
										self.getValue(key, function(objVal){
											var newobj = {};
											newobj["key"] = key;
											newobj["value"] = objVal[key]
											async_callback(null, newobj);
										});
									});
								})(val[i].key);
								small_subset_of_keys = Util.removeValueFromArray(small_subset_of_keys,val[i].key );
							}
						}
						if (func_arr.length > 0){
							async.series(func_arr, function(err, async_results){
								debugger;
								sync.get(small_subset_of_keys, function(objVal){
									var i,j,length;
									var objVal_keys = Object.keys(objVal);
									for (i = 0, length = objVal_keys.length; i < length ;++i){
										results[keys[i]] = objVal[keys[i]];
									}
									for (j = 0, length = async_results.length; j < length ;++j){
										results[async_results[j]["key"]] = async_results[j]["value"];
									}
									callback(results);
									return;
								});
							});
						} else {
							sync.get(keys, callback);
						}
					} else {
						sync.get(keys, callback);
					}
				});
			},

			getValue: function(key, callback){

				if (!Util.isString(key)){
					callback(new Error ("key should be string"));
					return;
				}
				var self = this;
				sync.get(this._fragment_key, function(objVal){
					var val = objVal[self._fragment_key];
					var parts = 0;
					var i, length;
					var parts_keys_array = [];
					if (Array.isArray(val) && val.length > 0 ){
						if (Util.isString(key)) {
							for(i = 0 , length = val.length; i < length; ++i){
								if (val[i].key === key){
									parts = val[i].parts;
									break;
								}
							}
							if (parts != 0){
								for ( i = 0; i < parts; ++i){
									var key_string = key + '_' + i;
									parts_keys_array.push(key_string);
								}

								sync.get(parts_keys_array,onGetSegmentParts);
							}
							
						}
					} else {
						sync.get(key, callback);
					}
				});

				function onGetSegmentParts(val){
					var str = '';
					var object = {};
					var valKeys = Object.keys(val);
					for( var i = 0, length = valKeys.length; i < length;++i ){
						str += val[valKeys[i]];
					}
					object[key] = str;
					callback(object);
				}
			},

			getSizeInBytes: function(str){
				return encodeURIComponent(str).replace(/%[A-F\d]{2}/g,'x').length;
			},

			getSizeOfKeyValue: function(key, value) {
				var obj = {};
				var str;
				obj[key] = value;
				str = stringify(obj);
				return this.getSizeInBytes(str);
			},

			getSizeOfObject: function(obj){
				var size = 0;
				for (key in obj){
					if(obj.hasOwnProperty(key)){
						size += this.getSizeOfKeyValue(key, obj[key]);
					}
				}
				return size;
			},

			setKey: function(key, value, callback){
				if (!Util.isString(key)){
					callback (new Error ("key should be string"));
					return;
				}
				var self = this;
				var sizeOfKeyValue = this.getSizeOfKeyValue(key, value);
				this.getSpaceLeft(function(spaceLeft){
					if (sizeOfKeyValue < spaceLeft){
						if (sizeOfKeyValue < self._QUOTA_ITEM) {
							var object = {};
							object[key] = value;
							self.setKeys(object, callback);
							return;
						} else if (sizeOfKeyValue < self._QUOTA_BYTES){
							self.setFragmentValue(key,value,callback);
							return;
						} 
					} 
					callback(Error("Only "+ spaceLeft+ " BYTES is left. This variable has size "+ sizeOfKeyValue+ "  BYTES"));
					
				});	
			},

			getFragments: function(key,value){
				var parts_keys = [];
				var parts_values = [];
				var i;
				var size;
				var length;
				var chars_size = 0;
				var next_chars_size = 0;
				var part = '';
				var parts_length;
				var object = {};

				for(i = 0, size = 0,length = value.length; i < length-1; ++i) {
					chars_size += this.getSizeInBytes(value[i]);
					part += value[i];
					next_chars_size = chars_size + this.getSizeInBytes(value[i+1]);

					if (next_chars_size > this._FRAGMENT_SIZE){
						parts_keys.push(key + '_' + parts_keys.length);
						parts_values.push(part);

						// reset values
						chars_size = 0;
						next_chars_size = 0;
						part = '';
					}
				}

				parts_keys.push(key + '_' + parts_keys.length);
				parts_values.push(part);

				if ( i === (length -1)) {
					parts_length = parts_values.length;
					parts_values[parts_length -1 ] = parts_values[parts_length -1 ] + value[length -1];
				}

				for ( i = 0; i < parts_length; ++ i) {
					object[parts_keys[i]] = parts_values[i];
				}

				return {
					data :object,
					parts: parts_length
				};

			},

			setFragmentValue: function(key, value, callback){

				var fragments = this.getFragments(key, value);
				this.setKeys(fragments.data, onSetKeys.bind(this));

				function onSetKeys(){
					this.setFragmentKey(key, fragments.parts, callback);
				}
			},

			setFragmentKey: function(key, parts, callback){
				sync.get(this._fragment_key,onGetFragmentedValues.bind(this));
				function onGetFragmentedValues(objVal){
					var object, key_object;
					var value = objVal[this._fragment_key];
					if (Array.isArray(value) && value.length > 0) {
						var _fragmentedKeys = value;
						var index = _fragmentedKeys.indexOf(key);
						if (index === -1) {
							_fragmentedKeys.push(key);
							object = {};
							key_object = {
								"key" : key,
								"parts": parts
							};
							_fragmentedKeys.push(key_object);
							object[this._fragment_key] = _fragmentedKeys;
							this.setKeys(object, callback);
						} else {
							var fragment = _fragmentedKeys[index];
							fragment.parts = parts;
							this.setKeys(fragment, callback);
						}
					} else {
						object = {};
						key_object = {
							"key" : key,
							"parts": parts
						};
						object[this._fragment_key] = [key_object];
						this.setKeys(object, callback);
					}
					
				}
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
				sync.clear(callback);
			},

			getSpaceLeft: function(callback){

				var self = this;
				this.getSpaceUsed(function(spaceUsed){
					var spaceLeft;
					spaceLeft = self._QUOTA_BYTES - spaceUsed;
					return callback(spaceLeft);
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
				local.get(null, callback);
			},

			getValues: function(keys, callback){
				local.get(keys, callback);
			},

			getValue: function(keys, callback){
				local.get(keys, callback);
			},

			setKey: function(key, value, callback){
				var object = {};
				object[key] = value;
				this.setKeys(object, callback);
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
				local.clear(callback);
			},

			getSpaceLeft: function(callback){

				this.getSpaceUsed(function(spaceUsed){
					var spaceLeft;
					spaceLeft = this._QUOTA_BYTES - spaceUsed;
					return callback(spaceLeft);
				});
			},

			getSpaceUsed: function(callback){
				local.getBytesInUse(callback);
			}
		}

	};
	return Storage;
})();
