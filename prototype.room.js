require ("prototype.structure");

Room.prototype.run = function () {
    
    //Don't run border rooms
    if(this.controller != undefined){
        //Update room.memory
        require('memoryManagement').run(this);
        
        this.setRoomState();
        
        //Queue up the next creep spawn
        this.chooseNextCreep();
        
        
        //run towers in room
        _.forEach(_.map(this.memory.structures.towers, towerID => Game.getObjectById(towerID)), tower => tower.run());
    }
    
}
          // Creep spawning code //
//--------------------------------------------------------//

//TO-DO:
//Reverse the order of the IF statements and turn them into if else statements to save some CPU, or just do a return in each if statement
Room.prototype.setRoomState = function (creepCounts) {
    
    if(creepCounts == undefined){
        creepCounts = this.creepCount("ALL");
        creepCounts["staticMiners"] = this.creepCount(["staticMiners"], true)["staticMiners"];   
    }
    let roomState = "INTRO_STATE"; //default
    
    if (creepCounts["staticMiners"] > 0 && creepCounts["transporters"] > 0)
        roomState = "BEGINNER_STATE";

    if (this.storage && false) //&& false is temporary stop
        roomState = "ADVANCED_STATE";

    //if (this.find(FIND_HOSTILE_CREEPS).length > 0)
    //    roomState = "DEFENSIVE_STATE";
    
    this.memory.roomState = roomState;
}

Room.prototype.getStructures = function() {
    let returnArray = [];
    _.forEach(this.memory.structures, function(structFolder) {
       _.forEach(structFolder, structID => returnArray.push(Game.getObjectById(structID))); 
    });
    return returnArray;
}


//Chooses next needed type of creep and passes the energyAmount available to this.spawnCreep
//TO-DO: Make it check if the lowest minerTTL is <= creep's body part count * 3 ticks/part and if so generate a new creep.
//TO-DO: After pathmaking is established to each source, count the time it takes a creep to travel to the source and add that to the above function
Room.prototype.chooseNextCreep = function () {

    let spawner = Game.getObjectById(this.memory.structures.spawners[0]);
    let room = this;
    
    //used for reporting
    let creepCounts = this.creepCount("ALL");
        //find these by targetRoom, to ensure we don't count remoteHarvesting creeps.
        creepCounts["staticMiners"] = this.creepCount(["staticMiners"], true)["staticMiners"];
        creepCounts["remoteHarvesters"] = this.creepCount(["remoteHarvesters"], true)["remoteHarvesters"];
    
    if (spawner != null && spawner.my && spawner.spawning == null) {
        
        //UPDATE CREEP LIMIT MEMORY WHEN SPAWNER IS AVAILABLE //
        this.updateCreepLimits(); //intializes inside of memoryManagement
        
        //INTRO STATE
        let MAX_CREEP_COST = {
            staticMiner: 150,
            transporter: 200,
            builder: 0,
            remoteHarvester: 0,
            claimer: 0 
        };
        
        if(this.memory.roomState == "BEGINNER_STATE"){
            MAX_CREEP_COST = { 
                staticMiner: 700,
                transporter: 2150,
                builder: 3300,
                remoteHarvester: 1500,
                claimer: 1300 
            };
        }
        
        const MIN_BUILDER_RATIO = 1/4; //ratio of builders to transporters
        const MINER_BUILD_TICKS = (9) * 3; //8 parts at 3 ticks a part to build
        
        // finds the miner closest to dead in each room.
        let lowestMiner = _.min(_.map(Memory.roles.staticMiners, function(creepName) {
            let creep = Game.creeps[creepName];
            
            if (creep.memory.targetRoom == room.name){
                return creep;
            }
        }), function(creep) { if(creep != undefined) { return creep.ticksToLive } } );
        
        let creepType = null, energyAmount = null;
        
        switch(this.memory.roomState){

            case "INTRO_STATE":

                if (creepCounts["staticMiners"] === 0) {
                    creepType = "staticMiner";
                }
                
                else if (creepCounts["transporters"] === 0) {
                    creepType = "transporter";
                }
                break;



            case "BEGINNER_STATE":
                
                if ( (creepCounts["staticMiners"] < this.memory.creepLimits["staticMiners"] 
                        && creepCounts["staticMiners"] <= creepCounts["transporters"]  )
                   || lowestMiner.ticksToLive < (MINER_BUILD_TICKS + lowestMiner.memory.ticksToSource) 
                        && creepCounts["staticMiners"] <= creepCounts["staticMiners"] + 1)
                {
                    creepType = "staticMiner";
                }
                else if (creepCounts["transporters"] < this.memory.creepLimits["transporters"] && creepCounts["builders"] >= Math.floor(creepCounts["transporters"] * MIN_BUILDER_RATIO)) {
                    creepType = "transporter";
                }
                else if (creepCounts["builders"] < this.memory.creepLimits["builders"]) {
                    creepType = "builder";
                }
                else if(creepCounts["claimers"] < this.memory.creepLimits["claimers"]){
                    creepType = "claimer";
                }
                else if(creepCounts["remoteHarvesters"] < this.memory.creepLimits["remoteHarvesters"] && this.storage != undefined){
                    creepType = "remoteHarvester";
                }
                break;



            case "ADVANCED_STATE":
                
                //Beginner state will be limited to controlling the room
                //MAX_MINERS will be this.room.maxMiners in beginner, and be the SUM of maxMiners in remoteHarvest rooms in ADVANCED state
                //Might have code to begin controlling other rooms
                console.log("PLACEHOLDER ADVANCED_STATE");
                break;



            case "DEFENSIVE_STATE":

                console.log("PLACEHOLDER DEFENSIVE_STATE");
                break;

        }
         
        if(creepType != null){
            
            if(this.energyCapacityAvailable <= MAX_CREEP_COST[creepType])
                energyAmount = this.energyCapacityAvailable;
            else
                energyAmount = MAX_CREEP_COST[creepType];
            
            this.spawnCreep(creepType, energyAmount);
        }
    }
    
    if(spawner != null){
        if(Game.time % 25 == 0){
            console.log("<a href=\"#!/room/" + Game.shard.name + "/" + this.name + "\">" + this.name + "</a>");
            console.log("       Limits: " + JSON.stringify(this.memory.creepLimits));
            console.log("       Counts: " + JSON.stringify(creepCounts));
        }
    }
}

