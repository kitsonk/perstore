/**
 * This is a wrapper store that can add caching to a store
 */
var when = require("promised-io/promise").when;
	
exports.Cache = function(store, cacheStore, options){
	options = options || {};
	var defaultExpiresTime = options.defaultExpiresTime || 2000;
	var cacheWrites = "cacheWrites" in options ? options.cacheWrites : true;
	var cleanupInterval = options.cleanupInterval || 1000;
	var lastAccess = {};
	var nextCheck = new Date().getTime();
	var now;
	cleanup();
	function cleanup(){
		now = new Date().getTime();
		if(now > nextCheck){
			nextCheck = now + cleanupInterval;
			return when(cacheStore.query("expires<$1", {parameters:[now]}), function(results){
				results.forEach(function(object){
					cacheStore["delete"](object.id);
				});
			});
		}
	}
	return {
		get: function(id){
			var cached = cacheStore.get(id);
			lastAccess[id] = now++;
			if(!cached){
				if(store){
					cacheStore.put(cached = store.get(id), {id:id});
				}
			}
			return cached;
		},
		put: function(object, id){
			cleanup();
			if(!object.expires){
				object.autoExpires = true; 
				object.expires = new Date().getTime() + defaultExpiresTime;
			}
			if(cacheWrites){
				cacheStore.put(object, id);
			}
			if(store){
				return store.put(object, id);
			}
		},
		add: function(object, id){
			cleanup();
			if(!object.expires){
				object.autoExpires = true; 
				object.expires = new Date().getTime() + defaultExpiresTime;
			}
			if(cacheWrites){
				cacheStore.add(object, id);
			}
			if(store){
				return store.add(object, id);
			}
		},
		query: function(query, options){
			return store.query(query, options);
		},
		"delete": function(id){
			cleanup();
			if(store){
				store["delete"](id);
			}
			cacheStore["delete"](id);
		}
	};
};
