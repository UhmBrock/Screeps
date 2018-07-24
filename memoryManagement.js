'use strict';
module.exports = {
    
    MEMORY_TTL: 9,
    
    
    run: function (room) {
    
        this.initStats();
        
        this.initPathMemory();
        
        this.initRoomMemory(room);

        this.updateDroppedResources(room); 

        this.updateCreepsByRole(room);
    
        this.updateFlags(room);
    },


    //Clears out stale objects
    garbageCollection: function () {
        for (let roomName in Memory.rooms) {
            if (Game.rooms[roomName] == undefined){
                delete Memory.rooms[roomName];
            }
            else{
                delete Game.rooms[roomName].memory.priorityRepairs;
            }
        }
        for (let creepName in Memory.creeps) {
            if (Game.creeps[creepName] == undefined)
                delete Memory.creeps[creepName];
        }
    },



                  // Initialize Memory //
    //--------------------------------------------------//

    initStats: function() {
        if(!Memory.stats) { 
            Memory.stats = {}; 
        }   
    },
    
    initPathMemory: function() {
        
    },
    
    initRoomMemory: function (room) {
        //Might have to restrict how often this method runs
        
        this.initStructures(room);

        this.initSources(room); 
        
        if(!room.memory.creepLimits){
            room.updateCreepLimits();
        }
        
        this.updateCostMatrix(room);
    },



    initStructures: function (room) {
        
        let structures = room.find(FIND_STRUCTURES);
        //Objects are removed from structures as they are sorted into the correct sub-array
        //so each map has less to iterate. Sorted by general order of quantities
        let sortedStructuresID = {

            roads: _.map(_.remove(structures, s => s.structureType == STRUCTURE_ROAD), o => o.id),
            
            //extensions: _.map(_.filter(structures, s => s.structureType == STRUCTURE_EXTENSION), o => o.id),
            
            lowExtensions: _.map(_.remove(structures, s => (s.structureType == STRUCTURE_EXTENSION && s.energy < s.energyCapacity) ), o => o.id),
    
            fullExtensions: _.map(_.remove(structures, s => (s.structureType == STRUCTURE_EXTENSION && s.energy == s.energyCapacity) ), o => o.id),
            
            walls: _.map(_.remove(structures, s => s.structureType == STRUCTURE_WALL), o => o.id),

            ramparts: _.map(_.remove(structures, s => s.structureType == STRUCTURE_RAMPART), o => o.id),

            spawners: _.map(_.remove(structures, s => s.structureType == STRUCTURE_SPAWN), o => o.id),

            keeper_lairs: _.map(_.remove(structures, s => s.structureType == STRUCTURE_KEEPER_LAIR), o => o.id),

            portals: _.map(_.remove(structures, s => s.structureType == STRUCTURE_PORTAL), o => o.id),

            controllers: _.map(_.remove(structures, s => s.structureType == STRUCTURE_CONTROLLER), o => o.id),

            links: _.map(_.remove(structures, s => s.structureType == STRUCTURE_LINK), o => o.id),

            storages: _.map(_.remove(structures, s => s.structureType == STRUCTURE_STORAGE), o => o.id),

            towers: _.map(_.remove(structures, s => s.structureType == STRUCTURE_TOWER), o => o.id),

            observers: _.map(_.remove(structures, s => s.structureType == STRUCTURE_OBSERVER), o => o.id),

            power_banks: _.map(_.remove(structures, s => s.structureType == STRUCTURE_POWER_BANK), o => o.id),

            power_spawns: _.map(_.remove(structures, s => s.structureType == STRUCTURE_POWER_SPAWN), o => o.id),

            extractors: _.map(_.remove(structures, s => s.structureType == STRUCTURE_EXTRACTOR), o => o.id),

            labs: _.map(_.remove(structures, s => s.structureType == STRUCTURE_LAB), o => o.id),

            terminals: _.map(_.remove(structures, s => s.structureType == STRUCTURE_TERMINAL), o => o.id),

            containers: _.map(_.remove(structures, s => s.structureType == STRUCTURE_CONTAINER), o => o.id),

            nukers: _.map(_.remove(structures, s => s.structureType == STRUCTURE_NUKER), o => o.id),
            
            constructionSites: _.filter(Object.keys(Game.constructionSites), id => Game.getObjectById(id).pos.roomName == room.name)
        }

        room.memory.structures = sortedStructuresID;
    },
    


    initSources: function (room) { // room.memory.sources[0]

        if (!room.memory.sources) {
            
            room.memory.sources = {};
            //all source objects
            let sources = room.find(FIND_SOURCES);
            
            
            //all source object IDs
            let sourceId = _.map(sources, source => source.id);

            //all walkable tiles by each source
            let accessTiles = _.map(sources, function (source) {

                let terrain = _.filter(room.lookForAtArea(LOOK_TERRAIN, source.pos.y - 1, source.pos.x - 1, source.pos.y + 1, source.pos.x + 1, true),
                    t => t.terrain != "wall");

                let walkablePos = _.map(terrain,
                    t => (new RoomPosition(t.x, t.y, room.name)));

                return walkablePos;

            });
            
            for(let i = 0; i < sources.length; i++){
                room.memory.sources[sourceId[i]] = { accessTiles: accessTiles[i] };
            }
            
        }
    },


    initMaxMiners: function(room) {
        if (!room.memory.maxMiners || room.memory.maxMiners < room.memory.sources.length)
            room.memory.maxMiners = room.memory.sources.length * 3;
    },


    //----------------------------------------------------------------------//
                    // END Initializing Memory //

    updateDroppedResources: function(room) {
        let dropsID = _.map(room.find(FIND_DROPPED_RESOURCES, { filter: { resourceType: RESOURCE_ENERGY } }), d => d.id);
        room.memory.droppedEnergy = dropsID;
    },
    
    updateCreepsByRole: function () {

        let staticMiners = [], transporters = [], builders = [], remoteHarvesters = [];
        let creeps = _.map(Game.creeps, creep => creep);
        
        let sortedCreeps = {
            
            staticMiners: _.map(_.remove(creeps, creep => creep.memory.role == "staticMiner"), creep => creep.name),
            
            transporters: _.map(_.remove(creeps, creep => creep.memory.role == "transporter"), creep => creep.name),
            
            builders: _.map(_.remove(creeps, creep => creep.memory.role == "builder"), creep => creep.name),
            
            claimers: _.map(_.remove(creeps, creep => creep.memory.role == "claimer"), creep => creep.name),
            
            remoteHarvesters: _.map(_.remove(creeps, creep => creep.memory.role == "remoteHarvester"), creep => creep.name),
            
            warriors: _.map(_.remove(creeps, creep => creep.memory.role == "warrior"), creep => creep.name)
        }
        
        Memory.roles = sortedCreeps;
    },
    
    
    updateFlags: function(room) {
        
        //let forceUpdate = (Game.time % this.MEMORY_TTL == 0); //forces update every 9 ticks
        let forceUpdate = true;
        if(!Memory.flags || forceUpdate){
            
            let flags = _.map(Game.flags, flag => flag);
            
            let sortedFlags = {

                remoteHarvestFlags: _.map(_.remove(flags, flag => (flag.color == COLOR_YELLOW && flag.secondaryColor == COLOR_YELLOW)), flag => flag.name),
                
                expansionFlags: _.map(_.remove(flags, flag => (flag.color == COLOR_GREEN && flag.secondaryColor == COLOR_GREEN)), flag => flag.name),
                
                defendFlags: _.map(_.remove(flags, flag => (flag.color == COLOR_RED && flag.secondaryColor == COLOR_RED)), flag => flag.name)
            }
            
            sortedFlags.expansionFlags = _.filter(sortedFlags.expansionFlags, function(flagName){
                let flag = Game.flags[flagName];
                
                if(Game.rooms[flag.pos.roomName] != undefined){
                    //console.log("Testing 228: " + flag.pos.roomName + ": " + JSON.stringify(Game.rooms[flag.pos.roomName].memory));
                    if(Game.rooms[flag.pos.roomName].memory.structures.spawners.length > 0){
                        flag.remove();
                        return false;
                    }
                    else{
                        return true;
                    }
                }
            });
            Memory.flags = sortedFlags;
        }
    },
    
    //-------------------------------------------------------------------------------------//
    //Begin Pathfinding                                                                    //
    //-------------------------------------------------------------------------------------//
    
    updateCostMatrix: function (room, forceUpdate) {
        
        forceUpdate = forceUpdate || false;
        
        if (!room.memory.costMatrix || forceUpdate) {
            console.log("CREATING NEW COSTMATRIX FOR " + room.name);
            
            let costs = new PathFinder.CostMatrix;
            //
            //set cost matrix for structures
            room.find(FIND_STRUCTURES).forEach(function (struct) {
                //Favor roads over plains or swamps
                if (struct.structureType === STRUCTURE_ROAD) {
                    costs.set(struct.pos.x, struct.pos.y, 1)
                }
                    //
                    //check if the structure is walkable (if not a container, or a rampart that I own)
                else if (struct.structureType !== STRUCTURE_CONTAINER && (struct.structureType !== STRUCTURE_RAMPART || !struct.my)) {
                    costs.set(struct.pos.x, struct.pos.y, 255); //255 == unwalkable
                }
            });
            /* //not using since I only want to update this costMatrix every now and then
            //find all creeps and avoid the tile they're on
            room.find(FIND_CREEPS).forEach(function (creep) {
                //could do like an if(staticMiner) then set 255, else set 0
                costs.set(creep.pos.x, creep.pos.y, 255); //255 == unwalkable
            });
            */
            room.memory.costMatrix = {matrix: JSON.stringify(costs.serialize()), tickCreated: Game.time };
        }
    },
    
    createNewPath: function(originPos, targetPos, pathName) {
        
        let target = {pos: targetPos, range: 1};
        
        // contains .path, .ops, .cost, .incomplete
        let createdPath = PathFinder.search(originPos, target, {
            plainCost: 2, swampCost: 10,
            
            roomCallback: function(roomName) {
                let room = Game.rooms[roomName];
                if(!room) return;
                
                //MIGHT change this to be more leniant. Might allow it to be x ticks old before updating, if it would save me CPU.
                if(room.memory.costMatrix.tickCreated != Game.time){
                    module.exports.updateCostMatrix(room, true);
                }
                
                return PathFinder.CostMatrix.deserialize(room.memory.costMatrix.matrix)
            }
        });
        if(!Memory.paths){
            Memory.paths = [createdPath.path];
        }
        if(!Memory.paths[pathName]){
            Memory.paths.push({pathName: createdPath.path});
        }
    }
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
};