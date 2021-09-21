//Just a silly in memory object for persisting things with some basic TTL

function InMemoryMap(){
  this.cache = {};
  this.timeouts = {};
}

InMemoryMap.prototype.get = function(key){
  return this.cache[key] || null;
}

InMemoryMap.prototype.put = function(key, value, ttl){
  this.cache[key] = value;
  if(this.timeouts[key]){
    clearTimeout(this.timeouts[key]);
    delete this.timeouts[key];
  }
  if(ttl){
    this.timeouts[key] = setTimeout(() => {
      delete this.cache[key];
      delete this.timeouts[key];
    }, ttl)
  }
}

InMemoryMap.prototype.delete = function(key){
  if(this.cache[key]){
    delete this.cache[key];
  }
  if(this.timeouts[key]){
    clearTimeout(this.timeouts[key]);
    delete this.timeouts[key];
  }
}

module.exports = InMemoryMap;