Room.prototype.creepCount = function(filteredRoles, useTarget){
    let room = this;
    useTarget = useTarget || false;
    
    let counts = {};
    
    if(filteredRoles == undefined || filteredRoles == "ALL"){
        
        if(useTarget){
            _.forEach(Object.keys(Memory.roles), 
                function(role){ 
                    counts[role] = _.filter(Memory.roles[role], name => Game.creeps[name].memory.targetRoom == room.name).length;
                }
            );
        }
        else{
            _.forEach(Object.keys(Memory.roles), 
                function(role){ 
                    counts[role] = _.filter(Memory.roles[role], name => Game.creeps[name].memory.home == room.name).length;
                }
            );
        }
    }
    else{
        if(useTarget){
            _.forEach(filteredRoles, 
                function(role){ 
                    counts[role] = _.filter(Memory.roles[role], name => Game.creeps[name].memory.targetRoom == room.name).length;
                }
            );
        }
        else{
            _.forEach(filteredRoles, 
                function(role){ 
                    counts[role] = _.filter(Memory.roles[role], name => Game.creeps[name].memory.home == room.name).length;
                }
            );
        }
    }
    
    return counts;
}

//Calls the createCreep function based on what role and energyAmount was returned from this.chooseNextCreep
Room.prototype.spawnCreep = function (role, energyAmount) {

    var type = {

        staticMiner: require("role.staticMiner"),
        
        remoteHarvester: require('role.remoteHarvester'),
        
        transporter: require("role.transporter"),
        
        builder: require("role.builder"),
        
        claimer: require("role.claimer"),
        
        warrior: require('role.warrior')

    };
    
    if(this.energyAvailable >= energyAmount)
        type[role].createCreep(this, energyAmount);

}

                    //End creep spawning\\
//-------------------------------------------------------------//

//To DO 

