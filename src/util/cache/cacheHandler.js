/*
 * Since we are holding the AuthN token and not providing it to the client 
 * straight away, we need to stash it somewhere so we can get it back post
 * challenge and establish a session.
 * 
 * This is designed as an interface class with logic around a basic
 * map implementation, which might be more resilient than my default
 * in memory version at some stage...
 */
const crypto = require('crypto');

const inMemoryImpl = require("./inMemoryCache");

function CacheHandler(implementation){
  if(implementation){
    this.cache = implementation
  }else{
    this.cache = new inMemoryImpl();
  }
}

CacheHandler.prototype.storeNewContext = function(context, ttl){
  while(true){
    var key = crypto.randomBytes(512).toString('base64');
    if(!this.cache.get(key)){
      //Not quite atomic, but given the size of the random, the odds of collision are 
      //probably within acceptable ranges...
      this.cache.put(key, context, ttl);
      return key;
    }
  }
}

CacheHandler.prototype.get = function(key){
  return this.cache.get(key);
}

module.exports = CacheHandler;

