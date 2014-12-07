
define(['async'],function(async){
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
				return reduced_arr;
			}
			return arr;
		},

		removeKeyFromObject: function(obj, key){
			var keys =  Object.keys(obj);
			var reduced_obj = {};
			var i,length;
			if (keys.length > 0 ){
				for (i = 0, length = keys.length ; i < length; ++i){
					if (keys[i] !== key) {
						reduced_obj[keys[i]] = obj[keys[i]]; 
					}
				}
			}
			if ( i === length){
				return reduced_obj;
			}
			return obj;
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
			var keys = Object.keys(obj);
			for (var i = 0, length = keys.length; i < length; ++i){
				var key = keys[i];
				size += this.getSizeOfKeyValue(key, obj[key]);
			}
			return size;
		},

		stringifyKeys: function(obj){
			var keys =  Object.keys(obj);
			var newobj = {};
			var i,length;
			if (keys.length > 0 ){
				for (i = 0, length = keys.length ; i < length; ++i){
					var key = keys[i];
					var value = JSON.stringify(obj[keys[i]]);
					newobj[key] = value;
				}
			}
			return newobj;
		},

		unstringifyKeys: function(obj){
			var keys =  Object.keys(obj);
			var newobj = {};
			var i,length;
			if (keys.length > 0 ){
				for (i = 0, length = keys.length ; i < length; ++i){
					var key = keys[i];
					var value = JSON.parse(obj[keys[i]]);
					newobj[key] = value;
				}
			}
			return newobj;
		}
	};

	/**
	* Storage Prototype to get and set data 
	*/
	var Storage = {
		Sync: {

			/* Total Bytes our app can store in sync mode */
			_QUOTA_BYTES: 102400, 

			/* Total Bytes per item . see chrome.storage documentation for more details */
			_QUOTA_ITEM: 8192,

			/*  Must be less than _QUOTA_ITEM */
			_FRAGMENT_SIZE: 8000,

			/*  Name of the key which will contain the parts info*/
			_fragment_key: "_fragmentedKeys",
			
			/* returns an object that contain all data in object form.*/
			getAllValues: function(callback){				
				sync.get(null, callback);
			},

			/* Output is same as chrome.storage.sync.get for more than 1 values . For values which are saved in fragmented form
				Take out the fragmented values. merge them with normal(under QUOTA Limit) values.
			*/
			getValues: function(keys, callback){
				var self = this;

				/* Get the fragment value. This will tell whether there are partitions. */
				sync.get(this._fragment_key, function(objVal){
					var val = objVal[self._fragment_key];
					var parts = 0;
					var i, length;
					var keys_arr = Array.prototype.slice.call(keys,0);

					/* save a copy of keys. Keep only those keys whose values are under QUOTA Limit*/
					var small_subset_of_keys = Array.prototype.slice.call(keys,0);
					var results = {};
					var func_arr = [];

					/* Fragment values must be an array of objects */
					if (Array.isArray(val) && val.length > 0 ){
						for(i = 0 , length = val.length; i < length; ++i){
							if (keys_arr.indexOf(val[i].key ) != -1){

								/* If found push in function array that will be called by async library */
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

								/* remove this key from small subset. Keep only those keys whose values are under QUOTA Limit*/
								small_subset_of_keys = Util.removeValueFromArray(small_subset_of_keys,val[i].key );
							}
						}

						if (func_arr.length > 0){
							/* Get all the values. After completion simply merge the two results. */
							async.parallel(func_arr, function(err, async_results){

								/*Fragmented values are fetched. Get normal values.*/
								sync.get(small_subset_of_keys, function(objVal){
									var i,j,length;
									var objVal_keys = Object.keys(objVal);
									for (i = 0, length = objVal_keys.length; i < length ;++i){
										results[objVal_keys[i]] = objVal[objVal_keys[i]];
									}

									/* Fragmented results ==> async_results . Merging in results*/
									for (j = 0, length = async_results.length; j < length ;++j){
										results[async_results[j]["key"]] = async_results[j]["value"];
									}

									callback(results);
									return;
								});
							});
						} else {
							/* If array is there but there is no key whose size is greater than QUOTA Limit*/

							sync.get(keys, callback);
						}
					} else {
						/* If fragment val is not array */
						sync.get(keys, callback);
					}
				});
			},

			/* output is same as chrome.storage.sync.get . But internally it merges the fragmented parts combine
			them for one key only.*/
			getValue: function(key, callback){

				if (!Util.isString(key)){
					callback(new Error ("key should be string"));
					return;
				}
				var self = this;

				/* Get the fragment value. This will tell whether there are partitions. */
				sync.get(this._fragment_key, function(objVal){
					var val = objVal[self._fragment_key];
					var parts = 0;
					var i, length;
					var parts_keys_array = [];
					if (Array.isArray(val) && val.length > 0 ){
						/* Key must be string */
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
								/* Getting the fragmented array by getting keys */
								sync.get(parts_keys_array,onGetSegmentParts);
							}
							
						}
					} else {
						/* if the value is not array */
						sync.get(key, callback);
					}
				});

				/* Fragmented values are returned . Now combine them.*/
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

			setKey: function(key, value, callback){
				if (!Util.isString(key)){
					callback (new Error ("key should be string"));
					return;
				}
				var self = this;
				var sizeOfKeyValue = Util.getSizeOfKeyValue(key, value);
				this.getSpaceLeft(function(spaceLeft){
					if (sizeOfKeyValue < spaceLeft){
						if (sizeOfKeyValue < self._QUOTA_ITEM) {
							var object = {};
							object[key] = value;
							sync.set(object, callback);
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
				/* +3 is for separator and number after separator. if key is "key". it will be saved as "key_0"..."key_10".
					QUOTA limit is for (key size + value size ). Not for alone value size.
				*/
				var keySize = Util.getSizeInBytes(JSON.stringify(key)) + 3; 
				var chars_size = keySize;
				var next_chars_size = 0;
				var part = '';
				var parts_length;
				var object = {};

				/* Simply get the size of the each character and keep on adding till it reaches FRAGMENT SIZE.
					After that make another array and repeat the process.
				*/
				for(i = 0, size = 0,length = value.length; i < length-1; ++i) {
					chars_size += Util.getSizeInBytes(value[i]);
					part += value[i];
					next_chars_size = chars_size + Util.getSizeInBytes(value[i+1]);

					if (next_chars_size > this._FRAGMENT_SIZE){
						parts_keys.push(key + '_' + parts_keys.length);
						parts_values.push(part);

						// reset values
						chars_size = keySize;
						next_chars_size = 0;
						part = '';
					}
				}

				/* add numbers in front of key */

				parts_keys.push(key + '_' + parts_keys.length);
				parts_values.push(part);

				/* If loop ever ran */
				if ( i === (length -1)) {
					parts_length = parts_values.length;
					parts_values[parts_length -1 ] = parts_values[parts_length -1 ] + value[length -1];
				}

				/* Save in an Object */
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
				sync.set(fragments.data, onSetKeys.bind(this));

				function onSetKeys(){
					this.setFragmentKey(key, fragments.parts, callback);
				}
			},

			setFragmentKey: function(key, parts, callback){

				/* Get the fragment value. This will tell whether there are partitions. */
				sync.get(this._fragment_key,onGetFragmentedValues.bind(this));

				function onGetFragmentedValues(objVal){
					var object, key_object;
					var value = objVal[this._fragment_key];
					if (Array.isArray(value) && value.length > 0) {
						var _fragmentedKeys = [];
						for ( var i = 0, length = value.length;i < length;++i) {
							_fragmentedKeys.push(value[i].key);
						}
						// var _fragmentedKeys = value;
						var index = _fragmentedKeys.indexOf(key);
						if (index === -1) {
							// _fragmentedKeys.push(key);
							object = {};
							key_object = {
								"key" : key,
								"parts": parts
							};
							value.push(key_object);
							object[this._fragment_key] = value;
							sync.set(object, callback);
						} else {
							var fragment = value[index];
							fragment.parts = parts;
							sync.set(fragment, callback);
						}
					} else {
						object = {};
						key_object = {
							"key" : key,
							"parts": parts
						};
						object[this._fragment_key] = [key_object];
						sync.set(object, callback);
					}
					
				}
			},

			setKeys: function(object, callback){
				var keys = Object.keys(object);
				var i, length;
				var key, value;
				var func_arr = [];
				var object_to_save = object; 
				var self = this;
				for (i = 0 , length = keys.length; i < length; ++i){
					key = keys[i];
					value = object[key];
					if (Util.getSizeInBytes(value) > this._QUOTA_ITEM){
						object_to_save = Util.removeKeyFromObject(object_to_save, key);
						(function(key, value){
							func_arr.push(function(asyncCallback){
								self.setKey(key,value,function(){
									asyncCallback(null,true);
								});
							});
						})(key, value);
					}
				}
				if (func_arr.length > 0) {
					async.series(func_arr,function(err, results){
						sync.set(object_to_save,callback);
					});
				} else {
					sync.set(object,callback);
				}
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
				var self = this;
				this.getSpaceUsed(function(spaceUsed){
					var spaceLeft;
					spaceLeft = self._QUOTA_BYTES - spaceUsed;
					return callback(spaceLeft);
				});
			},


			getSpaceUsed: function(callback){
				local.getBytesInUse(callback);
			}
		},

		syncOn: function(callback){
			var self = this;
			if (this.isSyncOn()){
				callback({'saved': 'Ok'});
				return;
			} else {
				self.Local.getAllValues(function(objVal){
					var objValSize = Util.getSizeOfObject(objVal);
					if (objValSize < self.Local._QUOTA_BYTES){
						self.Sync.removeAllKeys(function(){
							self.Sync.setKeys(objVal, function(){
								self.SYNC = true;
								callback({'saved': 'Ok'});
							});
						});
					} else {
						callback({'saved': 'Error'});
					}
					
				});			
			}
		},

		/* SYNC Flag*/
		SYNC : true,

		syncOff: function(){
			this.SYNC = false;
		},

		isSyncOn: function(){
			return this.SYNC;
		},

		setKey: function(key, value, callback){
			var object = {};
			object[key] = value;
			this.setKeys(object,callback);
		},

		setKeys: function(obj, callback){
			var object = Util.stringifyKeys(obj);
			var sizeOfObject = Util.getSizeOfObject(object);
			var self = this;
			var return_object = {};
			/* Get local storage space left . If not available raise an alert. BAD UI :( */
			this.Local.getSpaceLeft(function(spaceLeft){
				if (spaceLeft >  sizeOfObject){
					self.Local.setKeys(object, function(){
						/* Local saved. Now save in Sync */
						if (self.isSyncOn()){
							if (sizeOfObject < self.Sync._QUOTA_BYTES){
								self.Sync.removeAllKeys(function(){
									self.Sync.setKeys(object, function(){
										/* return space left in Sync storage */
										return_object["saved"] = 'Ok';
										return_object["spaceSaved"] = sizeOfObject;
										callback(return_object);
									});
								});
							} else {
								return_object["saved"] = 'Error';
								return_object["spaceSaved"] = sizeOfObject;
								callback(return_object);
							}

						} else {
							return_object["saved"] = 'Ok';
							return_object["spaceSaved"] = sizeOfObject;
							callback(return_object);
						}
					});
				} else {
					alert("You have too much data on notes. Extension Can't save more data.")

				}
			});
		},

		getValue: function(key, callback){
			if (this.isSyncOn()){
				this.Sync.getValue(key, onReturnValues);
			} else {
				this.Local.getValue(key, onReturnValues);
			}

			function onReturnValues(obj){
				var newobj = Util.unstringifyKeys(obj);
				callback(newobj);

			}

		},

		getValues: function(keys, callback){
			if (this.isSyncOn()){
				this.Sync.getValues(keys, onReturnValues);
			} else {
				this.Local.getValues(keys, onReturnValues);
			}

			function onReturnValues(obj){
				var newobj = Util.unstringifyKeys(obj);
				callback(newobj);

			}
		},

		getAllValues: function(callback){
			if (this.isSyncOn()){
				this.Sync.getAllValues(onReturnValues);
			} else {
				this.Local.getAllValues(onReturnValues);
			}

			function onReturnValues(obj){
				var newobj = Util.unstringifyKeys(obj);
				callback(newobj);

			}
		},

		removeKey: function(key, callback){
			var self = this;
			self.Local.removeKey(key, function(){
				self.Sync.removeKey(key, callback);
			});
		},

		removeKeys: function(keys, callback){
			var self = this;
			self.Local.removeKeys(keys, function(){
				self.Sync.removeKeys(keys, callback);
			});
		},

		removeAllKeys: function(callback){
			var self = this;
			self.Local.removeAllKeys(function(){
				self.Sync.removeAllKeys(callback);
			});
		},

		getSpaceLeft: function(callback){
			if (this.isSyncOn()){
				this.Sync.spaceLeft(function(spaceLeft){
					callback(spaceLeft);
				});
			} else {
				this.Local.spaceLeft(function(spaceLeft){
					callback(spaceLeft);
				});
			}
		},

		getSpaceUsed: function(callback){
			if (this.isSyncOn()){
				this.Sync.spaceUsed(function(spaceUsed){
					callback(spaceUsed);
				});
			} else {
				this.Local.spaceUsed(function(spaceUsed){
					callback(spaceUsed);
				});
			}
		}


	};
	var storage =  {
		syncOn: Storage.syncOn.bind(Storage),
		syncOff: Storage.syncOff.bind(Storage),
		isSyncOn: Storage.isSyncOn.bind(Storage),
		setKey: Storage.setKey.bind(Storage),
		setKeys: Storage.setKeys.bind(Storage),
		getValue: Storage.getValue.bind(Storage),
		getValues: Storage.getValues.bind(Storage),
		getAllValues: Storage.getAllValues.bind(Storage),
		getSpaceUsed: Storage.getSpaceUsed.bind(Storage),
		getSpaceLeft: Storage.getSpaceLeft.bind(Storage),
		removeKey: Storage.removeKey.bind(Storage),
		removeKeys: Storage.removeKeys.bind(Storage),
		removeAllKeys: Storage.removeAllKeys.bind(Storage)
	};

	return storage;
});
