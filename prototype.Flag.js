/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('prototype.Flag');
 * mod.thing == 'a thing'; // true
 */

Flag.prototype.isVisible = function() {
    
    return (Game.rooms[this.pos.roomName] != undefined);
    
}

Flag.prototype.isOwned = function() {
    if(this.isVisible()){
        return this.room.controller.my;
    }
    else{
        return false;
    }
}

Flag.prototype.warriorsNeeded = function() {
    if(this.isVisible()){
        let warriorsTargeting = this.room.creepCount(["warriors"], true)["warriors"];
        let enemies = this.room.find(FIND_HOSTILE_CREEPS);
        
        return Math.ceil(enemies/2) - warriorsTargeting;
    }
    else{
        return 0;
    }
}
Flag.prototype.minersNeeded = function() {
    if(this.isVisible()){
        let minersTargeting = this.room.creepCount(["staticMiners"], true)["staticMiners"];
        
        numNeeded = this.room.memory.creepLimits["staticMiners"] - minersTargeting;
        
        if(numNeeded >= 0)
            return numNeeded;
        else
            return 0;
    }
    else{
        //return 0;
        return (1 - _.filter(Memory.roles.staticMiners, name => Game.creeps[name].memory.targetRoom == this.pos.roomName).length);
    }
}

Flag.prototype.remoteHarvestersNeeded = function() {
    if(this.isVisible()){
        let harvestersTargeting = this.room.creepCount(["remoteHarvesters"], true)["remoteHarvesters"];
        
        numNeeded = (this.room.memory.creepLimits["staticMiners"] * 3) - harvestersTargeting;
        
        if(numNeeded >= 0){
            return numNeeded;
        }
        else{
            return 0;
        }
    }
    else{
        return 0;
    }
}

Flag.prototype.claimersNeeded = function() {
    if(this.isOwned()){
        return 0;
    }
    else{
        return 1 - _.filter(Memory.roles.claimers, name => Game.creeps[name].memory.targetRoom == this.pos.roomName).length;
    }
}