// Change the Game.time +1 to a Math.random from 0 to the length of roomsWithStorage
Room.prototype.updateCreepLimits = function (){
    
    this.memory.creepLimits = {};
    
    const numOfSources = Object.keys(this.memory.sources).length;
    
    const roomsWithStorage = _.filter(Game.rooms, room => room.storage != undefined);
    
    // Static Miner Limit //
    if(this.energyCapacityAvailable >= 650 || this.energyCapacityAvailable === 0){
        if(this.storage == undefined){
            this.memory.creepLimits["staticMiners"] = numOfSources;
        }
        else{
            
            let creepsPerRoom = _.sum(Memory.flags.remoteHarvestFlags, name => Game.flags[name].minersNeeded()) / roomsWithStorage.length;

            if(creepsPerRoom > 0 && creepsPerRoom < 1){ //if there is less than one creep per room, decide which room has to spawn it by using Game.time
                
                if(roomsWithStorage[ (Game.time % 2) ].name == this.name) //returns roomsWithStorage[ ZERO or ONE ], to decide which room is responsible.
                    this.memory.creepLimits["staticMiners"] = numOfSources + Math.ceil(creepsPerRoom);
                else
                    this.memory.creepLimits["staticMiners"] = numOfSources + Math.floor(creepsPerRoom);
                    
            }
            else{
                
                this.memory.creepLimits["staticMiners"] = numOfSources + Math.ceil(creepsPerRoom);
                
            }
        }
    }
    else{                                                      //current formula for staticMiner
    
        let workPerCreep = 2 * Math.floor(this.energyCapacityAvailable / (BODYPART_COST["work"] * 2 + BODYPART_COST["move"] * 1));
    
        let maxMiners = Math.ceil( SOURCE_ENERGY_CAPACITY / 300 / workPerCreep) * numOfSources;
    
        let maxSpots = _.sum(this.memory.sources, function(source) {
            return source.accessTiles.length;
        });
    
        if(maxMiners >= maxSpots){
            this.memory.creepLimits["staticMiners"] = maxSpots;
        }
        else{
            this.memory.creepLimits["staticMiners"] = maxMiners;
    
        }
    }
    
    // Transporter Limit //
    
    if((this.memory.structures.lowExtensions.length + this.memory.structures.fullExtensions.length) < 20){
        this.memory.creepLimits["transporters"] = numOfSources * 2.5;
    }
    else if(this.storage != undefined && _.sum(this.storage.store) >= 150000){
        this.memory.creepLimits["transporters"] = numOfSources * 3;
    }
    else{
        this.memory.creepLimits["transporters"] = numOfSources * 2;
    }
    
    // Builder Limit //
    
    if(this.memory.structures.constructionSites.length > 10){
        this.memory.creepLimits["builders"] = 2;
    }
    else {
        this.memory.creepLimits["builders"] = 1;
    }
       
    // Claimer Limit //
    
    // NEED TO DO THE SAME THING I DID WITH MINERS AND REM HARVESTERS TO PREVENT DOUBLE SPAWN
    if(Memory.flags.expansionFlags.length == 0 || this.storage == undefined){
        this.memory.creepLimits["claimers"] = 0;
    }
    else{
        
        let creepsPerRoom = _.sum(Memory.flags.expansionFlags, name => Game.flags[name].claimersNeeded() ) / roomsWithStorage.length;
        
        if(creepsPerRoom > 0 && creepsPerRoom < 1){ //if there is less than one creep per room, decide which room has to spawn it by using Game.time
            
            if(roomsWithStorage[ ((Game.time+1) %2) ].name == this.name) //returns roomsWithStorage[ ZERO or ONE ], opposite of staticMiners
                this.memory.creepLimits["claimers"] = Math.ceil(creepsPerRoom);
            else
                this.memory.creepLimits["claimers"] = Math.floor(creepsPerRoom);
                
        }
        else{
            
            this.memory.creepLimits["claimers"] = Math.ceil(creepsPerRoom);
            
        }
    }
    
    // Remote Harvester Limit //
    
    if(Memory.flags.remoteHarvestFlags.length == 0 || this.storage == undefined){
        this.memory.creepLimits["remoteHarvesters"] = 0;
    }
    else{
        
        let creepsPerRoom = _.sum(Memory.flags.remoteHarvestFlags, name => Game.flags[name].remoteHarvestersNeeded()) / roomsWithStorage.length;
        
        if(creepsPerRoom > 0 && creepsPerRoom < 1){ //if there is less than one creep per room, decide which room has to spawn it by using Game.time
            
            if(roomsWithStorage[ ( (Game.time + 1) % 2) ].name == this.name) //returns roomsWithStorage[ ZERO or ONE ], opposite of staticMiners
                this.memory.creepLimits["remoteHarvesters"] = Math.ceil(creepsPerRoom);
            else
                this.memory.creepLimits["remoteHarvesters"] = Math.floor(creepsPerRoom);
                
        }
        else{
            
            this.memory.creepLimits["remoteHarvesters"] = Math.ceil(creepsPerRoom);
            
        }
    }
    
    // Warrior Limit //
    if(Memory.flags.defendFlags.length == 0){
        this.memory.creepLimits["warriors"] = 0;
    }
    else{
        
        let creepsPerRoom = _.sum(Memory.flags.defendFlags, name => Game.flags[name].warriorsNeeded()) / roomsWithStorage.length;
        
        this.memory.creepLimits["warriors"] = Math.ceil(creepsPerRoom);
    }
    //
    
}