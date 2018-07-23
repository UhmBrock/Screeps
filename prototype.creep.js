'use strict';

//TO-DO: Create a prototype function for GenerateName() and potentially GenerateBody()

Creep.prototype.run = function() { //requiring these modules each time might be expensive. Potentially look into calling require outside the loop
    var role = {
        
        staticMiner: require('role.staticMiner'),
        
        remoteHarvester: require('role.remoteHarvester'),
        
        transporter: require('role.transporter'),
        
        builder: require('role.builder'),
        
        claimer: require('role.claimer'),
        
        warrior: require('role.warrior')
    }
    // DO a try : catch here to stop one type of creep from crashing my code
    if(!this.spawning && this.memory.role != undefined)
        role[this.memory.role].run(this);
}

Creep.prototype.clearTargetMemory = function () {
    this.memory.targetID = null;
    this.memory.workState = null;
}
//
//BEGIN - Creep property methods
//

Creep.prototype.full = function () {
    
    return _.sum(this.carry) == this.carryCapacity;
    
}

Creep.prototype.empty = function() {

    return _.sum(this.carry) == 0;

}

//
//END - Creep property methods
//

//
//BEGIN - Targeting Methods
//

//Sets this.memory.targetID to a Source object's ID in the room.
//returns true if target was assigned
//TO-DO: Change this to target the container next to the source, so that creep will always be on top of container
Creep.prototype.chooseSource = function (targetRoom) {
    
    let room = null;
    //optional room var
    if(targetRoom == null){
        room = this.room;
    }
    else{
        room = targetRoom;
    }
    
    this.clearTargetMemory();

    let minerArray = _.map(Memory.roles.staticMiners, c => Game.creeps[c]);
    
    for (let sourceID in room.memory.sources) {

        let source = Game.getObjectById(sourceID);
        
        let minersTargeting = _.filter(minerArray, miner => miner.memory.targetID === source.id);
        
        if(minersTargeting.length > 0){
            
            let minMiner = _.min(minersTargeting, creep => creep.ticksToLive);
            //if a creep targeting the source will die within the time it takes another creep to get there from spawn to source, 
            //don't count it in targeting algorithm.
            if(minMiner.timeToLive <= minMiner.memory.ticksToSource + 24){
                minersTargeting.remove(minMiner);
            }
            
        }
        
        //if no creeps have the source targeted and the source is not empty, then if you have no target, or it is closer than your target, then target it
        if (minersTargeting.length === 0 && (source.energy > 0 || source.ticksToRegeneration < 20)){
            if(this.memory.targetID == null || (this.pos.getRangeTo(source) < this.pos.getRangeTo(Game.getObjectById(this.memory.targetID))))
                this.memory.targetID = source.id;
        }
        
        //if less than optimal work parts or a creep targeting it will die soon, and source has energy or will within 20 ticks
        else if ((_.sum(minersTargeting, c => c.getActiveBodyparts(WORK)) < source.energyCapacity / 600) && (source.energy > 0 || source.ticksToRegeneration < 20))
        {

            //check if there is an open spot at the source, target it if there is
            if (minersTargeting.length < room.memory.sources[sourceID].accessTiles.length){
                this.memory.targetID = source.id;
            }

        }

    }
    
    return this.memory.targetID != null;
}

//Runs this.clearTargetMemory();
//Sets this.memory.targetID to a droppedEnergy resource, container, or a storage.
//Sets this.memory.targetID to null if there are no targets.
//returns true if target was assigned
//TO-DO: Search for tombstones as well
Creep.prototype.chooseTargetEnergy = function (targetRoom) {
    
    let room = null;
    //optional room var
    if(targetRoom == null){
        room = this.room;
    }
    else{
        room = targetRoom;
    }
    
    this.clearTargetMemory();
    
    if ( !this.full() && room != null) {
        
        const MAX_CARRY = this.carryCapacity - _.sum(this.carry);
        
        let dropArray = [],
            containerArray = [],
            mergedArray = [];

        //Get all dropped energy in a room as objects
        dropArray = _.map(room.memory.droppedEnergy, d => Game.getObjectById(d));

        //check if there are containers, merge them with the dropped resources
        if (room.memory.structures.containers.length > 0) {

            containerArray = _.map(room.memory.structures.containers, c => Game.getObjectById(c));

        }
        
        mergedArray = dropArray.concat(containerArray);

        //filter out the targets with energy >= this.carryCapacity
        let largeTargetsArray = _.filter(mergedArray, function (target) {
            if (target.structureType == STRUCTURE_CONTAINER || target.structureType == STRUCTURE_STORAGE) {
                return target.store[RESOURCE_ENERGY] >= MAX_CARRY;
            }
            else {
                return target.amount >= MAX_CARRY;
            }
        })

        //Get the closest resource >= this.carryCapacity
        let closestResource = this.pos.findClosestByRange(largeTargetsArray);

        if (closestResource != undefined) {
            this.memory.targetID = closestResource.id;
        }
        //target storage if it has enough, and no other sources are large.
        else if(room.storage != undefined && _.sum(room.storage) > MAX_CARRY){
            this.memory.targetID = room.storage.id;
        }

            //Check for largest drop in the room if there are none >= this.carryCapacity
        else {

            let dropAmount = _.map(dropArray, d => d.amount);

            let containerAmount = _.map(containerArray, c => c.store[RESOURCE_ENERGY]);

            let energyAmount;

            if (room.storage != undefined)
                energyAmount = dropAmount.concat(containerAmount, room.storage[RESOURCE_ENERGY]);
            else
                energyAmount = dropAmount.concat(containerAmount);

            //Gets the index of the highest energy amount
            let maxIndex = _.indexOf(energyAmount, _.max(energyAmount));

            if (energyAmount[maxIndex] != null) {

                this.memory.targetID = mergedArray[maxIndex].id;

            }
        }
    }
    
    return this.memory.targetID != null;
}


