module.exports = {
    
    getStats: function(roomObject) {
        
        this.cpuStats();
        
        this.gclStats();
        
        this.spawnStats(roomObject);
        
        this.roomEnergy(roomObject);
        
        this.rclStats(roomObject);
    },
    
    cpuStats: function() {
        
        Memory.stats['cpu.getUsed'] = Game.cpu.getUsed();
        
        Memory.stats['cpu.limit'] = Game.cpu.limit;
        
        Memory.stats['cpu.bucket'] = Game.cpu.bucket;
        
    },
    
    gclStats: function() {
        
        Memory.stats['gcl.progress'] = Game.gcl.progress;
        
        Memory.stats['gcl.progressTotal'] = Game.gcl.progressTotal;
        
        Memory.stats['gcl.level'] = Game.gcl.level;
        
    },
    
    spawnStats: function(room) {
        
        if(room.memory.creepLimits){
            _.forEach(Object.keys(room.memory.creepLimits), function(creepType) {
                    Memory.stats['room.' + room.name + '.limit.' + creepType] = room.memory.creepLimits[creepType];
            });
        }
        
        let creepCounts = room.creepCount("ALL");
        creepCounts["staticMiners"] = room.creepCount(["staticMiners"], true)["staticMiners"];
        creepCounts["remoteHarvesters"] = room.creepCount(["remoteHarvesters"], true)["remoteHarvesters"];
        
        _.forEach(Object.keys(creepCounts), function(creepType) {
            Memory.stats['room.' + room.name + '.count.' + creepType] = creepCounts[creepType];
        });
    },
    
    rclStats: function(room) {
        
        Memory.stats["room." + room.name + ".progress"] = room.controller.progress;
        
        Memory.stats["room." + room.name + ".progressTotal"] = room.controller.progressTotal;
        
        Memory.stats["room." + room.name + ".level"] = room.controller.level;
        
    },
    
    roomEnergy: function(room) {
        let storage_store = 0;
        if(room.storage){ 
            storage_store = room.storage.store[RESOURCE_ENERGY];
        }
        
        Memory.stats["room." + room.name + ".storage"] = storage_store;
        
        
        if(room.memory.structures){
            
            for(let i = 0; i < room.memory.structures["containers"].length; i++){
                let container = Game.getObjectById(room.memory.structures.containers[i]);
                
                Memory.stats["room." + room.name + ".container." + i] = container.store[RESOURCE_ENERGY];
                
            }
            
        }
        
        let droppedEnergy = _.sum(room.memory.droppedEnergy, id => Game.getObjectById(id).amount);
        
        Memory.stats["room." + room.name + ".dropped"] = droppedEnergy;
    }
};