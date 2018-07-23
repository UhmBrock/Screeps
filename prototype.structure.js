//
//BEGIN - Structure prototype 
//
//Need to do a find and replace to rename this "structure.fill(creep)"
Structure.prototype.withdraw = function(creep) {
    if(this.structureType == STRUCTURE_SPAWN ||
    this.structureType == STRUCTURE_EXTENSION ||
    this.structureType == STRUCTURE_TOWER ||
    this.structureType == STRUCTURE_STORAGE ||
    this.structureType == STRUCTURE_CONTAINER)
    {

        return creep.transfer(this, RESOURCE_ENERGY);

    }
    else if(this.structureType == STRUCTURE_CONTROLLER){
        
        return creep.upgradeController(this, RESOURCE_ENERGY);
        
    }
    else {

        return ERR_INVALID_TARGET;

    }
}

//
//BEGIN - (resource/container).loadEnergy
//
//need to find and repalce to rename it .withdraw or .transfer

Structure.prototype.transferTo = function(creep) {
    if(this.structureType == STRUCTURE_SPAWN ||
    this.structureType == STRUCTURE_EXTENSION ||
    this.structureType == STRUCTURE_TOWER ||
    this.structureType == STRUCTURE_CONTROLLER ||
    this.structureType == STRUCTURE_STORAGE ||
    this.structureType == STRUCTURE_CONTAINER)
    {
        return creep.withdraw(this, RESOURCE_ENERGY);

    }
    else {

        return ERR_INVALID_TARGET;

    }
}


Structure.prototype.isFull = function () {
    if (this.energy != undefined)
        return this.energy == this.energyCapacity;
    else
        return undefined;
}
//
//END - structure.unloadEnergy
//

//
//BEGIN - Tower prototype
//
StructureTower.prototype.run = function() {
    let tower = this;
    let enemies = this.room.find(FIND_HOSTILE_CREEPS);
    let enemy = _.find(enemies, function(creep) {
        if(creep.getActiveBodyparts(HEAL) > 0 )
            return true;
    })
    
    if(enemy != null){
        this.attack(enemy);
    }
    else{
        let target = _.min(_.filter(Game.creeps, creep => creep.room.name == this.room.name), creep => creep.hits / creep.hitsMax);
        if(target != null && (target.hits / target.hitsMax < 1) && target.my){
            this.heal(target);
        }
        else{
            target = this.chooseRepairTarget();
            if(target != null)
                this.repair(target);
        }
    }
    
}

StructureTower.prototype.chooseRepairTarget = function () {
    
    const REPAIR_PERCENT = .20;
    const WALL_PROPORTION = 50000;
    
    let room = this.room;
    let roomStructures = room.getStructures();
    
    let priorityRepairs = _.filter(roomStructures, 
        function(structure) {
            if(structure.structureType != STRUCTURE_WALL && structure.structureType != STRUCTURE_RAMPART)
                return ((structure.hits / structure.hitsMax) < REPAIR_PERCENT);
            else{ 
                return (structure.hits / (room.controller.level * WALL_PROPORTION) < REPAIR_PERCENT);
            }
        }
    );

    if(priorityRepairs.length > 0){
        return this.pos.findClosestByRange(priorityRepairs);
    }

}
//
//END - Tower prototype
//

//
//BEGIN - Spawn prototype
//

StructureSpawn.prototype.spawnNextCreep = function() {
    
    
    
}

//
//END - Spawn prototype
//

//
//BEGIN - Source prototype
//
Source.prototype.containerPos = function() {
    let source = this;
    
    let sourceMemory = this.room.memory.sources[this.id];
    
    let container = Game.getObjectById(sourceMemory.container);
    
    if(container != null){
        return Game.getObjectById(sourceMemory.container).pos;
    }
    else{
        let containerPos = sourceMemory["accessTiles"].find( function(tile) {
            
            tile = new RoomPosition(tile.x, tile.y, tile.roomName);
            
            //console.log(tile.x + ", " + tile.y + " Tile.look() returns: " + JSON.stringify(tile.look()));
            
            let structs = tile.look().filter( function(lookObject) {
                return (lookObject.type == LOOK_STRUCTURES || lookObject.type == LOOK_CONSTRUCTION_SITES);
            });
            
            
            if(structs.length && structs[0].structure && structs[0].structure.structureType == STRUCTURE_CONTAINER){
                sourceMemory["container"] = structs[0].structure.id;
            }
            else if(structs.length && structs[0].constructionSite && structs[0].constructionSite.structureType == STRUCTURE_CONTAINER){
                sourceMemory["container"] = structs[0].constructionSite.id;
            }
            
            return (structs.length && ((structs[0].structure && structs[0].structure.structureType == STRUCTURE_CONTAINER) || (structs[0].constructionSite && structs[0].constructionSite.structureType == STRUCTURE_CONTAINER)));
            
        });
        
        if(containerPos != undefined)
            return new RoomPosition(containerPos.x, containerPos.y, containerPos.roomName); //will be undefined if no container
        
        else
            return null;
    }
}


Resource.prototype.transferTo = function(creep){
    
    return creep.pickup(this);

}
//
//END - Source prototype
//
