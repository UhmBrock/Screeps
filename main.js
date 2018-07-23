/////////////////////////////////
// Last stable revision pushed //
//      07 - 18 - 2018         //
// Change Log:                 //
//   - Rewrote StaticMiner     //
//     + Added container maint //
//     + Move by path          //
//     + Now need CARRY part   //
/////////////////////////////////

/////////////////////////////////
// Known Bugs:                 //
/////////////////////////////////


'use strict';
var MemoryManager = require('memoryManagement');
require('prototype.room');
require('prototype.creep');
require('prototype.structure');
require('creepStateController');
require('prototype.Flag');

const profiler = require('screeps-profiler');

//uncomment below to enable profiler again (small overhead cost)
//profiler.enable();
module.exports.loop = function () {
    profiler.wrap(function() {
        
        //delete old objects out of memory
        MemoryManager.garbageCollection();
        
        //MemoryManager.createNewPath( Game.getObjectById("5b2563167402c80a9b82e04c").pos, Game.flags["Flag5"].pos, "StorageToFlag");
        
        //run rooms
        _.forEach(Game.rooms, room => room.run());
        
        //run creeps
        _.forEach(Game.creeps, creep => creep.run());
        
        //temp code to run defense flags
        /*
        if(Game.rooms[Game.flags["Flag4"].pos.roomName] != undefined){ // || Game.rooms[Game.flags["Flag6"].pos.roomName] != undefined){
            if( (Game.flags["Flag4"].room.find(FIND_HOSTILE_CREEPS).length > 0) )// || Game.flags["Flag6"].room.find(FIND_HOSTILE_CREEPS).length > 0) &&  Memory.roles.warriors.length < 2)
                Game.spawns.Spawn3.spawnCreep([TOUGH, TOUGH, TOUGH, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, ATTACK, ATTACK, ATTACK], "Champ Of E8S59", {memory: {role: "warrior" }});
        }
        */
        if(Game.time%25 == 0){
            console.log(" <br><hr> ");
        }
    });
}
//Optimize code using simultaneous actions
// E.G. have creep transfer to an extension, and on the same tick move to the next one

//TO-DO:
//Decide how many transporters/builders to make depending on creep colony state(maybe tied to number of extensions/room.energyCapacity)
//Combine transporter and builder class to be more efficient
    // They are basically the same, could potentially just have code that changes the memory.role of the creep to be one or the other based on needs
//Serialize path to each source to improve CPU usage
//Upgraders?
//  Maybe check if I have enough energy in my storage to upgrade my Controller, and if so, spawn a bunch of upgrader creeps to quickly get it done, and then kill them off to save CPU