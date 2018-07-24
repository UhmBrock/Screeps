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
const MemoryManager = require('memoryManagement');
require('prototype.room');
require('prototype.creep');
require('prototype.structure');
require('creepStateController');
require('prototype.Flag');

const statTracker = require('screeps-stats');
const profiler = require('screeps-profiler');

//uncomment below to enable profiler again (small overhead cost)
//profiler.enable();
module.exports.loop = function () {
    profiler.wrap(function() {
        
        //delete old objects out of memory
        MemoryManager.garbageCollection();
        
        
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
        
        //Grafan Support
        Memory.stats = {};
        _.forEach(Game.rooms, room => statTracker.getStats(room));
    });
}