//Could be improved with some caching of lowTower and lowExtensions
//return true if target was assigned
Creep.prototype.chooseTransferTarget = function (targetRoom) {
    let room = null;
    //optional room var
    if(targetRoom == null){
        room = this.room;
    }
    else{
        room = targetRoom;
    }
    
    this.clearTargetMemory();

    if (!this.empty() && room != null) {
        let lowTowers = _.filter(_.map(room.memory.structures.towers, id => Game.getObjectById(id)), tower => !tower.isFull());
        let spawners =  _.filter(_.map(room.memory.structures.spawners, id => Game.getObjectById(id)), spawner => !spawner.isFull());
        let lowExtensions = _.map(this.room.memory.structures.lowExtensions, id => Game.getObjectById(id));
        
        let lowTargets = spawners.concat(lowExtensions);

        //Fill tower if low
        if (lowTowers.length > 0) {
            
            let target = this.pos.findClosestByRange(lowTowers);
            if(target == null) // findClosestByRange does not reach across rooms, so this catches that.
                target = lowTowers[0];
            
            this.memory.targetID = target.id;
        }
        
        else if(lowTargets.length > 0){
            
            let target = this.pos.findClosestByRange(lowTargets);
            
            if(target != null) {
                this.memory.targetID = target.id;
            }
        }
        
        else {
            if((this.memory.role == "remoteHarvester" || this.memory.role == "builder") && room.storage != undefined)
                this.memory.targetID = room.storage.id;
            else
                this.memory.targetID = room.controller.id;
        }
    }
    
    return this.memory.targetID != null;
    
},
//
//END - Targeting methods
//

//
//BEGIN - Flag methods
//

Creep.prototype.findRemoteHarvestRoom = function() {
    
    //clear creep memory
    this.memory.targetFlag = null;
    
    //Find flagRoom with the least miners assigned to it
    if (Memory.flags.remoteHarvestFlags.length >= 1) {
        
        let creep = this;
        _.forEach(Memory.flags.remoteHarvestFlags, 
            
            function(flag) {
                
                let flagObject = Game.flags[flag];
                if(creep.memory.role == "staticMiner"){
                    if(flagObject.minersNeeded() > 0){
                        creep.memory.targetRoom = flagObject.pos.roomName;
                        creep.memory.targetFlag = flagObject.name;
                    }
                }
                else if(creep.memory.role == "remoteHarvester"){
                    if(flagObject.remoteHarvestersNeeded() > 0){
                        creep.memory.targetRoom = flagObject.pos.roomName;
                        creep.memory.targetFlag = flagObject.name;
                    }
                }
            }
        );
    }
    
    return this.memory.targetFlag != null; 
},

Creep.prototype.findExpansionRoom = function() {
    let creep = this;
    //clear creep memory
    this.memory.targetRoom = null;
    this.memory.targetFlag = null;
    
    if(Memory.flags.expansionFlags.length > 0){
        _.forEach(Memory.flags.expansionFlags, function(flagName) {
           let flagObject = Game.flags[flagName];
           
           if(flagObject.claimersNeeded() > 0){
               if(creep.memory.targetRoom == null || creep.memory.targetFlag == null){
                   creep.memory.targetRoom = flagObject.pos.roomName;
                   creep.memory.targetFlag = flagObject.name;
               }
               else if(Game.map.getRoomLinearDistance(creep.room.name, flagObject.pos.roomName) < Game.map.getRoomLinearDistance(creep.room.name, creep.memory.targetRoom)){
                   creep.memory.targetRoom = flagObject.pos.roomName;
                   creep.memory.targetFlag = flagObject.name;
               } 
           }
        });
    }    
    
    return this.memory.targetRoom != null;
}

Creep.prototype.findDefendRoom = function() {
    let creep = this;
    
    this.memory.targetRoom = null;
    this.memory.targetFlag = null;
    
    if(Memory.flags.expansionFlags.length > 0){
        _.forEach(Memory.flags.defendFlags, function(flagName) {
            let flagObject = Game.flags[flagName];
            
            if(flagObject.warriorsNeeded() > 0) {
                
                if(creep.memory.targetRoom == null || creep.memory.targetFlag == null){
                   creep.memory.targetRoom = flagObject.pos.roomName;
                   creep.memory.targetFlag = flagObject.name;
               }
               else if(Game.map.getRoomLinearDistance(creep.room.name, flagObject.pos.roomName) < Game.map.getRoomLinearDistance(creep.room.name, creep.memory.targetRoom)){
                   creep.memory.targetRoom = flagObject.pos.roomName;
                   creep.memory.targetFlag = flagObject.name;
               } 
               
            }
        });
    }
    
    return this.memory.targetRoom != null;
}
