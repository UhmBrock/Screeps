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
    }
};