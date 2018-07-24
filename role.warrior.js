module.exports = {
    run: function(creep) {
        if(creep.memory.targetFlag == null){
            creep.findDefendRoom();
        }
        
        if(Game.flags[creep.memory.targetFlag] != undefined){
            if(creep.room.name != creep.memory.targetRoom){
                creep.moveTo(Game.flags[creep.memory.targetFlag].pos);
            }
            else {
                creep.moveTo(Game.flags[creep.memory.targetFlag].pos);
                if(creep.attack(creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS)) == ERR_NOT_IN_RANGE)
                    creep.moveTo(creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS));
            }
        }
        else{
            creep.memory.targetFlag = null;
            creep.memory.targetRoom = null;
            creep.say("No room needs defending.");
        }
    },
    
    generateCreepBody: function(energyAmount) {
        let creepBody = [];
        let remainingEnergy = energyAmount;
        while(remainingEnergy/400 >= 1 && creepBody.length <= 44){
            creepBody.push(TOUGH);
            creepBody.push(TOUGH);
            creepBody.push(MOVE);
            creepBody.push(ATTACK);
            creepBody.push(ATTACK);
            creepBody.push(MOVE);
            remainingEnergy -= 400;
        }
        return creepBody;
    },
    
    generateName: function() {
        let creepName = "";
        let i = 0;
        do(i++)
        while(Game.creeps["warrior-" + i] != undefined)
        creepName = "warrior-" + i;
        return creepName;
    },

    createCreep: function (room, energyAmount) {
        console.log(room.name + ": Creating warrior creep");
        let spawner = Game.getObjectById(room.memory.structures.spawners[0]);
        let name, body;
        name = this.generateName();
        body = this.generateCreepBody(energyAmount);
        spawner.spawnCreep(body, name, { memory: { role: "warrior", home: room.name, workState: null, targetID: room.name } });
    }
    
};