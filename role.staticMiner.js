'use strict';
module.exports = {
    run: function(creep) {
        
        if(creep == undefined)
            return;
        
        if( creep.memory.targetID != null ){
            
            let source = Game.getObjectById(creep.memory.targetID);
            
                
            if(creep.harvest(source) == ERR_NOT_IN_RANGE){
                
                let moveTarget;
                
                
                if(source.room.memory.sources)
                    moveTarget = Game.getObjectById(source.room.memory.sources[source.id].container);
                    
                if(moveTarget == null)
                    moveTarget = source;
                
                if(creep.moveTo(moveTarget) == 0)
                    creep.memory.ticksToSource++;
            }
            else if(creep.harvest(source) == 0){
                if(creep.carry[RESOURCE_ENERGY] >= 25)
                    this.maintainContainer(creep, source);
            }
            else{
                creep.memory.targetID = null;
            }
        }
        
        else if( creep.chooseSource(Game.rooms[creep.memory.home]) ) {
            
            let source = Game.getObjectById(creep.memory.targetID);
            
            creep.moveTo(source);
            //this.getPath(creep, source); // sets creep.memory.path
            
            //creep.moveByPath(creep.memory.path);
            //this.moveUsing(creep, creep.memory.path);
        }
        
        else{
            if(creep.memory.targetRoom == creep.memory.home){
                creep.findRemoteHarvestRoom();
            }
            else{
                if(creep.chooseSource(Game.rooms[creep.memory.targetRoom])){
                    let source = Game.getObjectById(creep.memory.targetID);
                    
                    creep.moveTo(source);
                }
                else{
                    creep.moveTo(Game.flags[creep.memory.targetFlag].pos);
                }
            }
        }
    },
    
    moveUsing: function(creep, path) {
        let moveResult = creep.moveByPath(path);
        
        if(moveResult == 0){
            let lastPosition;
            
            
            if(creep.pos.isEqualTo(lastPosition)){
                creep.memory.stuckTimer++;
            }
            else{
                creep.memory.ticksToSource++;
                creep.memory.lastPos = creep.pos;
                creep.memory.stuckTimer = 0;
            }
            
            if(creep.memory.stuckTimer >= 5){
                this.getPath(creep, Game.getObjectById(creep.memory.targetID), false);
            }
            
        }
        
        return moveResult;
    },
    
    getPath: function(creep, source, ignoreBool) {
        if(ignoreBool === undefined){
            ignoreBool = true;
        }
        
        let containerPos = source.containerPos();
        
        if(containerPos == null)
            creep.memory.path = creep.pos.findPathTo(source, { range: 1, serialize: true});
        
        else
            creep.memory.path = creep.pos.findPathTo(containerPos, { serialize: true });
            //creep.memory.path = creep.pos.findPathTo(containerPos, { ignoreCreeps: ignoreBool, serialize: true});
        
        creep.memory.path_roomName = creep.pos.roomName;
        
    }, 
    
    maintainContainer: function(creep, source) {
        //If a container exists, repair if needed
        let container = Game.getObjectById(source.room.memory.sources[source.id].container);
        
        if(container != null && container instanceof StructureContainer){
            
            //console.log(creep.name + " has a container at : " + (container.hits/container.hitsMax) *100 + "% health.");
            if( (container.hits / container.hitsMax) < 1 ){
                creep.repair(container);
            } 
            else{
                creep.drop(RESOURCE_ENERGY);
            }
        }
        else if( container != null && container instanceof ConstructionSite){
            
            //console.log(creep.name + " is building container: " + creep.build(container));
            if(creep.build(container) == ERR_INVALID_TARGET)
                source.containerPos(); //update source container memory if built
            
        }
        else{ //container is null
            
            //console.log(creep.name + " has no container or site");
            creep.room.createConstructionSite(creep.pos, STRUCTURE_CONTAINER);
            
            source.containerPos(); //update source container memory
        }
        
    },
    
    
    /* TEMPORARY FUNCTIONS UNTIL MOVED */
    generateCreepBody: function(energyAmount) {
        let creepBody = [];
        let remainingEnergy = energyAmount;
        if(remainingEnergy == 150){
            creepBody = [WORK, MOVE];
        }
        else if(remainingEnergy == 650){
            creepBody = [WORK, WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE]; //optimal creep
        }
        else if(remainingEnergy == 700){
            creepBody = [WORK, WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE, CARRY];
        }
        else{
            while(remainingEnergy/250 >= 1){
                creepBody.push(WORK);
                creepBody.push(WORK);
                creepBody.push(MOVE);
                remainingEnergy -= 250;
            }
        }
        return creepBody;
    },
    generateName: function() {
        var creepName = "";
        var i = 0;
        do(i++)
        while(Game.creeps["staticMinerV2-" + i] != undefined)
        creepName = "staticMinerV2-" + i;
        return creepName;
    },

    createCreep: function (room, energyAmount) {
        console.log(room.name + ": Spawning staticMiner creep");
        
        let spawner = Game.getObjectById(room.memory.structures.spawners[0]);
        let name, body;
        name = this.generateName();
        body = this.generateCreepBody(energyAmount);
        spawner.spawnCreep(body, name, { memory: { role: "staticMiner", targetID: null, workState: null, home: room.name, targetRoom: room.name, targetFlag: null, ticksToSource: 0 } });
    }
};









