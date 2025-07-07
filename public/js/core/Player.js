/**
 * Player - Represents a player in the game with their pieces, resources, and state
 */
class Player {
    constructor(color, name = null) {
        this.id = `player_${Player.nextId++}`;
        this.color = color; // 'red', 'blue', 'orange', 'white'
        this.name = name || `Player ${this.color}`;
        
        // Game pieces inventory
        this.settlements = []; // Settlement objects owned by player
        this.cities = []; // City objects owned by player  
        this.roads = []; // Road objects owned by player
        
        // Remaining pieces to place
        this.settlementsRemaining = 5;
        this.citiesRemaining = 4;
        this.roadsRemaining = 15;
        
        // Resources
        this.resources = {
            lumber: 0,    // From forest
            brick: 0,     // From hills
            ore: 0,       // From mountains
            grain: 0,     // From fields
            wool: 0       // From pasture
        };
        
        // Development cards
        this.developmentCards = {
            knight: 0,
            roadBuilding: 0,
            yearOfPlenty: 0,
            monopoly: 0,
            victoryPoint: 0
        };
        
        // Game state
        this.victoryPoints = 0;
        this.knightsPlayed = 0;
        this.hasLongestRoad = false;
        this.hasLargestArmy = false;
        
        // Trading state
        this.tradeRatios = {
            lumber: 4,
            brick: 4,
            ore: 4,
            grain: 4,
            wool: 4
        };
        
        // Turn state
        this.hasRolled = false;
        this.canBuild = true;
        this.canTrade = true;
    }
    
    /**
     * Add resources to player's inventory
     */
    addResources(resourceType, amount = 1) {
        if (this.resources.hasOwnProperty(resourceType)) {
            this.resources[resourceType] += amount;
        }
    }
    
    /**
     * Remove resources from player's inventory
     */
    removeResources(resourceType, amount = 1) {
        if (this.resources.hasOwnProperty(resourceType)) {
            this.resources[resourceType] = Math.max(0, this.resources[resourceType] - amount);
            return true;
        }
        return false;
    }
    
    /**
     * Get total number of resource cards
     */
    getTotalResources() {
        return Object.values(this.resources).reduce((sum, count) => sum + count, 0);
    }
    
    /**
     * Check if player can afford to build something
     */
    canAfford(buildingType) {
        const costs = {
            road: { lumber: 1, brick: 1 },
            settlement: { lumber: 1, brick: 1, wool: 1, grain: 1 },
            city: { ore: 3, grain: 2 },
            developmentCard: { ore: 1, wool: 1, grain: 1 }
        };
        
        const cost = costs[buildingType];
        if (!cost) return false;
        
        for (let [resource, amount] of Object.entries(cost)) {
            if (this.resources[resource] < amount) {
                return false;
            }
        }
        return true;
    }
    
    /**
     * Pay resources for building something
     */
    payFor(buildingType) {
        if (!this.canAfford(buildingType)) return false;
        
        const costs = {
            road: { lumber: 1, brick: 1 },
            settlement: { lumber: 1, brick: 1, wool: 1, grain: 1 },
            city: { ore: 3, grain: 2 },
            developmentCard: { ore: 1, wool: 1, grain: 1 }
        };
        
        const cost = costs[buildingType];
        for (let [resource, amount] of Object.entries(cost)) {
            this.removeResources(resource, amount);
        }
        return true;
    }
    
    /**
     * Build a settlement
     */
    buildSettlement(vertex) {
        if (!this.canAfford('settlement') || this.settlementsRemaining <= 0) {
            return null;
        }
        
        const settlement = new Settlement(this);
        if (settlement.placeOn(vertex)) {
            this.payFor('settlement');
            this.settlements.push(settlement);
            this.settlementsRemaining--;
            this.updateVictoryPoints();
            return settlement;
        }
        return null;
    }
    
