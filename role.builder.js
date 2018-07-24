'use strict';
module.exports = 
{
    run: function(creep) {
        
        if (creep.full() && creep.memory.workState == null)
        {

            this.chooseTarget(creep);
            //chooseTarget sets workState 
        }
        else if (creep.empty() && creep.memory.workState == null) {

            if(creep.chooseTargetEnergy())
                creep.memory.workState = "STATE_GATHERING";
            else if(creep.chooseTargetEnergy(Game.rooms[creep.memory.home]))
                creep.memory.workState = "STATE_GATHERING";
        }
        
        creep.runState();
    },
    
    //need to change to return true
    chooseTarget: function (creep) {

        creep.clearTargetMemory();
        
        if (!creep.empty()) {
            this.choosePriorityStructure(creep);
            if (creep.memory.targetID == null)
                this.chooseTargetConstruction(creep);
            if (creep.memory.targetID == null)
                this.chooseTargetStructure(creep);
            if (creep.memory.targetID == null) {
                creep.chooseTransferTarget();
                creep.memory.workState = "STATE_TRANSFERRING";
            }
        }
    },
    
    choosePriorityStructure: function (creep) {

        const REPAIR_PERCENT = .25;
        const WALL_MULTIPLIER = 50000;
        
        
        let roomStructures = creep.room.getStructures();

        let priorityRepairs = _.filter(roomStructures, 
            function(structure) {
                if(structure.structureType != STRUCTURE_WALL && structure.structureType != STRUCTURE_RAMPART)
                    return ((structure.hits / structure.hitsMax) < REPAIR_PERCENT);
                else{ //only repair walls and ramparts to 50k * controller level
                    return (structure.hits / (creep.room.controller.level * WALL_MULTIPLIER) < REPAIR_PERCENT);
                }
            }
        );
        if(priorityRepairs.length > 0){
            creep.memory.targetID = creep.pos.findClosestByRange(priorityRepairs).id;
            creep.memory.workState = "STATE_REPAIRING";
        }
    },
    
    chooseTargetConstruction: function(creep) {
        
        if(Memory.flags.expansionFlags.length == 0){
            let targetConstruction = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);
    
            if(targetConstruction != null){
                creep.memory.targetID = targetConstruction.id;
                creep.memory.workState = "STATE_BUILDING";
            }
        }
        else{
            
            _.forEach(Memory.flags.expansionFlags, function(flagName) {
               let flagObject = Game.flags[flagName]; 
               if(Game.rooms[flagObject.pos.roomName] != undefined){
                   let targetConstruction = _.filter(Game.rooms[flagObject.pos.roomName].find(FIND_CONSTRUCTION_SITES), site => site.structureType == STRUCTURE_SPAWN)[0];
                   
                   if(targetConstruction != null){
                       creep.memory.targetID = targetConstruction.id;
                       creep.memory.workState = "STATE_BUILDING";
                   }
                   else{
                       targetConstruction = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);
                       
                       if(targetConstruction != null){
                           creep.memory.targetID = targetConstruction.id;
                           creep.memory.workState = "STATE_BUILDING";
                       }
                   }
               }
            });
        }
    },
    
    chooseTargetStructure: function (creep) {
        
        const WALL_MULTIPLIER = 50000;

        let repairStructures = _.filter(creep.room.getStructures(), 
            function(structure){
                if(structure.structureType != STRUCTURE_WALL && structure.structureType != STRUCTURE_RAMPART)
                    return (structure.hits < structure.hitsMax);
                else 
                    return (structure.hits < (creep.room.controller.level * WALL_MULTIPLIER));
            }
        );

        let targetStructure = creep.pos.findClosestByRange(repairStructures);

        if(targetStructure != null){
            creep.memory.targetID = targetStructure.id;
            creep.memory.workState = "STATE_REPAIRING";
        }
    },
    
    generateCreepBody: function(energyAmount) {
        let creepBody = [];
        let remainingEnergy = energyAmount;
        while(remainingEnergy/200 >= 1 && creepBody.length <= 47){
            creepBody.push(WORK);
            creepBody.push(CARRY);
            creepBody.push(MOVE);
            remainingEnergy -= 200;
        }
        if(remainingEnergy >= 150  && creepBody.length <= 47){
            creepBody.push(CARRY);
            creepBody.push(CARRY);
            creepBody.push(MOVE);
            remainingEnergy -= 150;
        }
        else if(remainingEnergy >= 100 && creepBody.length <= 48){
            creepBody.push(CARRY);
            creepBody.push(MOVE);
            remainingEnergy -= 100;
        }
        return creepBody;
    },
    
    generateName: function() {
        var creepName = "";
        var i = 0;
        do(i++)
        while(Game.creeps["builderV2-" + i] != undefined)
        creepName = "builderV2-" + i;
        return creepName;
    },
    
    //could be made into a creep.prototype method
    createCreep: function (room, energyAmount) {
        console.log(room.name + ": Creating builder creep");
        let spawner = Game.getObjectById(room.memory.structures.spawners[0]);
        let name, body;
        name = this.generateName();
        body = this.generateCreepBody(energyAmount);
        spawner.spawnCreep(body, name, {memory: { role: 'builder', targetID: null, workState: null, home: room.name } } );
    }
};