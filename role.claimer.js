//change this creep to a scout/claimer. 
//Only give it a claim part if I have less rooms than GCL allows?
//Might need to leave it for reservation though.
//But have it cycle through flags, check if the flag's room has a controller(I can see it), and if no, then move to that room to scout.
module.exports = {
    run: function(creep){
        if(creep.memory.targetRoom == null || creep.memory.targetFlag == null){
            creep.findExpansionRoom();
        }
        else{
            if(creep.room.name != creep.memory.targetRoom){
                creep.moveTo(Game.flags[creep.memory.targetFlag]);
            }
            else {
                if(creep.claimController(creep.room.controller) == ERR_NOT_IN_RANGE){
                    creep.moveTo(creep.room.controller);
                }
                else if(creep.claimController(creep.room.controller) == 0){
                    //creep.suicide();
                    creep.say("I would have killed myself");
                }
                else if(creep.reserveController(creep.room.controller) == ERR_NOT_IN_RANGE){
                    creep.moveTo(creep.room.controller);
                }
            }
        }
    },
    
    generateCreepBody: function(energyAmount) {
        let creepBody = [];
        let remainingEnergy = energyAmount;
        while(remainingEnergy / 650 >= 1){
            creepBody.push(CLAIM);
            creepBody.push(MOVE);
            remainingEnergy -= 650;
        }
        return creepBody;
    },
    
    generateName: function() {
        var creepName = "";
        var i = 0;
        do(i++)
        while(Game.creeps["claimer-" + i] != undefined)
        creepName = "claimer-" + i;
        return creepName;
    },

    createCreep: function (room, energyAmount) {
        console.log(room.name + ": Spawning claimer creep");
        let spawner = Game.getObjectById(room.memory.structures.spawners[0]);
        let name = this.generateName();
        let body = this.generateCreepBody(energyAmount);
        spawner.spawnCreep(body, name, { memory: { role: "claimer", targetRoom: room.name, targetFlag: null, home: room.name } });
    }
};