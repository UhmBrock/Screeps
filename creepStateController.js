Creep.prototype.runState = function() 
{
    let target = Game.getObjectById(this.memory.targetID);
    switch(this.memory.workState) 
    {
        
        case "STATE_WORKING": //transfers energy to structures, upgrades controller, reselects target from this.chooseTransferTarget if target is invalid
        {
            if (target != null && target.withdraw(this) == ERR_NOT_IN_RANGE)
                this.moveTo(target);
    
            else if (target == null || target.withdraw(this) != 0){
                if(this.chooseTransferTarget()){
                    this.memory.workState = "STATE_WORKING";
                    target = Game.getObjectById(this.memory.targetID);
                    if(target.withdraw(this) == ERR_NOT_IN_RANGE)
                        this.moveTo(target);
                }
            }
            
        break;
        }
        
        case "STATE_GATHERING": //withdraws energy from structures, picks up energy, reselects target if target becomes invalid
        {    
            if (target != null && target.transferTo(this) == ERR_NOT_IN_RANGE)
                this.moveTo(target);
    
            else if (target == null || target.transferTo(this) != 0){
                if(this.chooseTargetEnergy()){
                    this.memory.workState = "STATE_GATHERING";
                    target = Game.getObjectById(this.memory.targetID);
                    if(target.transferTo(this) == ERR_NOT_IN_RANGE)
                        this.moveTo(target);
                }
                else{
                    if(this.carry >= (this.carryCapacity/2)){
                        if(this.chooseTransferTarget(Game.rooms[this.memory.home]))
                            this.memory.workState = "STATE_WORKING";
                    }
                    else if(this.memory.role == "builder"){
                        require("role.builder").chooseTarget(this);
                    }
                    else{ //wait for energy to be available
                        this.clearTargetMemory();
                    }
                }
            }
            
        break;
        }
        
        //needs imporvement
        case "STATE_HARVESTING":
        {   
            
            if(this.full()){
                this.clearTargetMemory();
            }
            
            else if(this.harvest(target) == ERR_NOT_IN_RANGE){
                
                if(this.moveTo(target) == ERR_NO_PATH){
                    if(this.chooseSource()){
                        target = Game.getObjectById(this.memory.targetID);
                        this.moveTo(target);
                    }
                }
                
            }
            
            else if(this.harvest(target) != 0){
                if(this.chooseSource()){
                    this.memory.workState = "STATE_HARVESTING";
                    target = Game.getObjectById(this.memory.targetID);
                    if(this.harvest(target) == ERR_NOT_IN_RANGE)
                        this.moveTo(target);
                }
            } 
            
        break;
        }
            
        //To-DO: change else statement to a more generic target instead of remoteHarvester specific
        //and to not require target.room unless I give all thiss a target room
        
        //gets this to a targetRoom
        case "STATE_MOVING":
        {
            //we pass flag.pos to this state so we need this catch
            //if we are passing an object, it converts target into a RoomPosition 
            if(this.memory.targetID instanceof RoomPosition){
                target = this.memory.targetID;
            }
            else{
                target = target.pos;
            }
            
            if(this.pos.roomName != target.roomName){
                if(this.moveTo(target) == ERR_NO_PATH){
                    this.clearTargetMemory();
                }
            }
            else{
                this.moveTo(25, 25); //get off the exit tile
                this.clearTargetMemory();
            }
            
        }
        
        //To-do: remove reliance on Role.builder
        case "STATE_REPAIRING": //repairs structures, and reselects a new target if target has become invalid
        {   
            if(target != null){
                if (target.hits / target.hitsMax == 1 ){//if target has been repaired to max HP, choose a new one
                    require('role.builder').chooseTarget(this);
                }
                
                if (target != null && this.repair(target) == ERR_NOT_IN_RANGE){
                    this.moveTo(target);
                }
                else if (target == null || this.repair(target) != 0){
                    require('role.builder').chooseTarget(this);
                    target = Game.getObjectById(this.memory.targetID);
                    this.moveTo(target);
                }
            }
        break;
        }
        
        case "STATE_BUILDING": //attempts to build a construction site, reselects target if target has become invalid
        {    
            if (target != null && this.build(target) == ERR_NOT_IN_RANGE){
                this.moveTo(target);
            }
            
            else if (target == null || this.build(target) != 0){
                require('role.builder').chooseTarget(this);
                target = Game.getObjectById(this.memory.targetID);
                this.moveTo(target);
            }
            
        break;
        }
        
        //TO-DO: redesign default to work for worker this (builder + transporter);
        default: //automatically loops through target methods to either gather or use energy. Each function checks internally if this is full or empty
        {   
            //checks role to decide how it selects targets
            if(this.memory.role == "transporter" ){//|| this.memory.role == "remoteHarvester"){
                
                if(this.chooseTransferTarget()){
                    this.memory.workState = "STATE_WORKING";
                    target = Game.getObjectById(this.memory.targetID);
                    this.moveTo(target);
                }
                else if(this.chooseTargetEnergy()){
                    this.memory.workState = "STATE_GATHERING";
                    target = Game.getObjectById(this.memory.targetID);
                    this.moveTo(target);
                }
            }
            
            else if (this.memory.role == "remoteHarvester"){
                if(this.chooseSource(Game.rooms[this.memory.targetRoom])){
                    this.memory.workState = "STATE_HARVESTING";
                    target = Game.getObjectById(this.memory.targetID);
                    this.moveTo(target);
                }
            }
            else if(this.memory.role == "builder"){
                
                    require('role.builder').chooseTarget(this); //sets state on it's own
                    
            }
        break;
        }
    }
}
// TRANSPORTER SWITCH completely integrated

// BUILDER SWITCH completely intregrated

// REMHARVESTER SWITCH completely integrated

