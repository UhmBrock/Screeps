'use strict';

// TO-DO: For some reason creep is having to wait until its path times out before it will switch into STATE_WORKING
// Creep gets stuck on exit tile unless there is energy in the room
module.exports = {
    
    run: function(creep) {
        if(Memory.flags.remoteHarvestFlags.length > 0){
            
            //Memory Management
            if(creep.memory.targetRoom == null || creep.memory.targetFlag == null)
                creep.findRemoteHarvestRoom();
            
            if(creep.memory.pathToFlag == null){
                //set creep.memory.pathToFlag = room.paths)
            }
            //End Memory Management
            
            //if not in the target room and not on the way to drop off energy
            //if(creep.room.name != creep.memory.targetRoom && creep.memory.workState != "STATE_WORKING"){
            if(creep.room.name != creep.memory.targetRoom && creep.memory.workState == null){
                creep.memory.targetID = Game.flags[creep.memory.targetFlag].pos;
                creep.memory.workState = "STATE_MOVING";
            }            
            
            // Chooses a target in the same way that a transporter would, but selects storage instead of controller
            else if(creep.full() && creep.memory.workState == null){
                if(creep.chooseTransferTarget(Game.rooms[creep.memory.home]))
                    creep.memory.workState = "STATE_WORKING";
            }
            
            else if(creep.empty() && creep.memory.workState == null){
                if(creep.chooseTargetEnergy())
                    creep.memory.workState = "STATE_GATHERING";
            }
            
            else if(creep.memory.workState == null){
                if(creep.chooseTargetEnergy())
                    creep.memory.workState = "STATE_GATHERING";
                else if(creep.chooseTransferTarget(Game.rooms[creep.memory.home]))
                    creep.memory.workState = "STATE_WORKING";
            }
            
            creep.runState();
        }
        
        else{
            creep.say("No remote harvest flag found.");
        }
    },
 
    
    generateCreepBody: function(energyAmount) {
        let creepBody = [];
        let remainingEnergy = energyAmount;
        while(remainingEnergy / 300 >= 1 && creepBody.length <= 46){
            creepBody.push(CARRY);
            creepBody.push(CARRY);
            creepBody.push(MOVE);
            creepBody.push(MOVE);
            remainingEnergy -= 300;
        }
        
        return creepBody;
    },
    
    generateName: function() {
        var creepName = "";
        var i = 0;
        do(i++)
        while(Game.creeps["remoteHarvester-" + i] != undefined)
        creepName = "remoteHarvester-" + i;
        return creepName;
    },

    createCreep: function (room, energyAmount) {
        console.log(room.name + ": Spawning remoteHarvester creep");
        let spawner = Game.getObjectById(room.memory.structures.spawners[0]);
        let name = this.generateName();
        let body = this.generateCreepBody(energyAmount);
        spawner.spawnCreep(body, name, { memory: { role: "remoteHarvester", targetID: null, workState: null, home: room.name, targetRoom: room.name, targetFlag: null, pathToFlag: null } });
    }
};