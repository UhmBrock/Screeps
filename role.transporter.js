'use strict';
require('prototype.structure');
module.exports =
{
    run: function (creep) {
        
        if ( creep.full() && creep.memory.workState == null) {
            if(creep.chooseTransferTarget())
                creep.memory.workState = "STATE_WORKING";
            
        }
        
        else if( creep.empty() && creep.memory.workState == null){
            
            if(creep.chooseTargetEnergy())
                creep.memory.workState = "STATE_GATHERING";

        }
        
        else if(creep.memory.workState == null){
            if(creep.chooseTargetEnergy())
                creep.memory.workState = "STATE_GATHERING";
            else if(creep.chooseTransferTarget())
                creep.memory.workState = "STATE_WORkING";
        }
        creep.runState();
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
        if(remainingEnergy >= 150 && creepBody.length <= 47){
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
        let creepName = "";
        let i = 0;
        do(i++)
        while(Game.creeps["transporterV2-" + i] != undefined)
        creepName = "transporterV2-" + i;
        return creepName;
    },

    createCreep: function (room, energyAmount) {
        console.log(room.name + ": Creating transporter creep");
        let spawner = Game.getObjectById(room.memory.structures.spawners[0]);
        let name, body;
        name = this.generateName();
        body = this.generateCreepBody(energyAmount);
        spawner.spawnCreep(body, name, { memory: { role: "transporter", home: room.name, workState: null, targetID: null } });
    }
};

