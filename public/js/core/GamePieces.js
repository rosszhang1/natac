/**
 * Base class for all game pieces that can be placed on the board
 */
class GamePiece {
    constructor(owner, type) {
        this.owner = owner; // Player object
        this.type = type; // 'settlement', 'city', 'road', 'robber'
        this.id = `${type}_${owner ? owner.id : 'neutral'}_${GamePiece.nextId++}`;
        
        // 3D rendering reference
        this.mesh = null;
        
        // Placement tracking
        this.placedAt = null; // Vertex, Edge, or Hex depending on piece type
        this.placedTurn = null; // Turn number when placed
    }
    
    /**
     * Remove this piece from the board
     */
    remove() {
        if (this.placedAt) {
            if (this.type === 'settlement' || this.type === 'city') {
                this.placedAt.building = null;
            } else if (this.type === 'road') {
                this.placedAt.road = null;
            } else if (this.type === 'robber') {
                this.placedAt.hasRobber = false;
            }
            this.placedAt = null;
        }
    }
    
    /**
     * Get debug info for this piece
     */
    getDebugInfo() {
        return {
            id: this.id,
            type: this.type,
            owner: this.owner ? this.owner.color : 'neutral',
            placedAt: this.placedAt ? this.placedAt.id : null,
            placedTurn: this.placedTurn
        };
    }
}

GamePiece.nextId = 1;

/**
 * Settlement - Provides 1 resource per adjacent hex, 1 victory point
 */
class Settlement extends GamePiece {
    constructor(owner) {
        super(owner, 'settlement');
        this.victoryPoints = 1;
        this.resourceMultiplier = 1;
        this.vertex = null; // Vertex where this settlement is placed
    }
    
    /**
     * Place this settlement on a vertex
     */
    placeOn(vertex) {
        if (vertex.placeSettlement(this)) {
            this.vertex = vertex;
            this.placedAt = vertex;
            return true;
        }
        return false;
    }
    
    /**
     * Get all hexes this settlement can collect resources from
     */
    getResourceHexes() {
        return this.vertex ? this.vertex.getResourceHexes() : [];
    }
    
    /**
     * Collect resources when a number is rolled
     */
    collectResources(diceRoll) {
        const resources = [];
        if (this.vertex) {
            for (let hex of this.vertex.hexes) {
                if (hex.shouldProduce(diceRoll)) {
                    const resourceType = hex.getResourceType();
                    if (resourceType) {
                        resources.push(resourceType);
                    }
                }
            }
        }
        return resources;
    }
    
    /**
     * Check if this settlement can be upgraded to a city
     */
    canUpgradeToCity() {
        return this.vertex && this.vertex.building === this;
    }
    
    toString() {
        return `Settlement(${this.owner.color}) at ${this.vertex ? this.vertex.id : 'unplaced'}`;
    }
}

/**
 * City - Provides 2 resources per adjacent hex, 2 victory points
 */
class City extends GamePiece {
    constructor(owner) {
        super(owner, 'city');
        this.victoryPoints = 2;
        this.resourceMultiplier = 2;
        this.vertex = null; // Vertex where this city is placed
    }
    
    /**
     * Place this city on a vertex (upgrading existing settlement)
     */
    placeOn(vertex) {
        const oldSettlement = vertex.upgradeToCity(this);
        if (oldSettlement) {
            this.vertex = vertex;
            this.placedAt = vertex;
            return oldSettlement;
        }
        return null;
    }
    
    /**
     * Get all hexes this city can collect resources from
     */
    getResourceHexes() {
        return this.vertex ? this.vertex.getResourceHexes() : [];
    }
    
    /**
     * Collect resources when a number is rolled (2x settlement)
     */
    collectResources(diceRoll) {
        const resources = [];
        if (this.vertex) {
            for (let hex of this.vertex.hexes) {
                if (hex.shouldProduce(diceRoll)) {
                    const resourceType = hex.getResourceType();
                    if (resourceType) {
                        // Cities produce 2 of each resource
                        resources.push(resourceType, resourceType);
                    }
                }
            }
        }
        return resources;
    }
    
    toString() {
        return `City(${this.owner.color}) at ${this.vertex ? this.vertex.id : 'unplaced'}`;
    }
}

/**
 * Road - Connects settlements/cities, enables expansion, counts for longest road
 */
class Road extends GamePiece {
    constructor(owner) {
        super(owner, 'road');
        this.edge = null; // Edge where this road is placed
    }
    
    /**
     * Place this road on an edge
     */
    placeOn(edge) {
        if (edge.placeRoad(this)) {
            this.edge = edge;
            this.placedAt = edge;
            return true;
        }
        return false;
    }
    
    /**
     * Get the length of the road network this road is part of
     */
    getRoadNetworkLength() {
        return this.edge ? this.edge.getRoadLength(this.owner) : 0;
    }
    
    /**
     * Check if this road connects two vertices
     */
    connectsVertices(vertex1, vertex2) {
        return this.edge ? this.edge.connectsVertices(vertex1, vertex2) : false;
    }
    
    /**
     * Get vertices connected by this road
     */
    getConnectedVertices() {
        return this.edge ? this.edge.getVertices() : [];
    }
    
    toString() {
        return `Road(${this.owner.color}) at ${this.edge ? this.edge.id : 'unplaced'}`;
    }
}

/**
 * Robber - Blocks resource production, enables stealing
 */
class Robber extends GamePiece {
    constructor() {
        super(null, 'robber'); // No owner
        this.hex = null; // Hex where robber is placed
    }
    
    /**
     * Move robber to a new hex
     */
    moveTo(hex) {
        // Remove from current hex
        if (this.hex) {
            this.hex.hasRobber = false;
        }
        
        // Place on new hex
        this.hex = hex;
        this.placedAt = hex;
        if (hex) {
            hex.hasRobber = true;
        }
    }
    
    /**
     * Get all players with buildings adjacent to the robber
     */
    getAdjacentPlayers() {
        if (!this.hex) return [];
        
        const players = new Set();
        for (let vertex of this.hex.vertices) {
            if (vertex.building && vertex.building.owner) {
                players.add(vertex.building.owner);
            }
        }
        return Array.from(players);
    }
    
    /**
     * Check if robber is blocking a specific hex
     */
    isBlocking(hex) {
        return this.hex === hex;
    }
    
    toString() {
        return `Robber at ${this.hex ? this.hex.id : 'unplaced'}`;
    }
    
    getDebugInfo() {
        const baseInfo = super.getDebugInfo();
        return {
            ...baseInfo,
            hex: this.hex ? this.hex.terrain : null,
            adjacentPlayers: this.getAdjacentPlayers().map(p => p.color),
            isBlocking: this.hex ? true : false
        };
    }
}