    /**
     * Build a city (upgrade settlement)
     */
    buildCity(vertex) {
        if (!this.canAfford('city') || this.citiesRemaining <= 0) {
            return null;
        }
        
        const city = new City(this);
        const oldSettlement = city.placeOn(vertex);
        if (oldSettlement) {
            this.payFor('city');
            this.cities.push(city);
            this.citiesRemaining--;
            this.settlementsRemaining++; // Settlement returns to supply
            
            // Remove old settlement from player's list
            const index = this.settlements.indexOf(oldSettlement);
            if (index > -1) {
                this.settlements.splice(index, 1);
            }
            
            this.updateVictoryPoints();
            return { city, oldSettlement };
        }
        return null;
    }
    
    /**
     * Build a road
     */
    buildRoad(edge) {
        if (!this.canAfford('road') || this.roadsRemaining <= 0) {
            return null;
        }
        
        const road = new Road(this);
        if (road.placeOn(edge)) {
            this.payFor('road');
            this.roads.push(road);
            this.roadsRemaining--;
            return road;
        }
        return null;
    }
    
    /**
     * Calculate and update victory points
     */
    updateVictoryPoints() {
        let points = 0;
        
        // Points from buildings
        points += this.settlements.length * 1;
        points += this.cities.length * 2;
        
        // Points from development cards
        points += this.developmentCards.victoryPoint;
        
        // Points from special achievements
        if (this.hasLongestRoad) points += 2;
        if (this.hasLargestArmy) points += 2;
        
        this.victoryPoints = points;
        return points;
    }
    
    /**
     * Get longest road length for this player
     */
    getLongestRoadLength() {
        let maxLength = 0;
        for (let road of this.roads) {
            const length = road.getRoadNetworkLength();
            maxLength = Math.max(maxLength, length);
        }
        return maxLength;
    }
    
    /**
     * Collect resources from dice roll
     */
    collectFromDiceRoll(diceRoll) {
        const collected = [];
        
        // Collect from settlements
        for (let settlement of this.settlements) {
            const resources = settlement.collectResources(diceRoll);
            for (let resource of resources) {
                this.addResources(resource);
                collected.push(resource);
            }
        }
        
        // Collect from cities
        for (let city of this.cities) {
            const resources = city.collectResources(diceRoll);
            for (let resource of resources) {
                this.addResources(resource);
                collected.push(resource);
            }
        }
        
        return collected;
    }
    
    /**
     * Discard half resources (when robber is rolled)
     */
    discardHalf() {
        const total = this.getTotalResources();
        if (total <= 7) return [];
        
        const toDiscard = Math.floor(total / 2);
        const discarded = [];
        
        // Simple strategy: discard evenly
        let remaining = toDiscard;
        const resourceTypes = Object.keys(this.resources);
        
        while (remaining > 0) {
            for (let resourceType of resourceTypes) {
                if (remaining <= 0) break;
                if (this.resources[resourceType] > 0) {
                    this.removeResources(resourceType, 1);
                    discarded.push(resourceType);
                    remaining--;
                }
            }
        }
        
        return discarded;
    }
    
    /**
     * Debug representation
     */
    toString() {
        return `Player(${this.color}) VP:${this.victoryPoints} Resources:${this.getTotalResources()}`;
    }
    
    /**
     * Get comprehensive debug info
     */
    getDebugInfo() {
        return {
            id: this.id,
            name: this.name,
            color: this.color,
            victoryPoints: this.victoryPoints,
            resources: { ...this.resources },
            totalResources: this.getTotalResources(),
            developmentCards: { ...this.developmentCards },
            pieces: {
                settlements: this.settlements.length,
                cities: this.cities.length,
                roads: this.roads.length
            },
            remaining: {
                settlements: this.settlementsRemaining,
                cities: this.citiesRemaining,
                roads: this.roadsRemaining
            },
            achievements: {
                longestRoad: this.hasLongestRoad,
                largestArmy: this.hasLargestArmy,
                longestRoadLength: this.getLongestRoadLength(),
                knightsPlayed: this.knightsPlayed
            },
            canAfford: {
                road: this.canAfford('road'),
                settlement: this.canAfford('settlement'),
                city: this.canAfford('city'),
                developmentCard: this.canAfford('developmentCard')
            }
        };
    }
}

Player.nextId = 1;